/**
 * Women's hand-picked adds (2026-07-22). No LLM, no Anthropic API.
 *
 * List-driven: each item is a URL Nyah picked off a live PDP. Composition is
 * read off the live page (Shopify product JSON body_html or the rendered HTML)
 * and passed as an explicit `comp` — never guessed. Price + brand-CDN images
 * come from the live product JSON. Colorway lives in the description, never the
 * item_name. Inserts as published:false drafts for /admin review.
 *
 *   node --env-file=.env.local scripts/add-women-picks.js --draft
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

// Composition read off each live PDP (verified 2026-07-22). Not guessed.
const ITEMS = [
  {
    name: "Lou Tee", brand: "Ozma of California", category: "Tops",
    url: "https://ozmaofcalifornia.com/products/lou-tee-silk-noil-jersey-tea",
    comp: { silk: 100 }, occasion: ["casual", "everyday"],
    description:
      "the classic boy tee cut in 100% regenerative silk noil, with the nubby, lived-in texture of raw silk. narrow through the shoulder with a slight crop, breathable and soft against skin. in a warm tea.",
  },
  {
    name: "Childhood Jean", brand: "Still Here", category: "Bottoms",
    url: "https://www.stillhere.nyc/products/original-childhood-in-classic-blue",
    comp: { cotton: 100 }, occasion: ["casual", "everyday"],
    description:
      "a relaxed straight-leg jean in 100% cotton, cut and finished in new york. pure cotton denim with no synthetic stretch, in a classic mid-blue wash.",
  },
  {
    name: "Blake Ripstop Utility Jacket", brand: "Marine Layer", category: "Outerwear",
    url: "https://www.marinelayer.com/products/blake-ripstop-utility-jacket",
    comp: { lyocell: 59, cotton: 38, elastane: 3 }, occasion: ["casual", "everyday"],
    description:
      "a lightweight utility jacket in a tencel-and-cotton ripstop, the rare structured layer that skips the usual all-synthetic shell. soft, breathable, with just a touch of give.",
  },
  {
    name: "Vivian Button-Through Blouse", brand: "Marine Layer", category: "Tops",
    url: "https://www.marinelayer.com/products/vivian-button-through-blouse",
    comp: { cotton: 51, lyocell: 49 }, occasion: ["casual", "everyday", "workwear"],
    description:
      "a soft button-through blouse in a cotton-tencel blend, fluid and breathable with an easy drape. an everyday layer that moves between work and the weekend.",
  },
  {
    name: "Classic Madras Shirt", brand: "Industry of All Nations", category: "Tops",
    url: "https://industryofallnations.com/products/madras-long-sleeve-button-down-shirt",
    comp: { "organic cotton": 100 }, occasion: ["casual", "everyday"],
    description:
      "a lightweight long-sleeve button-down woven from 100% organic cotton in a traditional madras plaid, colored with plant-based natural dyes and finished with river-shell buttons. relaxed fit, soft muted tones.",
  },
  {
    name: "Jasper Jeans", brand: "With Jean", category: "Bottoms",
    url: "https://withjean.com/products/jasper-jeans-indigo-blue",
    comp: { cotton: 95, polyester: 5 }, occasion: ["casual", "everyday"],
    description:
      "low-rise, medium-weight denim with a built-in buckle waist and front zip, cut in 95% cotton with just 5% polyester. soft and structured, in a deep indigo blue.",
  },
  {
    // Self: 100% silk, Lining: 100% viscose (read off the rendered PDP 2026-07-22).
    // Scored on the shell/self fabric per the lined-garment convention.
    name: "Jett Silk Cami Top", brand: "Rue Sophie", category: "Tops",
    url: "https://ruesophie.com/products/jett-silk-cami-top-in-white",
    comp: { silk: 100 }, occasion: ["everyday", "occasion"],
    description:
      "a clean bias cami in 100% silk with a viscose lining, light and cool with a soft drape, in a crisp white.",
  },
  {
    // Composition (74% linen / 26% cotton) confirmed by Nyah off the care label,
    // 2026-07-22 — the PDP publishes no percentage.
    name: "Asuan Draped Top", brand: "Paloma Wool", category: "Tops",
    url: "https://palomawool.com/products/asuan-loose-draped-top-twisted-pattern-navy",
    comp: { linen: 74, cotton: 26 }, occasion: ["casual", "everyday"],
    description:
      "a loose, draped top with a twisted stitch pattern in a sheer, rustic linen-cotton knit. relaxed and fluid with an easy silhouette, in a soft navy. made in spain.",
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

async function addOne(supabase, item, live) {
  const meta = await fetchProductJSON(item.url);
  if (!meta) return { skip: "no product JSON" };
  if (!meta.images.length) return { skip: "no images" };

  const dupUrl = item.url.split("?")[0];
  const { data: dup } = await supabase.from("products").select("id").eq("item_url", dupUrl).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };

  const frac = toFractions(item.comp);
  const score = calcToxomeScore(frac);
  if (score == null) return { skip: "unscoreable comp" };

  const row = {
    item_name: item.name, brand: item.brand,
    item_price: meta.price, currency: "USD", budget: budget(meta.price),
    category: item.category, gender: "Women", occasion: canonOcc(item.occasion),
    item_image: meta.images[0], images: meta.images.slice(0, 6), item_url: dupUrl, affiliate_url: null,
    fabric_composition: frac, materials_text: materialsFromComp(item.comp),
    description: item.description, certifications: null,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !!live, rejected: false, added_by: "agent", reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-women-picks", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  return { ok: true, id: data.id, score, price: meta.price, comp: frac, imgs: row.images.length, inStock: meta.inStock };
}

async function run() {
  const live = !process.argv.includes("--draft");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, key);

  let n = 0;
  const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live);
    if (r.ok) {
      n++;
      console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(10)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${JSON.stringify(r.comp)} · ${r.imgs} imgs · feed ${r.inStock ? "in-stock" : "SOLD-OUT?"}`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as ${live ? "LIVE" : "drafts"}.`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
