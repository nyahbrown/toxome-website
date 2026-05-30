/**
 * Toxome Product Enrichment + Availability Pass
 *
 * Goes through products already in Supabase, checks that each one's external
 * link is still live and in stock, and for the live ones backfills the full
 * product-detail data (fabric breakdown, materials text, description, gallery
 * images, certifications) and recomputes the Toxome score.
 *
 * Decisions baked in (chosen by Nyah):
 *   - Dead link (404/410) or clearly sold out  -> published = false (row kept)
 *   - Ambiguous availability                   -> left published (we only
 *                                                 unpublish on a hard signal)
 *
 * Setup (same keys as scripts/agent.js):
 *   ANTHROPIC_API_KEY=...            (extraction; not needed for --check-only)
 *   SUPABASE_SERVICE_ROLE_KEY=...    (Supabase dashboard -> Project Settings -> API)
 *
 * Run:
 *   node scripts/enrich-products.js                # check + enrich all published
 *   node scripts/enrich-products.js --dry-run      # report only, no DB writes
 *   node scripts/enrich-products.js --check-only   # availability only, no Claude
 *   node scripts/enrich-products.js --only-missing # skip rows that already have a fabric breakdown
 *   node scripts/enrich-products.js --limit 10     # first N products
 *   node scripts/enrich-products.js --ids <uuid,uuid>
 *
 * Combine freely, e.g. a safe first look:
 *   node scripts/enrich-products.js --dry-run --limit 10
 */

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const MODEL = "claude-sonnet-4-6";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MAX_IMAGES = 8;
const REQUEST_DELAY_MS = 1200; // be polite to retailer sites + Anthropic

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const ARGV = process.argv.slice(2);
const FLAGS = {
  dryRun: ARGV.includes("--dry-run"),
  checkOnly: ARGV.includes("--check-only"),
  onlyMissing: ARGV.includes("--only-missing"),
  verbose: ARGV.includes("--verbose"),
  limit: intFlag("--limit"),
  ids: strFlag("--ids"),
  emitSql: strFlag("--emit-sql"), // write UPDATE statements to a .sql file instead of/with writing
};
const SQL_OUT = [];
function sqlLit(s) {
  return "$tox$" + String(s).replace(/\$tox\$/g, "") + "$tox$";
}
function sqlArr(arr) {
  return "ARRAY[" + arr.map(sqlLit).join(",") + "]::text[]";
}
function sqlJson(obj) {
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}
function intFlag(name) {
  const i = ARGV.indexOf(name);
  return i >= 0 && ARGV[i + 1] ? parseInt(ARGV[i + 1], 10) : null;
}
function strFlag(name) {
  const i = ARGV.indexOf(name);
  return i >= 0 && ARGV[i + 1] ? ARGV[i + 1] : null;
}

