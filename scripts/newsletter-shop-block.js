/**
 * Builds the "new in the shop" section of the beehiiv newsletter as paste-ready
 * HTML, with product PHOTOS.
 *
 * Why this exists: the issues are written by hand in beehiiv, and the shop
 * section was going out as plain text bullets — ten products, ten prices, zero
 * images. A shopping section with no pictures is the one part of the letter
 * that cannot work as text. beehiiv's Create Post endpoint is enterprise-only
 * (403 SEND_API_NOT_ENTERPRISE_PLAN), so this can't push a draft; it prints
 * HTML you paste into a beehiiv **HTML Snippet** block (Premium section of the
 * editor, any paid plan).
 *
 * Everything is inline-styled and table-based on purpose: beehiiv strips
 * <style> and <link> tags, CSS classes do nothing, and Outlook ignores modern
 * layout. See NEWSLETTER_DESIGN.md for the locked look this renders.
 *
 * Links carry the documented UTM convention (see ~/TOXOME/utm-convention.md):
 * utm_source=beehiiv&utm_medium=email&utm_campaign=<issue slug>. beehiiv's own
 * auto-tagging does not reach inside an HTML Snippet, so an untagged link here
 * would be an uncounted click.
 *
 *   # newest 6 published products
 *   node --env-file=.env.local scripts/newsletter-shop-block.js --campaign=clean-edit-08-06
 *
 *   # hand-picked, in this order
 *   node --env-file=.env.local scripts/newsletter-shop-block.js \
 *     --campaign=footwear-drop --slugs=soludos-dali-mule-espadrille,baabuk-peaks-wooler
 *
 *   # options
 *   --limit=6        how many products when --slugs is not given
 *   --title="..."    section eyebrow (default "new in the shop")
 *   --out=path.html  also write a standalone preview file you can open in a browser
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const THRESHOLDS = require("../lib/fiber-scores.json").thresholds;
// Stored product scores are CLEAN space (higher = cleaner), the inverse of the
// fiber hazard numbers the thresholds are expressed in. Mirrors
// scoreToRiskLevel in lib/fabricScores.ts — do not hardcode 68/40 here, or the
// chip colors drift the next time the bands move.
const CLEAN_GREEN = 100 - THRESHOLDS.lowMax; // 68
const CLEAN_AMBER = 100 - THRESHOLDS.moderateMax; // 40

// Locked brand tokens (DESIGN.md). No black: #3B3C3A is the darkest allowed.
const CREAM = "#FCFBF7";
const WHITE = "#FFFFFF";
const INK = "#3B3C3A";
const INK_2 = "#57636C";
const INK_3 = "#8A9199";
const RISK_LOW = "#ADC89C";
const ORANGE = "#E6A638";
const RED = "#C84242";

const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

// 600px content column, 24px gutter between two cards. beehiiv's own column is
// ~590px and its mobile media queries only target its own classes, never an
// HTML Snippet's inline styles — so the block sizes itself in PERCENTAGES and
// treats 600 as a ceiling, not a floor. A fixed 600px grid here overflows both
// beehiiv's column and every phone.
const CARD_W = 288;
const IMG_W = 288;
const IMG_H = 360; // 4:5 portrait, the shop grid ratio

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreColor(clean) {
  if (clean == null) return INK_3;
  if (clean >= CLEAN_GREEN) return RISK_LOW;
  if (clean >= CLEAN_AMBER) return ORANGE;
  return RED;
}

/** Internal link, tagged per ~/TOXOME/utm-convention.md. */
function productUrl(p, campaign) {
  const slug = p.slug || p.id;
  const q = new URLSearchParams({
    utm_source: "beehiiv",
    utm_medium: "email",
    utm_campaign: campaign,
  });
  return `https://toxome.app/shop/${slug}?${q}`;
}

/**
 * Normalize the product photo to one 4:5 crop so a row of cards lines up.
 * Shopify's CDN (72% of the catalog) crops server-side at 2x, which every mail
 * client honors because the file itself arrives already 4:5. The rest lean on
 * aspect-ratio + object-fit, which Gmail and Apple Mail respect and Outlook's
 * Word engine ignores — there the image keeps its natural height instead of
 * cropping. Acceptable: never broken, just a less tight row.
 */
function imageSrc(url) {
  if (!url) return null;
  if (/cdn\.shopify\.com/i.test(url)) {
    const u = new URL(url);
    u.searchParams.set("width", String(IMG_W * 2));
    u.searchParams.set("height", String(IMG_H * 2));
    u.searchParams.set("crop", "center");
    return u.toString();
  }
  return url;
}

function money(price, currency) {
  if (price == null || price === "") return null;
  const n = Number(price);
  if (!Number.isFinite(n)) return null;
  const sym = { USD: "$", GBP: "£", EUR: "€" }[currency || "USD"];
  // Unknown currency keeps its code rather than silently rendering as dollars
  // (see the open scrape-currency bug).
  return sym ? `${sym}${n % 1 === 0 ? n : n.toFixed(2)}` : `${n} ${currency}`;
}

