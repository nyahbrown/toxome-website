/**
 * Women's clothing UNDER $100 (2026-07-12). No LLM, no Anthropic API.
 *
 * Same page-grounded validate + score + draft path as add-home-certified.js.
 * `comp` is only passed where the brand renders its fabric line via JS (past
 * scrape.js's 20k pageText window); it is read off the live PDP, never guessed.
 * Every URL is pinned to a NEUTRAL colorway and every item_name is colorway-free.
 *
 *   node --env-file=.env.local scripts/add-women-under100.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// --- page-grounded composition recovery -------------------------------------
// scrape.js truncates its pageText scan at 20k chars, so on nav-heavy stores the
// fabric line falls outside the window and composition comes back null. The text
// IS on the page. We re-scan the FULL page, cutting at review / related-product
// markers first so a customer review ("100% cotton and I love it") can never be
// mistaken for a spec. Regex only. No LLM.
const CUT = /(customer reviews|write a review|you may also like|related products|pairs well with|complete the look|recently viewed|you might also)/i;
function cleanText(html) {
  return String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function normFiber(raw) {
  const s = raw.toLowerCase();
  if (/ecovero/.test(s)) return "ecovero";
  if (/tencel[^a-z]*modal/.test(s)) return "tencel modal";
  if (/tencel|lyocell/.test(s)) return "lyocell";
  if (/organic\s+cotton|gots\s+cotton/.test(s)) return "organic cotton";
  if (/pima|supima|egyptian|cotton/.test(s)) return "cotton";
  if (/european\s*flax|flax|linen/.test(s)) return "linen";
  if (/merino/.test(s)) return "merino wool";
  if (/alpaca/.test(s)) return "alpaca";
  if (/cashmere/.test(s)) return "cashmere";
  if (/\bwool\b/.test(s)) return "wool";
  if (/hemp/.test(s)) return "hemp";
  if (/mulberry|silk/.test(s)) return "silk";
  if (/bamboo[^a-z]*(viscose|rayon)|viscose|rayon/.test(s)) return "viscose";
  if (/modal/.test(s)) return "modal";
  if (/ramie/.test(s)) return "ramie";
  if (/polyester/.test(s)) return "polyester";
  if (/nylon|polyamide/.test(s)) return "nylon";
  if (/elastane|spandex|lycra/.test(s)) return "elastane";
  if (/acrylic/.test(s)) return "acrylic";
  return null;
}
const FIBER_RX = /(\d{1,3})\s*%\s*([A-Za-z®™\-\s]{3,40})/g;
function recoverComp(html) {
  const body = cleanText(html).split(CUT)[0];
  const found = [];
  let m;
  FIBER_RX.lastIndex = 0;
  while ((m = FIBER_RX.exec(body))) {
    const pct = Number(m[1]);
    if (!(pct > 0 && pct <= 100)) continue;
    const fiber = normFiber(m[2]);
    if (!fiber) continue;
    found.push({ pct, fiber });
  }
  if (!found.length) return null;
  for (let start = 0; start < Math.min(found.length, 4); start++) {
    const comp = {}; let sum = 0;
    for (let i = start; i < found.length && sum < 100; i++) {
      const f = found[i];
      if (comp[f.fiber]) continue;
      comp[f.fiber] = f.pct; sum += f.pct;
    }
    if (sum >= 97 && sum <= 103) return comp;
  }
  const h = found.find((f) => f.pct === 100);
  return h ? { [h.fiber]: 100 } : null;
}

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BLACKLIST = require("../lib/brandBlacklist.json").map((b) => b.toLowerCase().trim());
const isBlacklisted = (b) => !!b && BLACKLIST.some((x) => b.toLowerCase().includes(x));
const SCORE_BAR = 67;
const MAX_PRICE = 100;

const EVERY = ["Everyday"];
const WORK = ["Everyday", "Workwear"];
const RESORT = ["Everyday", "Vacation/Resort"];

const ITEMS = [
  // ---- SWEATERS (thin: 26) ------------------------------------------------
  { brand: "Organic Basics", name: "True Knit Sweater", category: "Sweaters", occasion: EVERY,
    url: "https://us.organicbasics.com/products/true-knit-sweater-almond",
    description: "A relaxed knit in 100% organic cotton, GOTS certified. Breathable enough to wear against bare skin, with none of the acrylic that makes most cheap knits cling and pill. Shown in a soft almond." },
  // NOTE: the almond-heather colorway is $128, over the $100 bar, so this is pinned
  // to faded denim (a muted, non-loud wash) to stay in budget.
  { brand: "Eberjey", name: "Fine Gauge Sweater Tank", category: "Sweaters", occasion: EVERY,
    url: "https://eberjey.com/products/fine-gauge-sweater-tank-faded-denim",
    description: "A fine-gauge knit tank that layers under everything or stands on its own. Cotton-led, with a soft drape and a quiet, washed finish. Shown in a faded denim." },
  { brand: "Jungmaven", name: "Whittier Hemp Sweatshirt", category: "Sweaters", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-sweatshirt-whittier",
    description: "A sweatshirt in 100% hemp, cut and sewn in Los Angeles. Almost every sweatshirt on the market is cotton blended with polyester fleece. This one is not, so it breathes instead of trapping heat, and it softens rather than pilling." },
  { brand: "Jungmaven", name: "Raglan Fleece Hemp Sweatshirt", category: "Sweaters", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-sweatshirt-short-sleeve-raglan-fleece",
    description: "A short-sleeve raglan fleece in 100% hemp. The fleece is hemp too, not the recycled polyester most brands hide in the loopback, so nothing plastic sits against your skin." },

  // ---- ACTIVEWEAR ---------------------------------------------------------
  { brand: "Jungmaven", name: "Sporty Tank", category: "Activewear", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-sporty-tank-top",
    description: "A 100% hemp tank built to move in. Hemp is breathable and naturally odour-resistant, which is exactly what synthetic activewear promises and fails to deliver. Made in Los Angeles." },

  // ---- ACTIVEWEAR (thin: 26) ---------------------------------------------
  { brand: "MATE the Label", name: "Organic Stretch Midi Legging", category: "Activewear", occasion: EVERY,
    url: "https://matethelabel.com/products/organic-stretch-midi-legging-pebble",
    description: "A legging in 92% organic cotton with just enough stretch to move, GOTS and OEKO-TEX certified. Most activewear is straight plastic against the parts of you that sweat the most. This is not. Shown in pebble." },

  // ---- INTIMATES ----------------------------------------------------------
  { brand: "Cottonique", name: "Deborah Latex-Free Support Racerback Bra", category: "Intimates", occasion: EVERY,
    url: "https://cottonique.com/products/deborah-latex-free-support-racerback-bra",
    description: "A racerback bra in 100% organic cotton, made completely without latex, spandex or elastic. GOTS and OEKO-TEX certified, and built for skin that reacts to everything else. Nothing synthetic sits against you." },
  { brand: "Cottonique", name: "Deborah Latex-Free Classic Support Bra", category: "Intimates", occasion: EVERY,
    url: "https://cottonique.com/products/deborah-latex-free-classic-support-bra",
    description: "The classic-cut version of the latex-free bra, in organic cotton with no elastane and no rubber. GOTS and OEKO-TEX certified. A genuine option if elastic leaves you itching or marked." },
  { brand: "MATE the Label", name: "Organic Stretch Sports Bra", category: "Intimates", occasion: EVERY,
    url: "https://matethelabel.com/products/organic-stretch-sports-bra-bone",
    description: "A soft sports bra in 92% organic cotton, GOTS and OEKO-TEX certified. Breathable where polyester traps heat and odour, and gentle enough to wear all day. Shown in bone." },

  // ---- BOTTOMS ------------------------------------------------------------
  { brand: "Marine Layer", name: "Isla Double Cloth Short", category: "Bottoms", occasion: RESORT,
    url: "https://www.marinelayer.com/products/isla-double-cloth-short-2",
    description: "An easy pull-on short in 100% cotton double cloth, woven in two layers so it holds its shape and stays airy. The kind of thing you live in from June to September." },
  { brand: "Colorful Standard", name: "Organic Twill Shorts", category: "Bottoms", occasion: RESORT,
    url: "https://colorfulstandard.com/products/women-organic-twill-shorts-optical-white",
    description: "A clean twill short in 100% organic cotton from a B Corp maker. Structured enough to dress up, soft enough to wear all weekend. Shown in optical white." },

  // ---- PAJAMAS ------------------------------------------------------------
  { brand: "Coyuchi", name: "Isla Organic Cotton Night Dress", category: "Pajamas", occasion: EVERY,
    url: "https://www.coyuchi.com/products/womens-isla-organic-cotton-night-dress-indigo-stripe",
    description: "A loose night dress in 100% organic cotton, GOTS and Fair Trade certified. You spend eight hours a night inside your sleepwear, which makes it the easiest fabric swap in your wardrobe. In a soft tonal stripe." },

  // ---- TOPS ---------------------------------------------------------------
  { brand: "Jungmaven", name: "Ojai Tee", category: "Tops", occasion: EVERY,
    url: "https://jungmaven.com/products/hemp-shirt-ojai-tee-short-sleeve",
    description: "A everyday tee in 100% hemp, cut and sewn in Los Angeles. Hemp is naturally breathable and gets softer with every wash instead of thinning out. One of the cleanest tees you can buy." },
  { brand: "Toad&Co", name: "Manzana Pin Tuck Tank", category: "Tops", occasion: EVERY,
    url: "https://www.toadandco.com/products/manzana-pin-tuck-tank-egret",
    description: "A pin-tucked tank in 100% organic cotton with a soft, easy drape. Quiet detailing, no print, and a fiber that lets your skin breathe. Shown in egret." },
  { brand: "Toad&Co", name: "Taj Hemp Button Back Tank", category: "Tops", occasion: WORK,
    url: "https://www.toadandco.com/products/taj-hemp-button-back-tank-ii-london-fog-dobby",
    description: "A hemp-led tank with a button-back detail and a subtle dobby texture. Hemp brings structure and breathability, so it holds its shape through a full day. Shown in london fog." },
  { brand: "Toad&Co", name: "Anza Cinch Tank", category: "Tops", occasion: EVERY,
    url: "https://www.toadandco.com/products/anza-cinch-tank-egret",
    description: "An organic-cotton and lyocell tank with a cinched side detail. Light, breathable and soft against the skin, in a clean neutral. Shown in egret." },
  { brand: "Marine Layer", name: "Rosa Linen Top", category: "Tops", occasion: RESORT,
    url: "https://www.marinelayer.com/products/rosa-linen-top-1",
    description: "A linen-led top with a relaxed, breezy shape. Linen breathes better than almost anything else, which is why it wears cool when the day heats up." },
  { brand: "Marine Layer", name: "Gia Poplin Blouse", category: "Tops", occasion: WORK,
    url: "https://www.marinelayer.com/products/gia-poplin-blouse-2",
    description: "A crisp 100% cotton poplin blouse that tucks in cleanly and holds a line. Structured enough for work, breathable enough to wear all day without sticking." },
  { brand: "Marine Layer", name: "Luxe Sueded Crew Tee", category: "Tops", occasion: EVERY,
    url: "https://www.marinelayer.com/products/luxe-sueded-crew-tee-4",
    description: "A 100% cotton crew tee with a brushed, sueded hand that feels broken-in from the first wear. A plain cotton tee, done properly, with nothing synthetic blended in." },
  { brand: "Knickey", name: "Organic Cotton Classic Tee", category: "Tops", occasion: EVERY,
    url: "https://knickey.com/products/the-tee-in-graphite",
    description: "A straightforward tee in 100% organic cotton at a price that makes switching easy. No pesticide residue, no synthetic blend, no plastic sitting on your skin all day." },
  { brand: "Knickey", name: "Organic Cotton Easy Tank", category: "Tops", occasion: EVERY,
    url: "https://knickey.com/products/subset-organic-cotton-easy-tank-in-stone",
    description: "A soft, relaxed tank in 100% organic cotton. The cheapest clean-fiber layer in the shop, and the one you will reach for under everything. Shown in stone." },
  { brand: "Colorful Standard", name: "Oversized Organic T-Shirt", category: "Tops", occasion: EVERY,
    url: "https://colorfulstandard.com/products/women-oversized-organic-t-shirt-women-oversized-t-shirt-optical-white-female",
    description: "An oversized tee in 100% organic cotton from a B Corp maker, with a heavy, structured hand that does not go see-through. Shown in optical white." },
  { brand: "Colorful Standard", name: "Organic Rib Tank Top", category: "Tops", occasion: EVERY,
    url: "https://colorfulstandard.com/products/women-organic-rib-tank-top-women-tank-top-optical-white-female",
    description: "A ribbed tank in 100% organic cotton, cut close and clean. Breathable, undyed of anything harsh, and made by a certified B Corp. Shown in optical white." },
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

async function addOne(supabase, item, live) {
  if (isBlacklisted(item.brand)) return { skip: `${item.brand} blacklisted` };
  const v = await getValidatedProduct(item.url);
  if (!v.ok) return { skip: v.reason };

  const price = typeof v.price === "number" ? v.price : null;
  if (price == null || price >= MAX_PRICE) return { skip: `price $${price} not under $${MAX_PRICE}` };

  let comp = toFractions(v.composition) || toFractions(item.comp);
  if (!comp) {
    try {
      const page = await fetchPage(v.finalUrl);
      comp = toFractions(recoverComp(page.html));
    } catch {}
  }
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
    tags: ["batch-women-under100", "no-llm"],
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

  let n = 0;
  const failed = [];
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
