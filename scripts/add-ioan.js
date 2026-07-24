/**
 * No-LLM Industry of All Nations sourcing pass. Sibling of add-ramie.js /
 * add-hemp.js, but brand-scoped rather than fiber-scoped.
 *
 * Why a brand-specific script: IOAN's Shopify `body_html` is empty or prose-only
 * on ~40% of the catalog, so scrape.js getValidatedProduct returns
 * composition:null and the item auto-skips. The real per-colorway spec lives in
 * `data-details` / `data-specs` attributes on the colorway swatch inputs
 * (e.g. "MEDIUMWEIGHT TWILL FABRIC100% UNDYED ORGANIC COTTONRIVER SHELL BUTTONS
 * MADE IN TAMIL NADU, INDIA"). We parse that instead — still page-grounded,
 * still regex-only, no Anthropic API.
 *
 * Handles come from products.json ONLY, never constructed: IOAN has typo
 * handles in the wild ("goucho-pants" for "Gaucho Pants") that 404 if guessed.
 *
 *   node --env-file=.env.local scripts/add-ioan.js --dry-run
 *   node --env-file=.env.local scripts/add-ioan.js --insert
 *   node --env-file=.env.local scripts/add-ioan.js --insert --cap 3
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BRAND = "Industry of All Nations";
const ORIGIN = "https://industryofallnations.com";
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };
const SCORE_BAR = 67;

const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- fetch ---------- */
// IOAN rate-limits a sequential crawl. Without a retry the throttled responses
// look identical to a dead PDP, so products get silently dropped and the run
// still reports "done" — back off and retry rather than mis-skip a real item.
async function getText(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: UA, redirect: "follow" });
      if (res.ok) return res.text();
      if (res.status === 404) throw new Error("HTTP 404"); // genuinely gone, don't retry
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (/404/.test(e.message)) throw e;
      last = e;
    }
    await sleep(1500 * 2 ** i);
  }
  throw last;
}

async function catalog() {
  const out = [];
  for (let page = 1; page <= 8; page++) {
    const j = JSON.parse(await getText(`${ORIGIN}/products.json?limit=250&page=${page}`));
    if (!j.products || !j.products.length) break;
    out.push(...j.products);
  }
  return out;
}

/* ---------- composition from data-details ---------- */
// Longest-first so "ORGANIC COTTON" wins before "COTTON", and branded
// cellulosics resolve before the generic substring fallback in resolveFiber.
const FIBER_WORDS = [
  "REGENERATIVE ORGANIC COTTON", "ORGANIC PIMA COTTON", "ORGANIC COTTON",
  "RECYCLED POLYESTER", "RECYCLED COTTON", "RECYCLED WOOL", "RECYCLED NYLON",
  "BABY ALPACA", "MERINO WOOL", "PIMA COTTON", "SUPIMA COTTON",
  "TENCEL LYOCELL", "TENCEL MODAL", "ALPACA", "CASHMERE", "COTTON", "LINEN",
  "HEMP", "RAMIE", "JUTE", "SILK", "WOOL", "LYOCELL", "MODAL", "VISCOSE",
  "RAYON", "ELASTANE", "SPANDEX", "LYCRA", "NYLON", "POLYAMIDE", "POLYESTER",
  "ACRYLIC", "LEATHER", "RUBBER",
];
const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

/**
 * IOAN concatenates spec lines with no separator, so a fiber name runs straight
 * into the next line ("...ORGANIC COTTONRIVER SHELL BUTTONS"). Anchor on the
 * percentage, then look for the first known fiber word in the window after it
 * rather than trying to delimit the token.
 */
function parseComposition(details) {
  const t = decode(details).toUpperCase().replace(/\s+/g, " ");
  const out = {};
  for (const m of t.matchAll(/(\d{1,3})\s*%\s*/g)) {
    const pct = Number(m[1]);
    if (!pct || pct > 100) continue;
    const win = t.slice(m.index + m[0].length, m.index + m[0].length + 42);
    const hit = FIBER_WORDS.find((f) => win.startsWith(f) || win.replace(/^(UNDYED|UNBLEACHED|NATURAL|RAW|UNDYED\/)\s*/, "").startsWith(f));
    if (!hit) continue;
    const key = hit.toLowerCase();
    out[key] = (out[key] || 0) + pct;
  }
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  if (!sum) return null;
  // A spec that doesn't add up to ~100 means we mis-parsed; refuse rather than
  // guess a composition (fabricating comp is exactly what broke sourcing before).
  if (sum < 97 || sum > 103) return null;
  return out;
}

