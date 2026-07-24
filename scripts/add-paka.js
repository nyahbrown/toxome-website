/**
 * No-LLM PAKA sourcing pass. Sibling of add-ioan.js / add-ramie.js.
 *
 * Where the spec lives: a "Material" OR "Materials" <h3> block in the PDP HTML.
 * The header is inconsistent across their templates (singular on sweaters, plural
 * on the Essential line), and body_html carries only marketing prose like
 * "100% natural fibers" — which is a CLAIM, not a composition. Match both headers.
 *
 * Fiber bar bites hard here, unlike IOAN. PAKA's signature is alpaca cut with
 * recycled nylon, and it fails: their best-seller (65% Royal Alpaca / 35%
 * Recycled Nylon) scores 57. Only the Pima-cotton, Tencel and pure-alpaca
 * thermal lines clear 67.
 *
 *   node --env-file=.env.local scripts/add-paka.js --dry-run
 *   node --env-file=.env.local scripts/add-paka.js --insert [--cap 5]
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel, resolveFiber } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BRAND = "PAKA";
const ORIGIN = "https://www.pakaapparel.com";
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };
const SCORE_BAR = 67;
// A PDP can be live with almost every size gone. Require real depth, not just
// "something is buyable" — this is the Cuyana lesson and it killed the Wayve
// Classic Short (1/12) and PAKA's own 1.0 Thermal Crew (1/20).
const MIN_AVAIL = 4;
const MIN_STOCK_RATIO = 0.25;

const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

async function getText(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: UA, redirect: "follow" });
      if (res.ok) return res.text();
      if (res.status === 404) throw new Error("HTTP 404");
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (/404/.test(e.message)) throw e;
      last = e;
    }
    await sleep(1500 * 2 ** i);
  }
  throw last;
}

/* ---------- composition ---------- */
const MATERIAL_RE = />Materials?<\/h3>\s*([^<]{3,200})/i;

/**
 * Layered garments ("Exterior: ... Interior: ...", "Insulation: ... Shell: ...")
 * list two fabrics and sum past 100. Shell-only convention: score the outer
 * face. If the outer face can't be isolated (the parkas/puffers, whose shells
 * are recycled polyester anyway), refuse rather than guess.
 */
function parseMaterial(spec) {
  let t = decode(spec);
  const ext = /exterior\s*:\s*([^.]*?)\./i.exec(t);
  if (ext) t = ext[1];
  else if (/insulation\s*:|shell\s*:/i.test(t)) return { refuse: "layered shell/insulation" };

  const comp = {};
  const unresolved = [];
  // "65% Royal Alpaca", "8%Tencel", "20%  CoolMax® Polyester"
  for (const m of t.matchAll(/(\d{1,3})\s*%\s*([A-Za-z][A-Za-z®™\-\s]*?)(?=[,|\/;.]|\d|$)/g)) {
    const name = m[2].replace(/[®™]/g, "").trim();
    if (!name) continue;
    const k = resolveFiber(name);
    if (!k) { unresolved.push(name); continue; }
    comp[k] = (comp[k] || 0) + Number(m[1]);
  }
  // "Baby Alpaca 30%, Lyocell 7%" — a few specs invert the order.
  for (const m of t.matchAll(/([A-Za-z][A-Za-z®™\s]{2,24}?)\s+(\d{1,3})\s*%/g)) {
    const k = resolveFiber(m[1].replace(/[®™]/g, "").trim());
    if (k && !comp[k]) comp[k] = Number(m[2]);
  }
  if (unresolved.length) return { refuse: `unresolved: ${unresolved.join(",")}` };
  const sum = Object.values(comp).reduce((a, b) => a + b, 0);
  if (!sum) return { refuse: "no fibers parsed" };
  if (sum < 97 || sum > 103) return { refuse: `sum ${sum}` };
  return { comp };
}

/* ---------- aesthetic + taxonomy ---------- */
// Word-bounded: a bare /stone/ also matches "Bluestone", which is a blue.
const LIGHT_FIRST = [
  /\b(bone|birch|cream|ecru|ivory|natural|undyed|oat|stone|sandstone|quail|magnolia|chalk)\b/i,
  /\b(sand|willow|silver sage|sage|moss|heather grey|light grey|taupe|tan|clay|desert|wood)\b/i,
];
const AVOID_COLOR = /\b(black|jet|neon|fluoro|volcanic rust)\b/i;

