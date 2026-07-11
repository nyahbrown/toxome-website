/**
 * No-LLM Home & Bedding insert. Same page-grounded validation + scoring as
 * add-ramie.js, but for the Home department (gender = "Home"). Pulls
 * composition / price / images / certs from the product page's structured data
 * (JSON-LD / Shopify / og) — never the Anthropic API. Inserts as LIVE by
 * default (mirrors the admin "Add by URL" action); pass --draft to queue for
 * /admin review instead.
 *
 *   node --env-file=.env.local scripts/add-home.js            # inserts the built-in batch
 *   node --env-file=.env.local scripts/add-home.js --draft    # queue instead of live
 *
 * Each ITEM below is { url, brand, name, category, occasion }. category
 * defaults to "Bedding"; occasion defaults to ["Sleep"]. Score bar: >= 67
 * (clean). Home goods rarely carry a gender/apparel category, so we set those
 * explicitly here rather than inferring from the item name.
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BLACKLIST = require("../lib/brandBlacklist.json").map((b) => b.toLowerCase().trim());
const isBlacklisted = (b) => !!b && BLACKLIST.some((x) => b.toLowerCase().includes(x));
const SCORE_BAR = 67;

// --- The batch to add ------------------------------------------------------
const ITEMS = [
  {
    url: "https://www.lilysilk.com/us/product/19-momme-seamless-silk-sheets-set.html",
    brand: "LilySilk",
    name: "19 Momme Seamless Silk Sheets Set",
  },
  {
    url: "https://jungmaven.com/products/hemp-duvet-cover",
    brand: "Jungmaven",
    name: "Hemp Duvet Cover",
  },
  {
    url: "https://nordicknots.com/us/product/percale-duvet-cover-set-shirt-bluered-twin",
    brand: "Nordic Knots",
    name: "Percale Duvet Cover Set",
  },
];
// ---------------------------------------------------------------------------

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

// Clean, page-grounded materials line from the parsed composition, e.g.
// "100% silk" or "60% linen, 40% cotton". Description is left null for a later
// Toxome-voice backfill pass (same convention as add-ramie.js).
function materialsFromComp(comp) {
  if (!comp) return null;
  return Object.entries(comp)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${Math.round(v * 100)}% ${k}`)
    .join(", ");
}

async function addOne(supabase, item, live) {
  const { url, brand, name } = item;
  const category = item.category || "Bedding";
  const occasion = item.occasion || ["Sleep"];

  if (isBlacklisted(brand)) return { url, skip: `${brand} blacklisted` };

  const v = await getValidatedProduct(url);
  if (!v.ok) return { url, skip: v.reason };
  const comp = toFractions(v.composition);
  if (!comp) return { url, skip: "no page composition parsed" };
  const score = calcToxomeScore(comp);
  if (score == null || score < SCORE_BAR) return { url, skip: `score ${score} below bar` };

  const { data: dup } = await supabase.from("products").select("id").eq("item_url", v.finalUrl).maybeSingle();
  if (dup) return { url, skip: `dup ${dup.id.slice(0, 8)}` };

  const price = typeof v.price === "number" ? v.price : null;
  const row = {
    item_name: name,
    brand,
    item_price: price,
    currency: "USD",
    budget: budget(price),
    category,
    gender: "Home",
    occasion,
    item_image: v.images[0],
    images: v.images,
    item_url: v.finalUrl,
    affiliate_url: null,
    fabric_composition: comp,
    materials_text: materialsFromComp(comp),
    description: null, // backfilled later (Toxome voice)
    certifications: v.certifications && v.certifications.length ? v.certifications : null,
    toxome_score: score,
    risk_level: scoreToRiskLevel(score),
    published: !!live,
    rejected: false,
    added_by: "manual",
    reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-home", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { url, skip: `insert: ${error.message}` };
  return { url, ok: true, id: data.id, name, brand, score, risk: row.risk_level, imgs: v.images.length, price, comp, certs: row.certifications };
}

async function run() {
  const live = !process.argv.includes("--draft");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, serviceKey);

  console.log(`Adding ${ITEMS.length} home item(s) — ${live ? "LIVE" : "DRAFT"}\n`);
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live);
    if (r.ok) {
      console.log(`✓ ${live ? "PUBLISHED" : "queued"}: ${r.brand} — ${r.name}`);
      console.log(`  $${r.price} · score ${r.score} (${r.risk}) · ${JSON.stringify(r.comp)}` +
        `${r.certs ? " · " + r.certs.join(", ") : ""} · ${r.imgs} imgs · id ${r.id}`);
    } else {
      console.log(`✗ SKIP: ${r.url}\n  ${r.skip}`);
    }
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
