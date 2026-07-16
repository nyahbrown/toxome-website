/**
 * Women's WORKWEAR + PAJAMAS (2026-07-15). No LLM, no Anthropic API.
 *
 * Same page-grounded validate + score + draft path as add-women-under100.js.
 * Every URL below was pre-validated end-to-end (getValidatedProduct → real PDP,
 * live image, page-scraped composition → calcToxomeScore ≥ SCORE_BAR, in stock).
 * `comp` is only passed where a brand renders its fabric line via JS past
 * scrape.js's 20k window; it is read off the live PDP, never guessed. `price`
 * is only passed where the store hides a USD offer from JSON-LD (Amour Vert),
 * read verbatim off the live page. Every URL is pinned to the most NEUTRAL
 * available colorway and every item_name is colorway-free.
 *
 * There is no "Workwear" category — tailored/office pieces are filed under
 * Tops / Bottoms / Dresses with occasion = ["Everyday", "Workwear"]. Pajamas /
 * sleepwear / robes go under category "Pajamas".
 *
 * No price cap here (workwear + sleepwear routinely exceed $100). Unlike the
 * under-$100 batch, this run also skips anything the page reports out of stock.
 *
 *   node --env-file=.env.local scripts/add-women-workwear-pajamas.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// --- page-grounded composition recovery (identical to add-women-under100.js) --
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

const EVERY = ["Everyday"];
const WORK = ["Everyday", "Workwear"];

const ITEMS = [
  // ======================= WORKWEAR (Tops / Bottoms / Dresses) ==============
  // ---- MATE the Label — tailored button-downs + structured polo -----------
  { brand: "MATE the Label", name: "Organic Linen Oversized Button-Down", category: "Tops", occasion: WORK,
    url: "https://matethelabel.com/products/organic-linen-oversized-button-down-bone",
    description: "A relaxed button-down in 100% organic linen, GOTS certified and made in Los Angeles. Linen brings the structure a workday shirt needs while it breathes the way a plastic blend never will. Shown in bone." },
  { brand: "MATE the Label", name: "Organic Poplin Long Sleeve Button-Down", category: "Tops", occasion: WORK,
    url: "https://matethelabel.com/products/organic-poplin-long-sleeve-button-down-custard",
    description: "A crisp poplin button-down in 100% organic cotton, GOTS and OEKO-TEX certified. It tucks in cleanly and holds a line at the desk, with none of the wrinkle-free resin finish most office shirts hide. Shown in custard." },
  { brand: "MATE the Label", name: "Organic Structured Cotton Polo", category: "Tops", occasion: WORK,
    url: "https://matethelabel.com/products/organic-structured-cotton-polo-heather-oat",
    description: "A structured knit polo in 100% organic cotton, GOTS certified. The heavier hand gives it a tailored, put-together shape for work, and the fiber lets your skin breathe through a full day. Shown in heather oat." },

  // ---- Tradlands — small-batch shirting in natural fibers -----------------
  { brand: "Tradlands", name: "Bertille Cotton Top", category: "Tops", occasion: WORK,
    url: "https://tradlands.com/products/bertille-top",
    description: "A clean, tailored top in 100% cotton with a quiet drape that carries a workday and reads polished under a blazer. No print, no synthetic blend. Shown in cream." },
  { brand: "Tradlands", name: "Coast Camp Linen Shirt", category: "Tops", occasion: WORK,
    url: "https://tradlands.com/products/coast-camp-linen-shirt",
    description: "A camp-collar shirt in a linen and lyocell weave, both plant fibers that breathe and soften with wear. Structured enough to layer for the office, light enough to wear on its own. Shown in the muted check." },
  { brand: "Tradlands", name: "Marin Boatneck Shirt", category: "Tops", occasion: WORK,
    url: "https://tradlands.com/products/marin-boatneck-shirt",
    description: "A boatneck shirt led by cotton with a soft, easy structure that layers neatly for work. A natural-fiber base instead of the pure polyester most everyday shirts are cut from. Shown in a soft neutral stripe." },

  // ---- Christy Dawn — organic-cotton tailored dresses ---------------------
  { brand: "Christy Dawn", name: "The Kiara Dress", category: "Dresses", occasion: WORK,
    url: "https://christydawn.com/products/the-kiara-dress-chambray",
    description: "A chambray shirt-dress in 100% organic cotton, made in Los Angeles from deadstock and regeneratively grown fiber. Collared and buttoned through, it reads as workwear and breathes like a natural fiber should. Shown in chambray." },
  { brand: "Christy Dawn", name: "The Lynne Dress", category: "Dresses", occasion: WORK,
    url: "https://christydawn.com/products/the-lynne-dress-alabaster",
    description: "A clean-lined column dress in 100% organic cotton, cut to a quiet, tailored silhouette that works for the office and after it. A natural fiber against the skin all day, with nothing synthetic blended in. Shown in alabaster." },
  { brand: "Christy Dawn", name: "The Yvette Dress", category: "Dresses", occasion: WORK,
    url: "https://christydawn.com/products/the-yvette-dress-alabaster",
    description: "A structured organic-cotton dress in a solid neutral, tailored enough to carry a workday and made from regeneratively grown, non-toxic fiber. Breathable where a polyester sheath would trap heat. Shown in alabaster." },

  // ---- Amour Vert — tailored linen trouser --------------------------------
  { brand: "Amour Vert", name: "Larisa Cotton Linen Pant", category: "Bottoms", occasion: WORK, price: 79.99,
    url: "https://amourvert.com/products/larisa-linen-pant-natural",
    description: "A softly structured trouser in a cotton and linen blend, tailored high on the waist for work but breathable enough for a warm office. Two natural plant fibers, no linen-look plastic. Shown in natural." },

  // ---- Eileen Fisher — linen-silk tailored trouser ------------------------
  { brand: "Eileen Fisher", name: "Linen Silk Twill Tapered Pant", category: "Bottoms", occasion: WORK,
    url: "https://www.eileenfisher.com/linen-silk-twill-tapered-pant/S5WZK-P4832.html",
    description: "A pleated, tapered trouser in a 55% organic linen and 45% silk twill, both natural fibers, with a fly front and real pockets. Tailored for the office and cool against the skin the way a synthetic suiting pant never is." },

  // ---- Jungmaven — hemp button-down ---------------------------------------
  { brand: "Jungmaven", name: "Catalina Hemp Denim Button-Down Shirt", category: "Tops", occasion: WORK,
    url: "https://jungmaven.com/products/hemp-denim-shirt-button-down-catalina",
    description: "A button-down in 100% hemp denim, cut and sewn in the USA. Hemp gives it real structure for a tailored look while it breathes and softens with every wash, the opposite of a stiff synthetic-blend work shirt." },

  // ---- Eileen Fisher — organic cotton poplin button-down ------------------
  { brand: "Eileen Fisher", name: "Washed Organic Cotton Poplin Shirt", category: "Tops", occasion: WORK,
    url: "https://www.eileenfisher.com/washed-organic-cotton-poplin-shirt/S3AJH-T5705.html",
    description: "A relaxed classic-collar button-down in washed 100% organic cotton poplin, with a clean button front and side slits. A tailored work shirt that breathes, made from a natural fiber grown without synthetic pesticides." },

  // ======================= PAJAMAS / SLEEPWEAR =============================
  // ---- Coyuchi — organic cotton, GOTS + Fair Trade ------------------------
  { brand: "Coyuchi", name: "Isla Organic Cotton Long Sleeve Pajama Set", category: "Pajamas", occasion: EVERY,
    url: "https://www.coyuchi.com/products/womens-isla-organic-cotton-long-sleeve-pajama-set-praline-meadow",
    description: "A long-sleeve pajama set in 100% organic cotton, GOTS and Fair Trade certified. You spend eight hours a night inside your sleepwear, which makes it the easiest fiber swap in your wardrobe. Shown in a soft praline." },
  { brand: "Coyuchi", name: "Isla Organic Cotton Night Dress", category: "Pajamas", occasion: EVERY,
    url: "https://www.coyuchi.com/products/womens-isla-organic-cotton-night-dress-praline-chambray",
    description: "A loose night dress in 100% organic cotton percale, GOTS and Fair Trade certified. Breathable and gentle against bare skin for a full night, with none of the polyester most sleepwear hides. Shown in a soft praline chambray." },
  { brand: "Coyuchi", name: "Pima Organic Knit Wide-Leg Pant and Henley Set", category: "Pajamas", occasion: EVERY,
    url: "https://www.coyuchi.com/products/womens-pima-organic-knit-wide-leg-pant-henley-set",
    description: "A soft knit lounge set in 100% organic pima cotton, GOTS certified. A henley and a wide-leg pant made to sleep and slow-morning in, breathable where a synthetic knit would trap heat." },
  { brand: "Coyuchi", name: "Isla Organic Cotton Poplin Night Dress", category: "Pajamas", occasion: EVERY,
    url: "https://www.coyuchi.com/products/womens-isla-organic-cotton-night-dress-praline-meadow",
    description: "A relaxed night dress in 100% organic cotton poplin, GOTS and Fair Trade certified, that softens with every wash. Eight hours a night against bare skin is the easiest place to drop the polyester. Shown in a soft praline." },

  // ---- Cottonique — 100% organic cotton, latex/spandex-free ---------------
  { brand: "Cottonique", name: "Allergy-Free Organic Cotton Pajama Shirt", category: "Pajamas", occasion: EVERY,
    url: "https://cottonique.com/products/allergy-free-organic-cotton-pajama-shirt-melange-grey",
    description: "A pajama shirt in 100% organic cotton, GOTS certified and built completely without latex, spandex or elastic. Made for skin that reacts to everything else, so nothing synthetic sits against you overnight. Shown in melange grey." },
  { brand: "Cottonique", name: "Allergy-Free Organic Cotton Pajama Shorts", category: "Pajamas", occasion: EVERY,
    url: "https://cottonique.com/products/allergy-free-organic-cotton-pajama-shorts-melange-grey",
    description: "Pajama shorts in 100% organic cotton with a latex-free, spandex-free waistband, GOTS certified. A genuine option if elastic leaves you itching or marked by morning. Shown in melange grey." },
  { brand: "Cottonique", name: "Organic Cotton Drawstring Lounge Pants", category: "Pajamas", occasion: EVERY,
    url: "https://cottonique.com/products/organic-cotton-womens-drawstring-lounge-pants",
    description: "Drawstring lounge pants in 100% organic cotton, GOTS and OEKO-TEX certified, right down to the cotton drawstring. No elastic, no plastic, nothing to bind or itch through the night. Shown in natural." },

  // ---- Printfresh — 100% organic cotton poplin ----------------------------
  { brand: "Printfresh", name: "Caviar Club Long Pajama Set", category: "Pajamas", occasion: EVERY,
    url: "https://printfresh.com/products/embroidered-caviar-club-long-pj-set-pearl",
    description: "A long pajama set in 100% organic cotton poplin, with a piped, buttoned top and a full-length pant. Crisp, breathable, and free of the polyester satin most 'luxe' sleepwear is really made of. Shown in pearl." },
  { brand: "Printfresh", name: "Champagne Caviar Pajama Pant", category: "Pajamas", occasion: EVERY,
    url: "https://printfresh.com/products/champagne-caviar-astrid-pj-pant-goldenrod",
    description: "A relaxed pajama pant in 100% organic cotton poplin, made to layer with your own tee or worn on its own. A breathable natural fiber for the hours you actually spend in it. Shown in a soft goldenrod." },
  { brand: "Printfresh", name: "Champagne Caviar Sleep Shirt", category: "Pajamas", occasion: EVERY,
    url: "https://printfresh.com/products/champagne-caviar-sleep-shirt-goldenrod",
    description: "A button-through sleep shirt in 100% organic cotton poplin, long enough to wear alone and light enough to sleep in through a warm night. Cotton that breathes, not plastic that clings. Shown in a soft goldenrod." },

  // ---- Parachute — organic cotton robe ------------------------------------
  { brand: "Parachute", name: "Cloud Cotton Robe", category: "Pajamas", occasion: EVERY,
    url: "https://parachutehome.com/products/cloud-cotton-robe-bone",
    description: "A lightweight robe in airy 100% organic cotton gauze, OEKO-TEX certified. The kind of thing you live in on a slow morning, breathable and soft where a plush polyester robe just traps heat. Shown in bone." },

  // ---- Desmond & Dempsey — cotton pajama sets -----------------------------
  { brand: "Desmond & Dempsey", name: "Long Cotton Pajama Set", category: "Pajamas", occasion: EVERY,
    url: "https://desmondanddempsey.com/products/long-set-peony-white",
    description: "A long-sleeve pajama set in 100% cotton, a piped top and full-length pant cut for real sleep. A breathable natural fiber for the hours you spend against it, not a plastic 'silky' blend. Shown in white." },
  { brand: "Desmond & Dempsey", name: "Pointelle Cotton Top and Trouser Set", category: "Pajamas", occasion: EVERY,
    url: "https://desmondanddempsey.com/products/pointelle-long-sleeve-top-trouser-set-white",
    description: "A pointelle-knit lounge set in 100% cotton, a long-sleeve top and a trouser made to sleep and slow-morning in. Soft, breathable, and free of the synthetics most cosy sets are knit from. Shown in white." },
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
  if (v.inStock === false) return { skip: "out of stock" };

  // USD price: JSON-LD/Shopify first; fall back to the price read off the live
  // page only for stores that hide (or geo-swap) their offer (Amour Vert).
  let price = typeof v.price === "number" ? v.price : null;
  if (price == null && typeof item.price === "number") price = item.price;
  if (price == null) return { skip: "no USD price" };

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
    tags: ["batch-women-workwear-pajamas", "no-llm"],
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

  let n = 0, work = 0, pj = 0;
  const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live);
    if (r.ok) {
      n++;
      if (item.category === "Pajamas") pj++; else work++;
      console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(8)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${JSON.stringify(r.comp)} · ${r.certs ? r.certs.join("/") : "no certs"} · ${r.imgs} imgs`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as ${live ? "LIVE" : "drafts"}  (workwear ${work}, pajamas ${pj}).`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