// Variant option order is NOT consistent across brands: PAKA is "Color / Size"
// (option1=Color), Wayve is "Size / Color". Never pop a positional token — look
// up the option actually named Color.
function colorOf(product, variant) {
  const i = (product.options || []).findIndex((o) => /colou?r/i.test(o.name));
  if (i < 0) return null;
  return (variant[`option${i + 1}`] || "").trim() || null;
}
// "Printed" at PAKA means an all-over Mountains pattern, which breaks the
// solids + subtle-texture rule.
const GRAPHIC_RE = /\b(gift card|picture book|travel mug|bracelet|gift box|sock gift|printed)\b/i;

function category(type, title) {
  const n = (title || "").toLowerCase();
  const t = String(type || "");
  if (/\b(hat|beanie|cap|sock|glove|scarf)s?\b/.test(n)) return "Accessories";
  if (/brief|bralette|boxer|boy short|thong/.test(n)) return "Intimates";
  if (/jogger|sweatpant|bottoms|pant/.test(n)) return "Bottoms";
  if (/parka|puffer|jacket|vest/.test(n)) return "Outerwear";
  if (/sweater|hoodie|crew\b/.test(n) && !/tee|t-shirt/.test(n)) return t.includes("Sweaters") || /sweater|hoodie/.test(n) ? "Sweaters" : "Tops";
  if (/tank/.test(n)) return "Tops";
  if (/tee|t-shirt|long sleeve|v-neck|shirt/.test(n)) return "Tops";
  if (t.includes("Sweaters")) return "Sweaters";
  if (t.includes("Underwear") || t.includes("Briefs")) return "Intimates";
  if (t.includes("Tops")) return "Tops";
  if (t.includes("Socks") || t.includes("Headwear")) return "Accessories";
  return null;
}