// Trims IOAN lists WITHOUT a percentage. Not part of the shell composition
// (scrape.js is shell-only and the live IOAN rows follow that convention), but
// worth surfacing on the draft so /admin can eyeball it.
const TRIM_RE = /(RECYCLED ELASTIC|ELASTIC|RIVER SHELL BUTTON|COROZO|METAL|ZIPPER|LEATHER)/i;

function parseSwatches(html) {
  const rows = [];
  const re = /data-title="([^"]*)"\s+data-price="([^"]*)"\s+data-details="([^"]*)"/g;
  for (const m of html.matchAll(re)) {
    const title = decode(m[1]).trim();
    // Size swatches repeat the colorway spec with a "/ 26" title — skip them.
    if (!title || /^\/\s*\S+$/.test(title)) continue;
    rows.push({
      color: title,
      price: Number(decode(m[2]).replace(/[^0-9.]/g, "")) || null,
      details: decode(m[3]).replace(/\s+/g, " ").trim(),
    });
  }
  return rows;
}

/* ---------- aesthetic + taxonomy ---------- */
// Neutral/light first per the standing color rule; undyed is IOAN's cleanest and
// lightest colorway and reads cream.
const LIGHT_FIRST = [/undyed/i, /unbleached/i, /natural/i, /ecru|cream|oat|sand|stone|shellac/i];
const AVOID_COLOR = /\bblack|charcoal|jet\b/i;

// Never fall through to "first swatch" — that ignores the neutral rule and was
// pulling a Heather Charcoal beanie. No acceptable colorway = skip the product.
function pickColorway(swatches) {
  if (!swatches.length) return null;
  const ok = swatches.filter((s) => !AVOID_COLOR.test(s.color));
  if (!ok.length) return null;
  for (const re of LIGHT_FIRST) {
    const hit = ok.find((s) => re.test(s.color));
    if (hit) return hit;
  }
  return ok[0];
}

// Knitwear covers socks/gloves/scarves/beanies at IOAN, so the product_type
// alone can't decide — a sock is not a sweater. Check the garment word first.
const ACCESSORY_RE = /\b(socks?|gloves?|mittens?|scar(?:f|ves)|beanies?|hats?|caps?|belts?|bags?|totes?|bandanas?|muslin)\b/i;
function category(type, title) {
  const n = (title || "").toLowerCase();
  if (ACCESSORY_RE.test(n)) return "Accessories";
  if (/boardshort|swim/.test(n)) return "Swimwear";
  switch (type) {
    case "Dresses & Skirts": return "Dresses";
    case "Knitwear": return "Sweaters";
    case "Jackets & Coats": return "Outerwear";
    case "Underwear": return "Intimates";
    case "Shirts": case "T-Shirts": case "T-shirts": return "Tops";
    case "Pants & Shorts": return "Bottoms";
    case "Accessories": case "Hat": return "Accessories";
    case "Sweats": return /pant|short|jogger|sweatpant/.test(n) ? "Bottoms" : "Tops";
    default: return null; // Kids / Home / Shoe / Gift Card -> out of scope
  }
}

// Graphic/logo/slogan pieces are off the solids + subtle texture rule.
const GRAPHIC_RE = /\b(pride|logo|graphic|print tee|slogan|souvenir)\b/i;

// item_name must not carry the colorway (standing rule, no color column).
function cleanName(title) {
  return String(title).split(/\s+[-–—]\s+/)[0].replace(/\s+/g, " ").trim();
}

