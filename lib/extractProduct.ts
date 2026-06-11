// Server-only product extraction from a retailer URL.
// Ports the relevant parts of scripts/enrich-products.js to TypeScript: fetch
// the page (+ Shopify JSON + JSON-LD), harvest images programmatically, then
// ask Claude for the structured fields with a single forced tool call.
// NEVER import this into a client component, it uses the Anthropic API key.
import Anthropic from "@anthropic-ai/sdk";
import { calcToxomeScore, scoreToRiskLevel } from "@/lib/fabricScores";

// Haiku is fast and plenty for structured extraction from text we hand it, // keeps the add-by-URL request well under the serverless timeout.
const MODEL = "claude-haiku-4-5-20251001";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MAX_IMAGES = 8;

const CATEGORIES = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Activewear",
  "Loungewear",
  "Footwear",
  "Accessories",
] as const;

export type ProductDraft = {
  item_name: string;
  brand: string;
  item_price: number | null;
  budget: string | null;
  category: string | null;
  gender: string | null;
  item_image: string | null;
  images: string[];
  item_url: string;
  fabric_composition: Record<string, number> | null;
  materials_text: string | null;
  description: string | null;
  certifications: string[];
  toxome_score: number | null;
  risk_level: "low" | "moderate" | "high" | null;
};

type PageFetch = {
  status: number;
  html: string;
  finalUrl?: string;
  error?: string;
};

type ShopifyProduct = {
  body_html?: string;
  images?: string[];
  [k: string]: unknown;
};

type ProductLd = {
  image?: unknown;
  [k: string]: unknown;
};

// ---------------------------------------------------------------------------
// Page fetch + structured-source parsing
// ---------------------------------------------------------------------------
async function fetchPage(url: string): Promise<PageFetch> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text().catch(() => "");
    return { status: res.status, html, finalUrl: res.url };
  } catch (e) {
    return { status: 0, error: (e as Error).message, html: "" };
  }
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const out: unknown[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch {
      /* ignore malformed blocks */
    }
  }
  const flat: Record<string, unknown>[] = [];
  for (const j of out) {
    if (Array.isArray(j)) flat.push(...(j as Record<string, unknown>[]));
    else if (j && (j as Record<string, unknown>)["@graph"])
      flat.push(
        ...((j as Record<string, unknown>)["@graph"] as Record<string, unknown>[])
      );
    else if (j) flat.push(j as Record<string, unknown>);
  }
  return flat;
}

function findProductLd(ldArr: Record<string, unknown>[]): ProductLd | undefined {
  return ldArr.find((o) => {
    const t = o && o["@type"];
    return t === "Product" || (Array.isArray(t) && t.includes("Product"));
  }) as ProductLd | undefined;
}

