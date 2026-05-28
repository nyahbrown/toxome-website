/**
 * Toxome Shop Agent
 * Searches for new clean clothing items and adds them to Supabase as drafts.
 *
 * Setup:
 *   ANTHROPIC_API_KEY=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (Supabase dashboard → Project Settings → API)
 *
 * Run manually:
 *   node scripts/agent.js
 *
 * Schedule (GitHub Actions cron — see .github/workflows/shop-agent.yml):
 *   Runs every Monday at 9am UTC
 *
 * What it does:
 *   1. Searches for products from TARGET_BRANDS using Claude + web search
 *   2. Scores each item based on fabric composition
 *   3. Inserts to Supabase as published=false (drafts)
 *   4. You review and approve in Supabase Table Editor, then flip published=true
 */

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";

const TARGET_BRANDS = [
  "Pact Organic",
  "Quince",
  "Girlfriend Collective",
  "Cariuma",
  "Thought Clothing",
  "Organic Basics",
  "Patagonia",
  "Tentree",
  "Printfresh",
  "Birch Clothing",
  "COS",
  "Vuori",
];

// Fabric toxome score weights (lower = cleaner)
// Score: 0 = clean, 100 = high concern
const FABRIC_SCORES = {
  organic_cotton: 5,
  cotton: 20,
  linen: 8,
  hemp: 6,
  tencel: 18,
  lyocell: 18,
  modal: 22,
  bamboo: 25,
  wool: 15,
  merino: 15,
  silk: 12,
  recycled_polyester: 45,
  polyester: 65,
  nylon: 62,
  acrylic: 78,
  spandex: 55,
  elastane: 55,
  viscose: 40,
  rayon: 40,
  microfiber: 70,
  fleece: 60,
};

function calcToxomeScore(fabricComposition) {
  if (!fabricComposition || Object.keys(fabricComposition).length === 0) return null;

  let weightedScore = 0;
  let totalPct = 0;

  for (const [fabric, pct] of Object.entries(fabricComposition)) {
    const key = fabric.toLowerCase().replace(/\s+/g, "_");
    const score = FABRIC_SCORES[key] ?? 50;
    weightedScore += score * pct;
    totalPct += pct;
  }

  if (totalPct === 0) return null;
  const score = Math.round(weightedScore / totalPct);
  return Math.min(100, Math.max(0, score));
}

function scoreToRiskLevel(score) {
  if (score == null) return null;
  if (score <= 33) return "low";
  if (score <= 66) return "moderate";
  return "high";
}

const SYSTEM_PROMPT = `You are a product research agent for Toxome, a clean clothing platform.
Your job is to find real, currently-available products made from natural or low-toxin fabrics.

For each product you find, extract:
- item_name: the product name
- brand: brand name
- item_price: numeric price in USD (number only, no $ sign)
- item_url: direct product page URL
- item_image: direct image URL (use the main product image)
- category: one of [Tops, Bottoms, Dresses, Outerwear, Activewear, Loungewear, Footwear, Accessories]
- gender: one of [Women, Men, Unisex]
- budget: one of [$, $$, $$$] based on price ($=under $50, $$=$50-150, $$$=over $150)
- fabric_composition: object mapping fabric name to percentage (e.g. {"organic cotton": 95, "elastane": 5})

Only include products that are:
- Currently available for purchase
- Made from at least 50% natural or recycled/certified fabrics
- Priced reasonably (not couture/luxury outliers)

Return ONLY a valid JSON array. No markdown, no explanation. Example:
[{"item_name":"...","brand":"...","item_price":89,...}]`;

async function findProductsForBrand(client, brand) {
  console.log(`  Searching: ${brand}...`);

  let response;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Search ${brand}'s website and find 3 specific products that are made from natural, organic, or low-toxin fabrics. Prioritize items that clearly state fabric composition. Return a JSON array.`,
        },
      ],
    });
  } catch (err) {
    console.error(`  Error for ${brand}:`, err.message);
    return [];
  }

  // Extract text from final assistant message
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) return [];

  // Parse JSON array from response
  const text = textBlock.text.trim();
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn(`  No JSON array found for ${brand}`);
    return [];
  }

  try {
    const items = JSON.parse(match[0]);
    return Array.isArray(items) ? items : [];
  } catch {
    console.warn(`  Failed to parse JSON for ${brand}`);
    return [];
  }
}

async function run() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }
  if (!serviceKey) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

  const anthropic = new Anthropic({ apiKey });
  const supabase = createClient(SUPABASE_URL, serviceKey);

  // Fetch existing item_urls to avoid duplicates
  const { data: existing } = await supabase.from("products").select("item_url");
  const existingUrls = new Set((existing ?? []).map((r) => r.item_url).filter(Boolean));

  let totalInserted = 0;

  for (const brand of TARGET_BRANDS) {
    const rawItems = await findProductsForBrand(anthropic, brand);

    const toInsert = rawItems
      .filter((item) => item.item_name && item.brand)
      .filter((item) => !item.item_url || !existingUrls.has(item.item_url))
      .map((item) => {
        const score = calcToxomeScore(item.fabric_composition);
        return {
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
          toxome_score: score,
          risk_level: scoreToRiskLevel(score),
          published: false, // drafts — you approve in Supabase Table Editor
          added_by: "agent",
        };
      });

    if (toInsert.length === 0) {
      console.log(`  → 0 new items for ${brand} (all duplicates or invalid)`);
      continue;
    }

    const { error } = await supabase.from("products").insert(toInsert);
    if (error) {
      console.error(`  Insert failed for ${brand}:`, error.message);
    } else {
      totalInserted += toInsert.length;
      console.log(`  → ${toInsert.length} drafts added for ${brand}`);
      toInsert.forEach((i) => existingUrls.add(i.item_url));
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nDone. ${totalInserted} new draft products added to Supabase.`);
  console.log("Review and approve at: https://supabase.com/dashboard/project/xclvodbmllglmharezqa/editor");
}

run().catch(console.error);
