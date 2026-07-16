/**
 * Women's JEANS / DENIM — GREEN SCORE ONLY, UNDER $500 (2026-07-15). No LLM.
 *
 * Clean-denim trousers for the shop: straight, wide-leg, high-rise, barrel,
 * bootcut, cropped, relaxed and slim jeans from denim houses that actually
 * publish their fiber content. Denim is cotton-dominant, so rigid 100% cotton
 * and low-elastane / tencel-blend stretch denim clear the green bar comfortably;
 * anything with meaningful polyester or high elastane drops below it and is
 * rejected, never forced.
 *
 * Same page-grounded validate + score + draft path as add-women-workwear-
 * under500.js. Every item must clear four gates, enforced in code:
 *   1. FIBER = GREEN Toxome score only. calcToxomeScore(comp) >= 68 ("low"
 *      risk). Composition is read LIVE off each PDP (Shopify body_html / JSON-LD
 *      / visible page text), never guessed. `comp` is passed only as a fallback
 *      for the recover path and matches what the live PDP states.
 *   2. PRICE < $500 (hard cap). USD is read off the live PDP; non-USD prices are
 *      dropped (no USD price).
 *   3. Real, in-stock, specific PDP with a working image (getValidatedProduct).
 *      Out-of-stock pages are skipped.
 *   4. Brand cap <= 4 items per brand TOTAL across the catalog. Existing rows are
 *      counted at start; this run tops each brand up to 4 and no further. DL1961
 *      already has 2, so it takes at most 2 more.
 *
 * Every URL is pinned to a NEUTRAL wash (dark rinse / indigo, black, ecru /
 * white, or classic light wash) with no heavy distressing; every item_name is
 * colorway / wash-free. gender="Women", category="Bottoms",
 * occasion=["Everyday"] (jeans are casual, not workwear). Quince is blacklisted.
 * The list is intentionally over-sourced with per-brand backups so ~18 land even
 * if a primary goes out of stock; the in-code brand cap keeps each brand <= 4.
 *
 *   node --env-file=.env.local scripts/add-women-jeans.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// --- page-grounded composition recovery (identical to add-women-workwear-under500.js) --
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
// Brand cap: <= 4 rows per brand TOTAL across the whole catalog.
const BRAND_CAP = 4;

const EVERY = ["Everyday"];

// Over-sourced with backups; the in-code brand cap keeps each brand <= 4 total.
const ITEMS = [
  // ============================ AGOLDE (100% cotton) ============================
  { brand: "AGOLDE", name: "90's Mid-Rise Loose Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 100 },
    url: "https://agolde.com/products/90s-jean-mid-rise-loose-fit-32-inseam-rinse",
    description: "A mid-rise, loose straight jean in 100% cotton, cut long and easy in a dark rinse. Rigid natural-fiber denim with nothing synthetic woven in, where most stretch jeans blend in elastane and polyester. Shown in a dark rinse indigo." },
  { brand: "AGOLDE", name: "Fusion Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 100 },
    url: "https://agolde.com/products/fusion-jean-foundation",
    description: "A relaxed, tapered jean in 100% cotton with a clean vintage line. A pure natural fiber that softens with wear, not the plastic-blend denim that traps heat. Shown in a mid indigo wash." },
  { brand: "AGOLDE", name: "Low Rise Slim Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 100 },
    url: "https://agolde.com/products/low-rise-slim-marshmallow",
    description: "A low-rise slim jean in 100% cotton, cut narrow and clean. Rigid cotton denim breathes and holds its shape without any elastane. Shown in a soft ecru." },
  { brand: "AGOLDE", name: "Magnus Trouser Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 100 },
    url: "https://agolde.com/products/magnus-trouser-jean-chlk-white",
    description: "A high-rise trouser jean in 100% cotton with a tailored, wide line. A natural fiber cut sharp enough to read like trousers, with nothing synthetic blended in. Shown in a chalk white." },
  { brand: "AGOLDE", name: "Deka Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 100 },
    url: "https://agolde.com/products/deka-jean-guide",
    description: "A relaxed straight jean in 100% cotton with an easy mid-rise. Rigid natural-fiber denim, not a poly-stretch blend. Shown in a clean indigo wash." },
  { brand: "AGOLDE", name: "90's Mid-Rise Straight Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 100 },
    url: "https://agolde.com/products/90s-jean-mid-rise-loose-32-session",
    description: "A mid-rise straight jean in 100% cotton with a true vintage cut. A pure natural fiber that wears in over time, unlike the elastane denim that goes slack. Shown in a mid indigo wash." },

  // ============================ TRIARCHY (regen / organic cotton) ============================
  { brand: "Triarchy", name: "Ms. Triarchy V-High Rise Straight Leg Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 98 },
    url: "https://triarchy.com/products/ms-triarchy-v-high-rise-straight-leg-medium-indigo",
    description: "A very high-rise straight-leg jean in regenerative cotton, cut clean and long. Denim grown on farms that rebuild soil, with almost no stretch fiber. Shown in a medium indigo." },
  { brand: "Triarchy", name: "Fonda High Rise Wide Leg Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 98 },
    url: "https://triarchy.com/products/fonda-high-rise-wide-leg-summer-light-indigo",
    description: "A high-rise wide-leg jean in regenerative cotton with a full, fluid line. A natural fiber that drapes long where a poly-stretch jean would cling. Shown in a summer light indigo." },
  { brand: "Triarchy", name: "Birkin Mid-Rise Straight Leg Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 80, lyocell: 20 },
    url: "https://triarchy.com/products/birkin-mid-rise-straight-leg-venice-vintage-indigo",
    description: "A mid-rise straight-leg jean in an organic cotton and tencel weave, cut with a soft vintage drape. Two low-impact fibers, no polyester. Shown in a vintage indigo." },
  { brand: "Triarchy", name: "Linda Mid-Rise Pleated Wide Leg Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 100 },
    url: "https://triarchy.com/products/linda-mid-rise-pleated-wide-leg-malibu-indigo",
    description: "A pleated, mid-rise wide-leg jean in organic cotton with a tailored, trouser-like line. Cotton grown without synthetic pesticides, breathable and rigid. Shown in a medium indigo." },
  { brand: "Triarchy", name: "Kate Mid-Rise Cropped Slim Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 98 },
    url: "https://triarchy.com/products/kate-mid-rise-cropped-slim-light-indigo",
    description: "A cropped, mid-rise slim jean in regenerative cotton with a clean ankle line. A natural fiber that holds its shape without heavy stretch. Shown in a light indigo." },
  { brand: "Triarchy", name: "Goldie Mid-Rise Darted Straight Leg Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 80, lyocell: 20 },
    url: "https://triarchy.com/products/goldie-mid-rise-darted-straight-leg-venice-vintage-indigo",
    description: "A darted, mid-rise straight-leg jean in an organic cotton and tencel blend with a soft, structured drape. Two low-impact fibers, no polyester. Shown in a vintage indigo." },

  // ============================ OUTLAND DENIM (organic cotton) ============================
  { brand: "Outland Denim", name: "Zoe High-Rise Straight Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 74, cotton: 20, spandex: 6 },
    url: "https://outlanddenim.com/products/zoe-high-straight-jean-32",
    description: "A high-rise straight jean in mostly organic and recycled cotton with a touch of stretch for movement. A natural-fiber-led denim, not a poly blend. Shown in an ash black." },
  { brand: "Outland Denim", name: "Elise Mid-Rise Straight Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 94, cotton: 5, spandex: 1 },
    url: "https://outlanddenim.com/products/elise-mid-straight-jean-33",
    description: "A mid-rise straight jean in 94% organic cotton with a barely-there stretch. Cotton grown without synthetic pesticides, cut clean and classic. Shown in a mid indigo." },
  { brand: "Outland Denim", name: "Cindy High-Rise Bootcut Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 74, cotton: 20, spandex: 6 },
    url: "https://outlanddenim.com/products/cindy-high-bootleg-jean-33",
    description: "A high-rise bootcut jean in mostly organic and recycled cotton with a small amount of stretch. A natural-fiber-led denim with a clean, long line. Shown in an ash black." },
  { brand: "Outland Denim", name: "Claudia High-Rise Wide Relaxed Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 100 },
    url: "https://outlanddenim.com/products/claudia-high-wide-relaxed-jean-34",
    description: "A high-rise, wide relaxed jean in 100% organic cotton with a fluid drape. Rigid natural-fiber denim, breathable and free of any stretch fiber. Shown in a vintage black." },
  { brand: "Outland Denim", name: "Ellie High-Rise Wide Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 74, cotton: 20, spandex: 6 },
    url: "https://outlanddenim.com/products/ellie-high-wide-jean-34",
    description: "A high-rise wide-leg jean in mostly organic and recycled cotton with a hint of stretch. A natural-fiber-led denim cut long and easy. Shown in an ash black." },
  { brand: "Outland Denim", name: "Mia Mid-Rise Seamed Jean", category: "Bottoms", occasion: EVERY, comp: { "organic cotton": 94, cotton: 5, spandex: 1 },
    url: "https://outlanddenim.com/products/mia-mid-wide-seamed-jean-32",
    description: "A mid-rise seamed wide jean in 94% organic cotton with a whisper of stretch. Cotton grown without synthetic pesticides, cut with a clean front seam. Shown in a mid indigo." },

  // ============================ WARP + WEFT (cotton-elastane) ============================
  { brand: "Warp + Weft", name: "SAT 90's Straight Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 99, elastane: 1 },
    url: "https://warpweftworld.com/products/sat-90s-straight-jeans-authentic-blues",
    description: "A high-rise 90's straight jean in 99% cotton with just 1% stretch. Almost entirely natural-fiber denim, a world away from the poly-heavy stretch jeans on most racks. Shown in a classic indigo." },
  { brand: "Warp + Weft", name: "NCE Wide Leg Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 99, elastane: 1 },
    url: "https://warpweftworld.com/products/nce-wide-leg-jeans-double-cuff",
    description: "A high-rise wide-leg jean in 99% cotton with a trace of stretch for movement. A cotton-led denim that drapes long and breathes. Shown in a mid-blue wash." },
  { brand: "Warp + Weft", name: "MIA Flare Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 99, elastane: 1 },
    url: "https://warpweftworld.com/products/mia-flare-jeans-big-city",
    description: "A high-rise flare jean in 99% cotton with a single percent of stretch. A natural-fiber-led denim with a clean, long flare. Shown in a mid-blue wash." },
  { brand: "Warp + Weft", name: "SAT 90's Utility Straight Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 98, elastane: 2 },
    url: "https://warpweftworld.com/products/sat-90s-utility-straight-jeans-ecru",
    description: "A high-rise utility straight jean in 98% cotton with a touch of stretch. A cotton-led denim cut clean and rigid. Shown in a natural ecru." },
  { brand: "Warp + Weft", name: "The Big Easy Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 99, elastane: 1 },
    url: "https://warpweftworld.com/products/the-big-easy-sand-dollar",
    description: "A relaxed, easy jean in 99% cotton with a trace of stretch. A natural-fiber-led denim with a soft, roomy line. Shown in a light sand wash." },

  // ============================ DL1961 (cotton / tencel) — 2 slots ============================
  { brand: "DL1961", name: "Kaylen Loose Straight High-Rise Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 83, lyocell: 17 },
    url: "https://dl1961.com/products/kaylen-loose-straight-high-rise-32-jeans-authentic",
    description: "A high-rise loose straight jean in a cotton and tencel weave, cut long and clean. Two low-impact fibers, no polyester, where most performance denim leans synthetic. Shown in an authentic indigo." },
  { brand: "DL1961", name: "Miro Barrel High-Rise Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 83, lyocell: 17 },
    url: "https://dl1961.com/products/miro-barrel-high-rise-28-jeans-ash-grey",
    description: "A high-rise barrel jean in a cotton and tencel blend with a rounded, modern leg. A natural and closed-loop fiber mix, breathable and free of polyester. Shown in an ash grey." },
  { brand: "DL1961", name: "Alex Baggy Wide Leg Jean", category: "Bottoms", occasion: EVERY, comp: { cotton: 83, lyocell: 17 },
    url: "https://dl1961.com/products/alex-baggy-wide-leg-low-rise-32-jeans-authentic",
    description: "A low-rise baggy wide-leg jean in a cotton and tencel weave with a loose, fluid drape. Two low-impact fibers, no polyester. Shown in an authentic indigo." },
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

async function addOne(supabase, item, live, remaining) {
  if (isBlacklisted(item.brand)) return { skip: `${item.brand} blacklisted` };
  // Brand cap: refuse once this brand has no remaining catalog budget.
  if ((remaining[item.brand] ?? 0) <= 0) return { skip: `brand cap (${BRAND_CAP}) reached` };

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
    tags: ["batch-women-jeans", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  remaining[item.brand] -= 1;
  return { ok: true, id: data.id, score, price, certs: row.certifications, comp, imgs: v.images.length };
}

async function run() {
  const live = !process.argv.includes("--draft");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, key);

  // Compute per-brand remaining budget from existing catalog counts (published + draft).
  const brands = [...new Set(ITEMS.map((i) => i.brand))];
  const remaining = {};
  for (const b of brands) {
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("brand", b);
    remaining[b] = Math.max(0, BRAND_CAP - (count || 0));
    console.log(`brand budget · ${b}: ${count || 0} existing → ${remaining[b]} slot(s)`);
  }
  console.log("");

  let n = 0;
  const byBrand = {};
  const scores = [];
  const prices = [];
  const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live, remaining);
    if (r.ok) {
      n++;
      byBrand[item.brand] = (byBrand[item.brand] || 0) + 1;
      scores.push(r.score);
      prices.push(r.price);
      console.log(`✓ ${String(n).padStart(2)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${JSON.stringify(r.comp)} · ${r.certs ? r.certs.join("/") : "no certs"} · ${r.imgs} imgs`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as ${live ? "LIVE" : "drafts"}.`);
  if (scores.length) console.log(`score range ${Math.min(...scores)}–${Math.max(...scores)}`);
  if (prices.length) console.log(`price range $${Math.min(...prices)}–$${Math.max(...prices)}`);
  console.log(`by brand: ${JSON.stringify(byBrand)}`);
  if (failed.length) console.log("skipped:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
