/**
 * Women's clothing UNDER $50 (2026-07-13). No LLM, no Anthropic API.
 *
 * Page-grounded validate + score + draft, same path as add-women-under100.js
 * (includes the full-page composition recovery for JS-rendered fabric lines).
 *
 * Sourcing notes for this price band:
 *  - Pact is fully JS-rendered (no price/fiber/JSON-LD in HTML) -> unscrapeable, excluded.
 *  - Pantee (notbasics.co.uk) prices in GBP and Kowtow's default store in NZD.
 *    Kowtow is re-pointed at us.kowtowclothing.com (USD); Pantee is dropped (UK only).
 *  - Under $50 in clean fiber is mostly basics/underwear. That is the real market,
 *    not a shortcut: cheap clothing is cheap because it is polyester.
 *
 *   node --env-file=.env.local scripts/add-women-under50.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BLACKLIST = require("../lib/brandBlacklist.json").map((b) => b.toLowerCase().trim());
const isBlacklisted = (b) => !!b && BLACKLIST.some((x) => b.toLowerCase().includes(x));
const SCORE_BAR = 67;
const MAX_PRICE = 50;

const EVERY = ["Everyday"];
const RESORT = ["Everyday", "Vacation/Resort"];

const ITEMS = [
  // ---- BOTTOMS ------------------------------------------------------------
  { brand: "Jungmaven", name: "Chennai Short", category: "Bottoms", occasion: RESORT,
    url: "https://jungmaven.com/products/hemp-short-chennai",
    description: "A pull-on short in 100% hemp, cut and sewn in Los Angeles. Hemp breathes and keeps its shape, so it wears cool through a hot day instead of clinging." },
  { brand: "Rawganique", name: "Arizona Elastic-Free Organic Cotton Shorts", category: "Bottoms", occasion: EVERY,
    url: "https://rawganique.com/products/arizona-elastic-free-100-organic-cotton-no-frills-shorts-made-in-usa",
    description: "A simple short in 100% organic cotton, grown and sewn in the USA with no elastic, no polyester and no synthetics anywhere in it. Drawstring instead of a rubber waistband, which is where most shorts hide their plastic." },
  { brand: "Threads 4 Thought", name: "Alayna Gauze Short", category: "Bottoms", occasion: RESORT,
    url: "https://www.threads4thought.com/products/alayna-gauze-shortoyster",
    description: "An airy 100% organic cotton gauze short. The double-gauze weave traps a little air, so it stays light and breathable in real heat. Shown in oyster." },
  { brand: "Threads 4 Thought", name: "Angelina Breezy Linen Short", category: "Bottoms", occasion: RESORT,
    url: "https://www.threads4thought.com/products/angelina-breezy-linen-short-sand",
    description: "A linen and lyocell short with a soft, fluid drape. Linen breathes, lyocell keeps it from creasing into oblivion. Shown in sand." },

  // ---- DRESSES (the sub-$50 void) ----------------------------------------
  { brand: "Threads 4 Thought", name: "Alexis Breezy Linen Romper", category: "Dresses", occasion: RESORT,
    url: "https://www.threads4thought.com/products/alexis-breezy-linen-romper-sand",
    description: "A one-and-done linen-blend romper in a relaxed, breezy cut. Linen keeps it cool and the lyocell gives it a soft fall rather than a stiff one. Shown in sand." },

  // ---- TOPS ---------------------------------------------------------------
  { brand: "Kowtow", name: "Ridge Tee", category: "Tops", occasion: EVERY,
    url: "https://us.kowtowclothing.com/products/building-block-ridge-tee-off-white",
    description: "A clean-lined tee in 100% Fairtrade organic cotton. Kowtow builds without plastic, down to the thread and the buttons. Heavy enough to hold its shape and not go sheer. Shown in off-white." },
  { brand: "Kowtow", name: "Singlet Top", category: "Tops", occasion: EVERY,
    url: "https://us.kowtowclothing.com/products/building-block-singlet-top-marble",
    description: "A ribbed organic cotton singlet, Fairtrade certified and made without synthetics. The layering piece that goes under everything. Shown in marble." },
  { brand: "Kowtow", name: "Box Tee", category: "Tops", occasion: EVERY,
    url: "https://us.kowtowclothing.com/products/building-block-box-tee-marble",
    description: "A boxy, squared-off tee in 100% Fairtrade organic cotton. Kowtow builds plastic-free right down to the thread, so there is no polyester hiding in the seams. Shown in marble." },
  { brand: "Kowtow", name: "Unity Tee", category: "Tops", occasion: EVERY,
    url: "https://us.kowtowclothing.com/products/building-block-unity-tee-off-white",
    description: "A relaxed organic cotton tee with a clean neckline, Fairtrade certified and made without synthetics. Heavy enough to keep its shape wash after wash. Shown in off-white." },
  { brand: "Groceries Apparel", name: "Scoop Tank", category: "Tops", occasion: EVERY,
    url: "https://groceriesapparel.com/products/scoop-tank",
    description: "A soft scoop-neck tank in 100% organic cotton, cut and sewn in Los Angeles. No blend, no plastic, nothing that traps heat against you." },
  { brand: "Groceries Apparel", name: "Swoop Neck Tee", category: "Tops", occasion: EVERY,
    url: "https://groceriesapparel.com/products/swoop-neck-tee",
    description: "An easy 100% organic cotton tee with a low swooped neckline. Made in LA, breathable, and free of the polyester most cheap tees are cut with." },
  { brand: "Vital Hemp", name: "Racer Back Hemp Tank", category: "Tops", occasion: EVERY,
    url: "https://www.vitalhemp.com/products/womens-racer-back-tank-top",
    description: "A racerback tank in hemp and organic cotton, made in Los Angeles. Hemp is naturally breathable and odour-resistant, which is the thing synthetic activewear keeps promising and failing to do." },
  { brand: "Vital Hemp", name: "Racer Back Hemp Lyocell Tank", category: "Tops", occasion: EVERY,
    url: "https://www.vitalhemp.com/products/womens-racer-back-tank-top-ht",
    description: "The hemp and lyocell version of the racerback, with a softer, more fluid hand. Both fibers breathe, so it stays cool against the skin." },
  { brand: "WAMA", name: "Hemp Crew Neck T-Shirt", category: "Tops", occasion: EVERY,
    url: "https://wamaunderwear.com/products/hemp-crew-neck-t-shirt",
    description: "A hemp and organic cotton crew tee, OEKO-TEX certified. Hemp gets softer with every wash instead of thinning out, so this outlasts the tees it replaces." },

  // ---- INTIMATES ----------------------------------------------------------
  { brand: "Jungmaven", name: "Hemp Bralette", category: "Intimates", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-bra-top",
    description: "A soft, unstructured bralette in 100% hemp. No foam cup, no polyester lining, no underwire. Just a breathable natural fiber against skin that is covered all day." },
  { brand: "Jungmaven", name: "Hemp Triangle Bra", category: "Intimates", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-bra-triangle",
    description: "A simple triangle bra in 100% hemp, made in Los Angeles. Most bras are a stack of polyester, foam and elastane. This one is not." },
  { brand: "Jungmaven", name: "Hemp Mesh Bralette", category: "Intimates", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-bralette-mesh",
    description: "An open hemp mesh bralette, light and completely breathable. 100% hemp, no synthetic lining, and airy enough to forget you have it on." },
  { brand: "Groceries Apparel", name: "Cami Bralette", category: "Intimates", occasion: EVERY,
    url: "https://groceriesapparel.com/products/cami-bralette",
    description: "A cami-style bralette in organic cotton with a touch of stretch, made in Los Angeles. Soft, wireless, and free of the foam and polyester most bras are built from." },
  { brand: "Groceries Apparel", name: "Ribbed V-Bra", category: "Intimates", occasion: EVERY,
    url: "https://groceriesapparel.com/products/ribbed-v-bra",
    description: "A ribbed V-front bra in TENCEL lyocell and organic cotton, GOTS certified. Smooth, breathable and made in LA, with no moulded foam cup." },
  { brand: "Groceries Apparel", name: "Scoop Bralette", category: "Intimates", occasion: EVERY,
    url: "https://groceriesapparel.com/products/422-bralette",
    description: "A scoop-neck bralette in organic cotton, cut and sewn in Los Angeles. Wireless, unlined, and soft enough to sleep in." },
  { brand: "MATE the Label", name: "Organic Comfort Cami", category: "Intimates", occasion: EVERY,
    url: "https://matethelabel.com/products/organic-comfort-cami-bone",
    description: "A GOTS organic cotton cami with a hint of stretch. The layering piece you wear against bare skin all day, which makes the fiber worth caring about. Shown in bone." },

  // ---- UNDERWEAR (live count is only 5 — the thinnest women's category) ---
  { brand: "Jungmaven", name: "Hemp High Waist Brief", category: "Underwear", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-brief-high-waist-ladies",
    description: "A high-waist brief in 100% hemp. Underwear sits against the most absorbent skin on your body all day, so the fiber matters more here than almost anywhere else." },
  { brand: "Jungmaven", name: "Hemp Boy Short", category: "Underwear", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-short-boy",
    description: "A boy-short cut in 100% hemp, made in Los Angeles. Breathable and naturally odour-resistant, with no polyester gusset." },
  { brand: "Jungmaven", name: "Hemp Mesh Bikini Brief", category: "Underwear", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-bikini-brief-mesh",
    description: "A light hemp mesh bikini brief. Fully breathable, 100% hemp, and free of the synthetic lace and elastane trim most underwear relies on." },
  { brand: "Blue Canoe", name: "Organic Cotton Bikini Panty", category: "Underwear", occasion: EVERY,
    url: "https://www.bluecanoe.com/products/organic-cotton-bikini-panty",
    description: "A classic bikini in 100% organic cotton. Grown without the pesticides conventional cotton leans on, and soft enough to forget about." },
  { brand: "Blue Canoe", name: "Organic Cotton Boy Short", category: "Underwear", occasion: EVERY,
    url: "https://www.bluecanoe.com/products/all-cotton-boy-short",
    description: "An all-cotton boy short with full coverage and no synthetic panel. Breathable organic cotton where it counts." },
  { brand: "Blue Canoe", name: "Lace Full Brief", category: "Underwear", occasion: EVERY,
    url: "https://www.bluecanoe.com/products/lace-full-brief",
    description: "A full brief in organic cotton with a soft lace trim. Breathable, high-coverage, and free of the polyester that lines most 'cotton' underwear." },
  { brand: "Rawganique", name: "Angie Organic Cotton Boy Shorts", category: "Underwear", occasion: EVERY,
    url: "https://rawganique.com/products/organic-cotton-boy-shorts-biodegradable",
    description: "Boy shorts in 100% organic cotton with no polyester, no elastane and no synthetic thread. Even the waistband is organic. Sewn in the USA and fully biodegradable." },
  { brand: "Rawganique", name: "Bardot Organic Pima Cotton Bikini", category: "Underwear", occasion: EVERY,
    url: "https://rawganique.com/products/organic-prima-cotton-french-high-cut-bikini-bardot",
    description: "A French high-cut bikini in 100% organic pima cotton, grown and made in the USA. No synthetics, no plastic thread, and almost entirely biodegradable." },
  { brand: "Rawganique", name: "Aphrodite Organic Cotton Contour Bikini", category: "Underwear", occasion: EVERY,
    url: "https://rawganique.com/products/organic-prima-cotton-contour-bikini-aphrodite",
    description: "A contour bikini in organic pima cotton, made in Europe. Soft, breathable and free of the synthetic blends most underwear hides under a cotton label." },
  { brand: "Kowtow", name: "Boxer Shorts", category: "Underwear", occasion: EVERY,
    url: "https://us.kowtowclothing.com/products/boxer-shorts-06-cloud",
    description: "A relaxed boxer short in Fairtrade organic cotton, built plastic-free from thread to trim. Loose, breathable and easy to sleep in. Shown in cloud." },

  // ---- LOUNGEWEAR ---------------------------------------------------------
  { brand: "Rawganique", name: "Austin Elastic-Free Organic Cotton Sweatpants", category: "Loungewear", occasion: EVERY,
    url: "https://rawganique.com/products/elastic-free-organic-cotton-jammy-sweatpants-made-in-usa-austin",
    description: "Lightweight lounge sweatpants in organic cotton with a drawstring instead of elastic. No rubber waistband, no polyester fleece, nothing synthetic against you while you sleep." },
];

const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
function toFractions(comp) {
  if (!comp || typeof comp !== "object") return null;
  const e = Object.entries(comp).map(([k, v]) => [k.toLowerCase().trim(), Number(v)]).filter(([k, v]) => k && v > 0);
  if (!e.length) return null;
  const s = e.reduce((a, [, v]) => a + v, 0);
  const o = {};
  for (const [k, v] of e) o[k] = Math.round((v / s) * 1000) / 1000;
  return o;
}
const materialsFromComp = (c) =>
  !c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${Math.round(v * 100)}% ${k}`).join(", ");

const CUT = /(customer reviews|write a review|you may also like|related products|pairs well with|complete the look|recently viewed)/i;
function cleanText(html) {
  return String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function normFiber(raw) {
  const s = raw.toLowerCase();
  if (/tencel|lyocell/.test(s)) return "lyocell";
  if (/organic\s+cotton/.test(s)) return "organic cotton";
  if (/pima|supima|cotton/.test(s)) return "cotton";
  if (/flax|linen/.test(s)) return "linen";
  if (/hemp/.test(s)) return "hemp";
  if (/silk/.test(s)) return "silk";
  if (/merino|wool/.test(s)) return "wool";
  if (/viscose|rayon/.test(s)) return "viscose";
  if (/modal/.test(s)) return "modal";
  if (/polyester/.test(s)) return "polyester";
  if (/nylon|polyamide/.test(s)) return "nylon";
  if (/elastane|spandex|lycra/.test(s)) return "elastane";
  return null;
}
const RX = /(\d{1,3})\s*%\s*([A-Za-z®™\-\s]{3,40})/g;
function recoverComp(html) {
  const body = cleanText(html).split(CUT)[0];
  const found = []; let m; RX.lastIndex = 0;
  while ((m = RX.exec(body))) {
    const pct = Number(m[1]); const fiber = normFiber(m[2]);
    if (!fiber || !(pct > 0 && pct <= 100)) continue;
    found.push({ pct, fiber });
  }
  if (!found.length) return null;
  for (let start = 0; start < Math.min(found.length, 4); start++) {
    const comp = {}; let sum = 0;
    for (let i = start; i < found.length && sum < 100; i++) {
      const f = found[i]; if (comp[f.fiber]) continue;
      comp[f.fiber] = f.pct; sum += f.pct;
    }
    if (sum >= 97 && sum <= 103) return comp;
  }
  const h = found.find((f) => f.pct === 100);
  return h ? { [h.fiber]: 100 } : null;
}

async function addOne(supabase, item, live) {
  if (isBlacklisted(item.brand)) return { skip: `${item.brand} blacklisted` };
  const v = await getValidatedProduct(item.url);
  if (!v.ok) return { skip: v.reason };

  const price = typeof v.price === "number" ? v.price : null;
  if (price == null || price >= MAX_PRICE) return { skip: `price $${price} not under $${MAX_PRICE}` };

  let comp = toFractions(v.composition);
  if (!comp) { try { comp = toFractions(recoverComp((await fetchPage(v.finalUrl)).html)); } catch {} }
  if (!comp) return { skip: "no composition" };
  const score = calcToxomeScore(comp);
  if (score == null || score < SCORE_BAR) return { skip: `score ${score} below bar` };

  const { data: dup } = await supabase.from("products").select("id").eq("item_url", v.finalUrl).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };

  const row = {
    item_name: item.name, brand: item.brand,
    item_price: price, currency: "USD", budget: budget(price),
    category: item.category, gender: "Women", occasion: item.occasion,
    item_image: v.images[0], images: v.images, item_url: v.finalUrl, affiliate_url: null,
    fabric_composition: comp, materials_text: materialsFromComp(comp),
    description: item.description,
    certifications: v.certifications && v.certifications.length ? v.certifications : null,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !!live, rejected: false, added_by: "manual", reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-women-under50", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  return { ok: true, id: data.id, score, price, certs: row.certifications, comp, imgs: v.images.length };
}

async function run() {
  const live = !process.argv.includes("--draft");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, key);

  let n = 0; const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live);
    if (r.ok) {
      n++;
      console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(11)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${JSON.stringify(r.comp)} · ${r.certs ? r.certs.join("/") : "no certs"} · ${r.imgs} imgs`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as ${live ? "LIVE" : "drafts"}.`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
