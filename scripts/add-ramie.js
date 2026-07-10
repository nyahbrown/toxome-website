/**
 * No-LLM single-product insert. Same validation + scoring as add-product.js,
 * but pulls item_name/brand from page structured data (JSON-LD / Shopify /
 * og:title) instead of calling the Anthropic API. Built for a credit-free
 * ramie sourcing pass; requires the primary fiber to be ramie (or a ramie
 * blend) and inserts as a draft for /admin review.
 *
 *   node --env-file=.env.local scripts/add-ramie.js <url> [--brand "Mango"] [--gender Women] [--live]
 *   node --env-file=.env.local scripts/add-ramie.js --file urls.txt   # one url (+optional "|Brand") per line
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const {
  getValidatedProduct,
  fetchPage,
  shopifyProduct,
  extractJsonLd,
  findProductLd,
} = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BLACKLIST = require("../lib/brandBlacklist.json").map((b) => b.toLowerCase().trim());
const isBlacklisted = (b) => !!b && BLACKLIST.some((x) => b.toLowerCase().includes(x));
const CATEGORIES = ["Tops","Bottoms","Dresses","Outerwear","Activewear","Loungewear","Footwear","Accessories"];

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

function ogMeta(html, prop) {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return m ? m[1].trim() : null;
}

function titleTag(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

function pickName(html, shopify, prodLd) {
  let name = (shopify && shopify.title) || (prodLd && prodLd.name) || ogMeta(html, "og:title") || titleTag(html) || "";
  name = String(name).trim();
  // Trim trailing " | Brand" / " - Brand" site-name suffixes and leading fiber % noise.
  name = name.replace(/\s*[|–—-]\s*[^|–—-]*$/,(s)=> (/\b(mango|uniqlo|zara|reformation|everlane|cos|arket|massimo)\b/i.test(s) ? "" : s));
  name = name.replace(/^\s*100%\s*/i, "").replace(/\s+/g, " ").trim();
  return name;
}

function pickBrand(argBrand, shopify, prodLd, url) {
  if (argBrand) return argBrand;
  const b = (prodLd && prodLd.brand && (prodLd.brand.name || prodLd.brand)) || (shopify && shopify.vendor);
  if (b) return String(b).trim();
  try { return new URL(url).hostname.replace(/^www\.|^shop\./, "").split(".")[0]; } catch { return "Unknown"; }
}

function inferCategory(name) {
  const n = name.toLowerCase();
  if (/\b(dress|dresses|kaftan|caftan|jumpsuit|romper|gown)\b/.test(n)) return "Dresses";
  if (/\b(pants?|trousers?|shorts?|skirts?|jeans?|chinos?|culottes?|leggings?|bermudas?)\b/.test(n)) return "Bottoms";
  if (/\b(jacket|blazer|coat|overshirt|trench|parka)s?\b/.test(n)) return "Outerwear";
  if (/\b(shirts?|blouses?|tops?|tanks?|tee|tees|t-shirt|camis?|vests?|sweaters?|cardigans?|knit|polos?|button)\b/.test(n)) return "Tops";
  return "Tops";
}

const RAMIE_OK = (comp) => comp && Object.keys(comp).some((k) => /ramie/.test(k));

async function addOne(supabase, url, argBrand, gender, live) {
  const v = await getValidatedProduct(url);
  if (!v.ok) return { url, skip: v.reason };
  const comp = toFractions(v.composition);
  if (!comp) return { url, skip: "no page composition parsed" };
  if (!RAMIE_OK(comp)) return { url, skip: `no ramie in comp ${JSON.stringify(comp)}` };
  const score = calcToxomeScore(comp);
  if (score == null || score < 67) return { url, skip: `score ${score} below bar` };

  const page = await fetchPage(v.finalUrl);
  const shopify = await shopifyProduct(v.finalUrl);
  const prodLd = findProductLd(extractJsonLd(page.html));
  const name = pickName(page.html, shopify, prodLd);
  const brand = pickBrand(argBrand, shopify, prodLd, v.finalUrl);
  if (!name || !brand) return { url, skip: "no name/brand" };
  if (isBlacklisted(brand)) return { url, skip: `${brand} blacklisted` };

  const { data: dup } = await supabase.from("products").select("id").eq("item_url", v.finalUrl).maybeSingle();
  if (dup) return { url, skip: `dup ${dup.id.slice(0, 8)}` };

  const price = typeof v.price === "number" ? v.price : null;
  const row = {
    item_name: name, brand,
    item_price: price, budget: budget(price),
    category: inferCategory(name), gender: gender || "Women",
    item_image: v.images[0], images: v.images, item_url: v.finalUrl, affiliate_url: null,
    fabric_composition: comp, materials_text: v.descText ? v.descText.slice(0, 400) : null,
    description: null, // backfilled in a follow-up pass (Toxome voice + occasion)
    certifications: v.certifications && v.certifications.length ? v.certifications : null,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !!live, rejected: false, added_by: "agent", reviewed_at: null,
    tags: ["batch-ramie", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { url, skip: `insert: ${error.message}` };
  return { url, ok: true, id: data.id, name, brand, score, imgs: v.images.length, comp };
}

async function run() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const gender = (args[args.indexOf("--gender") + 1] && args.includes("--gender")) ? args[args.indexOf("--gender") + 1] : "Women";
  const argBrand = args.includes("--brand") ? args[args.indexOf("--brand") + 1] : null;
  const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;

  let jobs = [];
  if (fileArg) {
    for (const line of fs.readFileSync(fileArg, "utf8").split("\n").map((l) => l.trim()).filter(Boolean)) {
      if (line.startsWith("#")) continue;
      const [u, b] = line.split("|").map((x) => x && x.trim());
      if (/^https?:\/\//.test(u)) jobs.push({ url: u, brand: b || argBrand });
    }
  } else {
    const u = args.find((a) => /^https?:\/\//.test(a));
    if (u) jobs.push({ url: u, brand: argBrand });
  }
  if (!jobs.length) { console.error("No URLs. Usage: add-ramie.js <url> [--brand X] | --file urls.txt"); process.exit(1); }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, serviceKey);

  let inserted = 0;
  for (const j of jobs) {
    const r = await addOne(supabase, j.url, j.brand, gender, live);
    if (r.ok) { inserted++; console.log(`  ✓ ${r.brand} — ${r.name} · score ${r.score} · ${r.imgs} imgs · ${Object.keys(r.comp).join("/")} · ${r.id.slice(0, 8)}`); }
    else console.log(`  ✗ ${j.url.slice(0, 70)} — ${r.skip}`);
  }
  console.log(`\n${inserted}/${jobs.length} inserted as ${live ? "LIVE" : "drafts"}.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
