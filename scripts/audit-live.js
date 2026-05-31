/**
 * Audit currently-LIVE (published) products:
 *   1. Multiple images  — backfills a 2nd angle from the product page when missing
 *                         (keeps the existing primary; only adds angles).
 *   2. Materials mapped + scored — flags products with no fabric_composition/score.
 *   3. In stock (US)   — uses getValidatedProduct().inStock (JSON-LD/Shopify offers).
 *
 * Run:  node --env-file=.env.local scripts/audit-live.js          (report only)
 *       node --env-file=.env.local scripts/audit-live.js --apply  (also backfill images)
 *
 * Writes a full report to /tmp/audit_report.json. Stock / dead-URL decisions are
 * left to a human (not auto-unpublished) — the report lists ids to act on.
 */
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct } = require("./scrape");

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes("--apply");
const CONCURRENCY = 6;

async function mapLimit(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        await fn(items[idx], idx);
      } catch (e) {
        console.error("  worker error:", e.message);
      }
    }
  });
  await Promise.all(workers);
}

async function run() {
  if (!SUPABASE_URL || !KEY) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, KEY);
  const { data: products, error } = await supabase
    .from("products")
    .select("id, brand, item_name, item_url, item_image, images, fabric_composition, toxome_score")
    .eq("published", true);
  if (error) throw error;

  console.log(`Auditing ${products.length} live products (concurrency ${CONCURRENCY})…\n`);

  const report = {
    total: products.length,
    okInStock: 0,
    unknownStock: 0,
    soldOut: [],
    dead: [],
    imageBackfill: [],
    stillSingleImage: [],
    missingMaterials: [],
  };
  let done = 0;

  await mapLimit(products, CONCURRENCY, async (p) => {
    const label = `${p.brand} — ${p.item_name}`;
    if (!p.fabric_composition || Object.keys(p.fabric_composition || {}).length === 0) {
      report.missingMaterials.push({ id: p.id, label });
    }
    if (p.item_url) {
      const v = await getValidatedProduct(p.item_url);
      if (!v.ok) {
        report.dead.push({ id: p.id, label, reason: v.reason });
      } else {
        if (v.inStock === false) report.soldOut.push({ id: p.id, label, url: p.item_url });
        else if (v.inStock === true) report.okInStock++;
        else report.unknownStock++;

        // Backfill a 2nd image: keep the existing primary, append fresh angles.
        const existing = (p.images && p.images.length ? p.images : p.item_image ? [p.item_image] : []);
        const merged = [...new Set([...existing, ...(v.images || [])])].slice(0, 6);
        if (existing.length < 2 && merged.length >= 2) {
          report.imageBackfill.push({ id: p.id, label, images: merged });
        } else if (merged.length < 2) {
          report.stillSingleImage.push({ id: p.id, label });
        }
      }
    }
    done++;
    if (done % 25 === 0) console.log(`  …${done}/${products.length}`);
  });

  fs.writeFileSync("/tmp/audit_report.json", JSON.stringify(report, null, 2));

  console.log("\n===== LIVE PRODUCT AUDIT =====");
  console.log(`Total live:            ${report.total}`);
  console.log(`In stock (US):         ${report.okInStock}`);
  console.log(`Stock unknown:         ${report.unknownStock}`);
  console.log(`SOLD OUT:              ${report.soldOut.length}`);
  console.log(`Dead / bad URL:        ${report.dead.length}`);
  console.log(`Missing materials:     ${report.missingMaterials.length}`);
  console.log(`Image backfill avail:  ${report.imageBackfill.length}`);
  console.log(`Still single image:    ${report.stillSingleImage.length}`);

  if (APPLY) {
    let n = 0;
    for (const b of report.imageBackfill) {
      const { error: e } = await supabase
        .from("products")
        .update({ images: b.images })
        .eq("id", b.id);
      if (!e) n++;
    }
    console.log(`\nApplied: backfilled images on ${n} products (primary unchanged).`);
  }
  console.log("\nFull report → /tmp/audit_report.json");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
