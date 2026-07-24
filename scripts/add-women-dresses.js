/**
 * Women's dresses hand-pick (2026-07-22). No LLM, no Anthropic API.
 *
 * Explicit list (like add-women-picks.js) rather than the auto-neutral knits
 * engine, because a couple of picks are intentionally non-neutral (a bleu silk
 * occasion dress, a blue denim dress). Composition is verified off each feed's
 * body_html; price + brand images come from the live product JSON. Requires >=2
 * images. Inserts published:false drafts for /admin.
 *
 *   node --env-file=.env.local scripts/add-women-dresses.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
// Shop occasion filter matches EXACT Title-Case Lifestyle-5; map legacy → canonical.
const OCC_MAP = { everyday: "Everyday", casual: "Everyday", lounge: "Everyday", sleep: "Everyday", active: "Everyday", resort: "Vacation/Resort", "vacation/resort": "Vacation/Resort", occasion: "Special Occasion", "special occasion": "Special Occasion", evening: "Evening", workwear: "Workwear", work: "Workwear" };
const canonOcc = (arr) => [...new Set((arr || []).map((o) => OCC_MAP[String(o).toLowerCase()] || o))];
const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const materialsFromComp = (c) =>
  !c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");
const toFractions = (c) => {
  const s = Object.values(c).reduce((a, b) => a + b, 0);
  const o = {};
  for (const [k, v] of Object.entries(c)) o[k] = Math.round((v / s) * 1000) / 1000;
  return o;
};

const ITEMS = [
  {
    name: "Isol Silk Dress", brand: "Ciao Lucia", // Nyah's pick
    url: "https://ciaolucia.com/products/20015546ble-charmeuse-bleu",
    comp: { silk: 100 }, occasion: ["occasion", "everyday"],
    description: "a fluid bias-cut dress in 100% silk charmeuse, cool and weightless on the skin, in a deep bleu.",
  },
  {
    name: "Marja Silk Dress", brand: "Ciao Lucia",
    url: "https://ciaolucia.com/products/20435603ivr-habotai-ivory",
    comp: { silk: 100 }, occasion: ["occasion", "everyday"],
    description: "a soft slip dress in 100% silk habotai with a quiet sheen, light and breathable, in a warm ivory.",
  },
  {
    name: "Austine Linen Dress", brand: "Ciao Lucia",
    url: "https://ciaolucia.com/products/austine-dress-white",
    comp: { linen: 55, cotton: 45 }, occasion: ["occasion", "resort", "everyday"],
    description: "an embroidered dress in an airy linen-cotton voile, textured and breezy for warm days, in a crisp white.",
  },
  {
    name: "Pique Tank Dress", brand: "Industry of All Nations",
    url: "https://industryofallnations.com/products/pique-tank-maxi-dress",
    comp: { "organic cotton": 100 }, occasion: ["casual", "everyday", "resort"],
    description: "a clean tank maxi in 100% organic cotton pique, breathable and undyed in a natural tone.",
  },
  {
    name: "Reverie Dress", brand: "Jenni Kayne",
    url: "https://www.jennikayne.com/products/reverie-dress-white",
    comp: { cotton: 100 }, occasion: ["casual", "everyday"],
    description: "a relaxed dress in 100% cotton with an easy, unfussy drape, in a soft white.",
  },
  {
    name: "Tuesday Dress", brand: "Still Here",
    url: "https://www.stillhere.nyc/products/tuesday-dress-in-classic-blue",
    comp: { cotton: 100 }, occasion: ["casual", "everyday"],
    description: "a denim dress in 100% cotton, cut and finished in new york with no synthetic stretch, in a classic mid blue.",
  },
  // Amour Linen — 100% natural linen confirmed on the rendered PDP ("100% natural
  // linen, no synthetics"). USD Shopify storefront. Muted earthy colorways.
  {
    name: "Vila Slip Dress", brand: "Amour Linen",
    url: "https://amourlinen.com/products/vila-slip-dress-cacao",
    comp: { linen: 100 }, occasion: ["Everyday", "Vacation/Resort", "Special Occasion"],
    description: "a bias slip dress in 100% natural linen, cool and breathable with an easy drape, in a warm cacao.",
  },
  {
    name: "Sarah Pleated Dress", brand: "Amour Linen",
    url: "https://amourlinen.com/products/sarah-pleated-dress-cacao",
    comp: { linen: 100 }, occasion: ["Everyday", "Vacation/Resort"],
    description: "a pleated midi in 100% natural linen, airy and structured for warm days, in a warm cacao.",
  },
  {
    name: "Nola Dress with Ties", brand: "Amour Linen",
    url: "https://amourlinen.com/products/nola-dress-with-ties-deep-olive",
    comp: { linen: 100 }, occasion: ["Everyday", "Vacation/Resort"],
    description: "a tie-waist dress in 100% natural linen, light and breezy with a relaxed shape, in a soft deep olive.",
  },
];

async function fetchProductJSON(url) {
  const base = url.split("?")[0].replace(/\/$/, "");
  const r = await fetch(base + ".json", { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return null;
  const p = (await r.json()).product;
  if (!p) return null;
  const prices = p.variants.map((v) => Number(v.price)).filter((n) => n > 0);
  return {
    price: prices.length ? Math.min(...prices) : null,
    inStock: p.variants.some((v) => v.available),
    images: (p.images || []).map((i) => i.src).filter(Boolean),
  };
}

async function addOne(supabase, item) {
  const meta = await fetchProductJSON(item.url);
  if (!meta) return { skip: "no product JSON" };
  if (meta.images.length < 2) return { skip: `only ${meta.images.length} image(s)` };

  const dupUrl = item.url.split("?")[0];
  const { data: dup } = await supabase.from("products").select("id").eq("item_url", dupUrl).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };

  const frac = toFractions(item.comp);
  const score = calcToxomeScore(frac);
  if (score == null) return { skip: "unscoreable" };

  const row = {
    item_name: item.name, brand: item.brand,
    item_price: meta.price, currency: "USD", budget: budget(meta.price),
    category: "Dresses", gender: "Women", occasion: canonOcc(item.occasion),
    item_image: meta.images[0], images: meta.images.slice(0, 6), item_url: dupUrl, affiliate_url: null,
    fabric_composition: frac, materials_text: materialsFromComp(item.comp),
    description: item.description, certifications: null,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: false, rejected: false, added_by: "agent", reviewed_at: null,
    tags: ["batch-women-dresses", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  return { ok: true, id: data.id, score, price: meta.price, imgs: row.images.length, inStock: meta.inStock };
}

async function run() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, key);
  let n = 0;
  const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item);
    if (r.ok) {
      n++;
      console.log(`✓ ${String(n).padStart(2)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${materialsFromComp(item.comp)} · ${r.imgs} imgs · feed ${r.inStock ? "in-stock" : "SOLD-OUT?"}`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as drafts.`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
