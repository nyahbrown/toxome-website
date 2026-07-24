/**
 * Men's polo shirts (2026-07-23). No LLM, no Anthropic API.
 *
 * Handle-driven: each item names a US brand + a Shopify product handle + the
 * composition READ OFF the live PDP (verified via scripts/probe-men-polos.js,
 * which parses the full rendered PDP HTML — these brands render fabric % in JS
 * so it isn't in the feed body_html). Price / images / stock come from the
 * brand's products.json feed (all US storefronts → USD base, no currency trap).
 * Colorway lives in the description, never item_name. gender=Men, category=Tops.
 * Inserts published:false drafts for /admin review.
 *
 *   node --env-file=.env.local scripts/add-men-polos.js --dry     # preview
 *   node --env-file=.env.local scripts/add-men-polos.js --draft   # queue drafts
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const OCC_MAP = { everyday: "Everyday", casual: "Everyday", lounge: "Everyday", sleep: "Everyday", active: "Everyday", resort: "Vacation/Resort", "vacation/resort": "Vacation/Resort", occasion: "Special Occasion", "special occasion": "Special Occasion", evening: "Evening", workwear: "Workwear", work: "Workwear" };
const canonOcc = (arr) => [...new Set((arr || []).map((o) => OCC_MAP[String(o).toLowerCase()] || o))];
const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const materialsFromComp = (c) => (!c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", "));
const toFractions = (c) => {
  const s = Object.values(c).reduce((a, b) => a + b, 0);
  const o = {};
  for (const [k, v] of Object.entries(c)) o[k] = Math.round((v / s) * 1000) / 1000;
  return o;
};

// comp read off each live PDP (probe-men-polos.js, 2026-07-23). Not guessed.
const ITEMS = [
  // Taylor Stitch (US) — organic cotton / hemp
  { brand: "Taylor Stitch", domain: "https://www.taylorstitch.com", handle: "cotton-hemp-polo-in-sage-2606",
    name: "The Cotton Hemp Polo", comp: { "organic cotton": 70, hemp: 30 }, occasion: ["Everyday", "Vacation/Resort"],
    description: "a breezy short-sleeve polo in a 70% organic cotton / 30% hemp piqué, in a muted sage. hemp keeps it cool and gets softer with every wash." },
  { brand: "Taylor Stitch", domain: "https://www.taylorstitch.com", handle: "ripper-polo-in-canyon-2607",
    name: "The Ripper Polo", comp: { "organic cotton": 100 }, occasion: ["Everyday", "Workwear"],
    description: "a relaxed everyday polo cut from 100% organic cotton, in a warm canyon clay. soft, breathable, and built to break in over years, not seasons." },
  { brand: "Taylor Stitch", domain: "https://www.taylorstitch.com", handle: "pacific-polo-in-washed-indigo-pique-2505",
    name: "The Pacific Polo", comp: { "organic cotton": 100 }, occasion: ["Everyday", "Workwear"],
    description: "a classic piqué polo in 100% organic cotton, garment-washed to a soft indigo. structured collar, easy fit, nothing synthetic against the skin." },

  // Faherty (US) — linen / organic cotton
  { brand: "Faherty", domain: "https://fahertybrand.com", handle: "ss-linen-polo-whitecap",
    name: "Short-Sleeve Linen Polo", comp: { linen: 100 }, occasion: ["Everyday", "Vacation/Resort"],
    description: "an airy warm-weather polo in 100% linen, in a soft whitecap off-white. linen breathes and cools the way no synthetic can, made for long hot days." },
  { brand: "Faherty", domain: "https://fahertybrand.com", handle: "ss-sunwashed-pique-polo-coastal-sage",
    name: "Sunwashed Pique Polo", comp: { "organic cotton": 100 }, occasion: ["Everyday", "Workwear"],
    description: "a sun-softened piqué polo in 100% organic cotton, in a muted coastal sage. lived-in feel from the first wear, breathable and collar-crisp." },
  { brand: "Faherty", domain: "https://fahertybrand.com", handle: "ss-linen-sweater-polo-caribbean-navy-melange",
    name: "Linen Sweater Polo", comp: { linen: 100 }, occasion: ["Everyday", "Vacation/Resort"],
    description: "a knit sweater polo in 100% linen, in a heathered caribbean navy. the drape of a knit with the breathability of pure linen, dressed up or down." },

  // Marine Layer (US) — hemp/cotton, organic cotton, cotton
  { brand: "Marine Layer", domain: "https://www.marinelayer.com", handle: "hemp-resort-polo-4",
    name: "Hemp Cotton Polo", comp: { hemp: 53, cotton: 47 }, occasion: ["Everyday", "Vacation/Resort"],
    description: "a resort-ready polo in a 53% hemp / 47% cotton blend, in a soft chambray blue. hemp keeps it cool and structured while the cotton stays gentle on skin." },
  { brand: "Marine Layer", domain: "https://www.marinelayer.com", handle: "luxe-slub-polo",
    name: "Luxe Slub Polo", comp: { "organic cotton": 100 }, occasion: ["Everyday", "Workwear"],
    description: "an elevated slub-textured polo in 100% organic cotton, in a deep asphalt charcoal. soft hand, subtle texture, and a clean collar for anywhere." },
  { brand: "Marine Layer", domain: "https://www.marinelayer.com", handle: "sueded-rugby-polo-4",
    name: "Sueded Rugby Polo", comp: { cotton: 100 }, occasion: ["Everyday"],
    description: "a heavier sueded rugby polo in 100% cotton, in a warm sand and whitecap stripe. brushed for softness, made to be the easy weekend layer." },

  // Corridor NYC (US) — 100% cotton / organic cotton
  { brand: "Corridor NYC", domain: "https://corridornyc.com", handle: "pique-polo-3",
    name: "Pique Polo", comp: { cotton: 100 }, occasion: ["Everyday", "Workwear"],
    description: "a clean piqué polo in 100% cotton, in a crisp white. knit and sewn in new york, with a refined collar and an easy, breathable fit." },
  { brand: "Corridor NYC", domain: "https://corridornyc.com", handle: "pique-polo-1",
    name: "Pique Polo", comp: { cotton: 100 }, occasion: ["Everyday", "Workwear"],
    description: "the classic piqué polo in 100% cotton, in a deep navy. knit and sewn in new york, structured collar, nothing synthetic in the weave." },
  { brand: "Corridor NYC", domain: "https://corridornyc.com", handle: "ls-slouchy-polo-black-1",
    name: "Long Sleeve Slouchy Polo", comp: { "organic cotton": 100 }, occasion: ["Everyday", "Workwear"],
    description: "a relaxed long-sleeve polo in 100% organic cotton, in a washed black. slouchy through the body with an open collar, soft and breathable." },

  // Jungmaven (US) — hemp
  { brand: "Jungmaven", domain: "https://jungmaven.com", handle: "hemp-shirt-polo-fields",
    name: "Fields Hemp Polo", comp: { hemp: 100 }, occasion: ["Everyday", "Vacation/Resort"],
    description: "a rugged everyday polo in 100% hemp, naturally breathable and antimicrobial. hemp softens with wear and lasts for years, one of the cleanest fibers you can wear." },

  // Industry of All Nations (US) — organic cotton, natural dye
  { brand: "Industry of All Nations", domain: "https://industryofallnations.com", handle: "standard-polo",
    name: "Standard Polo", comp: { "organic cotton": 100 }, occasion: ["Everyday", "Workwear"],
    description: "a heritage piqué polo in 100% organic cotton, left undyed in its natural cotton tone. no dyes, no synthetics, just clean fiber and a classic collar." },

  // Everlane (US) — cotton
  { brand: "Everlane", domain: "https://www.everlane.com", handle: "mens-classic-pique-polo-olive-night",
    name: "Classic Piqué Polo", comp: { cotton: 100 }, occasion: ["Everyday", "Workwear"],
    description: "the classic piqué polo in 100% cotton, in a deep olive night. a clean-lined wardrobe staple with a structured collar and breathable weave." },
];

const feedCache = {};
async function feed(domain) {
  if (feedCache[domain]) return feedCache[domain];
  let all = [];
  for (let page = 1; page <= 5; page++) {
    let r;
    try { r = await fetch(`${domain}/products.json?limit=250&page=${page}`, { headers: { "User-Agent": "Mozilla/5.0" } }); }
    catch (e) { break; }
    if (!r.ok) break;
    let json;
    try { json = await r.json(); } catch (e) { break; }
    const ps = json.products || [];
    all = all.concat(ps);
    if (ps.length < 250) break;
  }
  feedCache[domain] = all;
  return all;
}

async function resolve(item) {
  const all = await feed(item.domain);
  const p = all.find((x) => x.handle === item.handle);
  if (!p) return { err: "handle not in feed" };
  const inStock = p.variants.some((v) => v.available);
  const prices = p.variants.map((v) => Number(v.price)).filter((n) => n > 0);
  const images = (p.images || []).map((i) => i.src).filter(Boolean);
  return {
    title: p.title, inStock,
    price: prices.length ? Math.min(...prices) : null,
    images,
    url: `${item.domain}/products/${p.handle}`,
  };
}

async function run() {
  const draft = process.argv.includes("--draft");
  const dry = !draft;
  const supabase = draft ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
  if (draft && !process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

  let n = 0;
  const problems = [];
  for (const item of ITEMS) {
    const r = await resolve(item);
    if (r.err) { problems.push(`${item.brand} — ${item.name} (${item.handle}): ${r.err}`); console.log(`✗    ${item.brand} — ${item.name}  (${r.err})`); continue; }
    const frac = toFractions(item.comp);
    const score = calcToxomeScore(frac);
    const flags = [];
    if (score == null || score < 67) flags.push(`SCORE ${score}`);
    if (!r.inStock) flags.push("SOLD-OUT");
    if (r.images.length < 2) flags.push(`${r.images.length}img`);

    if (dry) {
      console.log(`• Tops  ${item.brand} — ${item.name}  [feed title: ${r.title}]`);
      console.log(`     $${r.price} · score ${score} ${scoreToRiskLevel(score)} · ${materialsFromComp(item.comp)} · ${r.images.length}img · ${r.inStock ? "in-stock" : "SOLD-OUT"}${flags.length ? "  ⚠ " + flags.join(", ") : ""}`);
      console.log(`     ${r.url}`);
      n++;
      continue;
    }

    if (flags.length) { problems.push(`${item.brand} — ${item.name}: ${flags.join(", ")}`); console.log(`✗    ${item.brand} — ${item.name}  (${flags.join(", ")})`); continue; }
    const { data: dup } = await supabase.from("products").select("id").eq("item_url", r.url).maybeSingle();
    if (dup) { console.log(`✗    ${item.brand} — ${item.name}  (dup ${dup.id.slice(0, 8)})`); continue; }
    const row = {
      item_name: item.name, brand: item.brand,
      item_price: r.price, currency: "USD", budget: budget(r.price),
      category: "Tops", gender: "Men", occasion: canonOcc(item.occasion),
      item_image: r.images[0], images: r.images.slice(0, 6), item_url: r.url, affiliate_url: null,
      fabric_composition: frac, materials_text: materialsFromComp(item.comp),
      description: item.description, certifications: null,
      toxome_score: score, risk_level: scoreToRiskLevel(score),
      published: false, rejected: false, added_by: "agent", reviewed_at: null,
      tags: ["batch-men-polos", "no-llm"],
    };
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) { problems.push(`${item.brand} — ${item.name}: ${error.message}`); console.log(`✗    ${item.brand} — ${item.name}  (insert: ${error.message})`); continue; }
    n++;
    console.log(`✓ ${String(n).padStart(2)} ${item.brand} — ${item.name}  ($${r.price}, ${score})`);
  }
  console.log(`\n${n} ${dry ? "candidates previewed" : "drafted"}.`);
  if (problems.length) console.log("problems:\n  " + problems.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