function card(p, campaign) {
  const href = esc(productUrl(p, campaign));
  const src = imageSrc(p.item_image);
  const name = esc(p.item_name || "");
  const brand = esc(p.brand || "");
  const price = money(p.item_price, p.currency);
  const score = p.toxome_score;
  const chip = scoreColor(score);

  const photo = src
    ? `<a href="${href}" style="text-decoration:none;"><img src="${esc(src)}" width="${IMG_W}" alt="${brand} ${name}" style="display:block;width:100%;max-width:100%;height:auto;aspect-ratio:${IMG_W}/${IMG_H};object-fit:cover;border:0;outline:none;background-color:#EDE9E0;" /></a>`
    : "";

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${CARD_W}px;background-color:${WHITE};">
  <tr><td style="padding:0;">${photo}</td></tr>
  <tr><td style="padding:14px 16px 18px 16px;font-family:${SANS};">
    ${brand ? `<div style="font-size:10px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:${INK_3};padding-bottom:6px;">${brand}</div>` : ""}
    <div style="font-size:15px;font-weight:600;line-height:1.35;color:${INK};padding-bottom:8px;">
      <a href="${href}" style="color:${INK};text-decoration:none;">${name}</a>
    </div>
    <div style="font-size:14px;line-height:1.5;color:${INK_2};padding-bottom:10px;">
      ${score != null ? `<span style="display:inline-block;background-color:${chip};color:${INK};font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;">${score}</span>` : ""}
      ${price ? `<span style="padding-left:${score != null ? "8px" : "0"};">${esc(price)}</span>` : ""}
    </div>
    <div style="font-size:13px;font-weight:600;letter-spacing:0.02em;">
      <a href="${href}" style="color:${INK};text-decoration:underline;">shop it</a>
    </div>
  </td></tr>
</table>`;
}

/** Two per row, in percentages so the pair shrinks together instead of forcing a
 *  600px floor. A media query would be the nicer answer, but beehiiv strips
 *  <style>, so percentage columns are the only mobile behavior available. */
function grid(products, campaign) {
  const rows = [];
  for (let i = 0; i < products.length; i += 2) {
    const left = products[i];
    const right = products[i + 1];
    rows.push(`
  <tr>
    <td width="48%" valign="top" style="width:48%;padding:0 0 28px 0;">${card(left, campaign)}</td>
    <td width="4%" style="width:4%;font-size:0;line-height:0;">&nbsp;</td>
    <td width="48%" valign="top" style="width:48%;padding:0 0 28px 0;">${right ? card(right, campaign) : "&nbsp;"}</td>
  </tr>`);
  }
  return rows.join("\n");
}

function block(products, { campaign, title }) {
  return `<!-- toxome: new in the shop. generated by scripts/newsletter-shop-block.js. paste into a beehiiv HTML Snippet block. -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CREAM};">
  <tr><td align="center" style="padding:8px 0 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
      <tr><td style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:${INK_3};padding-bottom:20px;">${esc(title)}</td></tr>
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${grid(products, campaign)}
        </table>
      </td></tr>
      <tr><td style="font-family:${SANS};font-size:13px;color:${INK_2};padding-top:4px;">
        <a href="https://toxome.app/shop?utm_source=beehiiv&amp;utm_medium=email&amp;utm_campaign=${esc(campaign)}" style="color:${INK};text-decoration:underline;font-weight:600;">see the whole shop</a>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

(async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local)");
    process.exit(1);
  }
  const campaign = arg("campaign");
  if (!campaign) {
    console.error(
      "Missing --campaign=<issue-slug>. Every link out of beehiiv is tagged or the click is uncounted."
    );
    process.exit(1);
  }
  const title = arg("title", "new in the shop");
  const slugs = arg("slugs", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const limit = Number(arg("limit", "6"));

  const supabase = createClient(
    "https://xclvodbmllglmharezqa.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const cols = "id, slug, item_name, brand, item_price, currency, toxome_score, item_image";
  let products;
  if (slugs.length) {
    const { data, error } = await supabase.from("products").select(cols).in("slug", slugs);
    if (error) { console.error(error.message); process.exit(1); }
    // Honor the order the slugs were given in — that's the edit's running order.
    const bySlug = new Map((data || []).map((p) => [p.slug, p]));
    const missing = slugs.filter((s) => !bySlug.has(s));
    if (missing.length) console.error(`! no product for slug: ${missing.join(", ")}`);
    products = slugs.map((s) => bySlug.get(s)).filter(Boolean);
  } else {
    const { data, error } = await supabase
      .from("products")
      .select(cols)
      .eq("published", true)
      .eq("rejected", false)
      .not("item_image", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) { console.error(error.message); process.exit(1); }
    products = data || [];
  }

  const photoless = products.filter((p) => !p.item_image);
  if (photoless.length) {
    // The whole point of the block is the photo. Loudly, rather than shipping a
    // grey box into 1,130 inboxes.
    console.error(`! no item_image, skipped: ${photoless.map((p) => p.item_name).join(", ")}`);
    products = products.filter((p) => p.item_image);
  }
  if (!products.length) {
    console.error("No products with photos matched.");
    process.exit(1);
  }

  const html = block(products, { campaign, title });

  const out = arg("out");
  if (out) {
    const file = path.resolve(out);
    fs.writeFileSync(
      file,
      `<!doctype html><meta charset="utf-8"><title>shop block preview</title><body style="margin:0;background:${CREAM};padding:32px 0;">${html}</body>`
    );
    console.error(`preview written: ${file}`);
  }

  console.error(`${products.length} products, campaign=${campaign}\n`);
  process.stdout.write(html + "\n");
})();
