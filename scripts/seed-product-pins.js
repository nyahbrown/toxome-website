#!/usr/bin/env node
/**
 * seed-product-pins — create Pinterest draft rows for rendered product pins.
 *
 * The DETERMINISTIC half of the product-pin pipeline. Render the PNGs first with
 * scripts/render-product-pins.js (they upload to the public `carousels` bucket at
 * pins/<id>.png); this script reads each product, writes a short keyword-rich
 * Pinterest description in Toxome's voice, and drops a `draft` row into Supabase
 * `content_drafts` — one per product — pointing media_url at the pin PNG and
 * carrying its destination https://toxome.app/shop/<id> in the comment (the
 * dashboard table has no link column; the Pinterest target link is wired at push
 * time). Runs locally with the service-role key, like the other scripts here.
 *
 * Usage:
 *   node scripts/seed-product-pins.js <id> [<id> ...]
 *   node scripts/seed-product-pins.js --all                  # all published products
 *   node scripts/seed-product-pins.js --all --limit 50
 *   node scripts/seed-product-pins.js <id> --dry-run         # preview, no insert
 *
 * Env: reads SUPABASE_SERVICE_ROLE_KEY from the environment or from .env.local.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BUCKET = "carousels";
const TABLE = "content_drafts";
const SHOP_BASE = "https://toxome.app/shop";

function loadEnvLocal() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let [, k, v] = m;
    v = v.replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
function flag(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
}
const ALL = has("--all");
const DRY = has("--dry-run");
const LIMIT = flag("--limit", null);
const ids = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1]?.startsWith("--") !== true);

// Lowercase a category for use inside a phrase ("non-toxic dresses"), tolerating
// a null category (some home goods / catch-alls have none).
function categoryPhrase(p) {
  const c = (p.category || "").trim().toLowerCase();
  if (!c) return "clothing";
  return c;
}

// Pinterest is a search engine, so the description leads with the health-intent
// keyword ("non-toxic <category>"), names the brand, states the Toxome score when
// there is one, and closes with a soft, on-brand CTA. No hashtags.
function pinDescription(p) {
  const cat = categoryPhrase(p);
  const brand = (p.brand || "").trim();
  const parts = [];
  parts.push(brand ? `Non-toxic ${cat} from ${brand}.` : `Non-toxic ${cat}.`);
  if (typeof p.toxome_score === "number") {
    parts.push(`Toxome score ${p.toxome_score}/100.`);
  }
  parts.push("Clean, breathable fabrics for sensitive skin, with no hidden plastics or harsh chemical finishes.");
  parts.push("Shop verified clean clothing on toxome.app and know what's in your clothes.");
  return parts.join(" ");
}

function rowFor(p, publicUrl) {
  return {
    group_id: crypto.randomUUID(),
    source_type: "product",
    source_ref: `Product pin · ${p.item_name}`,
    platform: "pinterest",
    variant_type: "pin",
    title: p.item_name,
    body: pinDescription(p),
    media_url: publicUrl,
    media_type: "image",
    comment: `Destination: ${SHOP_BASE}/${p.id}`,
    status: "draft",
  };
}

async function fetchProducts(supabase) {
  let q = supabase
    .from("products")
    .select("id, item_name, brand, category, toxome_score")
    .eq("published", true);
  if (ALL) {
    q = q.order("created_at", { ascending: false });
    if (LIMIT) q = q.limit(Number(LIMIT));
  } else {
    q = q.in("id", ids);
  }
  const { data, error } = await q;
  if (error) {
    console.error(`✗ Failed to load products: ${error.message}`);
    process.exit(1);
  }
  return data ?? [];
}

async function main() {
  if (!ALL && !ids.length) {
    console.error("Usage: node scripts/seed-product-pins.js <id> [<id> ...] | --all [--limit N] [--dry-run]");
    process.exit(1);
  }
  loadEnvLocal();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("✗ Missing SUPABASE_SERVICE_ROLE_KEY (env or .env.local)");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, key);

  const products = await fetchProducts(supabase);
  if (!products.length) {
    console.error("✗ No published products matched.");
    process.exit(1);
  }

  const rows = products.map((p) => {
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(`pins/${p.id}.png`).data.publicUrl;
    return rowFor(p, publicUrl);
  });

  console.log(`\nPrepared ${rows.length} Pinterest draft(s):\n`);
  for (const r of rows) {
    console.log(`  pinterest  pin  ${r.source_ref}`);
    console.log(`      ${r.media_url}`);
    console.log(`      ${r.comment}`);
    console.log(`      ${r.body.replace(/\s+/g, " ").slice(0, 100)}${r.body.length > 100 ? "…" : ""}`);
  }

  if (DRY) {
    console.log(`\n(dry run — nothing inserted)`);
    return;
  }

  const { data, error } = await supabase.from(TABLE).insert(rows).select("id");
  if (error) {
    console.error(`✗ Supabase insert failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`\n✓ Inserted ${data.length} Pinterest draft(s) as status "draft".`);
  console.log(`  Review + approve at: https://toxome.app/admin/content`);
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exit(1);
});