// ---------------------------------------------------------------------------
// Toxome scoring — shared with agent.js (mirror in lib/fabricScores.ts)
// ---------------------------------------------------------------------------
const { fabricScore, calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

/** Normalize a {fabric: percentage} map (any scale) to fractions summing to ~1. */
function toFractions(comp) {
  if (!comp || typeof comp !== "object") return null;
  const entries = Object.entries(comp)
    .map(([k, v]) => [String(k).toLowerCase().trim(), Number(v)])
    .filter(([k, v]) => k && Number.isFinite(v) && v > 0);
  if (entries.length === 0) return null;
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  const out = {};
  for (const [k, v] of entries) out[k] = Math.round((v / sum) * 1000) / 1000;
  return out;
}

// ---------------------------------------------------------------------------
// Page fetch + availability detection (no API cost)
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

function availabilityFromLd(prod) {
  if (!prod || !prod.offers) return null;
  const offers = Array.isArray(prod.offers) ? prod.offers : [prod.offers];
  const avails = offers.map((o) => String(o.availability || "").toLowerCase());
  if (avails.some((a) => /instock|preorder|backorder|limitedavailability/.test(a)))
    return "in_stock";
  if (avails.length && avails.every((a) => /outofstock|soldout|discontinued/.test(a)))
    return "out_of_stock";
  return null;
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
    if (typeof data.available !== "boolean") return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Returns { state, reason, page, shopify, prodLd }
 * state ∈ dead | out_of_stock | in_stock | unknown | error
 */
async function checkAvailability(url) {
  const page = await fetchPage(url);
  if (page.status === 404 || page.status === 410)
    return { state: "dead", reason: `HTTP ${page.status}`, page };
  if (page.status === 0)
    return { state: "error", reason: `fetch failed: ${page.error}`, page };
  // 403/429/5xx are usually bot-blocks or transient — never unpublish on those.
  if (page.status >= 400)
    return { state: "error", reason: `HTTP ${page.status}`, page };

  const shopify = await shopifyProduct(url);
  if (shopify && shopify.available === false)
    return { state: "out_of_stock", reason: "shopify available=false", page, shopify };

  const prodLd = findProductLd(extractJsonLd(page.html));
  const ldState = availabilityFromLd(prodLd);
  if (ldState === "out_of_stock")
    return { state: "out_of_stock", reason: "JSON-LD OutOfStock", page, prodLd, shopify };

  if (shopify && shopify.available === true)
    return { state: "in_stock", reason: "shopify available=true", page, shopify, prodLd };
  if (ldState === "in_stock")
    return { state: "in_stock", reason: "JSON-LD InStock", page, prodLd, shopify };

  return { state: "unknown", reason: "no hard signal", page, prodLd, shopify };
}

// ---------------------------------------------------------------------------
// Image + text harvesting (programmatic, fed to Claude as hints)
// ---------------------------------------------------------------------------
function absolutize(src, base) {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function harvestImages(check, url) {
  const found = [];
  const push = (s) => {
    const abs = s && absolutize(s, check.page.finalUrl || url);
    if (abs && /\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(abs)) found.push(abs);
  };
  if (check.shopify && Array.isArray(check.shopify.images))
    check.shopify.images.forEach(push);
  if (check.prodLd && check.prodLd.image) {
    const imgs = Array.isArray(check.prodLd.image)
      ? check.prodLd.image
      : [check.prodLd.image];
    imgs.forEach((i) => push(typeof i === "string" ? i : i && i.url));
  }
  const og = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  let m;
  while ((m = og.exec(check.page.html))) push(m[1]);
  // de-dupe, strip shopify size suffixes so we don't keep 5 sizes of one photo
  const seen = new Set();
  const out = [];
  for (let f of found) {
    const keyUrl = f.replace(/(_\d+x\d*|_\d+x)(?=\.)/i, "").split("?")[0];
    if (!seen.has(keyUrl)) {
      seen.add(keyUrl);
      out.push(f.split("?")[0]);
    }
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Claude extraction
// ---------------------------------------------------------------------------
const EXTRACT_TOOL = {
  name: "save_product_details",
  description: "Save the product detail fields extracted from the page.",
  input_schema: {
    type: "object",
    properties: {
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
          "Textile/ethical certifications explicitly mentioned (e.g. 'GOTS', 'OEKO-TEX Standard 100', 'Fair Trade', 'bluesign'). [] if none.",
      },
      composition_stated: {
        type: "boolean",
        description:
          "true only if fabric_composition came from an explicit composition statement on the page (not guessed).",
      },
    },
    required: [
      "fabric_composition",
      "materials_text",
      "description",
      "certifications",
      "composition_stated",
    ],
  },
};

async function extractWithClaude(client, product, check) {
  const sourceText =
    (check.shopify && check.shopify.body_html
      ? "PRODUCT DESCRIPTION HTML:\n" + cleanText(check.shopify.body_html) + "\n\n"
      : "") +
    "PAGE TEXT:\n" +
    cleanText(check.page.html).slice(0, 16000);

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "save_product_details" },
    messages: [
      {
        role: "user",
        content:
          `Extract clean-clothing detail fields for this product. Only use facts present in the page content; do not invent a fabric composition.\n\n` +
          `Brand: ${product.brand}\nProduct: ${product.item_name}\nURL: ${
            product.item_url || product.affiliate_url
          }\n\n${sourceText}`,
      },
    ],
  });

  const block = resp.content.find(
    (b) => b.type === "tool_use" && b.name === "save_product_details"
  );
  return block ? block.input : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !FLAGS.checkOnly) {
    console.error("Missing ANTHROPIC_API_KEY (required unless --check-only)");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, serviceKey);
  const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

  let query = supabase
    .from("products")
    .select(
      "id, brand, item_name, item_url, affiliate_url, fabric_composition, published"
    )
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (FLAGS.ids) query = query.in("id", FLAGS.ids.split(",").map((s) => s.trim()));
  if (FLAGS.limit) query = query.limit(FLAGS.limit);

  const { data: products, error } = await query;
  if (error) {
    console.error("Failed to load products:", error.message);
    process.exit(1);
  }

  console.log(
    `Loaded ${products.length} published products.` +
      (FLAGS.dryRun ? "  [DRY RUN — no writes]" : "") +
      (FLAGS.checkOnly ? "  [CHECK ONLY]" : "") +
      (FLAGS.onlyMissing ? "  [ONLY MISSING]" : "")
  );

  const stats = {
    checked: 0,
    inStock: 0,
    unknownKept: 0,
    unpublishedDead: 0,
    unpublishedSoldOut: 0,
    enriched: 0,
    enrichSkipped: 0,
    errors: 0,
  };

  for (const p of products) {
    const url = p.item_url || p.affiliate_url;
    if (!url) {
      console.log(`- ${p.brand} / ${p.item_name}: no URL, skipping`);
      continue;
    }
    stats.checked++;
    const label = `${p.brand} / ${p.item_name}`;

    let check;
    try {
      check = await checkAvailability(url);
    } catch (e) {
      stats.errors++;
      console.log(`✗ ${label}: check error — ${e.message}`);
      await sleep();
      continue;
    }

    // --- unpublish dead / sold out -----------------------------------------
    if (check.state === "dead" || check.state === "out_of_stock") {
      const key = check.state === "dead" ? "unpublishedDead" : "unpublishedSoldOut";
      const reason = check.state === "dead" ? "dead" : "sold_out";
      stats[key]++;
      console.log(`⊘ ${label}: ${check.state} (${check.reason}) → unpublish`);
      if (FLAGS.emitSql)
        SQL_OUT.push(
          `UPDATE products SET published=false, unpublish_reason='${reason}' WHERE id='${p.id}'; -- ${check.state}: ${label}`
        );
      if (!FLAGS.dryRun) {
        const { error: uerr } = await supabase
          .from("products")
          .update({ published: false, unpublish_reason: reason })
          .eq("id", p.id);
        if (uerr) console.log(`   ! update failed: ${uerr.message}`);
      }
      await sleep();
      continue;
    }

    if (check.state === "error") {
      stats.errors++;
      console.log(`? ${label}: ${check.reason} → left as-is (kept published)`);
      await sleep();
      continue;
    }

    if (check.state === "in_stock") stats.inStock++;
    else stats.unknownKept++;

    // --- enrich -------------------------------------------------------------
    if (FLAGS.checkOnly) {
      console.log(`✓ ${label}: ${check.state}`);
      await sleep();
      continue;
    }
    if (FLAGS.onlyMissing && p.fabric_composition) {
      stats.enrichSkipped++;
      console.log(`✓ ${label}: ${check.state} (already has breakdown, skip)`);
      await sleep();
      continue;
    }

    let details;
    try {
      details = await extractWithClaude(anthropic, p, check);
    } catch (e) {
      stats.errors++;
      console.log(`✗ ${label}: extract error — ${e.message}`);
      await sleep();
      continue;
    }
    if (!details) {
      stats.errors++;
      console.log(`✗ ${label}: no extraction returned`);
      await sleep();
      continue;
    }

    // Strip logos / brand marks that thin (JS-rendered) pages return as the
    // only "image", and drop descriptions that are really "no data found"
    // notes — applying those would make the detail page worse, not better.
    const images = harvestImages(check, url).filter(
      (u) => !/logo|_logo|sprite|placeholder/i.test(u)
    );
    const JUNK_DESC =
      /no (further |product-specific |additional )?(description|information|fabric|composition|details?)[^.]{0,40}(present|found|available|provided)|not (present|found|available|provided|specified)|page content/i;
    if (details.description && JUNK_DESC.test(details.description))
      details.description = null;
    if (details.materials_text && JUNK_DESC.test(details.materials_text))
      details.materials_text = null;

    const composition = details.composition_stated
      ? toFractions(details.fabric_composition)
      : null;

    // Build a patch that only overwrites fields we actually obtained, so a
    // thin page never wipes good existing data.
    const patch = {};
    if (composition) {
      patch.fabric_composition = composition;
      const score = calcToxomeScore(composition);
      patch.toxome_score = score;
      patch.risk_level = scoreToRiskLevel(score);
    }
    if (details.materials_text) patch.materials_text = details.materials_text;
    if (details.description) patch.description = details.description;
    if (Array.isArray(details.certifications) && details.certifications.length)
      patch.certifications = details.certifications;
    if (images.length) patch.images = images;

    if (Object.keys(patch).length === 0) {
      stats.enrichSkipped++;
      console.log(`✓ ${label}: ${check.state}, nothing new to add`);
      await sleep();
      continue;
    }

    stats.enriched++;
    const summary = [
      composition ? `fabric(${Object.keys(composition).length})` : null,
      patch.materials_text ? "materials" : null,
      patch.description ? "desc" : null,
      patch.certifications ? `certs(${patch.certifications.length})` : null,
      patch.images ? `img(${patch.images.length})` : null,
    ]
      .filter(Boolean)
      .join(", ");
    console.log(`✓ ${label}: ${check.state} → ${summary}`);
    if (FLAGS.verbose) console.log("   " + JSON.stringify(patch));

    if (FLAGS.emitSql) {
      const sets = [];
      if (patch.fabric_composition !== undefined)
        sets.push(`fabric_composition=${sqlJson(patch.fabric_composition)}`);
      if (patch.toxome_score !== undefined)
        sets.push(`toxome_score=${patch.toxome_score}`);
      if (patch.risk_level !== undefined)
        sets.push(`risk_level=${sqlLit(patch.risk_level)}`);
      if (patch.materials_text !== undefined)
        sets.push(`materials_text=${sqlLit(patch.materials_text)}`);
      if (patch.description !== undefined)
        sets.push(`description=${sqlLit(patch.description)}`);
      if (patch.certifications !== undefined)
        sets.push(`certifications=${sqlArr(patch.certifications)}`);
      if (patch.images !== undefined) sets.push(`images=${sqlArr(patch.images)}`);
      if (sets.length)
        SQL_OUT.push(
          `UPDATE products SET ${sets.join(", ")} WHERE id='${p.id}'; -- ${label}`
        );
    }

    if (!FLAGS.dryRun) {
      const { error: perr } = await supabase
        .from("products")
        .update(patch)
        .eq("id", p.id);
      if (perr) console.log(`   ! update failed: ${perr.message}`);
    }
    await sleep();
  }

  console.log("\n=== Summary ===");
  console.table(stats);
  if (FLAGS.dryRun) console.log("DRY RUN — no database changes were made.");

  if (FLAGS.emitSql && SQL_OUT.length) {
    require("fs").writeFileSync(FLAGS.emitSql, SQL_OUT.join("\n") + "\n");
    console.log(`Wrote ${SQL_OUT.length} SQL statements to ${FLAGS.emitSql}`);
  }
}

function sleep() {
  return new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
