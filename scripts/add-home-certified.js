/**
 * GOTS / OEKO-TEX certified Home batch (2026-07-12). No LLM, no Anthropic API.
 *
 * Same page-grounded validate + score + draft path as add-home.js. Compositions
 * are read off the live PDP (regex over the full page text) and passed explicitly
 * via `comp` for the brands whose fabric line sits past scrape.js's 20k pageText
 * window (MagicLinen, Sijo, Takasa, Ettitude, Under the Canopy, Delilah). Coyuchi
 * parses natively so it has no override.
 *
 *   node --env-file=.env.local scripts/add-home-certified.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const BLACKLIST = require("../lib/brandBlacklist.json").map((b) => b.toLowerCase().trim());
const isBlacklisted = (b) => !!b && BLACKLIST.some((x) => b.toLowerCase().includes(x));
const SCORE_BAR = 67;
const TARGET = 30;

const OC = { "organic cotton": 100 };
const LIN = { linen: 100 };
const LYO = { lyocell: 100 };

const BATH = { category: "Bath", occasion: ["home", "bath"] };
const BED = { category: "Bedding", occasion: ["home", "sleep"] };
const THROW = { category: "Throws & Blankets", occasion: ["home"] };
const RUG = { category: "Rugs", occasion: ["home"] };

const ITEMS = [
  // ---- RUGS (the thinnest category: only 2 in catalog) --------------------
  { ...RUG, brand: "Coyuchi", name: "Cove Organic Bath Rug",
    url: "https://www.coyuchi.com/products/cove-organic-bath-rug-river",
    description: "A GOTS organic cotton bath rug that stays soft underfoot without the plastic backing most bath rugs hide. Woven to dry fast, machine washable, and free of the synthetic pile that sheds microfibres into your home." },
  { ...RUG, brand: "Coyuchi", name: "Moonstone Organic Bath Rug",
    url: "https://www.coyuchi.com/products/moonstone-organic-bath-rug-slate",
    description: "A plush, textured organic cotton bath rug in a quiet, neutral tone. GOTS certified, absorbent, and made without the latex or vinyl backing that off-gasses in a warm bathroom." },
  { ...RUG, brand: "Under the Nile", name: "Hand-loomed Small Rug",
    url: "https://underthenile.com/products/small-rug-play-mat-natural-undyed",
    description: "A hand-loomed rug in 100% organic Egyptian cotton, left completely undyed so the fiber is exactly the colour it grew. GOTS certified, soft enough to sit on, and free of dye chemistry entirely." },

  // ---- BATH ---------------------------------------------------------------
  { ...BATH, brand: "Ettitude", name: "Bamboo Waffle Towels", comp: LYO,
    url: "https://ettitude.com/products/bath-towels",
    description: "A waffle-weave towel in CleanBamboo lyocell, made in a closed-loop process that captures and reuses its solvents. OEKO-TEX certified, lighter than terry, and quick to dry so it does not go musty between showers." },
  { ...BATH, brand: "Ettitude", name: "Waffle Bathrobe", comp: LYO,
    url: "https://ettitude.com/products/blissful-waffle-bathrobe",
    description: "A lightweight waffle robe in CleanBamboo lyocell, OEKO-TEX certified and breathable enough to wear straight out of the shower without overheating. Softens with every wash instead of pilling." },
  { ...BATH, brand: "Delilah Home", name: "Organic Cotton Bath Towels", comp: OC,
    url: "https://delilahhome.com/products/organic-cotton-bath-towels",
    description: "A 100% GOTS organic cotton towel, certified to the Global Organic Textile Standard from the field through to the finished hem. No softeners, no optical brighteners, and no synthetic blend to slow the drying down." },
  { ...BATH, brand: "MagicLinen", name: "Linen Waffle Towel Set", comp: LIN,
    url: "https://magiclinen.com/products/beige-linen-waffle-towel-set",
    description: "A waffle-weave towel set in 100% European flax linen, OEKO-TEX certified. Linen is naturally absorbent and dries faster than cotton terry, so it stays fresh on the hook. Gets softer with every single wash. Shown in a warm beige." },
  { ...BATH, brand: "Coyuchi", name: "Cloud Loom Organic Bath Mat", comp: OC,
    url: "https://www.coyuchi.com/products/cloud-loom-organic-bath-mat-fog",
    description: "A thick, GOTS organic cotton bath mat with real weight to it, and no rubber or vinyl backing. Absorbs fast, washes clean, and keeps the plastics out of the room where you are barefoot and steaming." },

  // ---- THROWS & BLANKETS --------------------------------------------------
  { ...THROW, brand: "Ettitude", name: "Hand Woven Throw Blanket", comp: LYO,
    url: "https://ettitude.com/products/luxe-cleanbamboo-plntboucle-woven-throw-blanket",
    description: "A hand-woven throw in CleanBamboo lyocell boucle, OEKO-TEX certified. Light but warm, with the drape of a much heavier blanket and none of the acrylic that makes most throws crackle with static." },
  { ...THROW, brand: "Ettitude", name: "Hand Woven Herringbone Throw Blanket", comp: LYO,
    url: "https://ettitude.com/products/luxe-cleanbamboo-plntboucle-herringbone-woven-throw-blanket",
    description: "A herringbone throw hand-woven from CleanBamboo lyocell, produced in a closed-loop system that recovers its solvents. OEKO-TEX certified, breathable, and cool to the touch rather than clammy." },
  { ...THROW, brand: "Ettitude", name: "Hand Woven Stripe Throw Blanket", comp: LYO,
    url: "https://ettitude.com/products/luxe-cleanbamboo-plntboucle-stripe-woven-throw-blanket",
    description: "A quietly striped, hand-woven lyocell throw. OEKO-TEX certified CleanBamboo, with a soft boucle texture that holds warmth without the polyester fill most throws rely on." },
  { ...THROW, brand: "MagicLinen", name: "Linen Waffle Blanket", comp: LIN,
    url: "https://magiclinen.com/products/beige-linen-waffle-blanket",
    description: "A generous waffle blanket in 100% European flax linen, OEKO-TEX certified. Linen breathes, so it works over a bed in summer and layers in winter without ever feeling sweaty. Shown in a warm beige." },
  { ...THROW, brand: "MagicLinen", name: "Linen Waffle Throw Blanket", comp: LIN,
    url: "https://magiclinen.com/products/beige-waffle-throw",
    description: "A smaller waffle throw in 100% European flax linen, OEKO-TEX certified and stonewashed to a lived-in softness. The kind of thing you keep on the sofa arm and reach for without thinking." },

  // ---- BEDDING (MagicLinen: 100% European flax linen, OEKO-TEX) -----------
  { ...BED, brand: "MagicLinen", name: "Linen Duvet Cover", comp: LIN,
    url: "https://magiclinen.com/products/white-linen-duvet-cover",
    description: "A 100% European flax linen duvet cover, OEKO-TEX certified and stonewashed so it arrives soft instead of stiff. Linen is breathable and thermoregulating, which is why it feels cool in summer and warm in winter. Shown in a clean white." },
  { ...BED, brand: "MagicLinen", name: "Linen Fitted Sheet", comp: LIN,
    url: "https://magiclinen.com/products/natural-linen-fitted-sheet",
    description: "A fitted sheet in 100% European flax linen, OEKO-TEX certified. It wicks moisture and lets air move, so you sleep without the damp, overheated feeling that synthetic sheets create. Shown in an undyed natural." },
  { ...BED, brand: "MagicLinen", name: "Linen Flat Sheet", comp: LIN,
    url: "https://magiclinen.com/products/natural-linen-flat-sheet",
    description: "A flat sheet in 100% European flax linen, OEKO-TEX certified and softened through stonewashing. Naturally breathable, and it only gets better the more you wash it. Shown in an undyed natural." },
  { ...BED, brand: "MagicLinen", name: "Linen Pillowcase", comp: LIN,
    url: "https://magiclinen.com/products/natural-linen-pillowcase",
    description: "A 100% European flax linen pillowcase, OEKO-TEX certified. Breathable and moisture-wicking against your face for eight hours a night, with no resin finishes or synthetic blend. Shown in an undyed natural." },
  { ...BED, brand: "MagicLinen", name: "Linen Sheet Set", comp: LIN,
    url: "https://magiclinen.com/products/white-linen-sheet-set",
    description: "The full bed in 100% European flax linen, OEKO-TEX certified. Flat sheet, fitted sheet and pillowcases, all stonewashed soft and built to outlast several cotton sets. Shown in a clean white." },

  // ---- BEDDING (Sijo: TENCEL lyocell, OEKO-TEX) ---------------------------
  { ...BED, brand: "Sijo", name: "AiryWeight Eucalyptus Comforter", comp: LYO,
    url: "https://sijohome.com/products/eucalyptus-comforter",
    description: "A comforter in 100% TENCEL lyocell, shell and fill, OEKO-TEX certified. Lyocell is made in a closed-loop process, and it moves heat and moisture away from you instead of trapping it like a polyester fill." },
  { ...BED, brand: "Sijo", name: "AiryWeight Eucalyptus Duvet Cover", comp: LYO,
    url: "https://sijohome.com/products/eucalyptus-duvet-cover",
    description: "A duvet cover in 100% TENCEL lyocell sourced from European wood pulp. OEKO-TEX certified, cool and fluid against the skin, and naturally resistant to the damp that dust mites like." },
  { ...BED, brand: "Sijo", name: "AiryWeight Eucalyptus Sheet Set", comp: LYO,
    url: "https://sijohome.com/products/eucalyptus-sheets",
    description: "A sheet set in 100% TENCEL lyocell, OEKO-TEX certified. It wicks moisture better than cotton and sleeps genuinely cool, which matters if you run hot or wake up sweating." },
  { ...BED, brand: "Sijo", name: "AiryWeight Eucalyptus Pillowcase Set", comp: LYO,
    url: "https://sijohome.com/products/eucalyptus-pillow-case",
    description: "Pillowcases in 100% TENCEL lyocell, OEKO-TEX certified. Smooth enough to be kind to skin and hair overnight, and breathable so the pillow does not turn into a warm, damp surface." },
  { ...BED, brand: "Sijo", name: "AiryWeight Eucalyptus Fitted Sheet", comp: LYO,
    url: "https://sijohome.com/products/fitted-sheet",
    description: "A fitted sheet in 100% TENCEL lyocell, OEKO-TEX certified, made in a closed-loop process that recaptures its solvents. Cool, smooth, and free of the resin finishes used to make cotton wrinkle-free." },

  // ---- BEDDING (Takasa: GOTS + Fairtrade organic cotton) ------------------
  { ...BED, brand: "Takasa", name: "Cool + Crisp Organic Cotton Bed Sheet Set", comp: OC,
    url: "https://takasa.co/products/organic-and-fairtrade-cotton-percale-bed-sheet-set",
    description: "A crisp percale sheet set in 100% GOTS organic cotton, Fairtrade certified from the farm through to the finished hem. Percale breathes, so it sleeps cool and only softens with washing." },
  { ...BED, brand: "Takasa", name: "Cool + Crisp Organic Cotton Duvet Cover", comp: OC,
    url: "https://takasa.co/products/organic-and-fairtrade-cool-crisp-cotton-duvet-cover",
    description: "A percale duvet cover in GOTS organic cotton, coloured only with GOTS-approved dyes and free of the formaldehyde-based finishes used to keep conventional bedding smooth in the bag." },
  { ...BED, brand: "Takasa", name: "Cool + Crisp Organic Cotton Fitted Sheet", comp: OC,
    url: "https://takasa.co/products/organic-and-fairtrade-cool-crisp-cotton-fitted-sheet",
    description: "A GOTS organic cotton fitted sheet in a cool percale weave, Fairtrade certified. Grown without the pesticides that conventional cotton leans on, and finished without the softening resins." },
  { ...BED, brand: "Takasa", name: "Cool + Crisp Organic Cotton Flat Sheet", comp: OC,
    url: "https://takasa.co/products/organic-and-fairtrade-cool-crisp-cotton-flat-sheet",
    description: "A percale flat sheet in 100% GOTS organic cotton. Breathable, crisp, and audited from seed to finished product so nothing harsh ends up against you for eight hours a night." },
  { ...BED, brand: "Takasa", name: "Cool + Crisp Organic Cotton Pillow Cases", comp: OC,
    url: "https://takasa.co/products/organic-and-fairtrade-cool-crisp-cotton-pillow-cases",
    description: "GOTS organic cotton pillow cases in a cool percale weave, Fairtrade certified. The surface your face is pressed into all night, made without pesticide residue or resin finishing." },

  // ---- BEDDING (others) ---------------------------------------------------
  { ...BED, brand: "Delilah Home", name: "Organic Cotton Bed Sheet Collection", comp: OC,
    url: "https://delilahhome.com/products/buy-organic-cotton-bed-sheet-sets",
    description: "Sheets in 100% certified organic cotton, GOTS certified end to end. No pesticide residue, no formaldehyde wrinkle-resist finish, and no polyester blended in to cut the cost." },
  { ...BED, brand: "Under the Canopy", name: "Linen Eucalyptus Duvet Set", comp: { lyocell: 60, linen: 40 },
    url: "https://underthecanopy.com/products/linen-eucalyptus-duvet-set-chambray",
    description: "A duvet set blending TENCEL lyocell with linen, carrying both OEKO-TEX and GOTS certification. The linen brings breathability and structure, the lyocell brings a cool, fluid drape." },

  // ---- SPARES (only used if something above fails validation) -------------
  { ...BED, brand: "MagicLinen", name: "Linen Pillowcase Set", comp: LIN, spare: true,
    url: "https://magiclinen.com/products/white-linen-pillowcase",
    description: "Pillowcases in 100% European flax linen, OEKO-TEX certified and stonewashed soft. Breathable against your skin all night, with no synthetic blend and no resin finish. Shown in a clean white." },
  { ...BED, brand: "Sijo", name: "AiryWeight Eucalyptus Flat Sheet", comp: LYO, spare: true,
    url: "https://sijohome.com/products/eucalyptus-flat-sheet",
    description: "A flat sheet in 100% TENCEL lyocell, OEKO-TEX certified. Cool, smooth and moisture-wicking, made in a closed-loop process that recovers its solvents." },
  { ...BATH, brand: "MagicLinen", name: "Linen Waffle Bath Towel", comp: LIN, spare: true,
    url: "https://magiclinen.com/products/cinnamon-linen-waffle-towel-set",
    description: "A waffle-weave bath towel in 100% European flax linen, OEKO-TEX certified. Absorbent, fast-drying and naturally fresh between uses." },
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

  // page-parsed composition wins; explicit hand-read `comp` is the fallback
  const comp = toFractions(v.composition) || toFractions(item.comp);
  if (!comp) return { skip: "no composition" };
  const score = calcToxomeScore(comp);
  if (score == null || score < SCORE_BAR) return { skip: `score ${score} below bar` };

  const { data: dup } = await supabase.from("products").select("id").eq("item_url", v.finalUrl).maybeSingle();
  if (dup) return { skip: `dup ${dup.id.slice(0, 8)}` };

  const certs = v.certifications && v.certifications.length ? v.certifications : null;
  const price = typeof v.price === "number" ? v.price : null;
  const row = {
    item_name: item.name, brand: item.brand,
    item_price: price, currency: "USD", budget: budget(price),
    category: item.category, gender: "Home", occasion: item.occasion,
    item_image: v.images[0], images: v.images, item_url: v.finalUrl, affiliate_url: null,
    fabric_composition: comp, materials_text: materialsFromComp(comp),
    description: item.description,
    certifications: certs,
    toxome_score: score, risk_level: scoreToRiskLevel(score),
    published: !!live, rejected: false, added_by: "manual", reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-home-certified", "no-llm"],
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) return { skip: `insert: ${error.message}` };
  return { ok: true, id: data.id, score, price, certs, comp, imgs: v.images.length };
}

async function run() {
  const live = !process.argv.includes("--draft");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, key);

  const main = ITEMS.filter((i) => !i.spare);
  const spares = ITEMS.filter((i) => i.spare);
  let added = 0;
  const failed = [];

  for (const item of [...main, ...spares]) {
    if (added >= TARGET) break;
    if (item.spare && added + (main.length - added) >= TARGET && failed.length === 0) break;
    const r = await addOne(supabase, item, live);
    if (r.ok) {
      added++;
      console.log(`✓ ${String(added).padStart(2)} ${item.category.padEnd(18)} ${item.brand} — ${item.name}`);
      console.log(`     $${r.price} · score ${r.score} · ${r.certs ? r.certs.join("/") : "no certs"} · ${r.imgs} imgs`);
    } else {
      failed.push(`${item.brand} — ${item.name}: ${r.skip}`);
      console.log(`✗    ${item.brand} — ${item.name}  (${r.skip})`);
    }
  }
  console.log(`\n${added}/${TARGET} inserted as ${live ? "LIVE" : "drafts"}.`);
  if (failed.length) console.log("failed:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
