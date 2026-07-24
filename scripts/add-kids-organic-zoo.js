/**
 * Organic Zoo — kids seed (2026-07-22). No LLM, no Anthropic API.
 *
 * Organic Zoo (organic-zoo.com) is a GOTS organic-cotton / organic-wool kids
 * brand in muted earthy tones. UK store, but /en-us serves USD via Shopify
 * Markets. ⚠️ CURRENCY TRAP: products.json returns BASE (GBP) prices, so USD is
 * read off the localized /en-us PDP (the injected variant "price" in cents).
 * Composition verified off each PDP body_html (all 100% organic cotton or wool).
 *
 * Colorway-led names are collapsed to ONE colorway per product TYPE (the color
 * lives in the description), so two colorways of one product can't fragment.
 *
 *   node --env-file=.env.local scripts/add-kids-organic-zoo.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const materialsFromComp = (c) =>
  !c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");

const OZ = { oc: { "organic cotton": 100 }, wool: { wool: 100 } };
const ITEMS = [
  // Outerwear — the thin kids gap (was 2 live)
  { handle: "chestnut-wool-cardigan", name: "Wool Cardigan", category: "Outerwear", comp: OZ.wool,
    occasion: ["everyday"], desc: "a cozy button cardigan knit from 100% organic wool, undyed and soft on baby skin. a warm natural layer with no synthetics, in a rich chestnut." },
  { handle: "oatmeal-wool-jacket", name: "Wool Jacket", category: "Outerwear", comp: OZ.wool,
    occasion: ["everyday"], desc: "a structured jacket in 100% organic boiled wool, densely knit for warmth and made to last through hand-me-downs. no synthetic shell, in a soft oatmeal." },
  // Accessories — thin kids gap (was 4 live)
  { handle: "seagrass-sun-hat", name: "Sun Hat", category: "Accessories", comp: OZ.oc,
    occasion: ["everyday", "resort"], desc: "a low-gauge 100% organic cotton sun hat that breathes in the heat and shades little faces, in a muted seagrass." },
  { handle: "pebble-booties", name: "Booties", category: "Accessories", comp: OZ.oc,
    occasion: ["everyday"], desc: "soft 100% organic cotton booties that stay put on tiny feet, knit without any synthetics, in a warm pebble." },
  { handle: "undyed-cotton-dots-bonnet", name: "Pixie Bonnet", category: "Accessories", comp: OZ.oc,
    occasion: ["everyday"], desc: "a classic pixie bonnet in undyed 100% organic cotton with a subtle dot texture, gentle against a newborn's head." },
  // Rompers & Sets
  { handle: "seagrass-beach-romper", name: "Beach Romper", category: "Rompers & Sets", comp: OZ.oc,
    occasion: ["everyday", "resort"], desc: "an airy low-gauge 100% organic cotton romper built for hot days and sandy play, in a soft seagrass." },
  { handle: "chestnut-wool-set", name: "Wool Set", category: "Rompers & Sets", comp: OZ.wool,
    occasion: ["everyday"], desc: "a matching top-and-bottom set knit from 100% organic wool, warm and breathable with no synthetics, in a deep chestnut." },
  // Bottoms
  { handle: "olive-garden-leggings", name: "Ribbed Leggings", category: "Bottoms", comp: OZ.oc,
    occasion: ["everyday"], desc: "everyday ribbed leggings in 100% organic cotton that stretch and move without any elastane, in a muted olive." },
  { handle: "clover-wide-leg-pants-undyed", name: "Wide Leg Pants", category: "Bottoms", comp: OZ.oc,
    occasion: ["everyday"], desc: "relaxed wide-leg pants in undyed 100% organic cotton, breathable and roomy for play, in a soft clover." },
  { handle: "charcoal-midnight-traveller-pants", name: "Traveller Pants", category: "Bottoms", comp: OZ.oc,
    occasion: ["everyday"], desc: "easy pull-on traveller pants in 100% organic cotton, soft enough to sleep in, in a deep charcoal midnight." },
  // Tops
  { handle: "olive-garden-classic-t-shirt", name: "Classic T-Shirt", category: "Tops", comp: OZ.oc,
    occasion: ["everyday", "casual"], desc: "a classic jersey tee in 100% organic cotton, soft and breathable for everyday wear, in a muted olive." },
  { handle: "cottonfield-sweatshirt", name: "Sweatshirt", category: "Tops", comp: OZ.oc,
    occasion: ["everyday", "casual"], desc: "a cozy pullover sweatshirt in 100% organic cotton with no synthetic fleece, in a soft natural cottonfield." },
  // Dresses
  { handle: "dill-gingham-sleeveless-dress", name: "Sleeveless Dress", category: "Dresses", comp: OZ.oc,
    occasion: ["everyday", "resort"], desc: "a breezy sleeveless dress in 100% organic muslin cotton, light and airy for warm days, in a soft dill gingham." },
];

async function usdPriceAndImages(handle) {
  const j = (await (await fetch(`https://organic-zoo.com/products/${handle}.json`, { headers: { "User-Agent": "Mozilla/5.0" } })).json()).product;
  if (!j) return null;
  const images = (j.images || []).map((i) => i.src).filter(Boolean);
  const page = await (await fetch(`https://organic-zoo.com/en-us/products/${handle}`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const cents = [...page.matchAll(/"price":(\d{3,6})[,}]/g)].map((m) => +m[1]).filter((n) => n > 500);
  const price = cents.length ? Math.min(...cents) / 100 : null;
  const inStock = j.variants.some((v) => v.available);
  return { price, images, inStock };
}

async function addOne(supabase, item, live) {
  const url = `https://organic-zoo.com/en-us/products/${item.handle}`;
  const { data: dup } = await supabase.from("products").select("id").eq("item_url", url).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };

  const meta = await usdPriceAndImages(item.handle);
  if (!meta) return { skip: "no product JSON" };
  if (meta.price == null) return { skip: "no USD price" };
  if (!meta.images.length) return { skip: "no images" };

  const score = calcToxomeScore(item.comp);
  if (score == null) return { skip: "unscoreable" };

  const row = {
    item_name: item.name, brand: "Organic Zoo",
    item_price: meta.price, currency: "USD", budget: budget(meta.price),
    category: item.category, gender: "Kids", occasion: item.occasion,
    item_image: meta.images[0], images: meta.images.slice(0, 6), item_url: url, affiliate_url: null,
    fabric_composition: item.comp, materials_text: materialsFromComp(item.comp),
    description: item.desc, certifications: ["gots"],
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !!live, rejected: false, added_by: "agent", reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-kids-organic-zoo", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  return { ok: true, id: data.id, score, price: meta.price, imgs: row.images.length, inStock: meta.inStock };
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
      console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(16)} ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${materialsFromComp(item.comp)} · ${r.imgs} imgs · feed ${r.inStock ? "in-stock" : "SOLD-OUT?"}`);
    } else {
      failed.push(`${item.name}: ${r.skip}`);
      console.log(`✗    ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as ${live ? "LIVE" : "drafts"}.`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
