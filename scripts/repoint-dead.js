/**
 * Repoint products killed by the 2 Aug link sweep to their current live URL.
 *
 * For each dead product, pull the brand's paginated products.json, find the best
 * title/handle match, then VERIFY: live PDP, >=3 sizes in stock, >=2 loading
 * images, and a brand-stated composition that still scores the same. Only fully
 * verified matches are proposed for republish; anything that drifted is reported
 * for a human.
 *
 *   node --env-file=.env.local scripts/repoint-dead.js         # propose only
 *   node --env-file=.env.local scripts/repoint-dead.js --apply # write item_url/images/price + republish
 */
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };
const APPLY = process.argv.includes("--apply");
const LOUD = /black|sapphire|poppy|\bred\b|cobalt|emerald|violet|pink|\bblue\b|green|orange|yellow|purple|navy|teal|magenta|coral|lilac|mint|mustard|rust|olive|forest|burgundy|wine|plum|scarlet|crimson|maroon/i;

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

const STOP = new Set(["the", "in", "a", "of", "and", "with", "womens", "women", "mens", "men", "s"]);
const toks = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));

// ⚠️ Token overlap ALONE matches the wrong garment. "Soho Jacket In Cotton Linen"
// scored 75% against "Soho Pant In Cotton Linen" because the one token that
// matters (jacket vs pant) is outvoted by the shared descriptors — it would have
// repointed a jacket at a pair of trousers. Same for "Erika Dress" -> "Sally
// Dress". So the GARMENT NOUN must match, and a distinctive style name must
// survive, before token overlap is even considered.
const GARMENTS = [
  ["jacket"], ["coat", "overcoat"], ["trench"], ["blazer"], ["cardigan"], ["sweater", "jumper", "knit"],
  ["hoodie"], ["sweatshirt"], ["tee", "tshirt", "t"], ["shirt"], ["blouse"], ["top"], ["tank"],
  ["cami", "camisole"], ["dress"], ["skirt"], ["pant", "pants", "trouser", "trousers"], ["jean", "jeans"],
  ["short", "shorts"], ["legging", "leggings"], ["romper"], ["jumpsuit"], ["bra", "bralette"],
  ["brief", "briefs", "thong"], ["sock", "socks"], ["pillowcase", "pillowcases"], ["cover"],
  ["blanket", "throw"], ["towel"], ["sheet", "sheets"], ["mask"], ["polo"], ["henley"], ["bodysuit"],
];
const garmentOf = (s) => {
  const t = new Set(toks(s));
  for (let i = 0; i < GARMENTS.length; i++) if (GARMENTS[i].some((w) => t.has(w))) return i;
  return -1;
};
// tokens that aren't the garment noun or a generic fabric/colour word — the style name
const GENERIC = new Set(["cotton", "linen", "silk", "wool", "cashmere", "hemp", "organic", "merino",
  "alpaca", "viscose", "modal", "lyocell", "tencel", "blend", "slub", "waffle", "rib", "ribbed",
  "classic", "core", "essential", "easy", "relaxed", "slim", "loose", "wide", "long", "short",
  "sleeve", "sleeveless", "crew", "neck", "v", "mid", "high", "low", "rise", "fit", "pack", "set"]);
const styleToks = (s) => toks(s).filter((t) => !GENERIC.has(t) && garmentOf(t) === -1);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Stores throttle hard right after a full link sweep — Alex Mill returns 429 to
// back-to-back `limit=250` requests while the same URL succeeds from curl. A short
// fixed retry reads that as "not Shopify" and silently skips the whole brand, so
// back off properly and distinguish "throttled" from "no feed".
async function j(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status === 503) {
        const wait = Math.min(30000, 4000 * 2 ** attempt);
        await sleep(wait);
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch { await sleep(3000 * (attempt + 1)); }
  }
  return "THROTTLED";
}
// Some stores serve the feed only from a locale/regional host, and several 429 or
// stall under back-to-back paging — a single miss read as "not Shopify" on the
// first run for brands (Outerknown, Organic Basics) whose feeds demonstrably work.
const HOST_ALIASES = {
  "https://organicbasics.com": ["https://us.organicbasics.com"],
  "https://finisterre.com": ["https://finisterre.com/en-us", "https://www.finisterre.com"],
  "https://benifabrics.com": ["https://benifabrics.com/en-us"],
  "https://www.and-daughter.com": ["https://www.and-daughter.com/en-us"],
};
const feedCache = {};
async function feed(origin) {
  if (feedCache[origin]) return feedCache[origin];
  const bases = [origin, ...(HOST_ALIASES[origin] || [])];
  let all = [], throttled = false;
  for (const base of bases) {
    for (let page = 1; page <= 5; page++) {
      const d = await j(`${base}/products.json?limit=250&page=${page}`);
      if (d === "THROTTLED") { throttled = true; break; }
      const ps = d && d.products ? d.products : [];
      all = all.concat(ps);
      if (ps.length < 250) break;
      await sleep(1200);                    // be a good citizen between pages
    }
    if (all.length) break;
  }
  all.throttled = throttled;
  feedCache[origin] = all;
  return all;
}

