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

  return { ok: true, finalUrl, images };
}

module.exports = {
  fetchPage,
  shopifyProduct,
  extractJsonLd,
  findProductLd,
  harvestImages,
  imageLoads,
  getValidatedProduct,
};
