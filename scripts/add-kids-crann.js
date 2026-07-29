/**
 * Crann Organic — kids seed (2026-07-24). No LLM, no Anthropic API.
 *
 * Crann Organic (crannorganic.com) is a US/USD Shopify store. The ENTIRE
 * 44-product catalog is 100% GOTS certified organic cotton (score 92) in
 * BIG-KID sizes 2–12 — which is the real gap it fills, since the Toxome kids
 * catalog skews infant (L'ovedbaby / Under the Nile / Burt's Bees).
 * Brand angle: sensory-friendly construction (flat seams, no tags, no
 * irritating pockets) — a genuine toxic-load-adjacent story.
 *
 * No currency trap: feed price == PDP price, "currency":"USD" throughout.
 * Composition comes off body_html / the PDP materials tab (all 100% oc).
 *
 * ⚠️ Colorway-led catalog: nearly every product exists in 3–4 colorways, so
 * this collapses to ONE colorway per garment TYPE (color lives in the
 * description, never in item_name).
 *
 * ⚠️ AESTHETIC FLAG for /admin: Crann's palette is bright/primary
 * (cobalt, teal, marigold, orange) with playful prints. There is NO neutral
 * lane in this brand — even "Oat" and "Gray" pieces carry teal/cobalt
 * colorblocking. The picks below are the most restrained items that exist.
 *
 * ⚠️ The AW23 pieces (hoodie, leggings, colorblock sweatpants, wide leg
 * sweatpants) are tagged "final sale" and sit under a 70%-off clearance
 * banner — they will disappear when they sell through. All were verified at
 * 7/8 or 8/8 sizes in stock at insert time; tagged `clearance-verify`.
 *
 *   node --env-file=.env.local scripts/add-kids-crann.js --dry
 *   node --env-file=.env.local scripts/add-kids-crann.js --draft
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const DOMAIN = "https://crannorganic.com";
const BRAND = "Crann Organic";
const OC = { "organic cotton": 100 };
const UA = { "User-Agent": "Mozilla/5.0" };

const budget = (p) => (p == null ? null : p < 50 ? "$" : p <= 150 ? "$$" : "$$$");
const materialsFromComp = (c) =>
  !c ? null : Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}% ${k}`).join(", ");

// occasion[] must use the LOCKED Lifestyle-5 Title-Case strings.
const EVERYDAY = ["Everyday"];
const SUMMER = ["Everyday", "Vacation/Resort"];

const ITEMS = [
  // ── Tops ────────────────────────────────────────────────────────────────
  { handle: "kids-organic-cotton-oat-hoodie", name: "Organic Cotton Hoodie", category: "Tops",
    occasion: EVERYDAY, clearance: true,
    desc: "a zip hoodie in 100% GOTS organic cotton fleece, brushed soft with flat seams so it doesn't scratch. no polyester fleece and no synthetic pile, in an oat body with teal sleeves." },
  { handle: "kids-organic-cotton-sweatshirt", name: "Organic Cotton Sweatshirt", category: "Tops",
    occasion: EVERYDAY, clearance: true,
    desc: "an oversized crewneck sweatshirt in 100% GOTS organic cotton with a printed gondola lift, cozy without the plastic fleece most kids' sweats are made of. in a bright blue." },
  { handle: "organic-cotton-t-shirt-blue", name: "Organic Cotton T-Shirt", category: "Tops",
    occasion: SUMMER,
    desc: "a plain everyday tee in 100% GOTS organic cotton, breathable and sensory-friendly with no tag at the neck. in a solid cobalt." },
  { handle: "blue-tank-top", name: "Organic Cotton Tank Top", category: "Tops",
    occasion: SUMMER,
    desc: "an oversized summer tank in 100% GOTS organic cotton that stays cool against skin instead of trapping heat like a poly blend. in cobalt with a small mountain print." },

  // ── Bottoms ─────────────────────────────────────────────────────────────
  { handle: "organic-cotton-leggings-gray", name: "Organic Cotton Leggings", category: "Bottoms",
    occasion: EVERYDAY, clearance: true,
    desc: "slim everyday leggings in 100% GOTS organic cotton with a soft sensory-friendly waistband and zero elastane. in heather gray with a small blue print." },
  { handle: "kids-organic-fleece-sweatpants", name: "Colorblock Sweatpants", category: "Bottoms",
    occasion: EVERYDAY, clearance: true,
    desc: "best-selling sweatpants in 100% GOTS organic cotton fleece, designed with flat seams and no irritating pockets. no synthetic fleece anywhere, in oat with a teal side stripe." },
  { handle: "girls-wide-leg-sweatpants", name: "Wide Leg Sweatpants", category: "Bottoms",
    occasion: EVERYDAY, clearance: true,
    desc: "high-waisted wide leg sweatpants in 100% GOTS organic cotton, pocketless and sensory-friendly so nothing rubs. in a bright blue with a small print." },
  { handle: "kids-blue-shorts", name: "Colorblock Shorts", category: "Bottoms",
    occasion: SUMMER,
    desc: "unisex pull-on summer shorts in 100% GOTS organic cotton, gentle on sensitive skin and breathable in real heat. in cobalt with green colorblock pockets." },

  // ── Dresses ─────────────────────────────────────────────────────────────
  { handle: "organic-cotton-dress", name: "Gingham Dress", category: "Dresses",
    occasion: SUMMER,
    desc: "a sleeveless dress in 100% GOTS organic cotton with a peter pan collar and button back, light enough to run in all summer. in a blue and green gingham check." },
  { handle: "girls-summer-dresses", name: "Summer Dress", category: "Dresses",
    occasion: SUMMER,
    desc: "a peter pan collar summer dress in 100% GOTS organic cotton, breathable and soft against skin with no synthetic lining. in a blue bird print." },
];

// ⚠️ The per-product /products/{handle}.json reports available:false on EVERY
// variant here (the known-unreliable Shopify `available` field). The paginated
// COLLECTION feed reports real per-size stock, so index that once and use it.
let FEED = null;
async function loadFeed() {
  if (FEED) return FEED;
  FEED = new Map();
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${DOMAIN}/products.json?limit=250&page=${page}`, { headers: UA });
    const list = (await res.json()).products || [];
    if (!list.length) break;
    list.forEach((p) => FEED.set(p.handle, p));
    if (list.length < 250) break;
  }
  return FEED;
}

async function fetchProduct(handle) {
  const p = (await loadFeed()).get(handle);
  if (!p) return null;
  const images = (p.images || []).map((i) => i.src).filter(Boolean);
  const variants = p.variants || [];
  const inStock = variants.filter((v) => v.available).length;
  const prices = variants.map((v) => parseFloat(v.price)).filter((n) => n > 0);
  return {
    price: prices.length ? Math.min(...prices) : null,
    images,
    inStock,
    total: variants.length,
    title: p.title,
  };
}

async function build(item) {
  const url = `${DOMAIN}/products/${item.handle}`;
  const meta = await fetchProduct(item.handle);
  if (!meta) return { skip: "no product JSON" };
  if (meta.price == null) return { skip: "no price" };
  if (meta.images.length < 2) return { skip: `only ${meta.images.length} image(s)` };
  // stock gate: core sizes must be available, not a 1-left remnant
  if (meta.inStock < Math.ceil(meta.total / 2)) {
    return { skip: `thin stock ${meta.inStock}/${meta.total}` };
  }

  const score = calcToxomeScore(OC);
  if (score == null) return { skip: "unscoreable" };

  const tags = ["batch-kids-crann", "no-llm"];
  if (item.clearance) tags.push("clearance-verify");

  return {
    url,
    meta,
    score,
    row: {
      item_name: item.name,
      brand: BRAND,
      item_price: meta.price,
      currency: "USD",
      budget: budget(meta.price),
      category: item.category,
      gender: "Kids",
      occasion: item.occasion,
      item_image: meta.images[0],
      images: meta.images.slice(0, 6),
      item_url: url,
      affiliate_url: null,
      fabric_composition: OC,
      materials_text: materialsFromComp(OC),
      description: item.desc,
      certifications: ["gots"],
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

  let n = 0;
  const failed = [];
  for (const item of ITEMS) {
    const built = await build(item);
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
      `     $${built.meta.price} · score ${built.score} · ${materialsFromComp(OC)} · ` +
      `${built.row.images.length} imgs · stock ${built.meta.inStock}/${built.meta.total} · ` +
      `occ ${JSON.stringify(item.occasion)}${item.clearance ? " · CLEARANCE" : ""}`
    );
  }

  console.log(`\n${n}/${ITEMS.length} ${dry ? "would insert (DRY RUN, no writes)" : "inserted as drafts (published:false)"}.`);
  if (failed.length) console.log("skipped:\n  " + failed.join("\n  "));
}
run().catch((e) => { console.error(e); process.exit(1); });
