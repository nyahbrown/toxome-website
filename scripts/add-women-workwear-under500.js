/**
 * Women's ELEVATED / PROFESSIONAL WORKWEAR — UNDER $500 (2026-07-15). No LLM.
 *
 * A sub-$500 backfill for the elevated-workwear collection (the first pass
 * shipped ~11 pieces after the >= $500 items were pruned). Same Eileen-Fisher
 * register as add-women-workwear-elevated.js — tailored blazers, wide-leg and
 * pleated trousers, column / pencil skirts, silk and fine cotton blouses,
 * structured shirts, sheath / column / wrap dresses, and fine-gauge merino /
 * wool / cashmere / cotton / tencel knits. Explicitly NOT camp shirts, jersey
 * tees, tanks, sundresses, or loungewear.
 *
 * Same page-grounded validate + score + draft path as add-women-workwear-
 * elevated.js. Three gates every item must clear, enforced in code, never
 * forced:
 *   1. PRICE < $500 (hard cap). USD is read off the live PDP (JSON-LD / Shopify
 *      /products/{handle}.js). Anything the page prices in EUR/GBP is dropped
 *      (no USD price), and anything that lands >= 500 is dropped.
 *   2. FIBER = GREEN Toxome score only. calcToxomeScore(comp) >= 68 ("low"
 *      risk). Semi-synthetics/blends (tencel/lyocell, modal, cupro, ecovero,
 *      viscose blends) qualify iff they actually score green; sub-68 is dropped.
 *   3. Real, in-stock, specific PDP with a working image (getValidatedProduct).
 *
 * Every candidate below was pre-scanned off each brand's live Shopify catalog
 * (products.json) for a green composition, a USD sub-$500 price, an in-stock
 * neutral variant, and an elevated (non-casual) silhouette. `comp` is passed as
 * a fallback only, read verbatim off the live product body; the live scrape
 * wins when it returns its own composition, and price is always taken live.
 * Every URL is pinned to the most NEUTRAL colorway; every item_name is
 * colorway-free.
 *
 * Categories follow catalog convention: blazers / structured jackets ->
 * Outerwear, trousers / skirts -> Bottoms, blouses / shirts -> Tops, dresses ->
 * Dresses, knit sweaters / cardigans -> Sweaters. occasion = ["Workwear"]
 * (+ "Everyday" only when the piece is genuinely both). Out-of-stock pages are
 * skipped. Brand cap of <= 4 items per brand TOTAL is respected in the catalog.
 *
 *   node --env-file=.env.local scripts/add-women-workwear-under500.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// --- page-grounded composition recovery (identical to add-women-workwear-elevated.js) --
const CUT = /(customer reviews|write a review|you may also like|related products|pairs well with|complete the look|recently viewed|you might also)/i;
function cleanText(html) {
  return String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function normFiber(raw) {
  const s = raw.toLowerCase();
  if (/ecovero/.test(s)) return "ecovero";
  if (/tencel[^a-z]*modal/.test(s)) return "tencel modal";
  if (/tencel|lyocell/.test(s)) return "lyocell";
  if (/organic\s+cotton|gots\s+cotton/.test(s)) return "organic cotton";
  if (/pima|supima|egyptian|cotton/.test(s)) return "cotton";
  if (/european\s*flax|flax|linen/.test(s)) return "linen";
  if (/merino/.test(s)) return "merino wool";
  if (/alpaca/.test(s)) return "alpaca";
  if (/cashmere/.test(s)) return "cashmere";
  if (/\bwool\b/.test(s)) return "wool";
  if (/hemp/.test(s)) return "hemp";
  if (/mulberry|silk/.test(s)) return "silk";
  if (/cupro|cuprammonium|bemberg/.test(s)) return "cupro";
  if (/bamboo[^a-z]*(viscose|rayon)|viscose|rayon/.test(s)) return "viscose";
  if (/modal/.test(s)) return "modal";
  if (/ramie/.test(s)) return "ramie";
  if (/acetate/.test(s)) return "acetate";
  if (/polyester/.test(s)) return "polyester";
  if (/nylon|polyamide/.test(s)) return "nylon";
  if (/elastane|spandex|lycra/.test(s)) return "elastane";
  if (/acrylic/.test(s)) return "acrylic";
  return null;
}
const FIBER_RX = /(\d{1,3})\s*%\s*([A-Za-z®™\-\s]{3,40})/g;
function recoverComp(html) {
  const body = cleanText(html).split(CUT)[0];
  const found = [];
  let m;
  FIBER_RX.lastIndex = 0;
  while ((m = FIBER_RX.exec(body))) {
    const pct = Number(m[1]);
    if (!(pct > 0 && pct <= 100)) continue;
    const fiber = normFiber(m[2]);
    if (!fiber) continue;
    found.push({ pct, fiber });
  }
  if (!found.length) return null;
  for (let start = 0; start < Math.min(found.length, 4); start++) {
    const comp = {}; let sum = 0;
    for (let i = start; i < found.length && sum < 100; i++) {
      const f = found[i];
      if (comp[f.fiber]) continue;
      comp[f.fiber] = f.pct; sum += f.pct;
    }
    if (sum >= 97 && sum <= 103) return comp;
  }
  const h = found.find((f) => f.pct === 100);
  return h ? { [h.fiber]: 100 } : null;
}

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BLACKLIST = require("../lib/brandBlacklist.json").map((b) => b.toLowerCase().trim());
const isBlacklisted = (b) => !!b && BLACKLIST.some((x) => b.toLowerCase().includes(x));
// GREEN gate: scoreToRiskLevel returns "low" at >= 68 (CLEAN_GREEN).
const SCORE_BAR = 68;
// HARD PRICE CAP: every item must be strictly under this (USD).
const PRICE_CAP = 500;

const WORK = ["Workwear"];
const WORK_EVERY = ["Workwear", "Everyday"];

const ITEMS = [
  // ======================= FAVORITE DAUGHTER ==============================
  { brand: "Favorite Daughter", name: "The Classic Poplin Shirt", category: "Tops", occasion: WORK, comp: { cotton: 100 },
    url: "https://www.favoritedaughter.com/products/classic-poplin-shirt-white",
    description: "A crisp poplin button-down in 100% cotton, cut clean to tuck in and hold a line at the desk. A breathable natural fiber, not the wrinkle-free resin finish most office shirts hide. Shown in white." },
  { brand: "Favorite Daughter", name: "The Cord City Blazer", category: "Outerwear", occasion: WORK, comp: { cotton: 100 },
    url: "https://www.favoritedaughter.com/products/the-cord-city-blazer-navy",
    description: "A tailored blazer in 100% cotton corduroy, structured enough to anchor a work look and soft enough to wear all day. A natural fiber, not a fused synthetic suiting shell. Shown in navy." },
  { brand: "Favorite Daughter", name: "The Effortless Sweater", category: "Sweaters", occasion: WORK_EVERY, comp: { wool: 100 },
    url: "https://www.favoritedaughter.com/products/the-effortless-sweater-ivory",
    description: "A fine-gauge crewneck in 100% wool that layers cleanly under a blazer for work. A natural fiber that regulates temperature, unlike the acrylic knits that pill and hold static. Shown in ivory." },
  { brand: "Favorite Daughter", name: "The Fatigue Sisters Wide Leg Pant", category: "Bottoms", occasion: WORK, comp: { cotton: 95, cashmere: 5 },
    url: "https://www.favoritedaughter.com/products/fatigue-sisters-wide-leg-pant-black",
    description: "A high-waisted wide-leg trouser in a cotton and cashmere weave, cut long and clean for the office. Two natural fibers that breathe and drape, not the plastic suiting most work pants are made from. Shown in black." },

  // ======================= SILK LAUNDRY ==================================
  { brand: "Silk Laundry", name: "Boyfriend Shirt", category: "Tops", occasion: WORK, comp: { silk: 100 },
    url: "https://silklaundry.com/products/boyfriend-shirt-slate",
    description: "A relaxed button-up in 100% sandwashed silk, refined enough to read polished on its own or under a jacket. Pure silk against the skin all day instead of the polyester charmeuse most 'silky' shirts hide. Shown in slate." },
  { brand: "Silk Laundry", name: "Collarless Blazer", category: "Outerwear", occasion: WORK, comp: { silk: 100 },
    url: "https://silklaundry.com/products/collarless-blazer-black",
    description: "A softly tailored collarless blazer in 100% silk, structured enough to anchor a work look and fluid enough to wear all day. A natural protein fiber, not a fused synthetic suiting shell. Shown in black." },
  { brand: "Silk Laundry", name: "Carrie Dress", category: "Dresses", occasion: WORK_EVERY, comp: { silk: 100 },
    url: "https://silklaundry.com/products/carrie-dress-black",
    description: "A clean-lined column dress in 100% silk, tailored enough to carry a workday and easy after it. A breathable natural fiber against the skin where a synthetic dress would cling. Shown in black." },

  // ======================= THE FRANKIE SHOP ==============================
  { brand: "The Frankie Shop", name: "Arlen Cotton Boxy Shirt", category: "Tops", occasion: WORK, comp: { "organic cotton": 100 },
    url: "https://thefrankieshop.com/products/arlen-cotton-boxy-shirt-slate-grey",
    description: "A structured boxy button-down in 100% organic cotton, cut clean and minimal to layer for work. Cotton grown without synthetic pesticides, breathable where a poly-blend shirt is not. Shown in slate grey." },
  { brand: "The Frankie Shop", name: "Bec Padded Shirt", category: "Outerwear", occasion: WORK, comp: { cotton: 100 },
    url: "https://thefrankieshop.com/products/bec-padded-shirt-black",
    description: "A lightly padded shirt-jacket in 100% cotton, structured enough to layer over tailoring as an easy outer layer for work. A natural fiber, not a synthetic-shell overshirt. Shown in black." },
  { brand: "The Frankie Shop", name: "Arne Sweater", category: "Sweaters", occasion: WORK_EVERY, comp: { cotton: 100 },
    url: "https://thefrankieshop.com/products/arne-sweater-grey-melange",
    description: "A fine-gauge crewneck in 100% cotton that layers cleanly under a blazer for the office. A breathable natural fiber, not the acrylic most everyday knits are made from. Shown in grey melange." },

  // ======================= 3.1 PHILLIP LIM ===============================
  { brand: "3.1 Phillip Lim", name: "Cotton Linen Paperbag Trouser", category: "Bottoms", occasion: WORK, comp: { cotton: 70, linen: 30 },
    url: "https://thefrankieshop.com/products/3-1-phillip-lim-cotton-linen-paperbag-pant-olive",
    description: "A high-waisted paperbag trouser in a cotton and linen weave, tailored with a clean line for the desk. Two natural plant fibers that breathe, not a linen-look synthetic. Shown in olive." },

  // ======================= STILL HERE ====================================
  { brand: "Still Here", name: "The Shirt", category: "Tops", occasion: WORK, comp: { cotton: 100 },
    url: "https://stillherenewyork.com/products/theshirt-black",
    description: "A clean, tailored button-down in 100% cotton with enough body to tuck in and hold a line at work. A breathable natural fiber, not the polyester most everyday shirts are cut from. Shown in black." },
  { brand: "Still Here", name: "Snap Collar Sweater", category: "Sweaters", occasion: WORK_EVERY, comp: { cotton: 100 },
    url: "https://stillherenewyork.com/products/snap-collar-sweater-in-navy",
    description: "A refined snap-collar knit in 100% cotton, made to layer over shirting for work. A pure natural fiber that regulates temperature, unlike the acrylic knits that hold static. Shown in navy." },
  { brand: "Still Here", name: "Daughter Sweater", category: "Sweaters", occasion: WORK_EVERY, comp: { lyocell: 70, cotton: 25, silk: 5 },
    url: "https://stillherenewyork.com/products/daughter-sweater-long-sleeve-in-black",
    description: "A fine-knit long-sleeve in a tencel, cotton and silk blend, all breathable fibers, cut to layer cleanly under a blazer. A closed-loop and natural-fiber knit where a synthetic one would cling and pill. Shown in black." },
  { brand: "Still Here", name: "Hotel Sweater", category: "Sweaters", occasion: WORK_EVERY, comp: { cotton: 100 },
    url: "https://stillherenewyork.com/products/hotel-sweater-long-sleeve-in-chocolate-brown",
    description: "A relaxed long-sleeve knit in 100% cotton, easy to layer over tailored pieces for the office. A breathable natural fiber, not the acrylic most cosy knits are made from. Shown in chocolate." },

  // ======================= DEMYLEE =======================================
  { brand: "Demylee", name: "Abigail Cashmere Cardigan", category: "Sweaters", occasion: WORK_EVERY, comp: { cashmere: 100 },
    url: "https://demylee.com/products/abigail-cashmere-cardigan-3",
    description: "A fine-knit cardigan in 100% cashmere, built to layer over shirting for work. A pure natural fiber that insulates cleanly, without the static and pilling of an acrylic blend. Shown in a quiet neutral." },

  // ======================= OZMA ==========================================
  { brand: "OZMA", name: "All Day Pant", category: "Bottoms", occasion: WORK, comp: { "organic cotton": 100 },
    url: "https://ozmaofcalifornia.com/products/all-day-pant-organic-cotton-poplin-black",
    description: "A tailored straight-leg trouser in 100% organic cotton poplin, cut high with a clean line for the office. A natural fiber grown without synthetic pesticides, breathable where a synthetic suiting pant traps heat. Shown in black." },

  // ======================= NINETY PERCENT ================================
  { brand: "Ninety Percent", name: "Ina Harem Trouser", category: "Bottoms", occasion: WORK, comp: { lyocell: 100 },
    url: "https://ninetypercent.com/products/ina-harem-trouser-jersey-in-bitter-chocolate-hs26",
    description: "A fluid tapered trouser in 100% tencel, cut to drape long and clean for work. A closed-loop plant fiber that breathes and holds its line where a polyester pant would cling. Shown in bitter chocolate." },
  { brand: "Ninety Percent", name: "Tulla Dress", category: "Dresses", occasion: WORK_EVERY, comp: { cotton: 50, modal: 50 },
    url: "https://ninetypercent.com/products/tulla-dress-in-black-hs26",
    description: "A clean-lined column dress in a cotton and modal blend, tailored to a quiet, minimal silhouette for the office and after. Two breathable fibers against the skin where a polyester sheath would trap heat. Shown in black." },

  // ======================= SUNDRY ========================================
  { brand: "Sundry", name: "Classic Shirt", category: "Tops", occasion: WORK, comp: { cotton: 100 },
    url: "https://www.sundryclothing.com/products/sundry-classic-shirt-in-black",
    description: "A tailored button-down in 100% cotton, cut clean to tuck in and read polished under a blazer. A breathable natural fiber, not the poly-blend most everyday shirts are made from. Shown in black." },

  // ======================= AMOMENTO ======================================
  { brand: "Amomento", name: "Linen Oversized Shirt", category: "Tops", occasion: WORK, comp: { linen: 100 },
    url: "https://thefrankieshop.com/products/amomento-linen-oversized-shirt-khaki-grey",
    description: "A structured oversized button-down in 100% linen, tailored enough to layer for work and light enough to wear on its own. Linen breathes and holds a clean line where a synthetic shirt just traps heat. Shown in khaki grey." },

  // ======================= CAWLEY ========================================
  { brand: "Cawley", name: "Silk Dupion Erika Dress", category: "Dresses", occasion: WORK_EVERY, comp: { silk: 100 },
    url: "https://cawleystudio.com/products/silk-dupion-erika-dress",
    description: "A structured column dress in 100% silk dupion, tailored to a quiet, elevated line for the office. A natural protein fiber that breathes where a synthetic dress would cling. Shown in a quiet neutral." },
];

const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
function toFractions(comp) {
  if (!comp || typeof comp !== "object") return null;
  const e = Object.entries(comp).map(([k, v]) => [k.toLowerCase().trim(), Number(v)]).filter(([k, v]) => k && v > 0);
  if (!e.length) return null;
  const s = e.reduce((a, [, v]) => a + v, 0);
  const o = {};
  for (const [k, v] of e) o[k] = Math.round((v / s) * 1000) / 1000;
  return o;
}
const materialsFromComp = (c) =>
  !c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${Math.round(v * 100)}% ${k}`).join(", ");

async function addOne(supabase, item, live) {
  if (isBlacklisted(item.brand)) return { skip: `${item.brand} blacklisted` };
  const v = await getValidatedProduct(item.url);
  if (!v.ok) return { skip: v.reason };
  if (v.inStock === false) return { skip: "out of stock" };

  let price = typeof v.price === "number" ? v.price : null;
  if (price == null) return { skip: "no USD price" };
  // HARD CAP: drop anything at or above $500 before insert.
  if (price >= PRICE_CAP) return { skip: `price $${price} >= $${PRICE_CAP}` };

  // Prefer the live-scraped composition; fall back to the page-read `comp` only
  // when the live scrape misses it (some brands render fabric past the 20k window).
  let comp = toFractions(v.composition) || toFractions(item.comp);
  if (!comp) {
    try {
      const page = await fetchPage(v.finalUrl);
      comp = toFractions(recoverComp(page.html));
    } catch {}
  }
  if (!comp) return { skip: "no composition" };
  const score = calcToxomeScore(comp);
  if (score == null || score < SCORE_BAR) return { skip: `score ${score} below green bar` };

  const { data: dup } = await supabase.from("products").select("id").eq("item_url", v.finalUrl).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };
  const { data: dupName } = await supabase.from("products").select("id").eq("item_name", item.name).eq("brand", item.brand).maybeSingle();
  if (dupName) return { skip: `dup name ${dupName.id.slice(0, 8)}` };

  const row = {
    item_name: item.name, brand: item.brand,
    item_price: price, currency: "USD", budget: budget(price),
    category: item.category, gender: "Women", occasion: item.occasion,
    item_image: v.images[0], images: v.images, item_url: v.finalUrl, affiliate_url: null,
    fabric_composition: comp, materials_text: materialsFromComp(comp),
    description: item.description,
    certifications: v.certifications && v.certifications.length ? v.certifications : null,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !!live, rejected: false, added_by: "manual", reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-women-workwear-under500", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  return { ok: true, id: data.id, score, price, certs: row.certifications, comp, imgs: v.images.length };
}

async function run() {
  const live = !process.argv.includes("--draft");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, key);

  let n = 0;
  const byCat = {};
  const byBrand = {};
  const scores = [];
  const prices = [];
  const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live);
    if (r.ok) {
      n++;
      byCat[item.category] = (byCat[item.category] || 0) + 1;
      byBrand[item.brand] = (byBrand[item.brand] || 0) + 1;
      scores.push(r.score);
      prices.push(r.price);
      console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(9)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${JSON.stringify(r.comp)} · ${r.certs ? r.certs.join("/") : "no certs"} · ${r.imgs} imgs`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as ${live ? "LIVE" : "drafts"}.`);
  if (scores.length) console.log(`score range ${Math.min(...scores)}–${Math.max(...scores)}`);
  if (prices.length) console.log(`price range $${Math.min(...prices)}–$${Math.max(...prices)}`);
  console.log(`by category: ${JSON.stringify(byCat)}`);
  console.log(`by brand: ${JSON.stringify(byBrand)}`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
