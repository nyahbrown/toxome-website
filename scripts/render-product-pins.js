#!/usr/bin/env node
/**
 * render-product-pins — screenshot studio product pins and upload to Storage.
 *
 * Drives /studio/pin?id=<productId> in a headless browser at 1000×1500 (2:3,
 * Pinterest's ideal) and uploads each pin to the public Supabase Storage bucket
 * `carousels` at pins/<productId>.png. Prints each pin's public PNG URL plus its
 * destination https://toxome.app/shop/<id>. Feed the PNG URL to a Pinterest draft
 * (media_url, media_type: image) via scripts/seed-product-pins.js. No git commit,
 * no deploy, no repo bloat.
 *
 * Usage:
 *   node scripts/render-product-pins.js <id> [<id> ...]
 *   node scripts/render-product-pins.js <id> --base http://localhost:3000
 *   node scripts/render-product-pins.js --all                 # all published products
 *   node scripts/render-product-pins.js --all --limit 50      # cap the batch
 *
 * Defaults: --base https://toxome.app. Uses system Chrome (override with
 * CHROME_PATH). Needs puppeteer-core + SUPABASE_SERVICE_ROLE_KEY (env or
 * .env.local).
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BUCKET = "carousels";
const W = 1000;
const H = 1500;
const SCALE = 2;
const SHOP_BASE = "https://toxome.app/shop";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
function flag(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
}
const BASE = flag("--base", "https://toxome.app").replace(/\/+$/, "");
// Locked design = variant 2 ("cover"). --variant N renders a different design
// (used for fresh-pin variety later); defaults to the locked V2.
const VARIANT = flag("--variant", "2");
const ALL = has("--all");
const LIMIT = flag("--limit", null);
const ids = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1]?.startsWith("--") !== true);

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

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  return [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ].find((p) => fs.existsSync(p));
}

// Pull published product ids straight from Supabase (newest first), so --all
// renders the live catalog without a separate export step.
async function fetchPublishedIds(supabase, limit) {
  let q = supabase
    .from("products")
    .select("id")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (limit) q = q.limit(Number(limit));
  const { data, error } = await q;
  if (error) {
    console.error(`✗ Failed to list published products: ${error.message}`);
    process.exit(1);
  }
  return (data ?? []).map((r) => r.id);
}

async function main() {
  if (!ALL && !ids.length) {
    console.error("Usage: node scripts/render-product-pins.js <id> [<id> ...] | --all [--limit N] [--base URL]");
    process.exit(1);
  }
  loadEnvLocal();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("✗ Missing SUPABASE_SERVICE_ROLE_KEY (env or .env.local)");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error("✗ No Chrome found. Install Chrome or set CHROME_PATH=/path/to/chrome");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, key);

  const targets = ALL ? await fetchPublishedIds(supabase, LIMIT) : ids;
  if (!targets.length) {
    console.error("✗ No product ids to render.");
    process.exit(1);
  }

  console.log(`Base: ${BASE}  ·  ${targets.length} pin(s)  ·  → Storage bucket "${BUCKET}" (pins/<id>.png)`);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });

  const done = [];
  try {
    for (const id of targets) {
      const url = `${BASE}/studio/pin?id=${encodeURIComponent(id)}&v=${encodeURIComponent(VARIANT)}`;
      // The DB-backed studio page is dynamic (a query per request) and can be
      // slow on a cold function, so retry a few times before giving up.
      let buf = null;
      let lastErr = null;
      for (let attempt = 1; attempt <= 3 && !buf; attempt++) {
        const page = await browser.newPage();
        try {
          await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
          const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
          if (!res || !res.ok()) throw new Error(`HTTP ${res ? res.status() : "no response"}`);
          await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
          await new Promise((r) => setTimeout(r, 400));
          buf = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
        } catch (e) {
          lastErr = e;
        } finally {
          await page.close();
        }
      }
      if (!buf) {
        console.error(`  ✗ ${id}: ${lastErr ? lastErr.message.split("\n")[0] : "failed"} (after retries)`);
        continue;
      }

      const objectPath = `pins/${id}.png`;
      const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
        contentType: "image/png",
        upsert: true,
      });
      if (error) {
        console.error(`  ✗ ${id} upload: ${error.message}`);
        continue;
      }
      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
      done.push({ id, publicUrl, destination: `${SHOP_BASE}/${id}` });
      console.log(`  ✓ pins/${id}.png`);
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone. ${done.length} pin(s) (media_url, media_type: image · destination):`);
  for (const d of done) console.log(`  ${d.id}\n    ${d.publicUrl}\n    → ${d.destination}`);
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exit(1);
});
