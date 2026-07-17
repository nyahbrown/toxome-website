/**
 * Toxome Shop Discovery Agent
 * Finds NEW clean-clothing products and adds them to Supabase as drafts.
 *
 * Strategy (set with Nyah):
 *   1. Read the brands already in the catalog, then ask Claude to find adjacent
 *      brands we DON'T yet carry that fit the same world (natural / low-tox
 *      fibers, elevated-casual, comparable price).
 *   2. Only add LOW-RISK products — Toxome score <= 33 (mostly natural fibers).
 *   3. PRIORITIZE brands & products with recognized certifications (GOTS,
 *      OEKO-TEX, Fair Trade, bluesign, B Corp) but don't strictly require them.
 *   4. Insert as published=false (drafts) — you approve in Supabase, then flip
 *      published=true. Run scripts/enrich-products.js afterwards to backfill the
 *      full material breakdown / images on the ones you keep.
 *
 * Setup:
 *   ANTHROPIC_API_KEY=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Run:
 *   node --env-file=.env.local scripts/agent.js
 *   node --env-file=.env.local scripts/agent.js --dry-run --brands 4 --per-brand 3
 *   node --env-file=.env.local scripts/agent.js --min-score 80   # stricter fibers (higher = cleaner)
 *
 * Model + cost guard:
 *   Defaults to the cheaper Haiku model (these are drafts you review before
 *   publishing). Override with --model claude-sonnet-4-6 (or CLAUDE_MODEL=...)
 *   on a run where you want Sonnet quality.
 *   A per-run guard caps spend: --max-brands (8), --max-model-calls (40),
 *   --web-max-uses (3). The run stops cleanly once the model-call ceiling hits.
 *
 * Schedule (GitHub Actions cron — see .github/workflows/shop-agent.yml).
 */

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct } = require("./scrape");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const ARGV = process.argv.slice(2);
const FLAGS = {
  dryRun: ARGV.includes("--dry-run"),
  brands: intFlag("--brands") ?? 6, // how many new similar brands to source per run
  perBrand: intFlag("--per-brand") ?? 3, // products to try per brand
  minScore: intFlag("--min-score") ?? 67, // fiber bar: only keep Toxome score >= this (higher = cleaner)
  include: strFlag("--include"), // comma-separated exact brands to source from (skips auto-suggest)
  category: strFlag("--category"), // force a category on every inserted item (e.g. "Other" for home goods)
  requireCert: ARGV.includes("--require-cert"), // SAFETY GATE (used for Kids): only keep items whose PAGE-VERIFIED certs include a chemical-safety cert (OEKO-TEX or GOTS). No cert → dropped.
  gender: strFlag("--gender"), // force a gender/department on every inserted item (e.g. "Kids")
  ageBand: strFlag("--age-band"), // force an age_band on every inserted item (kids: "baby" | "kids")
  focus: strFlag("--focus"), // narrow the per-brand search to one product type (e.g. "socks") so it doesn't wander into general apparel
};