(async () => {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const targets = JSON.parse(fs.readFileSync("/tmp/repoint_targets.json", "utf8"));
  const results = { republish: [], review: [], none: [] };

  for (const p of targets) {
    const origin = new URL(p.item_url).origin;
    const ps = await feed(origin);
    if (!ps.length) {
      results.none.push({ p, why: ps.throttled ? "THROTTLED (429) — retry later, feed exists" : "brand feed unreachable (not Shopify or blocked)" });
      continue;
    }
    await sleep(800);                       // pace between brands

    const want = toks(p.item_name);
    const wantGarment = garmentOf(p.item_name);
    const wantStyle = styleToks(p.item_name);

    // A candidate must be the SAME GARMENT and share every distinctive style token
    // (the product name minus fabric/fit/colour words). Only then does overlap rank.
    const eligible = ps.filter((c) => {
      const hay = `${c.title} ${c.handle.replace(/-/g, " ")}`;
      if (wantGarment !== -1 && garmentOf(hay) !== wantGarment) return false;
      const have = new Set(toks(hay));
      return wantStyle.length ? wantStyle.every((t) => have.has(t)) : false;
    });
    let best = null, bestScore = 0;
    for (const c of eligible) {
      const have = new Set([...toks(c.title), ...toks(c.handle.replace(/-/g, " "))]);
      const s = want.filter((t) => have.has(t)).length / Math.max(want.length, 1);
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (!best || bestScore < 0.7) {
      const why = !wantStyle.length ? "name has no distinctive style token to match on"
        : !eligible.length ? `no same-garment match for "${wantStyle.join(" ")}"`
        : `best same-garment match only ${(bestScore * 100) | 0}% (${best.title})`;
      results.none.push({ p, why }); continue;
    }

    // prefer a neutral, in-stock colorway of the same style
    const family = eligible.filter((c) => { const have = new Set([...toks(c.title), ...toks(c.handle.replace(/-/g, " "))]); return want.filter((t) => have.has(t)).length / Math.max(want.length, 1) >= bestScore; });
    const ranked = family
      .map((c) => ({ c, avail: c.variants.filter((v) => v.available).length, neutral: !LOUD.test(c.handle) }))
      .sort((a, b) => (b.neutral - a.neutral) || (b.avail - a.avail));
    const pick = ranked[0];
    if (!pick || pick.avail < 3) { results.review.push({ p, url: pick ? `${origin}/products/${pick.c.handle}` : null, why: `match found but thin stock ${pick ? pick.avail : 0}` }); continue; }

    const newUrl = `${origin}/products/${pick.c.handle}`;
    // re-verify composition off the live page, feed body_html as fallback
    let pageTxt = "";
    try { const r = await fetch(newUrl, { headers: UA, signal: AbortSignal.timeout(25000) }); if (r.ok) pageTxt = (await r.text()).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " "); } catch {}
    const cut = pageTxt.search(/customer reviews|you may (also )?like|recently viewed/i);
    const head = cut > 500 ? pageTxt.slice(0, cut) : pageTxt;
    const feedTxt = String(pick.c.body_html || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");
    const comp = parseComp(head) || parseComp(feedTxt);
    if (!comp) { results.review.push({ p, url: newUrl, why: "live URL found but no brand-stated composition to re-verify" }); continue; }

    const score = calcToxomeScore(frac(comp));
    const imgs = [];
    for (const u of (pick.c.images || []).map((i) => i.src)) {
      try { const r = await fetch(u, { method: "HEAD", signal: AbortSignal.timeout(12000) }); if (r.ok) imgs.push(u); } catch {}
      if (imgs.length >= 6) break;
    }
    if (imgs.length < 2) { results.review.push({ p, url: newUrl, why: `only ${imgs.length} loading image(s)` }); continue; }

    const price = Math.min(...pick.c.variants.filter((v) => v.available).map((v) => +v.price));
    const rec = { p, url: newUrl, title: pick.c.title, score, oldScore: p.toxome_score, comp, materials: materials(comp), price, imgs, avail: pick.avail };
    if (score !== p.toxome_score) results.review.push({ ...rec, why: `score changed ${p.toxome_score} -> ${score} (${materials(comp)})` });
    else if (score < 67) results.review.push({ ...rec, why: `score ${score} now fails the 67 bar` });
    else results.republish.push(rec);
  }

  console.log(`\n===== REPOINT + REPUBLISH (${results.republish.length}) =====`);
  results.republish.forEach((r) => console.log(`  ${r.p.brand} — ${r.p.item_name}\n     -> ${r.url}\n        $${r.price} · ${r.score} · ${r.materials} · ${r.avail} sizes · ${r.imgs.length} imgs`));
  console.log(`\n===== NEEDS A HUMAN (${results.review.length}) =====`);
  results.review.forEach((r) => console.log(`  ${r.p.brand} — ${r.p.item_name}\n     ${r.why}${r.url ? "\n     -> " + r.url : ""}`));
  console.log(`\n===== NO MATCH (${results.none.length}) =====`);
  results.none.forEach((r) => console.log(`  ${r.p.brand} — ${r.p.item_name}  [${r.why}]`));

  if (APPLY) {
    let n = 0;
    for (const r of results.republish) {
      const { error } = await sb.from("products").update({
        item_url: r.url, item_image: r.imgs[0], images: r.imgs.slice(0, 6),
        item_price: r.price, budget: r.price < 50 ? "$" : r.price <= 150 ? "$$" : "$$$",
        fabric_composition: frac(r.comp), materials_text: r.materials,
        toxome_score: r.score, risk_level: scoreToRiskLevel(r.score),
        published: true, unpublish_reason: null, reviewed_at: new Date().toISOString(),
      }).eq("id", r.p.id).eq("rejected", false);   // never resurrect a rejected row
      if (!error) n++; else console.log("  !!", r.p.item_name, error.message);
    }
    console.log(`\nRepointed + republished ${n}.`);
  }
  fs.writeFileSync("/tmp/repoint_result.json", JSON.stringify(results, null, 1));
})();
