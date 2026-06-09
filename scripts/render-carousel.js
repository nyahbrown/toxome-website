#!/usr/bin/env node
/**
 * render-carousel — screenshot studio carousel slides to PNGs.
 *
 * Drives /studio/carousel?c=<slug>&i=<n> in a headless browser and writes each
 * slide to public/carousel/<slug>/slide-<n>.png at 1080×1350 (2× for crispness).
 * Commit the PNGs and they're served at /carousel/<slug>/slide-<n>.png — exactly
 * what the content dashboard + Blotato expect for a carousel.
 *
 * Usage:
 *   node scripts/render-carousel.js <slug> [<slug> ...]
 *   node scripts/render-carousel.js toxin-you-forgot --base http://localhost:3000
 *   node scripts/render-carousel.js read-a-label --slides 6
 *
 * Defaults: --base https://toxome.app, --slides 6. Uses system Chrome
 * (override with CHROME_PATH env). Requires puppeteer-core (devDependency).
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const W = 1080;
const H = 1350;
const SCALE = 2;

const argv = process.argv.slice(2);
function flag(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
}
const BASE = (flag("--base", "https://toxome.app")).replace(/\/+$/, "");
const SLIDES = Number(flag("--slides", "6"));
const slugs = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1]?.startsWith("--") !== true);

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((p) => fs.existsSync(p));
}

async function main() {
  if (!slugs.length) {
    console.error("Usage: node scripts/render-carousel.js <slug> [<slug> ...] [--base URL] [--slides N]");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error("✗ No Chrome found. Install Chrome or set CHROME_PATH=/path/to/chrome");
    process.exit(1);
  }

  console.log(`Base: ${BASE}  ·  ${SLIDES} slides each  ·  Chrome: ${path.basename(chrome)}`);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });

  try {
    for (const slug of slugs) {
      const outDir = path.join(__dirname, "..", "public", "carousel", slug);
      fs.mkdirSync(outDir, { recursive: true });
      console.log(`\n${slug} → ${path.relative(path.join(__dirname, ".."), outDir)}/`);

      for (let i = 0; i < SLIDES; i++) {
        const page = await browser.newPage();
        await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
        const url = `${BASE}/studio/carousel?c=${slug}&i=${i}`;
        const res = await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
        if (!res || !res.ok()) {
          console.error(`  ✗ slide ${i}: HTTP ${res ? res.status() : "no response"} (${url})`);
          await page.close();
          continue;
        }
        // Let fonts + images settle so type and photos aren't half-painted.
        await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
        await new Promise((r) => setTimeout(r, 350));

        const file = path.join(outDir, `slide-${i}.png`);
        await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } });
        console.log(`  ✓ slide-${i}.png`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`\nDone. Commit public/carousel/** and deploy so the slides are public.`);
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exit(1);
});