function genderOf(tags, title) {
  const t = tags.map((x) => x.toLowerCase());
  if (t.includes("gender:unisex")) return "Unisex";
  if (/women'?s|\bwomen\b/i.test(title)) return "Women";
  if (/men'?s|\bmen\b/i.test(title)) return "Men";
  if (t.some((x) => x.includes("all-womens")) && !t.some((x) => x.includes("all-mens"))) return "Women";
  return "Unisex";
}

// item_name carries no colorway and no gender prefix duplication is fine —
// PAKA names the gender in the title and the catalog has a gender column, but
// the title IS the brand's product name, so keep it.
const cleanName = (title) => String(title).replace(/\s+/g, " ").trim();

/* ---------- main ---------- */
async function main() {
  const args = process.argv.slice(2);
  const insert = args.includes("--insert");
  const cap = Number(args[args.indexOf("--cap") + 1]) || 5;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(SUPABASE_URL, key);

  const { data: existing } = await supabase
    .from("products").select("item_url, item_name, category, rejected")
    .or("brand.ilike.%paka%,item_url.ilike.%pakaapparel%");
  const haveUrl = new Set((existing || []).map((r) => (r.item_url || "").split("?")[0]));
  const haveName = new Set((existing || []).map((r) => (r.item_name || "").toLowerCase()));
  const taken = {};
  for (const r of existing || []) if (!r.rejected) taken[r.category] = (taken[r.category] || 0) + 1;

  const all = JSON.parse(await getText(`${ORIGIN}/products.json?limit=250&page=1`)).products;
  console.log(`catalog: ${all.length} · existing PAKA rows: ${(existing || []).length}\n`);

  const results = [];
  for (const p of all) {
    const url = `${ORIGIN}/products/${p.handle}`;
    const skip = (why) => results.push({ title: p.title, why });
    if (GRAPHIC_RE.test(p.title)) { skip("non-apparel"); continue; }
    const cat = category(p.product_type, p.title);
    if (!cat) { skip(`no category (${p.product_type})`); continue; }
    if (haveUrl.has(url) || haveName.has(cleanName(p.title).toLowerCase())) { skip("dup"); continue; }

    const avail = p.variants.filter((v) => v.available);
    const ratio = avail.length / Math.max(1, p.variants.length);
    if (avail.length < MIN_AVAIL || ratio < MIN_STOCK_RATIO) {
      skip(`stock ${avail.length}/${p.variants.length}`); continue;
    }
    if (p.images.length < 2) { skip(`${p.images.length} img`); continue; }

    let html;
    try { html = await getText(url); } catch (e) { skip(`fetch ${e.message}`); continue; }
    await sleep(900);

    const m = MATERIAL_RE.exec(html);
    if (!m) { skip("no Material block"); continue; }
    const spec = decode(m[1]).replace(/\s+/g, " ").trim();
    const parsed = parseMaterial(spec);
    if (parsed.refuse) { skip(`${parsed.refuse} :: ${spec.slice(0, 44)}`); continue; }

    const score = calcToxomeScore(parsed.comp, { descKeywords: [spec] });
    if (score == null || score < SCORE_BAR) { skip(`score ${score} :: ${spec.slice(0, 40)}`); continue; }

    // Pick a colorway from the in-stock ones only, neutral/light first.
    const gender = genderOf(p.tags, p.title);
    const colors = [...new Set(avail.map((v) => colorOf(p, v)).filter(Boolean))]
      .filter((c) => !AVOID_COLOR.test(c));
    if (!colors.length) { skip("no wearable colorway in stock"); continue; }
    let color = null;
    for (const re of LIGHT_FIRST) { const h = colors.find((c) => re.test(c)); if (h) { color = h; break; } }
    // Women are light/neutral ONLY, so no neutral in stock means skip. Men may
    // go darker (navy/charcoal/olive), so they can fall back.
    if (!color) {
      if (gender === "Women") { skip(`no neutral in stock (${colors.slice(0, 4).join(", ")})`); continue; }
      color = colors[0];
    }

    const imgs = p.images.map((i) => i.src.split("?")[0]);
    const slug = color.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const match = imgs.filter((i) => i.toLowerCase().replace(/[^a-z0-9]+/g, "").includes(slug));
    const ordered = [...match, ...imgs.filter((i) => !match.includes(i))].slice(0, 4);

    results.push({
      title: p.title, name: cleanName(p.title), url, cat,
      gender, color, spec, comp: parsed.comp, score,
      price: Number(p.variants[0].price), images: ordered,
      stock: `${avail.length}/${p.variants.length}`,
      colorImg: match.length > 0,
    });
  }

  const picks = results.filter((r) => r.score);
  const byCat = {};
  const rank = (r) => (r.gender === "Women" ? 0 : r.gender === "Unisex" ? 500 : 1000) + Math.abs((r.price || 0) - 100);
  for (const r of picks.sort((a, b) => rank(a) - rank(b))) {
    if (cap - (taken[r.cat] || 0) - (byCat[r.cat] || 0) <= 0) { r.why = `cap ${cap} · ${r.cat}`; continue; }
    byCat[r.cat] = (byCat[r.cat] || 0) + 1;
    r.take = true;
  }
  const take = picks.filter((r) => r.take);

  console.log(`passed gates: ${picks.length} · taking ${take.length} (cap ${cap}/category)\n`);
  for (const r of take)
    console.log(`  ${r.score}  ${r.cat.padEnd(11)} ${r.gender.padEnd(6)} ${r.name.slice(0, 32).padEnd(33)} ${r.color.slice(0, 13).padEnd(14)} $${String(r.price).padEnd(6)} ${r.stock.padEnd(6)} ${r.colorImg ? "" : "[no color img] "}${r.spec.slice(0, 40)}`);

  if (!insert) {
    console.log("\nskipped:");
    const why = {};
    for (const r of results.filter((r) => r.why)) (why[r.why.replace(/\d+/g, "N").slice(0, 46)] ||= []).push(r.title);
    for (const [k, v] of Object.entries(why).sort((a, b) => b[1].length - a[1].length))
      console.log(`  ${String(v.length).padStart(3)}  ${k}`);
    console.log("\nDry run. Re-run with --insert.");
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
      materials_text: `${r.color} · ${r.spec}`,
      description: null, // hand-backfilled in Toxome voice with occasion[]
      certifications: null, // B Corp is a company cert, not a textile one — never infer
      toxome_score: r.score, risk_level: scoreToRiskLevel(r.score),
      published: false, rejected: false, added_by: "agent", reviewed_at: null,
      tags: ["batch-paka", "no-llm", "image-verify"],
    };
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) console.log(`  ✗ ${r.name} — ${error.message}`);
    else { n++; console.log(`  ✓ ${r.name} · ${r.score} · ${data.id.slice(0, 8)}`); }
  }
  console.log(`\n${n}/${take.length} inserted as drafts → /admin Pending.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