// A real chemical-safety certification — the only marks that certify the textile
// is tested free of harmful substances. Ethics/welfare marks (RWS, Fair Trade,
// B Corp, bluesign) do NOT count for the Kids safety gate.
function hasSafetyCert(certs) {
  return Array.isArray(certs) && certs.some((c) => /oeko|gots/i.test(String(c)));
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
// Model + run guard
// ---------------------------------------------------------------------------
// Default to the cheaper Haiku model. These are drafts you review before
// publishing, so Haiku is fine here; override with --model or CLAUDE_MODEL=...
// on a run where you want Sonnet quality.
const MODEL =
  strFlag("--model") || process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

// Run guard — hard ceilings so one run (especially while debugging) can't
// spiral through API credits. All tunable, with deliberately low defaults.
const GUARD = {
  maxBrands: intFlag("--max-brands") ?? 8, // never source more than this many brands per run
  webMaxUses: intFlag("--web-max-uses") ?? 3, // web searches per product lookup (was 5)
  maxModelCalls: intFlag("--max-model-calls") ?? 40, // hard ceiling on total Anthropic calls per run
};
let modelCalls = 0;
// Call immediately BEFORE every Anthropic request. Returns false (and logs)
// once the per-run ceiling is hit, so callers stop instead of spending more.
function reserveModelCall() {
  if (modelCalls >= GUARD.maxModelCalls) {
    console.error(
      `\n⚠  Run guard tripped: reached ${GUARD.maxModelCalls} Anthropic calls this run — ` +
        `stopping to protect credits.\n   Raise with --max-model-calls N if that was intentional.\n`
    );
    return false;
  }
  modelCalls++;
  return true;
}

// ---------------------------------------------------------------------------
// Toxome scoring — shared with enrich-products.js (mirror in lib/fabricScores.ts)
// ---------------------------------------------------------------------------
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");
// Last-mile category/department corrector (mirror in lib/categoryGuard.ts).
const { guardCategory } = require("./categoryGuard");

// Brands Toxome will never source (shared with the admin add-by-URL feature).
const BRAND_BLACKLIST = require("../lib/brandBlacklist.json").map((b) =>
  b.toLowerCase().trim()
);
function isBlacklisted(brand) {
  if (!brand) return false;
  const b = String(brand).toLowerCase().trim();
  return BRAND_BLACKLIST.some((x) => b.includes(x));
}

// Normalize a brand name the SAME way the app does (app/api/admin/brand-submissions):
// lowercase → collapse non-alphanumeric runs to a single space → trim.
function normalizeBrand(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Register a brand in the directory (`brands` table) so any newly-sourced brand
// shows up in the app's brand picker + B2B directory. Idempotent via the unique
// `normalized` index — existing brands are left untouched. Never throws into the
// main loop.
async function ensureBrandInDirectory(supabase, brandName, website) {
  const normalized = normalizeBrand(brandName);
  if (!normalized) return;
  try {
    const { error } = await supabase.from("brands").upsert(
      { name: String(brandName).trim(), normalized, website: website || null, status: "active" },
      { onConflict: "normalized", ignoreDuplicates: true }
    );
    if (error) console.warn(`  ⚠ brand-directory upsert failed for ${brandName}: ${error.message}`);
  } catch (e) {
    console.warn(`  ⚠ brand-directory upsert error for ${brandName}: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Step 1 — suggest brands similar to the existing catalog
// ---------------------------------------------------------------------------
// Pull a JSON array of {brand,...} objects out of a model response that may
// wrap it in prose or markdown fences. Tries the longest bracketed span first,
// then a fenced block.
function parseBrandArray(text) {
  const candidates = [];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1]);
  // all top-level [ ... ] spans, longest first
  const spans = text.match(/\[[\s\S]*\]/g) || [];
  spans.sort((a, b) => b.length - a.length);
  candidates.push(...spans);
  for (const c of candidates) {
    try {
      const arr = JSON.parse(c);
      if (Array.isArray(arr) && arr.some((x) => x && (x.brand || x.item_name)))
        return arr;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function suggestSimilarBrands(client, existingBrands, count) {
  const existingLower = new Set(existingBrands.map((b) => b.toLowerCase().trim()));
  const userPrompt = `These brands are ALREADY in our catalog:\n${existingBrands.join(
    ", "
  )}\n\nNEVER suggest these blacklisted brands: ${
    BRAND_BLACKLIST.join(", ") || "(none)"
  }.\n\nSuggest ${count} DIFFERENT brands we do NOT already carry that fit the same world: natural / low-tox fibers, elevated-casual, comparable price and values. Anchor on the AESTHETIC of brands like Sézane, DÔEN, Brandy Melville, and Buck Mason — elevated-feminine, coastal, vintage-Americana, trend-aware but timeless — and find clean-fiber brands with that look and customer. Favor brands in the mid-range / accessible-premium price band (most pieces roughly $50–$150), not ultra-budget fast fashion or high-luxury labels. Strongly prioritize brands that hold recognized certifications (GOTS, OEKO-TEX, Fair Trade, bluesign, B Corp). Use your knowledge of the clean-fashion brand landscape. Respond with ONLY the JSON array (no prose, no markdown fences):\n[{"brand":"...","certifications":["GOTS"],"note":"why it fits"}]`;

  // The web-search step sometimes makes the final message non-JSON; retry.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!reserveModelCall()) break;
    let resp;
    try {
      // No web_search here: it occasionally leaves the final message with no
      // JSON. The model already knows the clean-fashion brand landscape; the
      // per-brand product search (which DOES use web_search) validates each
      // brand by finding (or not finding) real current products.
      resp = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: `You curate brands for Toxome, a clean-clothing platform. Toxome only features clothing made from natural / low-toxin fibers (organic cotton, linen, hemp, wool, alpaca, silk, Tencel/lyocell) and avoids synthetic-heavy fast fashion. The aesthetic is elevated-casual and sustainability-minded. Always respond with ONLY the requested JSON array.`,
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (err) {
      console.error(`  Brand suggestion error (attempt ${attempt + 1}):`, err.message);
      continue;
    }
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const arr = parseBrandArray(text);
    if (arr) {
      const filtered = arr.filter(
        (b) =>
          b &&
          b.brand &&
          !existingLower.has(b.brand.toLowerCase().trim()) &&
          !isBlacklisted(b.brand)
      );
      if (filtered.length) return filtered;
    }
    console.warn(`  Brand suggestion returned no parseable list (attempt ${attempt + 1}), retrying...`);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Step 2 — find low-risk products for a brand
// ---------------------------------------------------------------------------
const PRODUCT_SYSTEM = `You are a product research agent for Toxome, a clean-clothing platform.
Find real, currently-available products made from natural or low-toxin fabrics. Prioritize items that are MOSTLY natural fiber (organic cotton, linen, hemp, wool, alpaca, silk, Tencel/lyocell) and that clearly state their fabric composition. Prefer items that carry textile/ethical certifications.

For each product extract:
- item_name
- brand
- item_price: number in USD (no $)
- item_url: direct product page URL
- item_image: direct main image URL
- category: one of [Tops, Bottoms, Dresses, Outerwear, Activewear, Loungewear, Footwear, Accessories]
- gender: one of [Women, Men, Unisex]
- budget: $ (<50), $$ (50-150), $$$ (>150)
- fabric_composition: object mapping fabric name to PERCENTAGE number (e.g. {"organic cotton": 95, "elastane": 5})
- certifications: array of certs explicitly stated (e.g. ["GOTS","OEKO-TEX Standard 100"]); [] if none

Only include products that are currently available for purchase and made primarily from natural/low-tox fibers.

Always use the brand's US (.com) storefront and USD pricing. Prefer items that are in stock across multiple sizes; do not surface sold-out or final-sale products.

PRICE PRIORITY: Strongly prioritize mid-range prices — roughly $50–$150, with the sweet spot around $100 (this reflects where Toxome's catalog and customers sit). De-prioritize ultra-cheap basics under ~$40 and luxury outliers over ~$200; only include those if they are exceptional. When a brand spans many prices, pick the mid-range pieces.

Return ONLY a valid JSON array, no markdown.`;

async function findProductsForBrand(client, brand, perBrand) {
  const focusClause = FLAGS.focus
    ? ` IMPORTANT: only return ${FLAGS.focus} — ignore every other product type. They must be MOSTLY natural fiber (organic cotton, wool, linen) with only LOW percentages of any synthetic: a small amount of nylon/elastane for fit is fine (roughly ≤15% combined), but anything with a high synthetic share will be rejected. Prefer the highest natural-fiber content available and always report the exact composition percentages.`
    : "";
  const prompt = `Search ${brand}'s website and find ${perBrand} specific products made from natural / low-tox fabrics, prioritizing ones that state fabric composition and hold certifications.${focusClause} Give the DIRECT product-page URL for each (not the homepage or a collection page). After researching, your FINAL message must be ONLY the JSON array — no prose, no markdown fences.`;
  // web_search often leaves the final message as prose; parse all text blocks
  // robustly and retry once if no array comes back.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!reserveModelCall()) return [];
    let resp;
    try {
      resp = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        tools: [
          { type: "web_search_20250305", name: "web_search", max_uses: GUARD.webMaxUses },
        ],
        system: PRODUCT_SYSTEM,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (err) {
      console.error(`  Error for ${brand} (attempt ${attempt + 1}):`, err.message);
      continue;
    }
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const arr = parseBrandArray(text);
    if (arr && arr.length) return arr;
    console.warn(`  ${brand}: no parseable products (attempt ${attempt + 1})`);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    process.exit(1);
  }
  if (!serviceKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });
  const supabase = createClient(SUPABASE_URL, serviceKey);

  // Existing catalog: brands (to find "similar" + skip ones we have) and urls (dedupe).
  const { data: existing } = await supabase.from("products").select("brand, item_url");
  const existingBrands = [
    ...new Set((existing ?? []).map((r) => r.brand).filter(Boolean)),
  ];
  const existingUrls = new Set((existing ?? []).map((r) => r.item_url).filter(Boolean));

  // Explicit brands via --include skip the auto-suggestion step entirely.
  const includeBrands = (FLAGS.include || "")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

  console.log(
    `Model: ${MODEL}  |  Guard: <=${GUARD.maxBrands} brands, <=${GUARD.maxModelCalls} model calls, <=${GUARD.webMaxUses} searches/lookup`
  );
  console.log(
    (includeBrands.length
      ? `Sourcing from ${includeBrands.length} specified brand(s): ${includeBrands.join(", ")}`
      : `Catalog has ${existingBrands.length} brands. Finding ${FLAGS.brands} similar new brands`) +
      (FLAGS.dryRun ? "  [DRY RUN — no inserts]" : "") +
      `\nFiber bar: Toxome score >= ${FLAGS.minScore}\n`
  );

  const requestedBrandCount = Math.min(FLAGS.brands, GUARD.maxBrands);
  let suggested = includeBrands.length
    ? includeBrands
        .filter((b) => !isBlacklisted(b))
        .map((b) => ({ brand: b, certifications: [], note: "manually specified" }))
    : await suggestSimilarBrands(anthropic, existingBrands, requestedBrandCount);
  // Run guard: never process more than maxBrands in a single run.
  if (suggested.length > GUARD.maxBrands) {
    console.warn(
      `Run guard: capping ${suggested.length} brands to ${GUARD.maxBrands} for this run.`
    );
    suggested = suggested.slice(0, GUARD.maxBrands);
  }
  if (suggested.length === 0) {
    console.error("No brands to source. Exiting.");
    return;
  }
  console.log(
    "Similar brands to source:\n" +
      suggested
        .map(
          (b) =>
            `  • ${b.brand}${
              b.certifications && b.certifications.length
                ? ` [${b.certifications.join(", ")}]`
                : ""
            }${b.note ? ` — ${b.note}` : ""}`
        )
        .join("\n") +
      "\n"
  );

  const stats = {
    found: 0,
    tooSynthetic: 0,
    noCert: 0,
    duplicate: 0,
    invalidPage: 0,
    noImage: 0,
    soldOut: 0,
    inserted: 0,
  };

  for (const b of suggested) {
    if (modelCalls >= GUARD.maxModelCalls) {
      console.warn(
        `Run guard: hit ${GUARD.maxModelCalls} Anthropic calls — stopping before the remaining brands.`
      );
      break;
    }
    const brand = b.brand;
    console.log(`Searching ${brand}...`);
    const rawItems = await findProductsForBrand(anthropic, brand, FLAGS.perBrand);

    const toInsert = [];
    for (const item of rawItems) {
      if (!item.item_name || !item.brand) continue;
      if (isBlacklisted(item.brand)) continue;
      stats.found++;
      if (item.item_url && existingUrls.has(item.item_url)) {
        stats.duplicate++;
        continue;
      }
      // Guarantee an exact product-page URL before we spend a fetch.
      if (!item.item_url) {
        stats.invalidPage++;
        console.log(`  ✗ ${item.item_name} — no item_url`);
        continue;
      }
      // Validate the page FIRST. Composition, certs, and the score must all come
      // from the real product page — the model fabricates fibers and invents
      // cert badges (e.g. labeled a 100% viscose top as linen + OEKO-TEX).
      const validated = await getValidatedProduct(item.item_url);
      if (!validated.ok) {
        const reason = validated.reason || "invalid";
        if (/image/i.test(reason)) stats.noImage++;
        else stats.invalidPage++;
        console.log(`  ✗ ${item.item_name} — ${reason}`);
        continue;
      }
      // Stock gate: skip anything the product page reports as out of stock
      // (authoritative offers from Shopify .js / JSON-LD). inStock null = unknown → keep.
      if (validated.inStock === false) {
        stats.soldOut++;
        console.log(`  ✗ ${item.item_name} — sold out, skip`);
        continue;
      }

      // Composition: page-scraped wins. Fall back to the model ONLY with a
      // visible "fiber-unverified" flag so the reviewer knows it wasn't confirmed.
      const fiberUnverified = !validated.composition;
      const composition = validated.composition || item.fabric_composition || null;
      // Certs: ONLY what the page actually states. Model / brand-guessed certs
      // are dropped entirely.
      const certs =
        validated.certifications && validated.certifications.length
          ? validated.certifications
          : null;
      // SAFETY GATE (Kids): require a page-verified chemical-safety cert.
      if (FLAGS.requireCert && !hasSafetyCert(certs)) {
        stats.noCert++;
        console.log(
          `  ✗ ${item.item_name} — no verified safety cert (OEKO-TEX/GOTS), skip`
        );
        continue;
      }
      // Score from the real composition + the page's own care/description text
      // (so fiber floors + finish penalties apply correctly).
      const score = calcToxomeScore(composition, {
        certifications: certs || [],
        descKeywords: [validated.descText || ""],
      });
      // Fiber bar: only keep clean enough. A correctly-scored viscose item now
      // falls below the bar here instead of slipping through as fake linen.
      if (score == null || score < FLAGS.minScore) {
        stats.tooSynthetic++;
        console.log(
          `  ✗ ${item.item_name} — score ${score ?? "?"} < ${FLAGS.minScore} (page-verified), skip`
        );
        continue;
      }

      item.item_url = validated.finalUrl;
      item.item_image = validated.images[0];
      // Prefer the authoritative USD price scraped from the page over the LLM's.
      if (validated.price != null) item.item_price = validated.price;

      // Correct title-fooled categories before insert (rug→Home, "…Set"→Rompers
      // & Sets, etc.) so compound names don't keep landing in the wrong place.
      const guard = guardCategory({
        item_name: item.item_name,
        category: FLAGS.category || item.category || null,
        gender: FLAGS.gender || item.gender || null,
        age_band: FLAGS.ageBand || null,
      });
      if (guard.changed) {
        console.log(
          `  ↳ recategorized "${item.item_name}" → ${guard.gender}/${guard.category} (${guard.reason})`
        );
      }

      toInsert.push({
        item_name: item.item_name,
        brand: item.brand ?? brand,
        item_price: item.item_price ?? null,
        budget: item.budget ?? null,
        category: guard.category,
        subcategory: guard.subcategory,
        gender: guard.gender,
        age_band: guard.age_band,
        item_image: item.item_image,
        item_url: item.item_url,
        images: validated.images,
        affiliate_url: null,
        fabric_composition: composition,
        // The page text the composition was read out of. Without this a row is
        // unauditable later: you can't tell whether a stored composition came
        // from the page or from the model, and 308 agent rows had no evidence at
        // all. Keep it even when fiberUnverified, since then it's the proof the
        // page stated nothing.
        materials_text: validated.descText
          ? String(validated.descText).replace(/\s+/g, " ").trim().slice(0, 600)
          : null,
        certifications: certs,
        toxome_score: score,
        risk_level: scoreToRiskLevel(score),
        tags: fiberUnverified ? ["fiber-unverified"] : null,
        published: false, // draft — approve in Supabase
        added_by: "agent",
      });
      if (item.item_url) existingUrls.add(item.item_url);
      console.log(
        `  ✓ ${item.item_name} — score ${score} (${scoreToRiskLevel(score)})` +
          `${certs ? ` [${certs.join(", ")}]` : ""}` +
          `${fiberUnverified ? " ⚠ fiber-unverified" : ""}`
      );
    }

    if (toInsert.length && !FLAGS.dryRun) {
      const { error } = await supabase.from("products").insert(toInsert);
      if (error) console.error(`  Insert failed for ${brand}:`, error.message);
      else {
        stats.inserted += toInsert.length;
        // Whenever we add a brand's products, make sure the brand exists in the
        // directory (so it appears in the app's brand picker / B2B directory).
        let origin = null;
        try { origin = new URL(toInsert[0].item_url).origin; } catch { /* no website */ }
        await ensureBrandInDirectory(supabase, brand, origin);
      }
    } else {
      stats.inserted += toInsert.length; // count for dry-run summary
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n=== Summary ===");
  console.table(stats);
  if (FLAGS.dryRun) console.log("DRY RUN — nothing was inserted.");
  else
    console.log(
      `${stats.inserted} drafts added. Review at:\nhttps://supabase.com/dashboard/project/xclvodbmllglmharezqa/editor`
    );
}

run().catch(console.error);
