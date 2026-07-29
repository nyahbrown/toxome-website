/**
 * Footwear adds scored by the FOOTWEAR rubric (lib/footwearScore.ts), not the
 * apparel fiber one.
 *
 * scripts/add-footwear.js is the old path and scores the upper only. It stays
 * for reference but must not be used for new shoes: reading one composition
 * string rates a polyurethane-soled trainer 85 and "low risk". Use this.
 *
 * Every component below is the brand's own words, quoted in the comment above
 * each item. A component the brand never named is left out, and the rubric
 * refuses to score a shoe missing an upper or a sole rather than guessing.
 *
 *   npx tsx --env-file=.env.local scripts/add-footwear-scored.mts --draft --dry
 */
import { createClient } from "@supabase/supabase-js";
import { scoreFootwear, unresolvedMaterials, type FootwearInput } from "../lib/footwearScore";

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";
const budget = (p: number) => (p < 50 ? "$" : p <= 150 ? "$$" : "$$$");

type Item = {
  name: string;
  brand: string;
  gender: string;
  url: string;
  price: number;
  images: string[];
  /** Stored on the row so /shop still renders "what it is made of". This is the
   *  UPPER, which is the only part shoes quote as a percentage. The sole is in
   *  the description, where it cannot be mistaken for the whole shoe. */
  upperComposition: Record<string, number>;
  materialsText: string;
  spec: FootwearInput;
  occasion: string[];
  description: string;
};

const ITEMS: Item[] = [
  {
    // PDP, read 2026-07-29: "created with a 92% Tencel™, 7% Hotmelt and 1%
    // Roica upper" and "sole is made from recycled polyurethane, topped with a
    // layer of naturally antibacterial cork". No lining is described, so none
    // is scored. Roica is Asahi Kasei's branded elastane; Hotmelt is a
    // thermoplastic adhesive.
    name: "Primus Lite Knit Natural",
    brand: "Vivobarefoot",
    gender: "Women",
    url: "https://www.vivobarefoot.com/us/primus-lite-knit-natural-womens",
    price: 170,
    images: [
      "https://www.vivobarefoot.com/media/catalog/product/2/0/209576-01_siden.jpg",
      "https://www.vivobarefoot.com/media/catalog/product/2/0/209576-01_pairn.jpg",
      "https://www.vivobarefoot.com/media/catalog/product/2/0/209576-01_soleandtopn.jpg",
      "https://www.vivobarefoot.com/media/catalog/product/2/0/209576-01_insiden.jpg",
      "https://www.vivobarefoot.com/media/catalog/product/2/0/209576-01_backn.jpg",
    ],
    upperComposition: { lyocell: 92, hotmelt: 7, elastane: 1 },
    materialsText:
      "Upper: 92% Tencel, 7% hotmelt, 1% Roica. Sole: recycled polyurethane with a cork top layer.",
    spec: {
      upper: { parts: { tencel: 92, hotmelt: 7, roica: 1 } },
      footbed: { parts: { cork: 100 } },
      sole: { parts: { recycled_polyurethane: 100 } },
    },
    occasion: ["Everyday"],
    description:
      "a barefoot trainer with a knitted sock upper that is 92% tencel, the wood-pulp fiber spun in a closed loop, with 7% hotmelt adhesive and 1% roica stretch holding it together. the sole is recycled polyurethane topped with cork, so this is a natural upper on a plastic sole rather than a plastic-free shoe, and the score says so. wide toe box, thin flexible sole, made for sockless wear. in dusty green.",
  },
];

async function main() {
  const dry = process.argv.includes("--dry");
  const live = !process.argv.includes("--draft");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(SUPABASE_URL, key);

  for (const item of ITEMS) {
    const unknown = unresolvedMaterials(item.spec);
    if (unknown.length) {
      console.log(`✗ ${item.brand} ${item.name}: unknown materials ${unknown.join(", ")}`);
      continue;
    }
    const r = scoreFootwear(item.spec);
    if (r.score == null) {
      console.log(`✗ ${item.brand} ${item.name}: not scoreable, missing ${r.missing.join(", ")}`);
      continue;
    }

    const { data: dup } = await sb
      .from("products")
      .select("id")
      .eq("item_url", item.url)
      .maybeSingle();
    if (dup) {
      console.log(`✗ ${item.brand} ${item.name}: dup ${dup.id.slice(0, 8)}`);
      continue;
    }

    const row = {
      item_name: item.name,
      brand: item.brand,
      item_price: item.price,
      currency: "USD",
      budget: budget(item.price),
      category: "Footwear",
      gender: item.gender,
      occasion: item.occasion,
      item_image: item.images[0],
      images: item.images,
      item_url: item.url,
      fabric_composition: item.upperComposition,
      materials_text: item.materialsText,
      description: item.description,
      toxome_score: r.score,
      risk_level: r.band,
      published: live,
      rejected: false,
      added_by: "agent",
      tags: ["batch-footwear-v2", "footwear-rubric-v1", "no-llm"],
    };

    console.log(
      `${dry ? "would add" : "added"}  ${item.brand} ${item.name}  $${item.price}  score ${r.score} (${r.band})`,
    );
    console.log(
      `   ${r.breakdown.map((b) => `${b.component} ${Math.round(b.hazard)} w${b.weight}`).join("  ")}` +
        `${r.missing.length ? `   missing: ${r.missing.join(",")}` : ""}`,
    );
    if (dry) continue;

    const { data, error } = await sb.from("products").insert(row).select("id, slug").single();
    if (error) console.log(`   insert failed: ${error.message}`);
    else console.log(`   ${data.id}  /shop/${data.slug}`);
  }
}
main();
