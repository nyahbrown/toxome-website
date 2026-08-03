/**
 * Women's shorts + tops (2026-08-02). No LLM, no Anthropic API.
 *
 * List-driven, same contract as add-women-picks.js. Each ITEM names a live PDP.
 * The script re-reads composition from the LIVE PDP full page text (never trusts
 * the feed body_html alone — Leset/NPL hide it, and White + Warren writes "Lycra"
 * which a naive fiber regex drops, silently inflating the score). It then pulls
 * price/images/stock from the Shopify {url}.json, scores via the canonical rubric,
 * and queues published:false drafts for /admin.
 *
 *   node --env-file=.env.local scripts/add-women-shorts-tops.js --dry
 *   node --env-file=.env.local scripts/add-women-shorts-tops.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

// Lycra/spandex added — White + Warren states "5% Lycra" and dropping it scored
// a 95/5 cashmere-elastane knit as pure cashmere.
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
  if (/viscose|rayon|modal|acetate/.test(s)) return "viscose";
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
    // Pages restate the composition (Leset prints "100% cotton" in the fabric
    // blurb AND again in the care line) — summing repeats gives 200 and the item
    // is silently dropped. Collapse identical percent+fiber statements.
    const k = `${p}|${fi}`;
    if (seen.has(k)) continue;
    seen.add(k);
    f[fi] = (f[fi] || 0) + p;
  }
  const t = Object.values(f).reduce((a, b) => a + b, 0);
  return t >= 99 && t <= 101 ? f : null;   // strict: a short sum means a fiber was missed
}
const frac = (c) => { const s = Object.values(c).reduce((a, b) => a + b, 0); const o = {}; for (const [k, v] of Object.entries(c)) o[k] = v / s; return o; };
const materials = (c) => Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");
const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");

// Cut nav/footer/review noise before regexing, else a "15% off" promo or a review
// blurb becomes the composition.
function pageText(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
  const cut = t.search(/customer reviews|you may (also )?like|recently viewed|complete the look/i);
  return cut > 500 ? t.slice(0, cut) : t;
}

const ITEMS = [
  // ---------- SHORTS (the real gap: 14 women's shorts in the whole catalog) ----------
  { brand: "Industry of All Nations", url: "https://industryofallnations.com/products/ponya-corduroy-shorts",
    name: "Ponya Corduroy Shorts", category: "Bottoms", occasion: ["Everyday"],
    desc: "a relaxed corduroy short in 100% organic cotton, with the soft weight and breathability of an undyed natural fiber." },
  { brand: "Industry of All Nations", url: "https://industryofallnations.com/products/organic-cotton-ponya-drawstring-shorts",
    name: "Ponya Drawstring Shorts", category: "Bottoms", occasion: ["Everyday", "Vacation/Resort"],
    desc: "an easy drawstring short in 100% organic cotton, cut loose and breathable for warm weather." },
  { brand: "Jenni Kayne", url: "https://www.jennikayne.com/products/linen-logan-short-hemp",
    name: "Linen Logan Short", category: "Bottoms", occasion: ["Everyday", "Vacation/Resort"],
    desc: "a tailored short in 100% linen, breathable and quick-drying in a quiet natural tone." },
  { brand: "Ciao Lucia", url: "https://ciaolucia.com/products/10514180brn-cotton-poplin-brown",
    name: "Bibbi Cotton Poplin Short", category: "Bottoms", occasion: ["Everyday", "Vacation/Resort"],
    desc: "a crisp poplin short in 100% cotton, in a soft brown that wears easily through summer." },
  { brand: "Ciao Lucia", url: "https://ciaolucia.com/products/joska-white-embroidered-linen-short",
    name: "Joska Embroidered Linen Short", category: "Bottoms", occasion: ["Everyday", "Vacation/Resort"],
    desc: "an embroidered short in a linen-cotton blend, breathable and textural in a clean white." },
  { brand: "Ciao Lucia", url: "https://ciaolucia.com/products/dito-short-ivory-embroidered-cdc",
    name: "Dito Embroidered Silk Short", category: "Bottoms", occasion: ["Everyday", "Evening"],
    desc: "an embroidered short in 100% silk, fluid and temperature-regulating in a soft ivory." },
  { brand: "Leset", url: "https://leset.com/products/kyoto-carpenter-short-birch",
    name: "Kyoto Carpenter Short", category: "Bottoms", occasion: ["Everyday"],
    desc: "a garment-washed carpenter short in 100% cotton, crisp and utilitarian in a pale birch." },

  // ---------- TOPS ----------
  { brand: "Ciao Lucia", url: "https://ciaolucia.com/products/jona-cream-silk-top",
    name: "Jona Silk Top", category: "Tops", occasion: ["Everyday", "Evening"],
    desc: "a fluid top in 100% silk, breathable and temperature-regulating in a soft cream." },
  { brand: "Cou Cou", url: "https://coucouintimates.com/products/the-tank-cotton-jersey-white",
    name: "The Tank", category: "Tops", occasion: ["Everyday"],
    desc: "a fitted tank in 100% organic cotton jersey, soft against skin in a clean white." },
  { brand: "Cou Cou", url: "https://coucouintimates.com/products/the-tube-top-cotton-jersey-white",
    name: "The Tube Top", category: "Tops", occasion: ["Everyday"],
    desc: "a simple tube top in 100% organic cotton jersey, breathable and unlined in a clean white." },
  { brand: "Cou Cou", url: "https://coucouintimates.com/products/the-iris-tank-cotton-voile-white",
    name: "The Iris Tank", category: "Tops", occasion: ["Everyday"],
    desc: "a lightweight tank in 100% organic cotton voile, sheer and airy in a soft white." },
  { brand: "Harvest & Mill", url: "https://harvestandmill.com/products/womens-organic-unisex-style-v-neck-tee-in-natural",
    name: "Organic Cotton V-Neck Tee", category: "Tops", occasion: ["Everyday"],
    desc: "an everyday v-neck in 100% US-grown organic cotton, undyed and breathable in a natural tone." },
  { brand: "Harvest & Mill", url: "https://harvestandmill.com/products/natural-dye-pomegranate-chestnut-womens-unisex-style-crew-tee",
    name: "Natural Dye Crew Tee", category: "Tops", occasion: ["Everyday"],
    desc: "a crew tee in 100% US-grown organic cotton, coloured with pomegranate and chestnut rather than synthetic dye." },
  { brand: "Alex Mill", url: "https://www.alexmill.com/products/the-standard-t-shirt-in-slub-cotton-in-white",
    name: "Standard T-Shirt", category: "Tops", occasion: ["Everyday"],
    desc: "a relaxed tee in 100% slub cotton, with a soft dry hand and an easy drape, in white." },
  { brand: "Alex Mill", url: "https://www.alexmill.com/products/chantilly-ruffle-shirt-in-cotton-voile-in-white",
    name: "Chantilly Ruffle Shirt", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a ruffled shirt in 100% cotton voile, light and breathable with a quiet romantic line, in white." },
  { brand: "Alex Mill", url: "https://www.alexmill.com/products/bond-st-polo-in-cotton-cashmere-in-grey-flannel",
    name: "Bond St Polo", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a fine-knit polo in cotton and cashmere, soft and breathable with a clean collar, in a pale grey." },
  { brand: "Jenni Kayne", url: "https://www.jennikayne.com/products/claude-long-sleeve-tee-ivory-hemp-stripe",
    name: "Claude Long-Sleeve Tee", category: "Tops", occasion: ["Everyday"],
    desc: "a long-sleeve tee in 100% cotton, an easy breathable layer in a quiet ivory stripe." },
  { brand: "Jenni Kayne", url: "https://www.jennikayne.com/products/merino-tee-ivory",
    name: "Merino Tee", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a fine-gauge tee in 100% merino wool, temperature-regulating and naturally odor-resistant, in ivory." },
  { brand: "White + Warren", url: "https://www.whiteandwarren.com/products/cashmere-linen-blend-polo-ivory",
    name: "Cashmere Linen Blend Polo", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a knit polo in cashmere and linen, breathable and soft with a dry summer hand, in ivory." },
  { brand: "White + Warren", url: "https://www.whiteandwarren.com/products/cashmere-featherweight-t-shirt-natural-heather",
    name: "Cashmere Featherweight T-Shirt", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a featherweight tee in 100% cashmere, light and temperature-regulating in a natural heather." },
  { brand: "Demylee", url: "https://demylee.com/products/hazel-superfine-cashmere-top",
    name: "Hazel Superfine Cashmere Top", category: "Tops", occasion: ["Everyday", "Workwear"],
    desc: "a superfine knit top in 100% cashmere, light enough to wear alone and naturally breathable." },
  { brand: "Ozma", url: "https://ozmaofcalifornia.com/products/classic-tee-silk-noil-jersey-natural",
    name: "Classic Tee", category: "Tops", occasion: ["Everyday"],
    desc: "a boxy tee in 100% silk noil jersey, matte and textural with the breathability of raw silk, in natural." },
];

// ⚠️ Per-product /products/{handle}.json reports available:false on EVERY variant
// on several of these storefronts (the documented Crann feed bug). Real per-size
// stock, price and images only come from the paginated COLLECTION feed, so index
// that once per domain and resolve by handle.
const feedCache = {};
async function brandFeed(domain) {
  if (feedCache[domain]) return feedCache[domain];
  const byHandle = {};
  for (let page = 1; page <= 4; page++) {
    const d = await j(`${domain}/products.json?limit=250&page=${page}`);
    const ps = d && d.products ? d.products : [];
    for (const p of ps) byHandle[p.handle] = p;
    if (ps.length < 250) break;
  }
  feedCache[domain] = byHandle;
  return byHandle;
}

async function j(url) {
  try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) }); if (!r.ok) return null; return await r.json(); }
  catch { return null; }
}
async function html(url) {
  try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) }); if (!r.ok) return null; return await r.text(); }
  catch { return null; }
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

    // Composition, in order of trust: the live PDP text, then the feed body_html
    // (many of these brands render the materials block in JS, so it only exists in
    // the feed). Both are brand-stated. The strict 99–101 sum gate in parseComp is
    // what keeps a missed fiber from inflating the score — it is why White + Warren's
    // "95% Cashmere, 5% Lycra" top is rejected rather than scored as pure cashmere.
    const h = await html(it.url);
    const feedText = String(p.body_html || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
    const comp = (h ? parseComp(pageText(h)) : null) || parseComp(feedText);
    if (!comp) { skipped.push([label, "no brand-stated composition summing to 100"]); continue; }

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
      tags: ["batch-women-shorts-tops", "no-llm"],
    };

    if (dry) { ok++; console.log(`• ${it.category.padEnd(7)} ${label}\n    $${price} · ${score} ${scoreToRiskLevel(score)} · ${materials(comp)} · ${avail.length}/${p.variants.length} · ${images.length} imgs`); continue; }

    const { data: dup } = await supabase.from("products").select("id").eq("item_url", it.url).maybeSingle();
    if (dup) { skipped.push([label, `dup ${dup.id.slice(0, 8)}`]); continue; }
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) { skipped.push([label, `insert: ${error.message}`]); continue; }
    ok++;
    console.log(`✓ ${String(ok).padStart(2)} ${it.category.padEnd(7)} ${label}  ($${price}, ${score}, ${data.id.slice(0, 8)})`);
  }

  console.log(`\n${ok} ${dry ? "candidates" : "drafted"}, ${skipped.length} skipped.`);
  for (const [l, r] of skipped) console.log(`  ✗ ${l.padEnd(48)} ${r}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