/** Shopify exposes /products/{handle}.js, the most reliable source when present. */
async function shopifyProduct(url: string): Promise<ShopifyProduct | null> {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/products\/([^/?#]+)/);
    if (!m) return null;
    const res = await fetch(`${u.origin}/products/${m[1]}.js`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ShopifyProduct;
    return data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Image + text harvesting
// ---------------------------------------------------------------------------
function absolutize(src: string, base: string): string | null {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function harvestImages(
  page: PageFetch,
  shopify: ShopifyProduct | null,
  prodLd: ProductLd | undefined,
  url: string
): string[] {
  const found: string[] = [];
  const base = page.finalUrl || url;
  const push = (s?: string | null) => {
    // Authoritative sources (Shopify images, JSON-LD image, og:image), don't
    // require a file extension; many CDNs serve extensionless image URLs.
    // imageLoads() validates the content-type later.
    const abs = s && absolutize(s, base);
    if (abs && /^https?:\/\//i.test(abs) && !/\.(svg|gif)(\?|$)/i.test(abs))
      found.push(abs);
  };
  if (shopify && Array.isArray(shopify.images)) shopify.images.forEach(push);
  if (prodLd && prodLd.image) {
    const imgs = Array.isArray(prodLd.image) ? prodLd.image : [prodLd.image];
    imgs.forEach((i) =>
      push(typeof i === "string" ? i : (i as { url?: string })?.url)
    );
  }
  // og:image
  const og =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = og.exec(page.html))) push(m[1]);

  // Strip logos / seals / badges / swatches, then de-dupe (drop shopify size
  // suffixes so we don't keep 5 sizes of one photo), cap at MAX_IMAGES.
  const seen = new Set<string>();
  const out: string[] = [];
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
// Product-page + image-render guarantees (mirror of scripts/scrape.js)
// ---------------------------------------------------------------------------
const REFERER = "https://toxome.app/";

/** The real test of whether the grid / review card will render an image. */
async function imageLoads(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: REFERER, Accept: "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    return ct.startsWith("image");
  } catch {
    return false;
  }
}

function ogTypeIsProduct(html: string): boolean {
  if (!html) return false;
  const m = html.match(
    /<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i
  );
  return !!m && /product/i.test(m[1]);
}

function pathLooksLikeProduct(pathname: string): boolean {
  return /\/(products?|p|item|dp)\//i.test(pathname);
}

function pathLooksLikeNonProduct(pathname: string): boolean {
  const p = pathname || "/";
  if (p === "/" || p === "") return true;
  if (/\/(collections|category)\//i.test(p)) return true;
  if (/\/search(\/|$|\?)/i.test(p) && !pathLooksLikeProduct(p)) return true;
  return false;
}

function isProductPage(
  finalUrl: string,
  html: string,
  shopify: ShopifyProduct | null,
  prodLd: ProductLd | undefined
): boolean {
  let finalPath = "/";
  try {
    finalPath = new URL(finalUrl).pathname;
  } catch {
    /* keep default */
  }
  const isPathProduct = pathLooksLikeProduct(finalPath);
  if (pathLooksLikeNonProduct(finalPath) && !isPathProduct) return false;
  const isShopifyProduct =
    !!shopify &&
    (typeof (shopify as { id?: unknown }).id !== "undefined" ||
      !!(shopify as { title?: unknown }).title ||
      !!(shopify as { handle?: unknown }).handle);
  return isShopifyProduct || !!prodLd || ogTypeIsProduct(html) || isPathProduct;
}

function cleanText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize a {fabric: percentage} map (any scale) to fractions summing to ~1. */
function toFractions(
  comp: Record<string, number> | null | undefined
): Record<string, number> | null {
  if (!comp || typeof comp !== "object") return null;
  const entries = Object.entries(comp)
    .map(([k, v]) => [String(k).toLowerCase().trim(), Number(v)] as const)
    .filter(([k, v]) => k && Number.isFinite(v) && v > 0);
  if (entries.length === 0) return null;
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  const out: Record<string, number> = {};
  for (const [k, v] of entries) out[k] = Math.round((v / sum) * 1000) / 1000;
  return out;
}

function budgetFromPrice(price: number | null): string | null {
  if (price == null || !Number.isFinite(price)) return null;
  if (price < 50) return "$";
  if (price <= 150) return "$$";
  return "$$$";
}

// ---------------------------------------------------------------------------
// Claude extraction
// ---------------------------------------------------------------------------
const EXTRACT_TOOL: Anthropic.Tool = {
  name: "save_product",
  description: "Save the structured product fields extracted from the page.",
  input_schema: {
    type: "object",
    properties: {
      item_name: {
        type: "string",
        description: "The product's name/title. Empty string if not found.",
      },
      brand: {
        type: "string",
        description: "The brand or label that makes the product. Empty string if not found.",
      },
      item_price: {
        type: ["number", "null"],
        description: "Current price as a number in USD (no currency symbol). null if not found.",
      },
      category: {
        type: ["string", "null"],
        description:
          "One of: Tops, Bottoms, Dresses, Outerwear, Activewear, Loungewear, Footwear, Accessories. Pick the best fit. null if unclear.",
        enum: [...CATEGORIES, null],
      },
      gender: {
        type: ["string", "null"],
        description: "One of Women, Men, Unisex. null if unclear.",
        enum: ["Women", "Men", "Unisex", null],
      },
      fabric_composition: {
        type: "object",
        description:
          "Map of fabric name (lowercase, e.g. 'organic cotton', 'tencel', 'elastane') to its PERCENTAGE as a number 0-100. Use only fabrics explicitly stated on the page. {} if the page does not state a composition.",
        additionalProperties: { type: "number" },
      },
      materials_text: {
        type: ["string", "null"],
        description:
          "The brand's own wording about the fabric / material & care, lightly cleaned. null if the page has none.",
      },
      description: {
        type: ["string", "null"],
        description:
          "A concise 1-3 sentence plain-language description of the product. null if none.",
      },
      certifications: {
        type: "array",
        items: { type: "string" },
        description:
          "Textile/ethical certifications explicitly mentioned (e.g. 'GOTS', 'OEKO-TEX Standard 100', 'Regenerative Organic Certified', 'Fair Trade', 'bluesign'). [] if none.",
      },
    },
    required: [
      "item_name",
      "brand",
      "item_price",
      "category",
      "gender",
      "fabric_composition",
      "materials_text",
      "description",
      "certifications",
    ],
  },
};

type ExtractedFields = {
  item_name: string;
  brand: string;
  item_price: number | null;
  category: string | null;
  gender: string | null;
  fabric_composition: Record<string, number>;
  materials_text: string | null;
  description: string | null;
  certifications: string[];
};

async function extractWithClaude(
  client: Anthropic,
  url: string,
  page: PageFetch,
  shopify: ShopifyProduct | null
): Promise<ExtractedFields | null> {
  const sourceText =
    (shopify && shopify.body_html
      ? "PRODUCT DESCRIPTION HTML:\n" + cleanText(shopify.body_html) + "\n\n"
      : "") +
    "PAGE TEXT:\n" +
    cleanText(page.html).slice(0, 16000);

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "save_product" },
    messages: [
      {
        role: "user",
        content:
          `Extract clean-clothing product fields from this page. Only use facts present in the page content; do not invent a fabric composition.\n\n` +
          `URL: ${url}\n\n${sourceText}`,
      },
    ],
  });

  const block = resp.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === "save_product"
  );
  return block ? (block.input as ExtractedFields) : null;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export async function extractProductFromUrl(
  url: string
): Promise<{ ok: boolean; product?: ProductDraft; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Server is missing ANTHROPIC_API_KEY" };

  const page = await fetchPage(url);
  if (page.status === 0)
    return { ok: false, error: `Could not fetch the page: ${page.error}` };
  if (page.status >= 400)
    return { ok: false, error: `The page returned HTTP ${page.status}` };
  if (!page.html)
    return { ok: false, error: "The page returned no content" };

  const finalUrl = page.finalUrl || url;
  const shopify = await shopifyProduct(finalUrl);
  const prodLd = findProductLd(extractJsonLd(page.html));

  // Guarantee a specific product page (not a homepage / collection / category).
  if (!isProductPage(finalUrl, page.html, shopify, prodLd)) {
    return { ok: false, error: "Not a specific product page" };
  }

  // Run the (slow) Claude extraction and the image-render checks concurrently,
  // and validate the image candidates in parallel, sequential image checks
  // alone were ~12s and blew the serverless timeout (504). Cap candidates so
  // one slow CDN can't dominate.
  const client = new Anthropic({ apiKey });
  const candidateImages = harvestImages(page, shopify, prodLd, finalUrl).slice(
    0,
    4
  );
  const [fields, images] = await Promise.all([
    extractWithClaude(client, url, page, shopify).catch((e) => {
      console.error("extractWithClaude failed:", (e as Error).message);
      return null;
    }),
    Promise.all(
      candidateImages.map(async (img) => ((await imageLoads(img)) ? img : null))
    ).then((res) => res.filter((x): x is string => !!x).slice(0, MAX_IMAGES)),
  ]);

  if (!fields || !fields.item_name?.trim() || !fields.brand?.trim()) {
    return {
      ok: false,
      error: "Could not read a product name and brand from this page",
    };
  }
  if (images.length < 1) {
    return { ok: false, error: "No working product image found" };
  }

  const composition = toFractions(fields.fabric_composition);
  const score = calcToxomeScore(composition);
  const price =
    typeof fields.item_price === "number" && Number.isFinite(fields.item_price)
      ? fields.item_price
      : null;

  const category =
    fields.category && (CATEGORIES as readonly string[]).includes(fields.category)
      ? fields.category
      : null;
  const gender =
    fields.gender && ["Women", "Men", "Unisex"].includes(fields.gender)
      ? fields.gender
      : null;

  const product: ProductDraft = {
    item_name: fields.item_name.trim(),
    brand: fields.brand.trim(),
    item_price: price,
    budget: budgetFromPrice(price),
    category,
    gender,
    item_image: images[0] ?? null,
    images,
    item_url: finalUrl,
    fabric_composition: composition,
    materials_text: fields.materials_text || null,
    description: fields.description || null,
    certifications: Array.isArray(fields.certifications)
      ? fields.certifications.filter(Boolean)
      : [],
    toxome_score: score,
    risk_level: scoreToRiskLevel(score),
  };

  return { ok: true, product };
}
