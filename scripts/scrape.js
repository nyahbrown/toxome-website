/**
 * Toxome scrape helpers (CommonJS, reusable)
 *
 * Ports the proven page-fetch / Shopify / JSON-LD / image-harvest logic from
 * scripts/enrich-products.js and adds two guarantees the discovery agent and
 * the admin add-by-URL path both need:
 *
 *   - getValidatedProduct(url) only returns ok:true when the URL resolves to a
 *     SPECIFIC product page (not a brand homepage or a collection/category) AND
 *     at least one harvested image actually renders.
 *   - imageLoads(url) is the real test of whether the grid / review card will
 *     show the image: a browser-UA GET that must return an image content-type.
 */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MAX_IMAGES = 8;
const REFERER = "https://toxome.app/";

// ---------------------------------------------------------------------------
// Page fetch (follows redirects)
// ---------------------------------------------------------------------------
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    const html = await res.text().catch(() => "");
    return { status: res.status, html, finalUrl: res.url };
  } catch (e) {
    return { status: 0, error: e.message, html: "" };
  }
}

function extractJsonLd(html) {
  const out = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch {
      /* ignore malformed blocks */
    }
  }
  const flat = [];
  for (const j of out) {
    if (Array.isArray(j)) flat.push(...j);
    else if (j && j["@graph"]) flat.push(...j["@graph"]);
    else if (j) flat.push(j);
  }
  return flat;
}

function findProductLd(ldArr) {
  return ldArr.find((o) => {
    const t = o && o["@type"];
    return t === "Product" || (Array.isArray(t) && t.includes("Product"));
  });
}

/**
 * Pull authoritative price + stock from the product's offers.
 * Salesforce Commerce Cloud sites (Reformation, etc.) expose per-size offers
 * in JSON-LD with priceCurrency / price / availability; Shopify exposes
 * price (cents) + available on /products/{handle}.js.
 *
 * IMPORTANT (US-only sourcing): JSON-LD price is only trusted when the
 * currency is USD — this env/cron can geo-resolve to a EUR/GBP storefront,
 * and recording that price would be wrong. inStock is always returned.
 */
function extractOffer(prodLd, shopify) {
  if (shopify && typeof shopify.price !== "undefined") {
    const cents = Number(shopify.price);
    return {
      price: Number.isFinite(cents) ? Math.round(cents / 100) : null,
      currency: shopify.currency || null,
      inStock: typeof shopify.available === "boolean" ? shopify.available : null,
    };
  }
  if (prodLd && prodLd.offers) {
    const offers = Array.isArray(prodLd.offers) ? prodLd.offers : [prodLd.offers];
    if (!offers.length) return { price: null, currency: null, inStock: null };
    const currency = offers[0].priceCurrency || null;
    const prices = offers.map((o) => Number(o.price)).filter(Number.isFinite);
    const price = prices.length ? Math.min(...prices) : null;
    const inStock = offers.some((o) =>
      /InStock/i.test(String(o.availability || ""))
    );
    return { price: currency === "USD" ? price : null, currency, inStock };
  }
  return { price: null, currency: null, inStock: null };
}

