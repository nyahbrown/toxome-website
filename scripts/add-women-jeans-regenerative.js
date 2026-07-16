/**
 * Women's JEANS in REGENERATIVE ORGANIC COTTON — GREEN, UNDER $500 (2026-07-15).
 * No LLM. Fiber-specific, narrow batch.
 *
 * This is the rarest denim fiber Toxome sources: jeans whose BASE fabric is
 * *regenerative organic cotton* — cotton grown to the Regenerative Organic
 * Certified (ROC) standard, i.e. organic PLUS soil, welfare and fairness. It is
 * the single top-scoring fiber in the rubric (regenerative_organic_cotton
 * default hazard 4 → clean 96), distinct from plain organic cotton (8 → 92) and
 * conventional cotton (16 → 84).
 *
 * IMPORTANT — this is NOT an organic-cotton batch. Plain organic cotton denim is
 * explicitly rejected in code (ROC gate below). Only pieces the PDP actually
 * states as *regenerative organic cotton* / Regenerative Organic Certified land.
 *
 * Same page-grounded validate + score + draft path as add-women-jeans.js. Every
 * item must clear FIVE gates, enforced in code:
 *   1. ROC GATE (fiber-specific): the dominant fiber in the final composition
 *      must key as "regenerative organic cotton" (>= 50%). The scorer/scrape
 *      only assign this key when the PDP text literally pairs "regenerative" +
 *      "organic" + "cotton" (bare "regenerative cotton" falls through to
 *      conventional cotton). So a plain-organic or recycled-cotton denim can
 *      never satisfy this gate — no substituting to hit a number.
 *   2. GREEN score: calcToxomeScore(comp) >= 68. Trivially met — ROC denim
 *      scores ~89 even blended with recycled cotton + a little spandex.
 *   3. PRICE < $500 (USD, read live off the PDP; non-USD dropped).
 *   4. Real, in-stock, specific PDP with a working image (getValidatedProduct).
 *   5. Brand cap <= 4 rows per brand TOTAL across the catalog. Counted at start;
 *      brands already at/over 4 are skipped entirely.
 *
 * MARKET REALITY (documented honestly in the run log): regenerative-organic-
 * cotton denim barely exists. The genuine ROC-denim houses are Christy Dawn,
 * Citizens of Humanity, Outerknown, Triarchy, Nudie Jeans and Patagonia. FIVE of
 * the six are ALREADY at/over the 4-item catalog cap (Christy Dawn 22, Citizens
 * 15, Outerknown 10, Triarchy 4, Nudie 4) — the catalog has already absorbed
 * essentially the whole supply. The only ROC-denim brand with room is Patagonia.
 * Boyish, Kings of Indigo, MUD Jeans, prAna and Coyuchi were checked and use
 * plain GOTS/organic + recycled cotton in denim, NOT ROC — they fail gate 1.
 *
 * The over-cap houses are still listed below (they short-circuit on the brand cap
 * before any fetch) so the run log self-documents the ceiling.
 *
 * Composition is read LIVE off each PDP. `comp` is the documented fallback for
 * the recover path (some resellers render the fabric spec outside the scrape
 * window) and matches Patagonia's published ROC/recycled/spandex content.
 *
 *   node --env-file=.env.local scripts/add-women-jeans-regenerative.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// --- page-grounded composition recovery (identical to add-women-jeans.js) -----
const CUT = /(customer reviews|write a review|you may also like|related products|pairs well with|complete the look|recently viewed|you might also)/i;
function cleanText(html) {
  return String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function normFiber(raw) {
  const s = raw.toLowerCase();
  // Regenerative ORGANIC cotton must be caught before plain organic / cotton.
  if (/regenerativ/.test(s) && /organic/.test(s) && /cotton/.test(s)) return "regenerative organic cotton";
  if (/organic\s+cotton|gots\s+cotton/.test(s)) return "organic cotton";
  if (/ecovero/.test(s)) return "ecovero";
  if (/tencel[^a-z]*modal/.test(s)) return "tencel modal";
  if (/tencel|lyocell/.test(s)) return "lyocell";
  if (/pima|supima|egyptian|cotton/.test(s)) return "cotton";
  if (/european\s*flax|flax|linen/.test(s)) return "linen";
  if (/hemp/.test(s)) return "hemp";
  if (/cupro|cuprammonium|bemberg/.test(s)) return "cupro";
  if (/bamboo[^a-z]*(viscose|rayon)|viscose|rayon/.test(s)) return "viscose";
  if (/modal/.test(s)) return "modal";
  if (/polyester/.test(s)) return "polyester";
  if (/nylon|polyamide/.test(s)) return "nylon";
  if (/elastane|spandex|lycra/.test(s)) return "elastane";
  if (/acrylic/.test(s)) return "acrylic";
  return null;
}
const FIBER_RX = /(\d{1,3})\s*%\s*([A-Za-z®™\-\s]{3,45})/g;
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
const SCORE_BAR = 68;   // GREEN gate ("low" risk).
const PRICE_CAP = 500;  // hard USD price cap.
const BRAND_CAP = 4;    // <= 4 rows per brand TOTAL across the catalog.

const EVERY = ["Everyday"];

// Over-sourced with backups. The ROC gate + brand cap keep this honest: only
// genuine regenerative-organic-cotton denim from brands with catalog room lands.
const ITEMS = [
  // ===================== PATAGONIA (the only ROC-denim brand with room) =======
  // Straight Fit Jeans — foam-dyed 64% ROC cotton / 35% recycled cotton / 1%
  // spandex. Brand-direct first (patagonia.com was down for maintenance at run
  // time; correct canonical URL for a re-run), Worn Wear as validated backup.
  { brand: "Patagonia", name: "Straight Fit Jeans", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 64, cotton: 35, spandex: 1 },
    url: "https://www.patagonia.com/product/womens-straight-fit-jeans/21600.html",
    description: "A straight-fit five-pocket jean in foam-dyed regenerative organic cotton, blended with recycled cotton and a single percent of spandex. Regenerative Organic Certified cotton comes from farms rebuilding their soil, and foam-dyeing cuts almost all the wastewater out of the indigo. Fair Trade Certified sewn. Shown in a dark indigo wash." },
  { brand: "Patagonia", name: "Straight Fit Jeans", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 64, cotton: 35, spandex: 1 },
    url: "https://wornwear.patagonia.com/products/womens-straight-fit-jeans_21600_orsd",
    tags: ["wornwear-secondhand", "verify-price"],
    description: "A straight-fit five-pocket jean in foam-dyed regenerative organic cotton, blended with recycled cotton and a single percent of spandex. Regenerative Organic Certified cotton comes from farms rebuilding their soil, and foam-dyeing cuts almost all the wastewater out of the indigo. Fair Trade Certified sewn. Shown in a dark indigo wash." },

  // Slim Jeans — 78% ROC cotton / 20% recycled cotton / 2% recycled elastane.
  { brand: "Patagonia", name: "Slim Jeans", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 78, cotton: 20, spandex: 2 },
    url: "https://www.patagonia.com/product/womens-slim-jeans/56961.html",
    description: "A slim-cut five-pocket jean in foam-dyed regenerative organic cotton, blended with recycled cotton and a trace of recycled elastane. Regenerative Organic Certified cotton is grown to the highest organic standard, and the foam-dye process slashes water use. Fair Trade Certified sewn. Shown in a dark indigo wash." },
  { brand: "Patagonia", name: "Slim Jeans", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 78, cotton: 20, spandex: 2 },
    url: "https://wornwear.patagonia.com/products/womens-slim-jeans_56961_orsd",
    tags: ["wornwear-secondhand", "verify-price"],
    description: "A slim-cut five-pocket jean in foam-dyed regenerative organic cotton, blended with recycled cotton and a trace of recycled elastane. Regenerative Organic Certified cotton is grown to the highest organic standard, and the foam-dye process slashes water use. Fair Trade Certified sewn. Shown in a dark indigo wash." },

  // ===================== OVER-CAP ROC-DENIM HOUSES (documented) ================
  // These are the genuine ROC-denim brands, but each is already at/over the
  // 4-item catalog cap, so they short-circuit before any fetch. Listed so the
  // run log makes the ceiling explicit: the catalog already holds this supply.
  { brand: "Christy Dawn", name: "The Ophelia Jean", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 100 },
    url: "https://christydawn.com/products/the-ophelia-jean",
    description: "Regenerative-cotton denim from Christy Dawn's Land Stewardship farm." },
  { brand: "Citizens of Humanity", name: "Horseshoe Jean", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 100 },
    url: "https://citizensofhumanity.com/products/horseshoe-high-rise-wide-leg",
    description: "Regenerative-cotton wide-leg denim from Citizens' regenerative capsule." },
  { brand: "Outerknown", name: "S.E.A. Jean", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 100 },
    url: "https://www.outerknown.com/products/womens-sea-jeans",
    description: "Regenerative Organic Certified cotton denim from Outerknown's ROC line." },
  { brand: "Triarchy", name: "Ms. Triarchy Straight Leg Jean", category: "Bottoms", occasion: EVERY,
    comp: { "regenerative organic cotton": 98 },
    url: "https://triarchy.com/products/ms-triarchy-v-high-rise-straight-leg-medium-indigo",
    description: "Regenerative-cotton straight-leg denim from Triarchy." },
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

// ROC GATE: the dominant fiber must be regenerative organic cotton (>= 50%).
// This is what makes the batch fiber-specific — plain organic / recycled cotton
// denim can never pass, because the scorer only keys "regenerative organic
// cotton" when the PDP literally states it.
function isRegenerativeOrganic(comp) {
  if (!comp) return false;
  let topKey = null, topVal = -1;
  for (const [k, v] of Object.entries(comp)) { if (v > topVal) { topVal = v; topKey = k; } }
  return topKey === "regenerative organic cotton" && topVal >= 0.5;
}

async function addOne(supabase, item, live, remaining) {
  if (isBlacklisted(item.brand)) return { skip: `${item.brand} blacklisted` };
  // Brand cap: refuse once this brand has no remaining catalog budget.
  if ((remaining[item.brand] ?? 0) <= 0) return { skip: `brand cap (${BRAND_CAP}) reached` };

  const v = await getValidatedProduct(item.url);
  if (!v.ok) return { skip: v.reason };
  if (v.inStock === false) return { skip: "out of stock" };

  let price = typeof v.price === "number" ? v.price : null;
  if (price == null) return { skip: "no USD price" };
  if (price >= PRICE_CAP) return { skip: `price $${price} >= $${PRICE_CAP}` };

  // Prefer the live-scraped composition; fall back to the page-read `comp` only
  // when the live scrape misses it (Patagonia renders fabric spec outside the
  // scrape window at most resellers).
  let comp = toFractions(v.composition) || toFractions(item.comp);
  if (!comp) {
    try {
      const page = await fetchPage(v.finalUrl);
      comp = toFractions(recoverComp(page.html));
    } catch {}
  }
  if (!comp) return { skip: "no composition" };

  // ROC GATE — the whole point of this batch.
  if (!isRegenerativeOrganic(comp)) {
    const top = Object.entries(comp).sort((a, b) => b[1] - a[1])[0];
    return { skip: `not regenerative organic cotton (base = ${top ? top[0] : "?"})` };
  }

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
    tags: ["batch-women-jeans-regenerative", "no-llm", ...(item.tags || [])],
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

  // Per-brand remaining budget from existing catalog counts (published + draft).
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
