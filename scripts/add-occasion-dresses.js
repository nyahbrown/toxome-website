/**
 * Women's special-occasion dresses (2026-07-18). No LLM, no Anthropic API.
 *
 * Same page-grounded validate + score + draft path as add-women-under100.js:
 * getValidatedProduct (regex + JSON-LD) for composition/certs/images/price, then
 * calcToxomeScore, then the >=67 fiber bar, then insert as published:false drafts
 * for /admin review. `comp` is never guessed; the recoverComp fallback re-reads the
 * full PDP text for JS-rendered fabric lines (Jenni Kayne, Baserange).
 *
 * Sourcing rules honored ([[toxome-sourcing-rules]]): special-occasion = wedding-guest,
 * so NO white/ivory/cream/bridal and NO black; muted/jewel tones only (navy, sage/moss,
 * dusty/french blue, blush, plum, olive, brown). Modern elevated-minimal aesthetic
 * (Silk Laundry / St. Agni / Jenni Kayne / Ozma lanes), no loud prints. Every item has
 * a colorway-free item_name, a Toxome-voice description, and a non-empty occasion[].
 * Brand diversity: max 4 per brand across 9 brands.
 *
 *   node --env-file=.env.local scripts/add-occasion-dresses.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, fetchPage } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

// --- page-grounded composition recovery (same as add-women-under100.js) ------
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
  if (/cupro/.test(s)) return "cupro";
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

const OCC = ["Evening", "Special Occasion"];
const OCC_RESORT = ["Special Occasion", "Vacation/Resort"];

const ITEMS = [
  // ---- Silk Laundry (100% silk, OEKO-TEX) ---------------------------------
  { brand: "Silk Laundry", name: "Habotai Scoop Neck Silk Dress", category: "Dresses", occasion: OCC,
    url: "https://silklaundry.com/products/habotai-scoop-neck-dress-midnight",
    description: "A fluid scoop-neck dress in 100% silk, OEKO-TEX certified, shown in a deep midnight blue. Silk breathes and moves with you where most occasion dresses are lined in polyester that traps heat. This one is just silk, nothing sitting against your skin all night." },
  { brand: "Silk Laundry", name: "90s Silk Slip Dress", category: "Dresses", occasion: OCC,
    url: "https://silklaundry.com/products/90s-slip-dress-planktonic",
    description: "The bias-cut slip that goes anywhere, in 100% silk with an OEKO-TEX certification, in a muted sea-green. A real silk slip skims the body and stays cool. The lookalikes are polyester satin, which is plastic with a shine." },
  { brand: "Silk Laundry", name: "Long Halter Silk Dress", category: "Dresses", occasion: OCC,
    url: "https://silklaundry.com/products/long-halter-dress-deadleaf",
    description: "A floor-length halter in 100% silk, OEKO-TEX certified, in a soft olive deadleaf. Full-length and completely unlined, so it drapes and breathes instead of clinging the way a synthetic gown does." },
  { brand: "Silk Laundry", name: "Scoop Neck Silk Midi Dress", category: "Dresses", occasion: OCC,
    url: "https://silklaundry.com/products/scoop-neck-dress-deadleaf",
    description: "A midi-length scoop-neck dress in 100% silk, OEKO-TEX certified, in the same quiet olive. Easy to dress up or down, and pure silk means it wears cool through a long evening." },

  // ---- Eberjey (washable silk) --------------------------------------------
  { brand: "Eberjey", name: "Washable Silk Slip Dress with Lace", category: "Dresses", occasion: OCC,
    url: "https://eberjey.com/products/washable-silk-with-lace-embroidery-short-slip-powder-blue",
    description: "A short silk slip trimmed with lace embroidery, in 100% washable silk, OEKO-TEX and bluesign certified, shown in powder blue. Machine-washable silk that skips the dry-clean chemicals, and breathes the way a synthetic slip never will." },

  // ---- St. Agni (LENZING ECOVERO) -----------------------------------------
  { brand: "St. Agni", name: "Apron Dress", category: "Dresses", occasion: OCC,
    url: "https://st-agni.com/products/apron-dress-moss",
    description: "A minimal apron-cut dress in 100% LENZING ECOVERO, a certified low-impact viscose, in a deep moss green. Clean architectural lines with a fluid drape, and a cellulosic fiber made in a closed-loop process instead of a conventional one." },

  // ---- Jenni Kayne (fine-knit cashmere + cotton) --------------------------
  { brand: "Jenni Kayne", name: "Hastings Cashmere Dress", category: "Dresses", occasion: OCC,
    url: "https://www.jennikayne.com/products/hastings-dress-navy",
    description: "A fine-knit column dress in 100% cashmere, shown in navy. Cashmere is a natural fiber that regulates temperature on its own, so a knit dress like this wears warm without the static and cling of an acrylic knit." },
  { brand: "Jenni Kayne", name: "Iris Cashmere Dress", category: "Dresses", occasion: OCC,
    url: "https://www.jennikayne.com/products/iris-dress-brown",
    description: "A softly draped knit dress in 100% cashmere, in a warm brown. All the polish of an evening knit with none of the plastic, since it is a single natural fiber rather than a wool-acrylic blend." },
  { brand: "Jenni Kayne", name: "Peninsula Cashmere Dress", category: "Dresses", occasion: OCC,
    url: "https://www.jennikayne.com/products/peninsula-dress-french-blue",
    description: "A relaxed cashmere knit dress in a muted french blue, cut for ease. One hundred percent cashmere breathes and holds its shape, where most knit dresses at this length hide polyester to cut cost." },
  { brand: "Jenni Kayne", name: "Cove Cotton Dress", category: "Dresses", occasion: OCC,
    url: "https://www.jennikayne.com/products/cove-dress-navy",
    description: "An easy knit dress in 100% cotton, shown in navy. A clean, dress-up-or-down shape in a breathable natural fiber, with nothing synthetic worked into the yarn." },

  // ---- Anine Bing ---------------------------------------------------------
  { brand: "Anine Bing", name: "Mary Long-Sleeve Dress", category: "Dresses", occasion: OCC,
    url: "https://www.aninebing.com/products/mary-dress-long-sleeve-freshwater-blue",
    description: "A long-sleeve dress in 100% cotton, shown in a freshwater blue. Covered-up and elegant for evening, in a fiber that lets your skin breathe instead of a synthetic that seals in heat." },
  { brand: "Anine Bing", name: "Carissa Silk-Blend Dress", category: "Dresses", occasion: OCC,
    url: "https://www.aninebing.com/products/carissa-dress-blush",
    description: "A soft occasion dress led by silk, in a blush tone. The blend is majority silk over a cellulosic viscose, so it drapes with a real sheen and stays far cleaner than the polyester satin most blush dresses are cut from." },

  // ---- Ozma of California (GOTS organic cotton) ---------------------------
  { brand: "Ozma", name: "Maritza Organic Poplin Dress", category: "Dresses", occasion: OCC_RESORT,
    url: "https://ozmaofcalifornia.com/products/maritza-dress-textured-organic-poplin-fern",
    description: "A textured poplin dress in 100% organic cotton, GOTS and Fair Trade certified, in a soft fern green. Structured enough for an event, breathable enough for a warm garden afternoon, and grown without the pesticide load of conventional cotton." },
  { brand: "Ozma", name: "Ophelia Organic Batiste Dress", category: "Dresses", occasion: OCC_RESORT,
    url: "https://ozmaofcalifornia.com/products/ophelia-dress-organic-batiste-butter",
    description: "A light batiste dress in 100% organic cotton, GOTS and Fair Trade certified, in a pale butter yellow. Airy and fine for warm-weather occasions, in a certified-organic cotton that skips the finishing chemicals." },

  // ---- Lunya (washable silk) ----------------------------------------------
  { brand: "Lunya", name: "Washable Silk Bias Slip Dress", category: "Dresses", occasion: OCC,
    url: "https://www.lunya.co/products/womens-washable-silk-bias-slip-dress-delicate-pink",
    comp: { silk: 100 }, // Lunya renders the fabric line via JS; read off the live PDP (100% washable silk)
    description: "A bias-cut slip in 100% washable silk, bluesign certified, in a delicate pink. Real machine-washable silk skims and breathes, where the satin slip it resembles is polyester that clings and holds heat." },

  // ---- Baserange (silk, linen, organic cotton) ----------------------------
  { brand: "Baserange", name: "Moy Silk Dress", category: "Dresses", occasion: OCC,
    url: "https://baserange.com/products/moy-dress-in-inu-purple-laco-purple",
    description: "A fluid dress in 100% silk, OEKO-TEX certified, in a muted plum purple. Minimal and unlined, cut from a single natural fiber that drapes and breathes rather than trapping warmth the way a lined synthetic dress does." },
  { brand: "Baserange", name: "Lava Linen Dress", category: "Dresses", occasion: OCC_RESORT,
    url: "https://baserange.com/products/lava-dress-in-ama-brown",
    description: "A relaxed dress in 100% linen, OEKO-TEX certified, in a warm earth brown. Linen is the most breathable fiber there is, which makes this an easy choice for a summer occasion when a synthetic would leave you overheated." },
  { brand: "Baserange", name: "Omato Organic Cotton Rib Dress", category: "Dresses", occasion: OCC_RESORT,
    url: "https://baserange.com/products/omato-long-sleeve-dress-organic-cotton-rib-in-jade-brown",
    description: "A long-sleeve ribbed dress in organic cotton with a touch of stretch, OEKO-TEX and GOTS certified, in a jade brown. A fitted knit that moves with you, built on a certified-organic cotton base instead of a synthetic rib." },

  // ---- Cou Cou Intimates (organic cotton, B Corp) -------------------------
  { brand: "Cou Cou Intimates", name: "The Cami Slip", category: "Dresses", occasion: OCC,
    url: "https://coucouintimates.com/products/the-cami-slip-french-blue",
    description: "A delicate pointelle cami slip in 100% organic cotton from a B Corp maker, in french blue. A breathable cotton slip that works on its own or as a layer, with none of the synthetic mesh most slips are built from." },
  { brand: "Cou Cou Intimates", name: "The Midi Slip", category: "Dresses", occasion: OCC,
    url: "https://coucouintimates.com/products/the-midi-slip-blue-fields",
    description: "A midi-length pointelle slip in 100% organic cotton from a B Corp maker, in a soft blue. Quiet and easy for an occasion, in a certified-organic cotton that breathes against the skin." },
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
  if (price == null) return { skip: "no price" };

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
    published: !!live, rejected: false, added_by: "agent", reviewed_at: live ? new Date().toISOString() : null,
    tags: ["batch-occasion-dresses", "no-llm"],
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
      console.log(`✓ ${String(n).padStart(2)} ${item.brand.padEnd(18)} — ${item.name}`);
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
