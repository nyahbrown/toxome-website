/**
 * Repairs product grid images: for every published product whose item_image
 * is dead / hotlink-blocked, swap in the best available gallery image (a clean
 * product photo, preferring canonical CDN URLs and skipping seals/badges/logos).
 *
 *   node --env-file=.env.local scripts/fix-images.js            # apply
 *   node --env-file=.env.local scripts/fix-images.js --dry-run  # preview
 */
const { createClient } = require("@supabase/supabase-js");
const DRY = process.argv.includes("--dry-run");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BADGE = /seal|warranty|badge|logo|swatch|sprite|placeholder/i;

const supabase = createClient(
  "https://xclvodbmllglmharezqa.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function loads(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: "https://toxome.app/", Accept: "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    return res.ok && (res.headers.get("content-type") || "").startsWith("image");
  } catch {
    return false;
  }
}

(async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const { data, error } = await supabase
    .from("products")
    .select("id, brand, item_name, item_image, images")
    .eq("published", true);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  let fixed = 0;
  let stillBroken = 0;
  for (const p of data) {
    if (await loads(p.item_image)) continue;
    // Pick the best gallery image: a real product photo (not a badge/seal),
    // preferring canonical CDN URLs, that actually loads.
    const gallery = (p.images || []).filter((u) => u && !BADGE.test(u));
    gallery.sort((a, b) => (/cdn\.shopify\.com/.test(b) ? 1 : 0) - (/cdn\.shopify\.com/.test(a) ? 1 : 0));
    let replacement = null;
    for (const g of gallery) {
      if (await loads(g)) {
        replacement = g;
        break;
      }
    }
    if (replacement) {
      fixed++;
      console.log(`FIX ${p.brand} / ${p.item_name}\n   -> ${replacement}`);
      if (!DRY)
        await supabase.from("products").update({ item_image: replacement }).eq("id", p.id);
    } else {
      stillBroken++;
      console.log(`NO FIX ${p.brand} / ${p.item_name} (no working gallery image)`);
    }
  }
  console.log(`\n${fixed} ${DRY ? "would be fixed" : "fixed"}, ${stillBroken} still broken (placeholder will show).`);
})();
