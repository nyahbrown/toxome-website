/**
 * Discovery probe — scan candidate clean-fiber men's brands for polo shirts,
 * then read composition off the FULL live PDP HTML (not just feed body_html,
 * which these brands render via JS). No writes, no LLM.
 *
 *   node scripts/probe-men-polos.js
 */
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const CANDIDATES = [
  ["Taylor Stitch", "https://www.taylorstitch.com"],
  ["Faherty", "https://fahertybrand.com"],
  ["Alex Mill", "https://www.alexmill.com"],
  ["Todd Snyder", "https://www.toddsnyder.com"],
  ["Sunspel", "https://www.sunspel.com"],
  ["Everlane", "https://www.everlane.com"],
  ["Mollusk", "https://mollusksurfshop.com"],
  ["Corridor NYC", "https://corridornyc.com"],
  ["Wax London", "https://waxlondon.com"],
  ["Les Deux", "https://lesdeux.com"],
  ["Vuori", "https://vuoriclothing.com"],
  ["Marine Layer", "https://www.marinelayer.com"],
];

const norm = (r) => {
  const s = r.toLowerCase();
  if (/organic.*cotton/.test(s)) return "organic cotton";
  if (/pima|supima|cotton/.test(s)) return "cotton";
  if (/hemp/.test(s)) return "hemp";
  if (/cashmere/.test(s)) return "cashmere";
  if (/merino/.test(s)) return "merino wool";
  if (/alpaca/.test(s)) return "alpaca";
  if (/lambswool|\bwool\b/.test(s)) return "wool";
  if (/linen/.test(s)) return "linen";
  if (/silk/.test(s)) return "silk";
  if (/tencel|lyocell/.test(s)) return "lyocell";
  if (/viscose|rayon|modal/.test(s)) return "viscose";
  if (/polyester/.test(s)) return "polyester";
  if (/nylon|polyamide/.test(s)) return "nylon";
  if (/acrylic/.test(s)) return "acrylic";
  if (/elastane|spandex/.test(s)) return "elastane";
  return null;
};
function compFromText(body) {
  // Cut at review/related markers so we don't grab a review blurb.
  const cut = body.search(/you may also like|related products|customer reviews|write a review|complete the look|recently viewed/i);
  const text = cut > 400 ? body.slice(0, cut) : body;
  const f = {};
  let m;
  const rx = /(\d{1,3})\s*%\s*([a-z][a-z ]{2,24})/gi;
  while ((m = rx.exec(text))) {
    const p = +m[1];
    const fi = norm(m[2]);
    if (p > 0 && p <= 100 && fi) f[fi] = Math.max(f[fi] || 0, p);
  }
  const t = Object.values(f).reduce((a, b) => a + b, 0);
  return t >= 95 && t <= 105 ? f : null;
}
const strip = (html) => String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
const toFractions = (c) => {
  const s = Object.values(c).reduce((a, b) => a + b, 0);
  const o = {};
  for (const [k, v] of Object.entries(c)) o[k] = Math.round((v / s) * 1000) / 1000;
  return o;
};
const compStr = (c) => Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");

async function feed(domain) {
  let all = [];
  for (let page = 1; page <= 4; page++) {
    let r;
    try { r = await fetch(`${domain}/products.json?limit=250&page=${page}`, { headers: { "User-Agent": "Mozilla/5.0" } }); }
    catch (e) { return all; }
    if (!r.ok) return all;
    let json;
    try { json = await r.json(); } catch (e) { return all; }
    const ps = json.products || [];
    all = all.concat(ps);
    if (ps.length < 250) break;
  }
  return all;
}

async function pdpComp(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return { comp: null, note: `HTTP ${r.status}` };
    const html = await r.text();
    return { comp: compFromText(strip(html)), note: "" };
  } catch (e) { return { comp: null, note: e.message }; }
}

async function run() {
  for (const [brand, domain] of CANDIDATES) {
    const all = await feed(domain);
    if (!all.length) { console.log(`\n### ${brand}  —  no feed`); continue; }
    // one product per base title (drop per-colorway dupes)
    const seen = new Set();
    const polos = all.filter((p) => {
      if (!/\bpolo\b/i.test(p.title) || /dress|women|kids?/i.test(p.title)) return false;
      const base = p.title.toLowerCase().trim();
      if (seen.has(base)) return false;
      seen.add(base); return true;
    });
    console.log(`\n### ${brand}  (${all.length} products, ${polos.length} distinct polos)`);
    for (const p of polos) {
      const inStock = p.variants.some((v) => v.available);
      if (!inStock) continue;
      const price = Math.min(...p.variants.map((v) => +v.price).filter((n) => n > 0));
      const imgs = (p.images || []).length;
      const url = `${domain}/products/${p.handle}`;
      const { comp, note } = await pdpComp(url);
      let score = comp ? calcToxomeScore(toFractions(comp)) : null;
      const tag = comp ? (score != null && score >= 67 ? `PASS ${score}` : `fail ${score}`) : `no-comp${note ? " " + note : ""}`;
      console.log(`  [${tag}] "${p.title}" $${price} ${imgs}img  ${comp ? compStr(comp) : ""}`);
      console.log(`        ${url}`);
    }
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