/** Shopify exposes /products/{handle}.js — the most reliable source when present. */
async function shopifyProduct(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/products\/([^/?#]+)/);
    if (!m) return null;
    const res = await fetch(`${u.origin}/products/${m[1]}.js`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Image harvesting
// ---------------------------------------------------------------------------
function absolutize(src, base) {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

/**
 * Collect candidate image URLs from the Shopify images array, the JSON-LD
 * image field, and og:image; absolutize against the final URL, strip junk,
 * de-dupe (drop shopify size suffixes), cap at MAX_IMAGES.
 */
function harvestImages(page, shopify, prodLd, url) {
  const found = [];
  const base = (page && page.finalUrl) || url;
  const push = (s) => {
    // All sources here are authoritative product images (Shopify images,
    // JSON-LD image, og:image). Don't require a file extension — many CDNs
    // (e.g. Reformation's Cloudinary) serve extensionless image URLs. The
    // imageLoads() check validates the actual content-type later.
    const abs = s && absolutize(s, base);
    if (abs && /^https?:\/\//i.test(abs) && !/\.(svg|gif)(\?|$)/i.test(abs))
      found.push(abs);
  };
  if (shopify && Array.isArray(shopify.images)) shopify.images.forEach(push);
  if (prodLd && prodLd.image) {
    const imgs = Array.isArray(prodLd.image) ? prodLd.image : [prodLd.image];
    imgs.forEach((i) => push(typeof i === "string" ? i : i && i.url));
  }
  if (page && page.html) {
    const og =
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    let m;
    while ((m = og.exec(page.html))) push(m[1]);
  }
  const seen = new Set();
  const out = [];
  for (const f of found) {
    if (/logo|seal|warranty|badge|swatch|sprite|placeholder/i.test(f)) continue;
    const clean = f.split("?")[0];
    const keyUrl = clean.replace(/(_\d+x\d*|_\d+x)(?=\.)/i, "");
    if (!seen.has(keyUrl)) {
      seen.add(keyUrl);
      out.push(clean);
    }
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Image render test — the real check that a grid / review card can show it.
// ---------------------------------------------------------------------------
async function imageLoads(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: REFERER, Accept: "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    return ct.startsWith("image");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Composition + certification extraction (page-grounded, NOT model-guessed)
//
// The discovery agent must NEVER trust the LLM's fabric_composition or
// certifications — the model fabricates fibers and invents cert badges. These
// helpers pull both from the actual product page (Shopify body_html, JSON-LD
// description/material, then visible HTML as a fallback) so the score is real.
// ---------------------------------------------------------------------------
function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(html) {
  if (!html) return "";
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

// Known fiber words — a composition match only counts when the captured name
// contains one of these, so "20% off" / "100% cotton-free" style noise is ignored.
const FIBER_WORDS = [
  "linen", "flax", "cotton", "hemp", "wool", "cashmere", "alpaca", "mohair",
  "silk", "jute", "ramie", "tencel", "lyocell", "modal", "cupro", "viscose",
  "rayon", "bamboo", "acetate", "lenzing", "ecovero", "polyester", "nylon",
  "polyamide", "acrylic", "elastane", "spandex", "lycra", "polyurethane",
  "leather", "down", "modacrylic",
];
const FIBER_WORD_RE = new RegExp("\\b(" + FIBER_WORDS.join("|") + ")\\b", "i");

/**
 * Parse a "NN% fiber" composition out of free text. For each `NN%` token we look
 * a short window ahead for the first fiber word — robust to symbols between the
 * percent and the fiber (e.g. "100% European Flax® linen"). The window is kept
 * short so unrelated numbers ("10% off", "30%offDresses") match nothing. Only
 * the SHELL composition is kept (text is cut at the first lining/trim marker).
 * Returns a { fiberName: pct } object or null when nothing trustworthy is found.
 */
function parseComposition(text) {
  if (!text) return null;
  const main = decodeEntities(text).split(/lining|trim\s*:|contrast\s*:/i)[0];
  const pctRe = /(\d{1,3})\s*%/g;
  const comp = {};
  let m;
  let count = 0;
  while ((m = pctRe.exec(main)) && count < 10) {
    const pct = Number(m[1]);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) continue;
    const window = main.slice(m.index + m[0].length, m.index + m[0].length + 35);
    const fwMatch = window.match(FIBER_WORD_RE);
    if (!fwMatch) continue;
    const fw = fwMatch[0].toLowerCase();
    const before = window.slice(0, fwMatch.index + fw.length);
    let name = fw;
    if (fw === "flax") name = "linen";
    else if (fw === "cotton" && /organic/i.test(before)) name = "organic cotton";
    else if (fw === "elastane" || fw === "lycra") name = "spandex";
    else if (fw === "polyamide") name = "nylon";
    comp[name] = (comp[name] || 0) + pct;
    count++;
  }
  const keys = Object.keys(comp);
  if (!keys.length) return null;
  const sum = keys.reduce((s, k) => s + comp[k], 0);
  // Trust a clean total (~100). Otherwise only trust an unambiguous single 100%.
  if (sum >= 90 && sum <= 110) return comp;
  if (keys.length === 1 && comp[keys[0]] === 100) return comp;
  return null;
}

/**
 * Detect textile/ethical certifications actually named in the text. Conservative
 * by design — better to miss a real badge than invent one.
 */
function parseCertifications(text) {
  if (!text) return [];
  const t = decodeEntities(text).toLowerCase();
  const out = [];
  const add = (v) => { if (!out.includes(v)) out.push(v); };
  if (/oeko[\s-]?tex/.test(t)) add("OEKO-TEX Standard 100");
  if (/\bgots\b|global organic textile/.test(t)) add("GOTS");
  // ROC requires organic certification as its floor, so it's a recognized
  // chemical-safety cert (plus soil/welfare/fairness). Match the certified mark
  // only — bare "regenerative" is a practice claim, not this certification.
  if (/regenerative organic certified/.test(t) || (/\broc\b/.test(t) && /regenerativ|organic|cotton/.test(t)))
    add("Regenerative Organic Certified");
  if (/european\s*flax|masters of linen/.test(t)) add("European Flax");
  if (/bluesign/.test(t)) add("bluesign");
  if (/fair\s?trade|fairtrade/.test(t)) add("Fair Trade");
  if (/\bb\s?corp\b|certified b corporation/.test(t)) add("B Corp");
  if (/global recycled standard|\bgrs\b/.test(t)) add("GRS");
  if (/responsible wool|\brws\b/.test(t)) add("RWS");
  return out;
}

/**
 * Pull description-level text (where composition/certs are stated) from the
 * authoritative product sources, preferring structured fields over raw HTML.
 */
function productDescText(page, shopify, prodLd) {
  const parts = [];
  if (shopify && typeof shopify.body_html === "string") parts.push(stripTags(shopify.body_html));
  if (shopify && Array.isArray(shopify.tags)) parts.push(shopify.tags.join(" "));
  if (prodLd) {
    if (typeof prodLd.description === "string") parts.push(stripTags(prodLd.description));
    if (prodLd.material) {
      parts.push(typeof prodLd.material === "string" ? prodLd.material : JSON.stringify(prodLd.material));
    }
  }
  return parts.filter(Boolean).join("  •  ");
}

// ---------------------------------------------------------------------------
// Product-page heuristic
// ---------------------------------------------------------------------------
function ogTypeIsProduct(html) {
  if (!html) return false;
  const re =
    /<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i;
  const m = html.match(re);
  return !!m && /product/i.test(m[1]);
}

function pathLooksLikeProduct(pathname) {
  return /\/(products?|p|item|dp)\//i.test(pathname);
}

function pathLooksLikeNonProduct(pathname) {
  const p = pathname || "/";
  if (p === "/" || p === "") return true;
  if (/\/(collections|category)\//i.test(p)) return true;
  // /search (no product segment)
  if (/\/search(\/|$|\?)/i.test(p) && !pathLooksLikeProduct(p)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// getValidatedProduct — the guarantee
// ---------------------------------------------------------------------------
async function getValidatedProduct(url) {
  const page = await fetchPage(url);
  if (page.status === 0)
    return { ok: false, reason: `fetch failed: ${page.error || "unknown"}` };
  if (page.status === 404 || page.status === 410)
    return { ok: false, reason: `HTTP ${page.status}` };
  if (page.status >= 400)
    return { ok: false, reason: `HTTP ${page.status}` };

  const finalUrl = page.finalUrl || url;
  let finalPath = "/";
  try {
    finalPath = new URL(finalUrl).pathname;
  } catch {
    /* keep default */
  }

  const shopify = await shopifyProduct(finalUrl);
  const prodLd = findProductLd(extractJsonLd(page.html));

  // Determine whether this is a specific product page.
  const isShopifyProduct =
    shopify && (typeof shopify.id !== "undefined" || shopify.title || shopify.handle);
  const isLdProduct = !!prodLd;
  const isOgProduct = ogTypeIsProduct(page.html);
  const isPathProduct = pathLooksLikeProduct(finalPath);

  const looksLikeProduct =
    isShopifyProduct || isLdProduct || isOgProduct || isPathProduct;

  // Brand homepage / collection / category / bare search → not a product.
  if (pathLooksLikeNonProduct(finalPath) && !isPathProduct) {
    return { ok: false, reason: "not a product page" };
  }
  if (!looksLikeProduct) {
    return { ok: false, reason: "not a product page" };
  }

  // Harvest candidate images, then keep only the ones that actually render.
  const candidates = harvestImages(page, shopify, prodLd, finalUrl);
  const images = [];
  for (const img of candidates) {
    if (await imageLoads(img)) images.push(img);
    if (images.length >= MAX_IMAGES) break;
  }

  if (images.length < 1) {
    return { ok: false, reason: "no working product image found" };
  }

  const offer = extractOffer(prodLd, shopify);

  // Page-grounded composition + certs (NEVER the model's guess). Prefer the
  // structured description; fall back to visible page text for composition only
  // (its "NN% fiber" pattern is specific enough to scan the whole page safely).
  const descText = productDescText(page, shopify, prodLd);
  const pageText = stripTags(page.html).slice(0, 20000);
  const composition = parseComposition(descText) || parseComposition(pageText);
  // Certs scanned from the structured description first, then the page — these
  // marks rarely appear except where a brand actually claims them per-product.
  let certifications = parseCertifications(descText);
  if (!certifications.length) certifications = parseCertifications(pageText);

  return {
    ok: true,
    finalUrl,
    images,
    price: offer.price, // USD only (null if non-USD or unknown)
    currency: offer.currency,
    inStock: offer.inStock, // true/false/null
    composition, // { fiber: pct } scraped from the page, or null
    certifications, // [] scraped cert names — never model-supplied
    descText, // description/care text, fed to the scorer for floors/finishes
  };
}

module.exports = {
  fetchPage,
  shopifyProduct,
  extractJsonLd,
  findProductLd,
  extractOffer,
  harvestImages,
  imageLoads,
  getValidatedProduct,
  parseComposition,
  parseCertifications,
  productDescText,
  stripTags,
};
