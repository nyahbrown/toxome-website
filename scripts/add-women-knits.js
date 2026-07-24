/**
 * Women's Fall knits (2026-07-22). No LLM, no Anthropic API.
 *
 * Spec-driven: each SPEC names a brand + a product-title regex + target category.
 * The script pulls the brand's Shopify products.json (paginated), finds matching
 * products, keeps only ones that are in stock, in a NEUTRAL colorway, and whose
 * composition (read off body_html) scores >= 67, then picks the best neutral
 * variant and drafts it. Colorway is stripped from item_name and moved to the
 * description. All specced brands are US storefronts (USD base) — see the Organic
 * Zoo currency note if you add a UK/EU brand.
 *
 *   node --env-file=.env.local scripts/add-women-knits.js --dry     # preview only
 *   node --env-file=.env.local scripts/add-women-knits.js --draft   # queue drafts
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const NEUTRAL = /ivory|natural|ecru|oat|oatmeal|sand|flax|camel|cream|heather|stone|bone|fog|dove|birch|taupe|almond|wheat|undyed|clay|oatmilk|biscuit|mushroom|greige|chalk|milk|butter|sable|walnut|cocoa|chestnut|white|brown|coffee|mocha|fawn|\bash\b|pewter|pecan|hazel|bark|caramel|toffee|grey|gray/i;
// A colorway is loud if ANY loud word appears, even alongside a neutral one
// ("Shell Pink" is loud, not neutral).
const LOUD = /black|sapphire|poppy|sangria|rosebud|\bred\b|cobalt|emerald|violet|pink|\bblue\b|green|orange|yellow|purple|navy|teal|magenta|coral|lilac|mint|mustard|rust|olive|forest|burgundy|wine|plum|scarlet|crimson/i;

// Occasion filter (app/shop/ShopClient.tsx) matches EXACT Title-Case Lifestyle-5.
// Map any legacy value to canonical so items actually filter. See sourcing-rules memory.
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
const norm = (r) => {
  const s = r.toLowerCase();
  if (/organic.*cotton/.test(s)) return "organic cotton";
  if (/pima|supima|cotton/.test(s)) return "cotton";
  if (/cashmere/.test(s)) return "cashmere";
  if (/merino/.test(s)) return "merino wool";
  if (/alpaca/.test(s)) return "alpaca";
  if (/mohair/.test(s)) return "mohair";
  if (/lambswool|\bwool\b/.test(s)) return "wool";
  if (/linen/.test(s)) return "linen";
  if (/silk/.test(s)) return "silk";
  if (/yak/.test(s)) return "yak";
  if (/tencel|lyocell/.test(s)) return "lyocell";
  if (/viscose|rayon|modal/.test(s)) return "viscose";
  if (/polyester/.test(s)) return "polyester";
  if (/nylon|polyamide/.test(s)) return "nylon";
  if (/acrylic/.test(s)) return "acrylic";
  if (/elastane|spandex/.test(s)) return "elastane";
  return null;
};
function compFromBody(body) {
  const f = {};
  let m;
  const rx = /(\d{1,3})\s*%\s*([a-z ]{3,25})/gi;
  while ((m = rx.exec(body))) {
    const p = +m[1];
    const fi = norm(m[2]);
    if (p > 0 && p <= 100 && fi) f[fi] = (f[fi] || 0) + p;
  }
  const t = Object.values(f).reduce((a, b) => a + b, 0);
  return t >= 95 && t <= 105 ? f : null;
}
const bodyText = (p) => String(p.body_html || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
// Strip the colorway from a retailer title: cut at " | " / " - ", drop a trailing
// "in <Color>", and title-case ALL-CAPS names.
function cleanName(title) {
  let t = title.split(/\s[|]\s/)[0].split(/\s-\s/)[0].trim();
  t = t.replace(/\s+in\s+[a-z /&]+$/i, "").trim();
  if (t === t.toUpperCase()) t = t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return t;
}
// Resolve the display colorway from product options. Returns null (not a guess)
// when nothing clean is found, so the description can omit the color entirely.
function colorOf(p) {
  const opt =
    (p.options || []).find((o) => /colou?r/i.test(o.name)) ||
    (p.options || []).find((o) => o.values.some((v) => NEUTRAL.test(v) || LOUD.test(v)));
  const vals = opt ? opt.values : [];
  const neutral = vals.find((v) => NEUTRAL.test(v) && !LOUD.test(v));
  if (neutral) return neutral.toLowerCase();
  const nonLoud = vals.find((v) => !LOUD.test(v) && !/^(x{0,2}s|m|x{0,2}l|one size|\d)/i.test(v.trim()));
  return nonLoud ? nonLoud.toLowerCase() : null;
}

const SPECS = [
  { brand: "Industry of All Nations", domain: "https://industryofallnations.com", match: /^alpaca raglan sweater$/i, category: "Sweaters", occasion: ["Everyday", "Workwear"], garment: "raglan sweater" },
  { brand: "NakedCashmere", domain: "https://www.nakedcashmere.com", match: /jayla button-up cashmere cardigan/i, category: "Sweaters", occasion: ["Everyday", "Workwear"], garment: "button-up cardigan" },
  { brand: "NakedCashmere", domain: "https://www.nakedcashmere.com", match: /cashmere crewneck/i, category: "Sweaters", occasion: ["Everyday", "Workwear"], garment: "crewneck sweater" },
  { brand: "White + Warren", domain: "https://www.whiteandwarren.com", match: /^cotton cashmere crewneck/i, category: "Sweaters", occasion: ["Everyday", "Workwear"], garment: "crewneck sweater" },
  { brand: "Alex Mill", domain: "https://www.alexmill.com", match: /^bella cardigan in cotton cashmere/i, category: "Sweaters", occasion: ["Everyday", "Workwear"], garment: "cardigan" },
  { brand: "Alex Mill", domain: "https://www.alexmill.com", match: /^taylor striped cardigan/i, category: "Sweaters", occasion: ["Everyday", "Workwear"], garment: "striped cardigan" },
  { brand: "Demylee", domain: "https://demylee.com", match: /^isla cotton linen sweater/i, category: "Sweaters", occasion: ["Everyday", "Workwear"], garment: "sweater" },
];

const feedCache = {};
async function feed(domain) {
  if (feedCache[domain]) return feedCache[domain];
  let all = [];
  for (let page = 1; page <= 3; page++) {
    const r = await fetch(`${domain}/products.json?limit=250&page=${page}`, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) break;
    const ps = (await r.json()).products || [];
    all = all.concat(ps);
    if (ps.length < 250) break;
  }
  feedCache[domain] = all;
  return all;
}

async function resolve(spec) {
  const ps = (await feed(spec.domain)).filter((p) => spec.match.test(p.title));
  const cands = [];
  for (const p of ps) {
    const inStock = p.variants.some((v) => v.available);
    if (!inStock) continue;
    const handleColor = p.handle.replace(/-\d+$/, "");
    if (LOUD.test(handleColor)) continue; // per-color handle carries a loud colorway
    const color = colorOf(p);
    if (color && LOUD.test(color)) continue; // resolved display colorway is loud
    const comp = compFromBody(bodyText(p));
    if (!comp) continue;
    const score = calcToxomeScore(toFractions(comp));
    if (score == null || score < 67) continue;
    const price = Math.min(...p.variants.filter((v) => v.available).map((v) => +v.price));
    const images = (p.images || []).map((i) => i.src).filter(Boolean);
    if (!images.length) continue;
    cands.push({ p, comp, score, price, images, color, neutralHandle: NEUTRAL.test(handleColor) });
  }
  // Prefer a neutral-colorway handle, then most available stock.
  cands.sort((a, b) => (b.neutralHandle - a.neutralHandle) || (b.p.variants.filter((v) => v.available).length - a.p.variants.filter((v) => v.available).length));
  return cands[0] || null;
}

async function run() {
  const draft = process.argv.includes("--draft");
  const dry = process.argv.includes("--dry") || !draft;
  const supabase = draft ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
  if (draft && !process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

  let n = 0;
  for (const spec of SPECS) {
    const hit = await resolve(spec);
    if (!hit) { console.log(`✗    ${spec.brand} — /${spec.match.source}  (no clean neutral in-stock match)`); continue; }
    const name = cleanName(hit.p.title);
    const color = hit.color;
    const url = `${spec.domain}/products/${hit.p.handle}`;
    const comp = toFractions(hit.comp);
    const desc = `a ${spec.garment} in ${materialsFromComp(hit.comp)}, soft and breathable in natural fiber${color ? `, in a muted ${color}` : ""}.`;

    if (dry) {
      n++;
      console.log(`• ${spec.category.padEnd(9)} ${spec.brand} — ${name}`);
      console.log(`     $${hit.price} · score ${hit.score} ${scoreToRiskLevel(hit.score)} · ${materialsFromComp(hit.comp)} · ${color} · ${hit.images.length} imgs`);
      console.log(`     ${url}`);
      continue;
    }

    const dupUrl = url;
    const { data: dup } = await supabase.from("products").select("id").eq("item_url", dupUrl).maybeSingle();
    if (dup) { console.log(`✗    ${spec.brand} — ${name}  (dup ${dup.id.slice(0, 8)})`); continue; }
    const row = {
      item_name: name, brand: spec.brand,
      item_price: hit.price, currency: "USD", budget: budget(hit.price),
      category: spec.category, gender: "Women", occasion: canonOcc(spec.occasion),
      item_image: hit.images[0], images: hit.images.slice(0, 6), item_url: dupUrl, affiliate_url: null,
      fabric_composition: comp, materials_text: materialsFromComp(hit.comp),
      description: desc, certifications: null,
      toxome_score: hit.score, risk_level: scoreToRiskLevel(hit.score),
      published: false, rejected: false, added_by: "agent", reviewed_at: null,
      tags: ["batch-women-knits", "no-llm"],
    };
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) { console.log(`✗    ${spec.brand} — ${name}  (insert: ${error.message})`); continue; }
    n++;
    console.log(`✓ ${String(n).padStart(2)} ${spec.category.padEnd(9)} ${spec.brand} — ${name}  ($${hit.price}, ${hit.score}, ${color})`);
  }
  console.log(`\n${n} ${dry ? "candidates" : "drafted"}.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
