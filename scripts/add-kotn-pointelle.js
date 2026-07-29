/**
 * Kotn — Dalia Pointelle collection (2026-07-24). No LLM, no Anthropic API.
 *
 * Source: https://kotn.com/collections/pointelle — 6 products = 3 styles × 2
 * colourways (White / Deep Ocean). Per the no-colourway-in-name rule this
 * collapses to ONE colourway per style; White is picked over Deep Ocean
 * (a near-black charcoal-navy) to stay inside the neutral/lighter women's rule.
 *
 * ⚠️ Kotn is NOT Shopify-collection-accessible (/products.json 404s) — it is a
 * headless Next.js storefront. Real data lives in the collection page's
 * __NEXT_DATA__ under props.pageProps.initialProducts, including per-size
 * availability and a presentmentPrices array with a true USD amount (the
 * rendered page shows CAD on the .ca storefront — never scrape the visible
 * price).
 *
 * ⚠️ COMPOSITION IS NOT IN THE HTML. These are new FW26 styles whose Sanity CMS
 * records are still empty (description/details all blank), so the only "100%
 * Egyptian cotton" strings in the markup are brand boilerplate + recommended
 * products. Composition was read off the LIVE PDP in a browser: all three state
 * "100% organic cotton pointelle" → score 92 (NOT the 84 that Kotn's plain
 * Egyptian-cotton styles get). Passed here as an explicit comp override.
 *
 *   node --env-file=.env.local scripts/add-kotn-pointelle.js --dry
 *   node --env-file=.env.local scripts/add-kotn-pointelle.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const COLLECTION = "https://kotn.com/collections/pointelle";
const BRAND = "Kotn";
const OC = { "organic cotton": 100 };
const CERTS = ["OEKO-TEX Standard 100", "B Corp"];
const UA = { "User-Agent": "Mozilla/5.0" };

const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const materialsFromComp = (c) =>
  !c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");

// occasion[] must use the LOCKED Lifestyle-5 Title-Case strings. Knits = Everyday + Workwear.
const KNIT = ["Everyday", "Workwear"];

const ITEMS = [
  { handle: "womens-dalia-pointelle-top-in-white", name: "Dalia Pointelle Top",
    category: "Tops", occasion: KNIT,
    desc: "a slim pointelle knit tee in 100% organic cotton, the open needle-out stitch letting air move through instead of trapping it the way a poly knit does. in a soft white." },
  { handle: "womens-dalia-pointelle-3-4-sleeve-in-white", name: "Dalia Pointelle 3/4 Sleeve",
    category: "Tops", occasion: KNIT,
    desc: "a close-fitting 3/4 sleeve top knit in 100% organic cotton pointelle, light enough to layer and breathable straight against skin. in a soft white." },
  { handle: "womens-dalia-pointelle-cardigan-in-white", name: "Dalia Pointelle Cardigan",
    category: "Sweaters", occasion: KNIT,
    desc: "a fine-gauge button cardigan in 100% organic cotton pointelle, a real cotton knit layer with no acrylic or nylon blended in for cheapness. in a soft white." },
];

async function loadCollection() {
  const html = await (await fetch(COLLECTION, { headers: UA })).text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("no __NEXT_DATA__ on the collection page");
  const products = JSON.parse(m[1]).props?.pageProps?.initialProducts || [];
  return new Map(products.map((p) => [p.handle, p]));
}

function usdPrice(product) {
  for (const v of product.variants || []) {
    const usd = (v.presentmentPrices || []).find((p) => p.price?.currencyCode === "USD");
    if (usd) return parseFloat(usd.price.amount);
  }
  return null;
}

function build(item, product) {
  if (!product) return { skip: "not in collection feed" };

  const price = usdPrice(product);
  if (price == null) return { skip: "no USD price" };

  const images = (product.images || []).map((i) => i.w800).filter(Boolean);
  if (images.length < 2) return { skip: `only ${images.length} image(s)` };

  const variants = product.variants || [];
  const inStock = variants.filter((v) => v.availableForSale).length;
  if (!inStock) return { skip: "sold out" };
  const thin = inStock < Math.ceil(variants.length / 2);
  if (thin) return { skip: `thin stock ${inStock}/${variants.length}` };

  const score = calcToxomeScore(OC);
  if (score == null) return { skip: "unscoreable" };

  const tags = ["batch-kotn-pointelle", "no-llm"];
  // XS/S gone on some styles — flag anything not fully sized for /admin.
  if (inStock < variants.length) tags.push("stock-verify");

  const url = `https://kotn.com/products/${item.handle}`;
  return {
    url, price, score, inStock, total: variants.length,
    sizesOut: variants.filter((v) => !v.availableForSale)
      .map((v) => v.selectedOptions?.find((o) => o.name === "Size")?.value).filter(Boolean),
    row: {
      item_name: item.name,
      brand: BRAND,
      item_price: price,
      currency: "USD",
      budget: budget(price),
      category: item.category,
      gender: "Women",
      occasion: item.occasion,
      item_image: images[0],
      images: images.slice(0, 6),
      item_url: url,
      affiliate_url: null,
      fabric_composition: OC,
      materials_text: materialsFromComp(OC),
      description: item.desc,
      certifications: CERTS,
      toxome_score: score,
      risk_level: scoreToRiskLevel(score),
      published: false,
      rejected: false,
      added_by: "agent",
      reviewed_at: null,
      tags,
    },
  };
}

async function run() {
  const dry = process.argv.includes("--dry");
  const draft = process.argv.includes("--draft");
  if (!dry && !draft) {
    console.error("Pass --dry (preview) or --draft (insert as published:false).");
    process.exit(1);
  }

  let supabase = null;
  if (!dry) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
    supabase = createClient(SUPABASE_URL, key);
  }

  const feed = await loadCollection();
  console.log(`collection feed: ${feed.size} products (${[...feed.keys()].length} handles)\n`);

  let n = 0;
  const failed = [];
  for (const item of ITEMS) {
    const built = build(item, feed.get(item.handle));
    if (built.skip) {
      failed.push(`${item.name}: ${built.skip}`);
      console.log(`✗    ${item.name}  (${built.skip})`);
      continue;
    }

    if (!dry) {
      const { data: dup } = await supabase
        .from("products").select("id").eq("item_url", built.url).maybeSingle();
      if (dup) {
        failed.push(`${item.name}: dup ${dup.id.slice(0, 8)}`);
        console.log(`✗    ${item.name}  (dup ${dup.id.slice(0, 8)})`);
        continue;
      }
      const { error } = await supabase.from("products").insert(built.row).select("id").single();
      if (error) {
        failed.push(`${item.name}: insert ${error.message}`);
        console.log(`✗    ${item.name}  (insert: ${error.message})`);
        continue;
      }
    }

    n++;
    console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(9)} ${item.name}`);
    console.log(
      `     $${built.price} · score ${built.score} · ${materialsFromComp(OC)} · ` +
      `${built.row.images.length} imgs · stock ${built.inStock}/${built.total}` +
      `${built.sizesOut.length ? ` (out: ${built.sizesOut.join(",")})` : ""} · ` +
      `occ ${JSON.stringify(item.occasion)}`
    );
  }

  console.log(`\n${n}/${ITEMS.length} ${dry ? "would insert (DRY RUN, no writes)" : "inserted as drafts (published:false)"}.`);
  if (failed.length) console.log("skipped:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
