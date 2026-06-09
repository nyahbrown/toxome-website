#!/usr/bin/env node
/**
 * toxome-distribute — batch inserter for the content pipeline.
 *
 * The DETERMINISTIC half of the `/toxome-distribute` skill. Claude writes the
 * platform-native copy (the creative half) and hands this script a batch JSON;
 * this script ties the variants together with one group_id per source and drops
 * them straight into Supabase `content_drafts` as `draft` rows — bypassing the
 * Firebase-gated API (it runs locally with the service-role key, like the other
 * scripts in this folder).
 *
 * Usage:
 *   node scripts/distribute.js --file batch.json
 *   cat batch.json | node scripts/distribute.js
 *   node scripts/distribute.js --file batch.json --dry-run     # preview, no insert
 *   node scripts/distribute.js --list-articles                 # show journal slugs
 *
 * Env: reads SUPABASE_SERVICE_ROLE_KEY from the environment or from .env.local
 * (auto-loaded — no dotenv dependency).
 *
 * Batch JSON shape (a single source object, or an array of them):
 * {
 *   "source_type": "journal",            // journal | topic | comment | product | video | manual
 *   "source_ref":  "Polyester is plastic",
 *   "variants": [
 *     {
 *       "platform": "instagram",          // instagram | twitter | pinterest | tiktok
 *       "variant_type": "carousel",       // carousel | image | post | thread | pin
 *       "title": "Polyester is plastic",  // optional
 *       "body": "<full caption / thread / pin description>",
 *       "media_url": "/carousel/polyester-is-plastic/slide-0.png",  // optional
 *       "media_type": "carousel",         // image | carousel | null
 *       "comment": "Render: /studio/carousel?c=polyester-is-plastic · 6 slides" // optional internal note
 *     }
 *   ]
 * }
 *
 * Every variant in one source object shares a freshly-generated group_id, so the
 * dashboard groups the IG / X / Pinterest cuts of one idea together.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const TABLE = "content_drafts";

const PLATFORMS = ["instagram", "twitter", "pinterest", "tiktok"];
const VARIANT_TYPES = ["carousel", "image", "post", "thread", "pin"];
const SOURCE_TYPES = ["journal", "topic", "comment", "product", "video", "manual"];

// ---- env: prefer the real environment, fall back to .env.local --------------
function loadEnvLocal() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let [, k, v] = m;
    v = v.replace(/^["']|["']$/g, ""); // strip surrounding quotes
    if (!(k in process.env)) process.env[k] = v;
  }
}

// ---- args -------------------------------------------------------------------
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
function flagValue(f) {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : null;
}

function listArticles() {
  const dir = path.join(__dirname, "..", "content", "journal");
  if (!fs.existsSync(dir)) {
    console.log("No content/journal/ directory found.");
    return;
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  console.log(`Journal articles (${files.length}) — source a teaser from any of these:\n`);
  for (const f of files) {
    const slug = f.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const title = (raw.match(/^title:\s*(.+)$/m) || [])[1] || slug;
    console.log(`  • ${slug}\n      ${title.replace(/^["']|["']$/g, "").trim()}`);
  }
  console.log(`\nRender a teaser PNG: /studio/post?article=<slug>`);
}

function readInput() {
  const file = flagValue("--file");
  if (file) {
    const p = path.resolve(file);
    if (!fs.existsSync(p)) die(`Batch file not found: ${p}`);
    return fs.readFileSync(p, "utf8");
  }
  if (!process.stdin.isTTY) return fs.readFileSync(0, "utf8"); // piped stdin
  die("No input. Pass --file batch.json or pipe JSON via stdin. (--help for usage)");
}

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function validateVariant(v, srcLabel) {
  if (!v || typeof v !== "object") die(`A variant in "${srcLabel}" is not an object`);
  if (!PLATFORMS.includes(v.platform))
    die(`"${srcLabel}": platform "${v.platform}" must be one of ${PLATFORMS.join(", ")}`);
  if (!VARIANT_TYPES.includes(v.variant_type))
    die(`"${srcLabel}": variant_type "${v.variant_type}" must be one of ${VARIANT_TYPES.join(", ")}`);
  if (!v.body || !String(v.body).trim())
    die(`"${srcLabel}" (${v.platform}): body is required and cannot be empty`);
}

function rowsFromSource(src) {
  const label = src.source_ref || src.source_type || "untitled";
  const sourceType = SOURCE_TYPES.includes(src.source_type) ? src.source_type : "manual";
  const variants = Array.isArray(src.variants) ? src.variants : [];
  if (!variants.length) die(`Source "${label}" has no variants`);
  const groupId = crypto.randomUUID(); // tie this source's platform cuts together
  return variants.map((v) => {
    validateVariant(v, label);
    return {
      group_id: groupId,
      source_type: sourceType,
      source_ref: src.source_ref ? `Distribute · ${src.source_ref}` : "Distribute",
      platform: v.platform,
      variant_type: v.variant_type,
      title: v.title || null,
      body: String(v.body),
      media_url: v.media_url || null,
      media_type: v.media_type || null,
      comment: v.comment || null,
      status: "draft",
    };
  });
}

async function main() {
  if (has("--help") || has("-h")) {
    console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^\/\*\*?/, ""));
    return;
  }
  if (has("--list-articles")) return listArticles();

  loadEnvLocal();

  let parsed;
  try {
    parsed = JSON.parse(readInput());
  } catch (e) {
    die(`Invalid JSON: ${e.message}`);
  }
  const sources = Array.isArray(parsed) ? parsed : [parsed];
  const rows = sources.flatMap(rowsFromSource);

  // Preview table.
  console.log(`\nPrepared ${rows.length} draft(s) across ${sources.length} source(s):\n`);
  for (const r of rows) {
    const media = r.media_url ? `  [${r.media_type || "media"}: ${r.media_url}]` : "";
    console.log(`  ${r.platform.padEnd(10)} ${r.variant_type.padEnd(9)} ${r.source_ref}${media}`);
    console.log(`      ${String(r.body).replace(/\s+/g, " ").slice(0, 90)}${r.body.length > 90 ? "…" : ""}`);
  }

  if (has("--dry-run")) {
    console.log(`\n(dry run — nothing inserted)`);
    return;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) die("Missing SUPABASE_SERVICE_ROLE_KEY (not in env or .env.local)");
  const supabase = createClient(SUPABASE_URL, key);

  const { data, error } = await supabase.from(TABLE).insert(rows).select("id, platform, variant_type");
  if (error) die(`Supabase insert failed: ${error.message}`);

  console.log(`\n✓ Inserted ${data.length} draft(s) as status "draft".`);
  console.log(`  Review + approve at: https://toxome.app/admin/content`);
}

main().catch((e) => die(e.stack || String(e)));
