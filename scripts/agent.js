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
 *   node --env-file=.env.local scripts/agent.js --max-score 25   # stricter fibers
 *
 * Schedule (GitHub Actions cron — see .github/workflows/shop-agent.yml).
 */

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const ARGV = process.argv.slice(2);
const FLAGS = {
  dryRun: ARGV.includes("--dry-run"),
  brands: intFlag("--brands") ?? 6, // how many new similar brands to source per run
  perBrand: intFlag("--per-brand") ?? 3, // products to try per brand
  maxScore: intFlag("--max-score") ?? 33, // fiber bar: only keep Toxome score <= this
};
function intFlag(name) {
  const i = ARGV.indexOf(name);
  return i >= 0 && ARGV[i + 1] ? parseInt(ARGV[i + 1], 10) : null;
}

// ---------------------------------------------------------------------------
// Toxome scoring — shared with enrich-products.js (mirror in lib/fabricScores.ts)
// ---------------------------------------------------------------------------
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// ---------------------------------------------------------------------------
// Step 1 — suggest brands similar to the existing catalog
// ---------------------------------------------------------------------------
async function suggestSimilarBrands(client, existingBrands, count) {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
    system: `You curate brands for Toxome, a clean-clothing platform. Toxome only features clothing made from natural / low-toxin fibers (organic cotton, linen, hemp, wool, alpaca, silk, Tencel/lyocell) and avoids synthetic-heavy fast fashion. The aesthetic is elevated-casual and sustainability-minded.`,
    messages: [
      {
        role: "user",
        content: `These brands are ALREADY in our catalog:\n${existingBrands.join(
          ", "
        )}\n\nSuggest ${count} DIFFERENT brands we do NOT already carry that fit the same world: natural / low-tox fibers, elevated-casual, comparable price and values. Strongly prioritize brands that hold recognized certifications (GOTS, OEKO-TEX, Fair Trade, bluesign, B Corp). Use web search to confirm each brand exists and sells natural-fiber clothing.\n\nReturn ONLY a JSON array, no markdown:\n[{"brand":"...","certifications":["GOTS"],"note":"why it fits"}]`,
      },
    ],
  });
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock) return [];
  const match = textBlock.text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    const existingLower = new Set(existingBrands.map((b) => b.toLowerCase().trim()));
    return Array.isArray(arr)
      ? arr.filter((b) => b && b.brand && !existingLower.has(b.brand.toLowerCase().trim()))
      : [];
  } catch {
    return [];
  }
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

Only include products that are currently available for purchase and made primarily from natural/low-tox fibers. Return ONLY a valid JSON array, no markdown.`;

async function findProductsForBrand(client, brand, perBrand) {
  let resp;
  try {
    resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      system: PRODUCT_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Search ${brand}'s website and find ${perBrand} specific products made from natural / low-tox fabrics, prioritizing ones that state fabric composition and hold certifications. Return a JSON array.`,
        },
      ],
    });
  } catch (err) {
    console.error(`  Error for ${brand}:`, err.message);
    return [];
  }
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock) return [];
  const match = textBlock.text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const items = JSON.parse(match[0]);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
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

  console.log(
    `Catalog has ${existingBrands.length} brands. Finding ${FLAGS.brands} similar new brands` +
      (FLAGS.dryRun ? "  [DRY RUN — no inserts]" : "") +
      `\nFiber bar: Toxome score <= ${FLAGS.maxScore}\n`
  );

  const suggested = await suggestSimilarBrands(anthropic, existingBrands, FLAGS.brands);
  if (suggested.length === 0) {
    console.error("No new brands suggested. Exiting.");
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

  const stats = { found: 0, tooSynthetic: 0, duplicate: 0, inserted: 0 };

  for (const b of suggested) {
    const brand = b.brand;
    console.log(`Searching ${brand}...`);
    const rawItems = await findProductsForBrand(anthropic, brand, FLAGS.perBrand);

    const toInsert = [];
    for (const item of rawItems) {
      if (!item.item_name || !item.brand) continue;
      stats.found++;
      if (item.item_url && existingUrls.has(item.item_url)) {
        stats.duplicate++;
        continue;
      }
      const score = calcToxomeScore(item.fabric_composition);
      // Fiber bar: only keep low-risk. Reject unknown or above the threshold.
      if (score == null || score > FLAGS.maxScore) {
        stats.tooSynthetic++;
        console.log(
          `  ✗ ${item.item_name} — score ${score ?? "?"} > ${FLAGS.maxScore}, skip`
        );
        continue;
      }
      const certs =
        Array.isArray(item.certifications) && item.certifications.length
          ? item.certifications
          : Array.isArray(b.certifications) && b.certifications.length
          ? b.certifications
          : null;
      toInsert.push({
        item_name: item.item_name,
        brand: item.brand ?? brand,
        item_price: item.item_price ?? null,
        budget: item.budget ?? null,
        category: item.category ?? null,
        gender: item.gender ?? null,
        item_image: item.item_image ?? null,
        item_url: item.item_url ?? null,
        affiliate_url: null,
        fabric_composition: item.fabric_composition ?? null,
        certifications: certs,
        toxome_score: score,
        risk_level: scoreToRiskLevel(score),
        published: false, // draft — approve in Supabase
        added_by: "agent",
      });
      if (item.item_url) existingUrls.add(item.item_url);
      console.log(
        `  ✓ ${item.item_name} — score ${score} (low)${certs ? ` [${certs.join(", ")}]` : ""}`
      );
    }

    if (toInsert.length && !FLAGS.dryRun) {
      const { error } = await supabase.from("products").insert(toInsert);
      if (error) console.error(`  Insert failed for ${brand}:`, error.message);
      else stats.inserted += toInsert.length;
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
