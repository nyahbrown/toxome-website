/**
 * Add a single product by URL, published LIVE immediately (mirrors the admin
 * "Add by URL" dashboard action). Validates the exact product page + a
 * rendering image, extracts fields with Claude, scores it, and inserts.
 *
 *   node --env-file=.env.local scripts/add-product.js <product-url>
 *   node --env-file=.env.local scripts/add-product.js <url> --draft   # queue instead of live
 */
const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage, shopifyProduct } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const MODEL = "claude-haiku-4-5-20251001";
const BLACKLIST = require("../lib/brandBlacklist.json").map((b) => b.toLowerCase().trim());
const isBlacklisted = (b) => !!b && BLACKLIST.some((x) => b.toLowerCase().includes(x));

const CATEGORIES = ["Tops","Bottoms","Dresses","Outerwear","Activewear","Loungewear","Footwear","Accessories"];

const TOOL = {
  name: "save_product",
  description: "Save the structured product fields extracted from the page.",
  input_schema: {
    type: "object",
    properties: {
      item_name: { type: "string" },
      brand: { type: "string" },
      item_price: { type: ["number", "null"], description: "USD number, no symbol" },
      category: { type: ["string", "null"], enum: [...CATEGORIES, null] },
      gender: { type: ["string", "null"], enum: ["Women", "Men", "Unisex", null] },
      fabric_composition: {
        type: "object",
        description: "fabric name (lowercase) -> PERCENTAGE 0-100; only fabrics explicitly stated; {} if none",
        additionalProperties: { type: "number" },
      },
      materials_text: { type: ["string", "null"] },
      description: { type: ["string", "null"] },
      certifications: { type: "array", items: { type: "string" } },
    },
    required: ["item_name","brand","item_price","category","gender","fabric_composition","materials_text","description","certifications"],
  },
};

const cleanText = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ").trim();

function toFractions(comp) {
  if (!comp || typeof comp !== "object") return null;
  const e = Object.entries(comp).map(([k, v]) => [k.toLowerCase().trim(), Number(v)]).filter(([k, v]) => k && v > 0);
  if (!e.length) return null;
  const s = e.reduce((a, [, v]) => a + v, 0);
  const o = {};
  for (const [k, v] of e) o[k] = Math.round((v / s) * 1000) / 1000;
  return o;
}
const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");

async function run() {
  const url = process.argv.find((a) => /^https?:\/\//.test(a));
  const draft = process.argv.includes("--draft");
  if (!url) { console.error("Usage: node scripts/add-product.js <url> [--draft]"); process.exit(1); }
  const apiKey = process.env.ANTHROPIC_API_KEY, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !serviceKey) { console.error("Missing ANTHROPIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

  console.log("Validating product page + image...");
  const v = await getValidatedProduct(url);
  if (!v.ok) { console.error("✗ Rejected:", v.reason); process.exit(1); }
  console.log(`  ok — ${v.images.length} working image(s); url ${v.finalUrl}`);

  const page = await fetchPage(v.finalUrl);
  const shop = await shopifyProduct(v.finalUrl);
  const source = (shop && shop.body_html ? "DESCRIPTION:\n" + cleanText(shop.body_html) + "\n\n" : "") +
    "PAGE TEXT:\n" + cleanText(page.html).slice(0, 16000);

  console.log("Extracting fields with Claude...");
  const anthropic = new Anthropic({ apiKey });
  const resp = await anthropic.messages.create({
    model: MODEL, max_tokens: 1500, tools: [TOOL],
    tool_choice: { type: "tool", name: "save_product" },
    messages: [{ role: "user", content: `Extract clean-clothing product fields. Only use facts on the page; do not invent a fabric composition.\n\nURL: ${v.finalUrl}\n\n${source}` }],
  });
  const f = (resp.content.find((b) => b.type === "tool_use") || {}).input;
  if (!f || !f.item_name || !f.brand) { console.error("✗ Could not read name/brand"); process.exit(1); }
  if (isBlacklisted(f.brand)) { console.error(`✗ ${f.brand} is blacklisted`); process.exit(1); }

  const supabase = createClient(SUPABASE_URL, serviceKey);
  const { data: dup } = await supabase.from("products").select("id").eq("item_url", v.finalUrl).maybeSingle();
  if (dup) { console.error("✗ Already in catalog:", dup.id); process.exit(1); }

  const comp = toFractions(f.fabric_composition);
  const score = calcToxomeScore(comp);
  const price = typeof f.item_price === "number" ? f.item_price : null;
  const row = {
    item_name: f.item_name.trim(), brand: f.brand.trim(), item_price: price, budget: budget(price),
    category: CATEGORIES.includes(f.category) ? f.category : null,
    gender: ["Women", "Men", "Unisex"].includes(f.gender) ? f.gender : null,
    item_image: v.images[0], images: v.images, item_url: v.finalUrl, affiliate_url: null,
    fabric_composition: comp, materials_text: f.materials_text || null, description: f.description || null,
    certifications: Array.isArray(f.certifications) && f.certifications.length ? f.certifications : null,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !draft, rejected: false, added_by: "manual", reviewed_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) { console.error("✗ Insert failed:", error.message); process.exit(1); }
  console.log(`\n✓ ${draft ? "Queued (draft)" : "PUBLISHED LIVE"}: ${row.brand} — ${row.item_name}`);
  console.log(`  score ${score} (${row.risk_level})${row.certifications ? " · " + row.certifications.join(", ") : ""} · ${v.images.length} imgs`);
  console.log(`  id ${data.id}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