/* ---------- main ---------- */
async function main() {
  const args = process.argv.slice(2);
  const insert = args.includes("--insert");
  const cap = Number(args[args.indexOf("--cap") + 1]) || 5;

  const supabase = (() => {
    const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!k) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return createClient(SUPABASE_URL, k);
  })();

  const { data: existing } = await supabase
    .from("products").select("item_url, item_name, category, published, rejected")
    .ilike("brand", `%${BRAND}%`);
  const haveUrl = new Set((existing || []).map((r) => (r.item_url || "").split("?")[0]));
  const haveName = new Set((existing || []).map((r) => (r.item_name || "").toLowerCase()));
  const taken = {};
  for (const r of existing || []) if (!r.rejected) taken[r.category] = (taken[r.category] || 0) + 1;

  const all = await catalog();
  console.log(`catalog: ${all.length} products · already have ${(existing || []).length} IOAN rows`);

  const results = [];
  for (const p of all) {
    const tags = p.tags.map((t) => t.toLowerCase());
    const url = `${ORIGIN}/products/${p.handle}`;
    const skip = (why) => results.push({ title: p.title, why });

    if (tags.includes("kids") || p.product_type === "Kids") { skip("kids"); continue; }
    if (GRAPHIC_RE.test(p.title)) { skip("graphic/logo piece"); continue; }
    const cat = category(p.product_type, p.title);
    if (!cat) { skip(`out-of-scope type ${p.product_type}`); continue; }
    if (haveUrl.has(url) || haveName.has(cleanName(p.title).toLowerCase())) { skip("dup"); continue; }

    const avail = p.variants.filter((v) => v.available);
    if (avail.length < 2) { skip(`stock ${avail.length}/${p.variants.length}`); continue; }
    if (p.images.length < 2) { skip(`${p.images.length} img`); continue; }

    let html;
    try { html = await getText(url); } catch (e) { skip(`fetch ${e.message}`); continue; }
    await sleep(1200);

    const sw = parseSwatches(html);
    const gender = tags.includes("women") ? "Women" : "Unisex";
    const pick = pickColorway(sw);
    if (!pick) { skip(sw.length ? "no neutral colorway" : "no colorway spec"); continue; }

    const comp = parseComposition(pick.details);
    if (!comp) { skip(`unparsed comp: ${pick.details.slice(0, 60)}`); continue; }

    const score = calcToxomeScore(comp, { descKeywords: [pick.details], color: pick.color });
    if (score == null || score < SCORE_BAR) { skip(`score ${score}`); continue; }

    results.push({
      title: p.title, name: cleanName(p.title), handle: p.handle, url, cat, gender,
      color: pick.color, price: pick.price, comp, score,
      trim: (pick.details.match(TRIM_RE) || [null])[0],
      images: p.images.slice(0, 4).map((i) => i.src.split("?")[0]),
      stock: `${avail.length}/${p.variants.length}`,
    });
  }

  const picks = results.filter((r) => r.score);
  const byCat = {};
  // Everything clean-fiber at IOAN ties at 92, so score can't rank the cap.
  // Rank on fit instead: the site is women-led, and the catalog sweet spot is
  // ~$100 — cheapest-first was filling the caps with $20 boxers and belts.
  const rank = (r) => (r.gender === "Women" ? 0 : 1000) + Math.abs((r.price || 0) - 100);
  for (const r of picks.sort((a, b) => rank(a) - rank(b))) {
    const room = cap - (taken[r.cat] || 0) - (byCat[r.cat] || 0);
    if (room <= 0) { r.why = `cap ${cap} reached for ${r.cat}`; continue; }
    byCat[r.cat] = (byCat[r.cat] || 0) + 1;
    r.take = true;
  }

  const take = picks.filter((r) => r.take);
  console.log(`\npassed gates: ${picks.length} · taking ${take.length} under cap ${cap}/category\n`);
  for (const r of take) {
    console.log(`  ${r.score}  ${r.cat.padEnd(9)} ${r.gender.padEnd(6)} ${r.name.slice(0, 30).padEnd(31)} ${r.color.slice(0, 12).padEnd(13)} $${String(r.price).padEnd(5)} ${Object.entries(r.comp).map(([k, v]) => `${v}% ${k}`).join(", ")}${r.trim ? ` [trim: ${r.trim}]` : ""}`);
  }

  if (!insert) {
    console.log(`\nskipped (${picks.length - take.length} capped, ${results.filter((r) => r.why && !r.take).length} gated):`);
    const why = {};
    for (const r of results.filter((r) => r.why)) {
      const k = r.why.replace(/\d+/g, "N").slice(0, 40);
      (why[k] = why[k] || []).push(r.title);
    }
    for (const [k, v] of Object.entries(why).sort((a, b) => b[1].length - a[1].length))
      console.log(`  ${String(v.length).padStart(3)}  ${k}${v.length <= 3 ? "  — " + v.join(", ") : ""}`);
    console.log("\nDry run. Re-run with --insert to write drafts.");
    return;
  }

  let n = 0;
  for (const r of take) {
    const row = {
      item_name: r.name, brand: BRAND,
      item_price: r.price, budget: budget(r.price),
      category: r.cat, gender: r.gender,
      item_image: r.images[0], images: r.images, item_url: r.url, affiliate_url: null,
      fabric_composition: r.comp,
      materials_text: `${r.color} · ${Object.entries(r.comp).map(([k, v]) => `${v}% ${k}`).join(", ")}${r.trim ? ` · ${r.trim}` : ""}`,
      description: null, // hand-backfilled in Toxome voice, with occasion[]
      certifications: null, // IOAN prints no cert marks on PDPs — never infer
      toxome_score: r.score, risk_level: scoreToRiskLevel(r.score),
      published: false, rejected: false, added_by: "agent", reviewed_at: null,
      tags: ["batch-ioan", "no-llm", "image-verify"],
    };
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) console.log(`  ✗ ${r.name} — ${error.message}`);
    else { n++; console.log(`  ✓ ${r.name} · ${r.score} · ${data.id.slice(0, 8)}`); }
  }
  console.log(`\n${n}/${take.length} inserted as drafts → /admin Pending.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
