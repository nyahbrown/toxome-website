/**
 * Import recommendations.json → Supabase products table
 *
 * Setup:
 *   1. Run export-firebase.js first to generate recommendations.json
 *   2. Get your Supabase service role key:
 *      Supabase dashboard → Project Settings → API → service_role key
 *   3. Run:
 *      SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/import-to-supabase.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const ITEMS_PATH = path.join(__dirname, "recommendations.json");
if (!fs.existsSync(ITEMS_PATH)) {
  console.error("Missing scripts/recommendations.json — run export-firebase.js first");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const items = JSON.parse(fs.readFileSync(ITEMS_PATH, "utf8"));

async function importProducts() {
  console.log(`Importing ${items.length} products to Supabase...`);

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const { error } = await supabase.from("products").insert(batch);
    if (error) {
      console.error(`Batch ${i}–${i + BATCH} failed:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  Inserted ${inserted}/${items.length}`);
    }
  }

  console.log(`Done. ${inserted} products imported.`);
}

importProducts().catch(console.error);
