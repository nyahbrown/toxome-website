/**
 * Women's SUMMER tops (2026-08-02). No LLM, no Anthropic API.
 *
 * Same contract as add-women-shorts-tops.js (see that file for the two parser
 * bugs this shares the fix for: "Lycra" normalization + repeated-composition
 * double counting, guarded by a strict 99–101 sum gate).
 *
 * Curated against Nyah's /admin triage of batch-women-shorts-tops, where she
 * rejected EVERY warm-fiber top (cashmere/merino/wool), the long-sleeve tee, and
 * both undyed utilitarian Harvest & Mill basics — and approved linen, silk, cotton
 * poplin/voile/jersey. So this batch is summer-weight cellulosic + silk only,
 * sleeveless/short-sleeve, elevated rather than utility.
 *
 *   node --env-file=.env.local scripts/add-women-summer-tops.js --dry
 *   node --env-file=.env.local scripts/add-women-summer-tops.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };
const WARM = /cashmere|merino|wool|alpaca|mohair|yak/;

const norm = (r) => { const s = r.toLowerCase();
  if (/organic.*cotton/.test(s)) return "organic cotton";
  if (/pima|supima|cotton/.test(s)) return "cotton";
  if (/cashmere/.test(s)) return "cashmere";
  if (/merino/.test(s)) return "merino wool";
  if (/alpaca/.test(s)) return "alpaca";
  if (/mohair/.test(s)) return "mohair";
  if (/lambswool|\bwool\b/.test(s)) return "wool";
  if (/\bhemp\b/.test(s)) return "hemp";
  if (/\bramie\b/.test(s)) return "ramie";
  if (/linen|\bflax\b/.test(s)) return "linen";
  if (/silk/.test(s)) return "silk";
  if (/tencel|lyocell/.test(s)) return "lyocell";
  if (/viscose|rayon|modal|acetate|cupro/.test(s)) return "viscose";
  if (/polyester/.test(s)) return "polyester";
  if (/nylon|polyamide/.test(s)) return "nylon";
  if (/acrylic/.test(s)) return "acrylic";
  if (/elastane|spandex|lycra/.test(s)) return "elastane";
  return null; };

function parseComp(text) {
  const f = {}; const seen = new Set(); let m;
  const rx = /(\d{1,3})\s*%\s*([a-z][a-z \-]{2,25})/gi;
  while ((m = rx.exec(text))) {
    const p = +m[1], fi = norm(m[2]);
    if (!(p > 0 && p <= 100 && fi)) continue;
    const k = `${p}|${fi}`; if (seen.has(k)) continue; seen.add(k);
    f[fi] = (f[fi] || 0) + p;
  }
  const t = Object.values(f).reduce((a, b) => a + b, 0);
  return t >= 99 && t <= 101 ? f : null;
}
const frac = (c) => { const s = Object.values(c).reduce((a, b) => a + b, 0); const o = {}; for (const [k, v] of Object.entries(c)) o[k] = v / s; return o; };
const materials = (c) => Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");
const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");

function pageText(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
  const cut = t.search(/customer reviews|you may (also )?like|recently viewed|complete the look/i);
  return cut > 500 ? t.slice(0, cut) : t;
}

const ITEMS = [
  // --- With Jéan: Nyah's own reference. ONLY 3 of 40 tops clear the fiber bar. ---
  { brand: "With Jéan", url: "https://withjean.com/products/simos-top-white",
    name: "Simos Top", category: "Tops", occasion: ["Everyday", "Vacation/Resort"],
    desc: "a sleeveless button-up blouse in 100% cotton, with hand-drawn embroidery and tie details, in white." },
  { brand: "With Jéan", url: "https://withjean.com/products/lauren-top-white",
    name: "Lauren Top", category: "Tops", occasion: ["Everyday", "Vacation/Resort"],
    desc: "a soft woven top in 100% cotton, light and breathable for warm weather, in white." },
  { brand: "With Jéan", url: "https://withjean.com/products/audrey-top-white",
    name: "Audrey Top", category: "Tops", occasion: ["Everyday", "Vacation/Resort"],
    desc: "an easy summer top in 100% cotton, breathable and quietly feminine, in white." },

  // --- linen ---
  { brand: "MagicLinen", url: "https://magiclinen.com/products/sleeveless-linen-top-geneva-in-white",
    name: "Geneva Sleeveless Linen Top", category: "Tops", occasion: ["Everyday", "Vacation/Resort"],
    desc: "a sleeveless top in 100% washed linen, breathable and quick-drying in a soft white." },
  { brand: "Baserange", url: "https://baserange.com/products/lava-top-in-ama-brown",
    name: "Lava Top", category: "Tops", occasion: ["Everyday", "Vacation/Resort"],
    desc: "a relaxed top in 100% linen, airy and temperature-regulating in a warm brown." },
  { brand: "Baserange", url: "https://baserange.com/products/stoa-shirt-in-ama-brown",
    name: "Stoa Shirt", category: "Tops", occasion: ["Everyday", "Workwear", "Vacation/Resort"],
    desc: "an unstructured shirt in 100% linen, light and breathable with a soft collar, in a warm brown." },
  { brand: "Baserange", url: "https://baserange.com/products/max-top-in-loam-brown",
    name: "Max Top", category: "Tops", occasion: ["Everyday"],
    desc: "a fine-knit top in linen and organic cotton, breathable with a dry summer hand, in a soft loam." },
  { brand: "Jenni Kayne", url: "https://www.jennikayne.com/products/linen-ease-shirt-hemp",
    name: "Linen Ease Shirt", category: "Tops", occasion: ["Everyday", "Workwear", "Vacation/Resort"],
    desc: "a relaxed button-down in 100% linen, breathable and easy over everything, in a quiet neutral." },
  { brand: "Ciao Lucia", url: "https://ciaolucia.com/products/ander-white-embroidered-linen-top",
    name: "Ander Embroidered Linen Top", category: "Tops", occasion: ["Everyday", "Vacation/Resort"],
    desc: "an embroidered top in a linen-cotton blend, textural and breathable in a clean white." },
  { brand: "Demylee", url: "https://demylee.com/products/cris-cotton-linen-top",
    name: "Cris Cotton Linen Top", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a fine-knit top in cotton and linen, light and breathable with a soft dry finish." },

  // --- silk ---
  { brand: "Ozma", url: "https://ozmaofcalifornia.com/products/boy-tank-regen-silk-noil-jersey-natural",
    name: "Boy Tank", category: "Tops", occasion: ["Everyday"],
    desc: "a boxy tank in 100% silk noil jersey, matte and textural with the breathability of raw silk, in natural." },

  // --- cotton voile / poplin / jersey ---
  { brand: "Christy Dawn", url: "https://christydawn.com/products/the-heidi-blouse-alabaster",
    name: "The Heidi Blouse", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a soft blouse in 100% organic cotton, breathable and easy in a pale alabaster." },
  { brand: "Christy Dawn", url: "https://christydawn.com/products/the-addie-tank-ivory-regenerative-pointelle",
    name: "The Addie Tank", category: "Tops", occasion: ["Everyday"],
    desc: "a pointelle tank in 100% cotton, light and open-knit for warm weather, in ivory." },
  { brand: "Everlane", url: "https://www.everlane.com/products/womens-organic-cotton-box-cut-tee-heathered-oats",
    name: "The Box-Cut Tee", category: "Tops", occasion: ["Everyday"],
    desc: "a boxy tee in 100% organic cotton, breathable and easy in a heathered oat." },
  { brand: "Organic Basics", url: "https://us.organicbasics.com/products/true-heavy-boxy-fit-tee-clay",
    name: "True Heavy Boxy Fit Tee", category: "Tops", occasion: ["Everyday"],
    desc: "a heavyweight boxy tee in 100% organic cotton, breathable and built to hold its shape, in clay." },
  { brand: "Lunya", url: "https://lunya.co/products/womens-organic-pima-wide-sleeve-tee-storm-grey-heather",
    name: "Organic Pima Wide Sleeve Tee", category: "Tops", occasion: ["Everyday"],
    desc: "a wide-sleeve tee in 100% organic pima cotton, soft and breathable in a heathered grey." },
  { brand: "Wol Hide", url: "https://wolhide.com/products/wide-tank-natural",
    name: "Wide Tank", category: "Tops", occasion: ["Everyday"],
    desc: "a wide-cut tank in 100% organic cotton, undyed and breathable in a natural tone." },
  { brand: "Ninety Percent", url: "https://ninetypercent.com/products/aki-cami-top-in-chalk-hs26",
    name: "Aki Cami Top", category: "Tops", occasion: ["Everyday"],
    desc: "a slim cami in organic cotton jersey with a touch of stretch, in a soft chalk." },
];

async function j(url) {
  try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) }); if (!r.ok) return null; return await r.json(); }
  catch { return null; }
}
async function html(url) {
  try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) }); if (!r.ok) return null; return await r.text(); }
  catch { return null; }
}

// Per-product /products/{handle}.json reports available:false on every variant on
// several of these storefronts — always resolve stock/price/images from the
// paginated COLLECTION feed. See catalog-buildout memory.
const feedCache = {};
async function brandFeed(domain) {
  if (feedCache[domain]) return feedCache[domain];
  const byHandle = {};
  for (let page = 1; page <= 5; page++) {
    const d = await j(`${domain}/products.json?limit=250&page=${page}`);
    const ps = d && d.products ? d.products : [];
    for (const p of ps) byHandle[p.handle] = p;
    if (ps.length < 250) break;
  }
  feedCache[domain] = byHandle;
  return byHandle;
}

async function run() {
  const draft = process.argv.includes("--draft");
  const dry = process.argv.includes("--dry") || !draft;
  if (draft && !process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = draft ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

  let ok = 0; const skipped = [];
  for (const it of ITEMS) {
    const label = `${it.brand} — ${it.name}`;
    const m = it.url.match(/^(https?:\/\/[^/]+)\/products\/(.+)$/);
    const feed = await brandFeed(m[1]);
    const p = feed[m[2]];
    if (!p) { skipped.push([label, "handle not in brand feed"]); continue; }

    const avail = p.variants.filter((v) => v.available);
    if (avail.length < 3) { skipped.push([label, `thin stock ${avail.length}/${p.variants.length}`]); continue; }

    const h = await html(it.url);
    const feedText = String(p.body_html || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
    const comp = (h ? parseComp(pageText(h)) : null) || parseComp(feedText);
    if (!comp) { skipped.push([label, "no brand-stated composition summing to 100"]); continue; }
    if (Object.keys(comp).some((f) => WARM.test(f))) { skipped.push([label, `warm fiber (${materials(comp)}) — not a summer top`]); continue; }

    const score = calcToxomeScore(frac(comp));
    if (score == null || score < 67) { skipped.push([label, `score ${score} < 67 (${materials(comp)})`]); continue; }

    const images = (p.images || []).map((i) => i.src).filter(Boolean);
    if (images.length < 2) { skipped.push([label, `only ${images.length} image(s)`]); continue; }

    const price = Math.min(...avail.map((v) => +v.price));
    const row = {
      item_name: it.name, brand: it.brand,
      item_price: price, currency: "USD", budget: budget(price),
      category: it.category, gender: "Women", occasion: it.occasion,
      item_image: images[0], images: images.slice(0, 6),
      item_url: it.url, affiliate_url: null,
      fabric_composition: frac(comp), materials_text: materials(comp),
      description: it.desc, certifications: null,
      toxome_score: score, risk_level: scoreToRiskLevel(score),
      published: false, rejected: false, added_by: "agent", reviewed_at: null,
      tags: ["batch-women-summer-tops", "no-llm"],
    };

    if (dry) { ok++; console.log(`• ${label}\n    $${price} · ${score} ${scoreToRiskLevel(score)} · ${materials(comp)} · ${avail.length}/${p.variants.length} · ${images.length} imgs`); continue; }

    const { data: dup } = await supabase.from("products").select("id").eq("item_url", it.url).maybeSingle();
    if (dup) { skipped.push([label, `dup ${dup.id.slice(0, 8)}`]); continue; }
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) { skipped.push([label, `insert: ${error.message}`]); continue; }
    ok++;
    console.log(`✓ ${String(ok).padStart(2)} ${label}  ($${price}, ${score}, ${data.id.slice(0, 8)})`);
  }

  console.log(`\n${ok} ${dry ? "candidates" : "drafted"}, ${skipped.length} skipped.`);
  for (const [l, r] of skipped) console.log(`  ✗ ${l.padEnd(46)} ${r}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
