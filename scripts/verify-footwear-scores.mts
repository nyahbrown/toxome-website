/**
 * Verification pass: rescore the already-published footwear from BRAND-STATED
 * component text only. Every `parts` entry below is quoted from the live PDP in
 * the comment above it. Nothing is inferred.
 *
 *   npx tsx --env-file=.env.local scripts/verify-footwear-scores.mts        # report
 *   npx tsx --env-file=.env.local scripts/verify-footwear-scores.mts --apply
 */
import { createClient } from "@supabase/supabase-js";
import { scoreFootwear, unresolvedMaterials, type FootwearInput } from "../lib/footwearScore";

const APPLY = process.argv.includes("--apply");
const sb = createClient(
  "https://xclvodbmllglmharezqa.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SHOES: { slug: string; quote: string; spec: FootwearInput }[] = [
  {
    slug: "baabuk-shunya-wooler",
    quote:
      'Upper: "100% Burel Wool from Swiss Blacknose ... + MIRUM® a plant-based leather-like material containing no synthetics or plastic components" · Inner Lining: "100% Wool Burel" · Insole: "Sisal fiber + Natural latex foam + 100% Burel felted Wool" · Sole: "PLIANT® 100% biobased from natural rubber with plant and mineral pigments"',
    spec: {
      // No wool/MIRUM ratio is published, so `estimated` makes the rubric take
      // the worst of the two rather than inventing a split.
      upper: { parts: { wool: 1, mirum: 1 }, estimated: true },
      lining: { parts: { wool: 100 } },
      footbed: { parts: { sisal: 1, natural_latex: 1, wool: 1 }, estimated: true },
      sole: { parts: { natural_rubber: 100 } },
    },
  },
  {
    slug: "baabuk-peaks-wooler",
    quote:
      'Upper: "100% Pyrenean wool (50% Tarasconnaise, 50% Merino)" · Laces: "100% Roussillon Red sheep\'s wool" · Leather: "REACH certified" (tanning NOT stated) · Outsole: "62.5% natural rubber and 37.5% synthetic rubber" · Insole: "Sisal fibre + natural latex foam + 100% Laines Paysannes wool fabric"',
    spec: {
      upper: { parts: { wool: 50, merino_wool: 50 } },
      footbed: { parts: { sisal: 1, natural_latex: 1, wool: 1 }, estimated: true },
      // Percentages ARE published here, so this is a real weighted blend.
      sole: { parts: { natural_rubber: 62.5, synthetic_rubber: 37.5 } },
      // REACH compliance is chemical regulation, NOT a vegetable-tanning claim.
      // No veg-tan floor is unlocked.
    },
  },
  {
    slug: "kyrgies-bishkek-kicks",
    quote:
      'Upper: "Handmade from all-natural felted wool" · Sole: "a cotton canvas and natural rubber sole"',
    spec: {
      upper: { parts: { wool_felt: 1 } },
      sole: { parts: { cotton_canvas: 1, natural_rubber: 1 }, estimated: true },
    },
  },
  {
    slug: "kyrgies-barefoot-slides",
    quote:
      'Upper: "Made of 100% Kyrgyzstan Wool" · Sole: not named on this PDP, but Kyrgies\' site-wide Product Care (on the Barefoot Wides page, same line) says "our leather or felt-soled products are designed primarily for indoor comfort" and "our leather soled products use vegetable tanned leather soles rather than the highly toxic chromium". This shoe carries the `indoor` tag and no rubber-sole mention, so the sole is one of exactly two brand-named options.',
    spec: {
      upper: { parts: { wool: 100 } },
      // The brand names two possible soles for its indoor line and never says
      // which this one is. Rather than pick, score BOTH and let the conservative
      // `estimated` rule take the worse (veg-tan leather 30 over wool felt 24).
      // It cannot flatter, and it is strictly better than leaving the row on the
      // apparel rubric, which was never valid for a shoe.
      sole: { parts: { wool_felt: 1, leather: 1 }, estimated: true },
      vegetableTanned: true,
    },
  },
  {
    slug: "ohne-project-barefoot-espadrille-080",
    quote:
      'Upper: "100% Cotton Canvas" · Sole: "Natural Jute & Vulcanized Rubber" · "crafted without insoles"',
    spec: {
      upper: { parts: { cotton_canvas: 100 } },
      sole: { parts: { jute: 1, natural_rubber: 1 }, estimated: true },
    },
  },
];

async function main() {
  for (const s of SHOES) {
    const { data: row } = await sb
      .from("products")
      .select("id, brand, item_name, toxome_score, risk_level, published")
      .eq("slug", s.slug)
      .maybeSingle();
    if (!row) {
      console.log(`?? ${s.slug} not found`);
      continue;
    }
    const unknown = unresolvedMaterials(s.spec);
    const r = scoreFootwear(s.spec);
    const from = `${row.toxome_score}/${row.risk_level}`;
    const to = r.score == null ? "NOT SCOREABLE" : `${r.score}/${r.band}`;
    const changed = r.score !== row.toxome_score || r.band !== row.risk_level;

    console.log(`\n${row.brand} — ${row.item_name}  ${row.published ? "[live]" : "[draft]"}`);
    console.log(`  apparel ${from}  ->  footwear ${to}${changed ? "" : "   (no change)"}`);
    console.log(
      `  ${r.breakdown.map((b) => `${b.component} ${Math.round(b.hazard)}`).join("  ")}` +
        `${r.missing.length ? `   missing: ${r.missing.join(",")}` : ""}` +
        `${r.estimated ? "   [some components have no published %]" : ""}`,
    );
    if (unknown.length) console.log(`  ⚠ unresolved materials: ${unknown.join(", ")}`);
    console.log(`  stated: ${s.quote}`);

    if (!APPLY || !changed) continue;
    if (r.score == null) {
      console.log("  → left untouched: needs a human decision, not an automatic null");
      continue;
    }
    const { error } = await sb
      .from("products")
      .update({ toxome_score: r.score, risk_level: r.band })
      .eq("id", row.id);
    console.log(error ? `  → FAILED ${error.message}` : "  → updated");
  }
}
main();
