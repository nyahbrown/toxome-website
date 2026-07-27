/**
 * Natural-fiber FOOTWEAR adds (opened 2026-07-27). No LLM, no Anthropic API.
 *
 * Footwear is the emptiest category in the catalog (2 unpublished Allbirds rows
 * at the time this was written), so this is the seed script for the shoe lane.
 * List-driven, same contract as scripts/add-women-picks.js: each item is a live
 * PDP Nyah picked, composition is READ OFF THE LIVE PAGE and passed as an
 * explicit `comp` (never guessed), price + brand-CDN images come from the live
 * Shopify product JSON, colorway lives in the description and never in
 * item_name. Inserts as published:false drafts for /admin review.
 *
 *   node --env-file=.env.local scripts/add-footwear.js --draft
 *   node --env-file=.env.local scripts/add-footwear.js --draft --dry   # preview only
 *
 * Footwear scoring caveat: the rubric scores the fiber composition of the
 * UPPER/body. Shoes with a rubber, EVA, or foam outsole have a synthetic part
 * the rubric can't see, so only list shoes whose sole is the same natural
 * material as the upper (or state the sole in the description).
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
// Shop occasion filter matches EXACT Title-Case Lifestyle-5; map legacy → canonical.
const OCC_MAP = { everyday: "Everyday", casual: "Everyday", lounge: "Everyday", sleep: "Everyday", active: "Everyday", resort: "Vacation/Resort", "vacation/resort": "Vacation/Resort", occasion: "Special Occasion", "special occasion": "Special Occasion", evening: "Evening", workwear: "Workwear", work: "Workwear" };
const canonOcc = (arr) => [...new Set((arr || []).map((o) => OCC_MAP[String(o).toLowerCase()] || o))];
const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const materialsFromComp = (c) =>
  !c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");
const toFractions = (c) => {
  const s = Object.values(c).reduce((a, b) => a + b, 0);
  const o = {};
  for (const [k, v] of Object.entries(c)) o[k] = Math.round((v / s) * 1000) / 1000;
  return o;
};

// Every `comp` below was read off the live PDP on 2026-07-27, never guessed.
// `price` is set explicitly wherever the Shopify feed is not USD-base (Ohne
// Project's feed is EUR; the number here is the rendered price on the
// ?currency=USD&country=US page).
const ITEMS = [
  // ---- Kyrgies · handfelted Kyrgyz wool, "zero plastic, only natural elements"
  {
    // PDP: "Made of 100% Kyrgyzstan Wool" + Product Care "crafted from wool
    // felt". Shopify tag `indoor`, 6oz at size 35. Sage in stock all 14 sizes.
    name: "Barefoot Slides", brand: "Kyrgies", category: "Footwear", gender: "Women",
    url: "https://kyrgies.com/products/kyrgies-limited-edition-sage-slides",
    comp: { wool: 100 }, occasion: ["everyday"], price: 89,
    // Colorway-specific shots only — the rest of the gallery is other colorways.
    images: [
      "https://cdn.shopify.com/s/files/1/1970/6781/files/sage-barefoot-slides-limited-edition-6429191.jpg?v=1764915009",
      "https://cdn.shopify.com/s/files/1/1970/6781/files/sage-barefoot-slides-limited-edition-7990479.jpg?v=1764915010",
      "https://cdn.shopify.com/s/files/1/1970/6781/files/sage-barefoot-slides-limited-edition-5264153.jpg?v=1764915010",
    ],
    description:
      "an indoor slide handfelted from 100% kyrgyz wool, with a wide toe box and a flat, flexible sole that lets the foot move the way it wants to. kyrgies builds with zero plastic and only natural elements, so there is no synthetic foam footbed doing the work. wool wicks moisture and breathes, which is why these stay comfortable barefoot. in a soft sage.",
  },
  {
    // PDP: "made from hand-cut wool felt", "non-slip leather sole", Product Care
    // "our leather soled products use VEGETABLE TANNED leather soles rather than
    // the highly toxic chromium normally employed in the tanning process."
    name: "Tengries", brand: "Kyrgies", category: "Footwear", gender: "Women",
    url: "https://kyrgies.com/products/tengries",
    comp: { wool: 100 }, occasion: ["everyday"], price: 99,
    description:
      "the signature kyrgies house shoe: hand-cut wool felt stitched into a snug, flexible fit with hidden elastic so it stays on without a back. the sole is vegetable-tanned leather, not chrome-tanned, which matters because chromium tanning is the toxic part of leather nobody talks about. wool felt upper, no synthetics.",
  },
  {
    // PDP: "Handmade from all-natural felted wool… 100% synthetics-free… 100%
    // biodegradable", sole = cotton canvas + natural rubber (indoor + outdoor).
    name: "Bishkek Kicks", brand: "Kyrgies", category: "Footwear", gender: "Women",
    url: "https://kyrgies.com/products/bishkek-kicks",
    comp: { wool: 100 }, occasion: ["everyday"], price: 99,
    description:
      "a felted wool slip-on built for actual days out, not just the house. the upper is all-natural kyrgyz felt; the sole is cotton canvas and natural rubber. the brand calls it 100% synthetics-free and therefore fully biodegradable, which is a claim almost no sneaker can make. temperature-regulating and breathable, the way wool is.",
  },

  // ---- Ohne Project · barefoot espadrilles with Toni Pons (Spain, USD store)
  {
    // PDP: "HOW WE MADE YOUR ESPADRILLES — Upper: 100% Cotton Canvas. Sole:
    // Natural Jute & Vulcanized Rubber. 10mm stack height."
    // Scored on the upper per the shell convention; jute alone scores 50 and
    // would sink an otherwise clean shoe. Sole is stated in the description.
    // ⚠️ Feed is EUR (€125); $189 is the rendered ?currency=USD&country=US price.
    name: "Barefoot Espadrille 080", brand: "Ohne Project", category: "Footwear", gender: "Women",
    url: "https://ohneproject.com/products/barefoot-espadrilles-080-toni-pons-x-ohne-banana",
    comp: { cotton: 100 }, occasion: ["everyday", "resort"], price: 189,
    description:
      "a barefoot espadrille made with toni pons, the catalan house that has been hand-stitching them since 1946. the upper is 100% cotton canvas, the sole is natural jute and vulcanized rubber, and there is no insole at all, so nothing sits between the foot and the ground but plant fiber. wide toe box, 10mm stack, double lace. in banana yellow.",
  },
  {
    // Same materials block as the 080. Feed EUR €110; $179 rendered in USD.
    name: "Barefoot Espadrille 026", brand: "Ohne Project", category: "Footwear", gender: "Women",
    url: "https://ohneproject.com/products/barefoot-espadrilles-026-toni-pons-x-ohne-sand",
    comp: { cotton: 100 }, occasion: ["everyday", "resort"], price: 179,
    description:
      "the lower, quieter cut of the toni pons collaboration: 100% cotton canvas over a natural jute and vulcanized rubber sole, built with no insole so the foot stays close to the ground. wide toe box and true flex. in a soft sand.",
  },

  // ---- Baabuk · Swiss wool footwear, US storefront at /en-us (feed is USD)
  {
    // PDP materials block: "Upper: 100% Burel Wool from Swiss Blacknose +
    // MIRUM® plant-based leather alternative · Lining: 100% Wool Burel ·
    // Insole: Sisal fiber + Natural latex foam + 100% Burel felted Wool ·
    // Laces: 30% Cotton OEKO-TEX + 70% Natural latex · Sole: PLIANT® 100%
    // biobased from natural rubber · Strobel: Eucalyptus TENCEL + plant PLA."
    // Baabuk files this under a "PlasticFree" product type.
    name: "Shunya Wooler", brand: "Baabuk", category: "Footwear", gender: "Women",
    url: "https://www.baabuk.com/en-us/products/shunya-wooler-white",
    comp: { wool: 100 }, occasion: ["everyday"], price: 248,
    description:
      "the rare sneaker with no plastic anywhere in it. upper and lining are 100% burel wool from swiss blacknose sheep, the sole is 100% biobased natural rubber, the insole is sisal and natural latex, the laces are oeko-tex cotton and latex, and even the stitching thread is wool. a normal sneaker is a plastic object; this one is a wool object. in white.",
  },
  {
    // PDP: "Materials: 100% natural wool uppers. The inner-lining is made of a
    // soft recycled merino blend. The insole is Portuguese cork mixed with
    // natural latex. Featuring 100% latex rubber outsole." Handmade in Portugal.
    name: "Mary Jane Sandal", brand: "Baabuk", category: "Footwear", gender: "Women",
    url: "https://www.baabuk.com/en-us/products/sandal-mary-jane-grey",
    comp: { wool: 100 }, occasion: ["everyday", "resort"], price: 186,
    description:
      "a wool mary jane with an adjustable buckle, handmade in portugal. the upper is 100% natural wool, the lining is recycled merino, the insole is portuguese cork blended with natural latex, and the outsole is 100% latex rubber. no eva, no polyurethane footbed. in grey.",
  },
  {
    // PDP: first sneaker made from real Pyrenees wool, with Laines Paysannes.
    // "Upper: 100% Pyrenean wool · Laces: 100% Roussillon Red sheep's wool ·
    // Insole: sisal fibre + natural latex foam + 100% Laines Paysannes wool ·
    // Leather: REACH certified." Outsole is rubber.
    name: "Peaks Wooler", brand: "Baabuk", category: "Footwear", gender: "Women",
    url: "https://www.baabuk.com/en-us/products/peaks-wooler-warm-grey",
    comp: { wool: 100 }, occasion: ["everyday"], price: 224,
    description:
      "a sneaker made from real pyrenean wool with laines paysannes, down to the laces, which are 100% roussillon red sheep's wool. the insole is sisal fibre and natural latex foam rather than synthetic foam, and the leather trim is reach certified. wool insulates in winter and stays cool in summer, so it works year round. in warm grey.",
  },
];

async function fetchProductJSON(url) {
  const base = url.split("?")[0].replace(/\/$/, "");
  const r = await fetch(base + ".json", { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return null;
  const p = (await r.json()).product;
  if (!p) return null;
  const prices = p.variants.map((v) => Number(v.price)).filter((n) => n > 0);
  return {
    price: prices.length ? Math.min(...prices) : null,
    currency: p.variants[0]?.price_currency || null,
    images: (p.images || []).map((i) => i.src).filter(Boolean),
  };
}

async function addOne(supabase, item, live, dry) {
  const meta = await fetchProductJSON(item.url);
  if (!meta) return { skip: "no product JSON" };
  // Currency trap guard: never trust a feed price that isn't USD (see the
  // Organic Zoo / Kowtow / Pantee misfires in the sourcing notes). An explicit
  // `price` means the USD number was read off the localized storefront by hand,
  // so the feed's currency no longer matters.
  if (item.price == null && meta.currency && meta.currency !== "USD") {
    return { skip: `non-USD feed (${meta.currency}) and no explicit price` };
  }

  // Explicit colorway images win; otherwise take the feed gallery.
  const images = (item.images && item.images.length ? item.images : meta.images).slice(0, 6);
  if (images.length < 2) return { skip: "fewer than 2 images" };

  const dupUrl = item.url.split("?")[0];
  const { data: dup } = await supabase.from("products").select("id").eq("item_url", dupUrl).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };

  const frac = toFractions(item.comp);
  const score = calcToxomeScore(frac);
  if (score == null) return { skip: "unscoreable comp" };
  if (score < 67) return { skip: `score ${score} below the 67 bar` };

  const price = item.price ?? meta.price;
  const row = {
    item_name: item.name, brand: item.brand,
    item_price: price, currency: "USD", budget: budget(price),
    category: item.category, gender: item.gender, occasion: canonOcc(item.occasion),
    item_image: images[0], images, item_url: dupUrl, affiliate_url: null,
    fabric_composition: frac, materials_text: materialsFromComp(item.comp),
    description: item.description, certifications: item.certifications ?? null,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !!live, rejected: false, added_by: "agent", reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-footwear", "no-llm"],
  };
  if (dry) return { ok: true, id: "(dry-run)", score, price, comp: frac, imgs: images.length };

  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  return { ok: true, id: data.id, score, price, comp: frac, imgs: images.length };
}

async function run() {
  const dry = process.argv.includes("--dry");
  const live = !process.argv.includes("--draft");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, key);

  let n = 0;
  const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live, dry);
    if (r.ok) {
      n++;
      console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(9)} ${item.gender.padEnd(7)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${JSON.stringify(r.comp)} · ${r.imgs} imgs · ${r.id}`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} ${dry ? "would insert (DRY RUN)" : `inserted as ${live ? "LIVE" : "drafts"}`}.`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
