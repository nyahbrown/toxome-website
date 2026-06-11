#!/usr/bin/env node
/**
 * render-carousel — screenshot studio carousel slides and upload to Storage.
 *
 * Drives /studio/carousel?c=<slug>&i=<n> in a headless browser and uploads each
 * slide to the public Supabase Storage bucket `carousels` at
 * carousels/<slug>/slide-<n>.png. Prints the public URLs — use the slide-0 URL
 * as a draft's media_url (media_type: carousel) and the dashboard/Blotato expand
 * the rest. No git commit, no deploy, no repo bloat.
 *
 * Usage:
 *   node scripts/render-carousel.js <slug> [<slug> ...]
 *   node scripts/render-carousel.js toxin-you-forgot --base http://localhost:3000
 *   node scripts/render-carousel.js read-a-label --local   # also write public/ PNGs
 *
 * Defaults: --base https://toxome.app, --slides 6. Uses system Chrome
 * (override with CHROME_PATH). Needs puppeteer-core + SUPABASE_SERVICE_ROLE_KEY
 * (env or .env.local).
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BUCKET = "carousels";
const W = 1080;
const H = 1350;
const SCALE = 2;

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
function flag(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
}
const BASE = flag("--base", "https://toxome.app").replace(/\/+$/, "");
const SLIDES = Number(flag("--slides", "6"));
const LOCAL = has("--local");
const slugs = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1]?.startsWith("--") !== true);

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

async function main() {
  if (!slugs.length) {
    console.error("Usage: node scripts/render-carousel.js <slug> [<slug> ...] [--base URL] [--slides N] [--local]");
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

  console.log(`Base: ${BASE}  ·  ${SLIDES} slides  ·  → Storage bucket "${BUCKET}"${LOCAL ? " (+ local)" : ""}`);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });

  const covers = {};
  try {
    for (const slug of slugs) {
      console.log(`\n${slug}`);
      const localDir = path.join(__dirname, "..", "public", "carousel", slug);
      if (LOCAL) fs.mkdirSync(localDir, { recursive: true });

      for (let i = 0; i < SLIDES; i++) {
        const url = `${BASE}/studio/carousel?c=${slug}&i=${i}`;
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
          console.error(`  ✗ slide-${i}: ${lastErr ? lastErr.message.split("\n")[0] : "failed"} (after retries)`);
          continue;
        }

        const objectPath = `${slug}/slide-${i}.png`;
        const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
          contentType: "image/png",
          upsert: true,
        });
        if (error) {
          console.error(`  ✗ slide-${i} upload: ${error.message}`);
          continue;
        }
        if (LOCAL) fs.writeFileSync(path.join(localDir, `slide-${i}.png`), buf);
        const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
        if (i === 0) covers[slug] = publicUrl;
        console.log(`  ✓ slide-${i}.png`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone. Carousel covers (use as a draft's media_url, media_type: carousel):`);
  for (const slug of slugs) if (covers[slug]) console.log(`  ${slug}\n    ${covers[slug]}`);
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exit(1);
});
