/**
 * Women's ELEVATED / PROFESSIONAL WORKWEAR (2026-07-15). No LLM, no Anthropic API.
 *
 * Genuine office / Eileen-Fisher-register tailoring: tailored blazers, wide-leg
 * and pleated trousers, pencil / midi skirts, silk blouses, structured shirts,
 * sheath / shift / knit / wrap dresses, and fine-gauge merino / wool / cashmere
 * knits. Explicitly NOT the casual camp-shirt / poplin-popover / jersey-polo
 * register that was rejected in the prior batch.
 *
 * Same page-grounded validate + score + draft path as add-women-workwear-pajamas.js.
 * Fiber gate is the GREEN Toxome score (>= 68 clean = "low" risk) rather than a
 * natural-fiber-only rule, so structured semi-synthetic tailoring (modal, cupro,
 * lyocell, ecovero, and blends) qualifies when it actually scores green. Anything
 * that lands moderate/high (< 68) is dropped, never forced. `comp` is only passed
 * where a brand renders its fabric line via JS past scrape.js's 20k window; it is
 * read off the live PDP, never guessed. `price` is only passed where the store
 * hides a USD offer from JSON-LD, read verbatim off the live page. Every URL is
 * pinned to the most NEUTRAL available colorway; every item_name is colorway-free.
 *
 * Categories follow catalog convention: blazers / structured jackets -> Outerwear,
 * trousers / skirts -> Bottoms, blouses / shirts -> Tops, dresses -> Dresses,
 * knit sweaters -> Sweaters. occasion = ["Workwear"] (+ "Everyday" only when the
 * piece is genuinely both). No price cap (workwear routinely exceeds $100).
 * Out-of-stock pages are skipped.
 *
 *   node --env-file=.env.local scripts/add-women-workwear-elevated.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// --- page-grounded composition recovery (identical to add-women-workwear-pajamas.js) --
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
  if (/cupro|cuprammonium|bemberg/.test(s)) return "cupro";
  if (/bamboo[^a-z]*(viscose|rayon)|viscose|rayon/.test(s)) return "viscose";
  if (/modal/.test(s)) return "modal";
  if (/ramie/.test(s)) return "ramie";
  if (/acetate/.test(s)) return "acetate";
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
// GREEN gate: scoreToRiskLevel returns "low" at >= 68 (CLEAN_GREEN). That is the
// brand owner's acceptance test for this batch — accept green, drop moderate/high.
const SCORE_BAR = 68;

const EVERY = ["Everyday"];
const WORK = ["Workwear"];
const WORK_EVERY = ["Workwear", "Everyday"];

const ITEMS = [
  // ======================= JENNI KAYNE ====================================
  { brand: "Jenni Kayne", name: "Linen Logan Pant", category: "Bottoms", occasion: WORK,
    url: "https://jennikayne.com/products/linen-logan-pant-navy",
    description: "A high-waisted linen trouser with a clean, tailored line for the office. Linen holds its shape and breathes through a full day, where a synthetic suiting pant just traps heat against the skin. Shown in navy." },
  { brand: "Jenni Kayne", name: "Relaxed Trouser", category: "Bottoms", occasion: WORK,
    url: "https://jennikayne.com/products/relaxed-trouser-black",
    description: "A fluid, wide-leg trouser in 100% silk, cut to drape rather than cling. A natural protein fiber against the skin all day instead of the polyester most tailored pants are made from. Shown in black." },
  { brand: "Jenni Kayne", name: "Cashmere Porter Turtleneck", category: "Sweaters", occasion: WORK_EVERY,
    url: "https://jennikayne.com/products/cashmere-porter-turtleneck-shadow",
    description: "A fine-gauge turtleneck in 100% cashmere that layers cleanly under a blazer for work. A pure natural fiber that regulates temperature, unlike the acrylic knits that pill and hold static. Shown in shadow grey." },
  { brand: "Jenni Kayne", name: "Linen Ease Shirt", category: "Tops", occasion: WORK,
    url: "https://jennikayne.com/products/linen-ease-shirt-hemp",
    description: "A relaxed button-down in 100% linen with enough body to tuck in and hold a line. Linen breathes and softens with wear, the opposite of a resin-finished no-iron work shirt. Shown in a soft hemp neutral." },

  // ======================= ST. AGNI =======================================
  { brand: "St. Agni", name: "Silk Twill Pants", category: "Bottoms", occasion: WORK,
    url: "https://st-agni.com/products/silk-twill-pants-black",
    description: "A tailored, straight-leg trouser in 100% silk twill with a quiet, elevated drape for work. A breathable natural fiber, not the plastic suiting most office pants are cut from. Shown in black." },
  { brand: "St. Agni", name: "Jordan Button Up Top", category: "Tops", occasion: WORK,
    url: "https://st-agni.com/products/jordan-button-up-top-black",
    description: "A refined silk button-up that reads polished on its own or under a jacket. Pure silk against the skin all day instead of the polyester charmeuse most 'silky' blouses hide. Shown in black." },
  { brand: "St. Agni", name: "Jordan Button Up Dress", category: "Dresses", occasion: WORK_EVERY,
    url: "https://st-agni.com/products/jordan-button-up-dress-black",
    description: "A collared, buttoned shirt-dress in 100% silk, tailored enough to carry a workday and cut clean and minimal. A natural fiber that breathes where a synthetic sheath would cling. Shown in black." },
  { brand: "St. Agni", name: "Cashmere Sweater", category: "Sweaters", occasion: WORK_EVERY,
    url: "https://st-agni.com/products/cashmere-sweater-black",
    description: "A clean, fine-knit pullover in 100% cashmere, built to layer for the office. A pure natural fiber that insulates without the static and pilling of an acrylic blend. Shown in black." },

  // ======================= ANOTHER TOMORROW ===============================
  { brand: "Another Tomorrow", name: "Wide Leg Pant", category: "Bottoms", occasion: WORK,
    url: "https://anothertomorrow.co/products/wide-leg-pant-olive-green",
    description: "A structured, high-waisted wide-leg trouser in 100% organic cotton with a real tailored line. Cotton grown without synthetic pesticides, breathable through a long day at the desk. Shown in olive green." },
  { brand: "Another Tomorrow", name: "Pleat Back Poplin Shirt", category: "Tops", occasion: WORK,
    url: "https://anothertomorrow.co/products/pleat-back-poplin-shirt-white",
    description: "A crisp poplin button-down in organic cotton with a pleated back for movement. It holds a clean line at the desk without the wrinkle-free resin finish most office shirts rely on. Shown in white." },
  { brand: "Another Tomorrow", name: "Double Face Sheath Dress", category: "Dresses", occasion: WORK,
    url: "https://anothertomorrow.co/products/double-face-sheath-dress-black",
    description: "A structured sheath dress in double-faced organic cotton, tailored to a sharp, minimal silhouette for work. A natural fiber against the skin where a polyester sheath would trap heat. Shown in black." },
  { brand: "Another Tomorrow", name: "Tailored Cashmere Jacket", category: "Outerwear", occasion: WORK,
    url: "https://anothertomorrow.co/products/tailored-cashmere-jacket-camel",
    description: "A tailored blazer in 100% cashmere, structured enough to anchor a work look and soft enough to wear all day. A pure natural fiber, not a fused synthetic suiting shell. Shown in camel." },

  // ======================= CUYANA =========================================
  { brand: "Cuyana", name: "Wool Cropped Blazer", category: "Outerwear", occasion: WORK,
    url: "https://cuyana.com/products/wool-cropped-blazer",
    description: "A cropped, tailored blazer in a wool suiting with just a touch of stretch for movement. Wool breathes and resists wrinkles naturally, where a polyester blazer holds heat and odor. Shown in a quiet neutral." },
  { brand: "Cuyana", name: "Wool Wide Leg Pant", category: "Bottoms", occasion: WORK,
    url: "https://cuyana.com/products/wool-wide-leg-pant",
    description: "A high-waisted wide-leg trouser in wool suiting, cut to drape long and clean for the office. A natural fiber that holds a press and breathes, unlike the synthetic suiting most work pants are made from. Shown in a quiet neutral." },
  { brand: "Cuyana", name: "Silk Drape Front Dress", category: "Dresses", occasion: WORK_EVERY,
    url: "https://cuyana.com/products/silk-drape-front-dress",
    description: "A softly draped column dress in 100% silk, tailored enough for the office and easy after it. A breathable natural fiber against the skin instead of a clingy synthetic. Shown in a quiet neutral." },
  { brand: "Cuyana", name: "Single Origin Cashmere Wrap Sweater", category: "Sweaters", occasion: WORK_EVERY,
    url: "https://cuyana.com/products/single-origin-cashmere-wrap-sweater",
    description: "A refined wrap sweater in single-origin 100% cashmere, made to layer over tailored pieces. A pure natural fiber that insulates cleanly, without the static and pilling of acrylic. Shown in a quiet neutral." },

  // ======================= FRANK & EILEEN =================================
  { brand: "Frank & Eileen", name: "Eileen Washed Linen Button-Up", category: "Tops", occasion: WORK,
    url: "https://frankandeileen.com/products/eileen-black-washed-linen",
    description: "The signature button-down in 100% washed linen, structured enough to layer for work and soft from the first wear. Linen breathes and softens with washing, unlike a coated no-iron work shirt. Shown in black." },
  { brand: "Frank & Eileen", name: "Megan Washed Linen Dress", category: "Dresses", occasion: WORK_EVERY,
    url: "https://frankandeileen.com/products/megan-sand-washed-linen",
    description: "A collared shirt-dress in 100% washed linen with a clean, tailored line for the office. A natural plant fiber that breathes through a full day where a synthetic dress would cling. Shown in sand." },
  { brand: "Frank & Eileen", name: "Montecito Italian Cotton Cardigan", category: "Sweaters", occasion: WORK_EVERY,
    url: "https://frankandeileen.com/products/montecito-cardigan-sand-pure-italian-cotton",
    description: "A fine-knit cardigan in pure Italian cotton, built to layer over shirting for work. A breathable natural fiber, not the acrylic most everyday cardigans are knit from. Shown in sand." },
  { brand: "Frank & Eileen", name: "Limerick Cropped Linen Trouser", category: "Bottoms", occasion: WORK,
    url: "https://frankandeileen.com/products/limerick-crop-canyon-italian-performance-linen",
    description: "A cropped, tailored trouser in an Italian cotton-linen weave, cut high with a clean line for the desk. Two natural plant fibers that breathe, not a linen-look synthetic. Shown in canyon, a warm clay neutral." },

  // ======================= GRAMMAR NYC ====================================
  { brand: "Grammar NYC", name: "The Agent Shirt", category: "Tops", occasion: WORK,
    url: "https://grammarnyc.com/products/unisex-shirt",
    description: "A structured button-up in 100% organic cotton, cut clean and minimal to tuck in and hold a line at work. Cotton grown without synthetic pesticides, breathable where a poly-blend shirt is not. Shown in white." },
  { brand: "Grammar NYC", name: "The Feminine Dress", category: "Dresses", occasion: WORK_EVERY,
    url: "https://grammarnyc.com/products/feminine-long-sleeve-dress",
    description: "A long-sleeve column dress in 100% organic cotton with a quiet, tailored silhouette for the office. A natural fiber against the skin all day, with nothing synthetic blended in. Shown in white." },
  { brand: "Grammar NYC", name: "The Split Infinitive Shirt", category: "Tops", occasion: WORK,
    url: "https://grammarnyc.com/products/poet-blouse",
    description: "A refined tie-neck blouse in 100% organic cotton, structured enough to read polished under a blazer. A breathable natural fiber, not the polyester most blouses are cut from. Shown in white." },
  { brand: "Grammar NYC", name: "The Antecedent Shirt", category: "Tops", occasion: WORK,
    url: "https://grammarnyc.com/products/peasant-blouse",
    description: "A clean, softly gathered blouse in 100% organic cotton that layers neatly for work. Cotton grown without synthetic pesticides, breathable through a full day. Shown in white." },

  // ======================= EVERLANE =======================================
  { brand: "Everlane", name: "Wide-Leg Drawstring Pant in Linen", category: "Bottoms", occasion: WORK,
    url: "https://www.everlane.com/products/womens-wide-leg-drawstring-pant-in-linen-black",
    description: "A tailored wide-leg trouser in 100% linen, cut long and clean enough for the office. Linen breathes and holds its shape through a warm day where a synthetic pant traps heat. Shown in black." },

  // ======================= BODEN ==========================================
  { brand: "Boden", name: "Pleated Linen Culotte", category: "Bottoms", occasion: WORK,
    url: "https://www.boden.com/products/women-pleated-linen-culotte-navy-r0973nav",
    description: "A pleated, wide culotte in 100% linen, tailored high with a clean line for work. A breathable plant fiber that holds a pleat and cools in a warm office. Shown in navy." },
  { brand: "Boden", name: "Dimitra Linen Column Skirt", category: "Bottoms", occasion: WORK,
    url: "https://www.boden.com/products/women-dimitra-linen-column-skirt-white-r0936wht",
    description: "A long, slim column skirt in 100% linen with a quiet, tailored line for the office. A natural fiber that breathes through a full day instead of clinging like a synthetic. Shown in white." },

  // ======================= DOEN ===========================================
  { brand: "Doen", name: "Quinn Dress", category: "Dresses", occasion: WORK_EVERY,
    url: "https://shopdoen.com/products/quinn-dress-black",
    description: "A clean-lined dress in 100% organic cotton, tailored enough to carry a workday and easy after it. A natural fiber against the skin all day, with nothing synthetic blended in. Shown in black." },
  { brand: "Doen", name: "Madelynne Dress", category: "Dresses", occasion: WORK_EVERY,
    url: "https://shopdoen.com/products/madelynne-dress-black",
    description: "A softly tailored dress in 100% silk with a refined, minimal silhouette for the office. A breathable natural fiber where a polyester dress would cling and hold heat. Shown in black." },
  { brand: "Doen", name: "Cameron Cashmere Cardigan", category: "Sweaters", occasion: WORK_EVERY,
    url: "https://shopdoen.com/products/cameron-cashmere-cardigan-navy",
    description: "A fine-knit cardigan in 100% cashmere, made to layer over shirting for work. A pure natural fiber that insulates without the static and pilling of an acrylic blend. Shown in navy." },
  { brand: "Doen", name: "Maire Cashmere Sweater", category: "Sweaters", occasion: WORK_EVERY,
    url: "https://shopdoen.com/products/maire-cashmere-sweater-cloud-grey",
    description: "A clean crewneck in 100% cashmere that layers cleanly under a blazer. A breathable natural fiber that regulates temperature, unlike the acrylic knits that hold static. Shown in cloud grey." },

  // ======================= SABLYN =========================================
  { brand: "Sablyn", name: "Nora Deconstructed Silk Blazer", category: "Outerwear", occasion: WORK,
    url: "https://www.sablyn.com/products/nora-deconstructed-blazer-gardenia",
    description: "A softly tailored blazer in 100% silk, structured enough to anchor a work look and fluid enough to wear all day. A natural protein fiber, not a fused synthetic suiting shell. Shown in gardenia, a soft ivory." },
  { brand: "Sablyn", name: "Naomi Bias Cut Silk Trouser", category: "Bottoms", occasion: WORK,
    url: "https://www.sablyn.com/products/naomi-bias-cut-pull-on-pant-black",
    description: "A bias-cut, high-rise trouser in 100% silk that drapes long and clean for the office. A breathable natural fiber against the skin instead of the plastic most tailored pants are cut from. Shown in black." },
  { brand: "Sablyn", name: "Nadine Slouchy Silk Turtleneck", category: "Tops", occasion: WORK_EVERY,
    url: "https://www.sablyn.com/products/nadine-slouchy-turtleneck-top-gardenia",
    description: "A slouchy turtleneck in 100% silk, refined enough to layer under a blazer for work. A pure natural fiber that breathes where a synthetic knit clings and holds static. Shown in gardenia, a soft ivory." },
  { brand: "Sablyn", name: "Inez Draped Silk Dress", category: "Dresses", occasion: WORK_EVERY,
    url: "https://www.sablyn.com/products/inez-draped-v-nk-dress-black",
    description: "A draped V-neck column dress in 100% silk, tailored to a quiet, elevated line for the office and after. A breathable natural fiber, not a clingy synthetic. Shown in black." },
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
  if (score == null || score < SCORE_BAR) return { skip: `score ${score} below green bar` };

  const { data: dup } = await supabase.from("products").select("id").eq("item_url", v.finalUrl).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };
  const { data: dupName } = await supabase.from("products").select("id").eq("item_name", item.name).eq("brand", item.brand).maybeSingle();
  if (dupName) return { skip: `dup name ${dupName.id.slice(0, 8)}` };

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
    tags: ["batch-women-workwear-elevated", "no-llm"],
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
  const byCat = {};
  const byBrand = {};
  const scores = [];
  const failed = [];
  for (const item of ITEMS) {
    const r = await addOne(supabase, item, live);
    if (r.ok) {
      n++;
      byCat[item.category] = (byCat[item.category] || 0) + 1;
      byBrand[item.brand] = (byBrand[item.brand] || 0) + 1;
      scores.push(r.score);
      console.log(`✓ ${String(n).padStart(2)} ${item.category.padEnd(9)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${JSON.stringify(r.comp)} · ${r.certs ? r.certs.join("/") : "no certs"} · ${r.imgs} imgs`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${n}/${ITEMS.length} inserted as ${live ? "LIVE" : "drafts"}.`);
  if (scores.length) console.log(`score range ${Math.min(...scores)}–${Math.max(...scores)}`);
  console.log(`by category: ${JSON.stringify(byCat)}`);
  console.log(`by brand: ${JSON.stringify(byBrand)}`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
