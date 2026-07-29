/**
 * Women's summer footwear, scored by the FOOTWEAR rubric.
 * Every component is quoted from the live PDP in the comment above each item.
 */
import { createClient } from "@supabase/supabase-js";
import { scoreFootwear, unresolvedMaterials, type FootwearInput } from "../lib/footwearScore";

const sb = createClient("https://xclvodbmllglmharezqa.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY!);
const budget = (p: number) => (p < 50 ? "$" : p <= 150 ? "$$" : "$$$");

// Soludos states "Outsole: Undyed rubber made from 68% naturally derived
// sources". The other 32% is NOT stated, so it scores as the neutral unknown
// rather than being assumed to be more rubber.
const SOLUDOS_SOLE = { natural_rubber: 68, unstated_soludos_remainder: 32 };
const SOLUDOS_LINING = { cotton: 100 };

type Item = { name: string; brand: string; url: string; price: number; occasion: string[];
  comp: Record<string, number>; materialsText: string; spec: FootwearInput; description: string };

const ITEMS: Item[] = [
  { name: "Original Espadrille in Raffia", brand: "Soludos",
    url: "https://soludos.com/products/womens-original-espadrille-raffia-natural-undyed",
    price: 95, occasion: ["Everyday", "Vacation/Resort"],
    comp: { raffia: 100 },
    materialsText: "Upper: 8oz 100% raffia. Lining: undyed 100% cotton twill. Outsole: undyed rubber made from 68% naturally derived sources.",
    spec: { upper: { parts: { raffia: 100 } }, lining: { parts: SOLUDOS_LINING }, sole: { parts: SOLUDOS_SOLE } },
    description: "a classic espadrille with an upper woven entirely from raffia, the dried palm fiber, over a jute base. undyed throughout, so there is no dye load sitting against the foot, and the outsole is rubber made from 68% naturally derived sources rather than a foam. in natural undyed." },

  { name: "Platform Smoking Espadrille", brand: "Soludos",
    url: "https://soludos.com/products/womens-platform-smoking-espadrille-woven-color-natural-undyed",
    price: 109, occasion: ["Everyday", "Vacation/Resort"],
    comp: { "organic cotton": 100 },
    materialsText: "Upper: 10oz 100% organic cotton basketweave. Lining: undyed 100% cotton twill. Outsole: undyed rubber made from 68% naturally derived sources.",
    spec: { upper: { parts: { organic_cotton: 100 } }, lining: { parts: SOLUDOS_LINING }, sole: { parts: SOLUDOS_SOLE } },
    description: "a slip-on espadrille on a 25mm platform, with the upper basketwoven from 10oz organic cotton and lined in undyed cotton twill. organic cotton means the crop was grown without the synthetic pesticides conventional cotton leans on. in natural undyed." },

  { name: "Dali Mule Espadrille", brand: "Soludos",
    url: "https://soludos.com/products/espadrilles-womens-the-dali-mule-canvas-colors-natural-undyed",
    price: 79, occasion: ["Everyday", "Vacation/Resort"],
    comp: { cotton: 100 },
    materialsText: "Upper: 10oz 100% cotton. Lining: undyed 100% cotton twill. Outsole: undyed rubber made from 68% naturally derived sources.",
    spec: { upper: { parts: { cotton: 100 } }, lining: { parts: SOLUDOS_LINING }, sole: { parts: SOLUDOS_SOLE } },
    description: "the backless version of the dali, cut in 10oz cotton over a jute base with an undyed cotton twill lining. an open-heel shoe you can walk out of the house in without socks. in natural undyed." },

  { name: "2432 Works Low Cut Canvas Sneaker", brand: "Superga",
    url: "https://www.superga-usa.com/products/2432-works-low-cut-cotton-canvas-beige-off-white",
    price: 110, occasion: ["Everyday", "Vacation/Resort"],
    comp: { cotton: 100 },
    materialsText: "Breathable cotton canvas upper, cotton lining, cotton laces, vulcanized natural rubber sole.",
    spec: { upper: { parts: { cotton_canvas: 100 } }, lining: { parts: { cotton: 100 } }, sole: { parts: { natural_rubber: 100 } } },
    description: "a squared-toe canvas sneaker on a cup sole, cotton from the upper through the lining to the laces, finished with a vulcanized natural rubber sole rather than a foam one. the rare everyday sneaker with no plastic in the parts that touch you. in beige and off white." },

  { name: "2432 Works Low Cut Canvas Sneaker in Dusty Grey", brand: "Superga",
    url: "https://www.superga-usa.com/products/2432-works-low-cut-cotton-canvas-dusty-grey-off-white",
    price: 110, occasion: ["Everyday", "Vacation/Resort"],
    comp: { cotton: 100 },
    materialsText: "Breathable cotton canvas upper, cotton lining, cotton laces, vulcanized natural rubber sole.",
    spec: { upper: { parts: { cotton_canvas: 100 } }, lining: { parts: { cotton: 100 } }, sole: { parts: { natural_rubber: 100 } } },
    description: "the same cotton-canvas work sneaker in a soft dusty grey, cotton upper, lining and laces over a vulcanized natural rubber sole. minimal, squared toe, built to be worn into the ground." },

  { name: "2750 OG Canvas Sneaker", brand: "Superga",
    url: "https://www.superga-usa.com/products/2750-og-white-off-white",
    price: 90, occasion: ["Everyday", "Vacation/Resort"],
    comp: { cotton: 100 },
    materialsText: "Breathable cotton canvas upper, cotton laces, vulcanised natural rubber sole.",
    spec: { upper: { parts: { cotton_canvas: 100 } }, sole: { parts: { natural_rubber: 100 } } },
    description: "the original superga silhouette, unchanged since 1925: a breathable cotton canvas upper on a vulcanised natural rubber sole, with cotton laces. the summer shoe that predates the plastic sneaker entirely. in white and off white." },

  { name: "Farella Canvas Espadrille Wedge", brand: "Viscata",
    url: "https://www.viscata.com/products/farella-canvas-wedges-premium",
    price: 154, occasion: ["Everyday", "Vacation/Resort", "Special Occasion"],
    comp: { "organic cotton": 100 },
    materialsText: "100% organic canvas upper on a natural jute wedge.",
    spec: { upper: { parts: { organic_cotton: 100 } }, sole: { parts: { jute: 100 } } },
    description: "an ankle-strap espadrille wedge handmade in spain, with a 100% organic canvas upper seated on a natural jute heel. jute and cotton, nothing else, which is what an espadrille was before the synthetic versions arrived." },

  { name: "Pubol Canvas Espadrille Wedge", brand: "Viscata",
    url: "https://www.viscata.com/products/pubol-canvas-espadrille-wedges-premium",
    price: 132, occasion: ["Everyday", "Vacation/Resort"],
    comp: { "organic cotton": 100 },
    materialsText: "Organic cotton canvas upper on an all-natural jute 2 inch wedge heel.",
    spec: { upper: { parts: { organic_cotton: 100 } }, sole: { parts: { jute: 100 } } },
    description: "a closed-toe canvas espadrille on an all-natural jute wedge, handcrafted in spain. the 2 inch heel is jute rather than a moulded plastic core, so the whole shoe stays plant fiber." },

  { name: "Salina Canvas Espadrille Sandal Wedge", brand: "Viscata",
    url: "https://www.viscata.com/products/salina-canvas-wedges",
    price: 100, occasion: ["Everyday", "Vacation/Resort"],
    comp: { "organic cotton": 100 },
    materialsText: "Organic cotton canvas upper on a natural jute wedge.",
    spec: { upper: { parts: { organic_cotton: 100 } }, sole: { parts: { jute: 100 } } },
    description: "an open-toe espadrille sandal with a cross strap, organic cotton canvas over a natural jute wedge. handmade in spain, and light enough to live in through august." },
];

/** Images + live price/stock from the brand's own Shopify product JSON. */
async function feed(url: string) {
  const r = await fetch(url.split("?")[0].replace(/\/$/, "") + ".json", {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126" },
  });
  if (!r.ok) return null;
  const p = (await r.json()).product;
  if (!p) return null;
  return {
    title: p.title as string,
    images: (p.images || []).map((i: any) => i.src).filter(Boolean) as string[],
    inStock: p.variants.filter((v: any) => v.available).length,
    variants: p.variants.length,
  };
}

async function main() {
  const dry = process.argv.includes("--dry");
  const live = !process.argv.includes("--draft");
  for (const it of ITEMS) {
    const unknown = unresolvedMaterials(it.spec).filter((u) => u !== "unstated_soludos_remainder");
    if (unknown.length) { console.log(`✗ ${it.brand} ${it.name}: unknown ${unknown.join(",")}`); continue; }
    const r = scoreFootwear(it.spec);
    if (r.score == null) { console.log(`✗ ${it.brand} ${it.name}: missing ${r.missing.join(",")}`); continue; }
    const { data: dup } = await sb.from("products").select("id").eq("item_url", it.url).maybeSingle();
    if (dup) { console.log(`✗ ${it.brand} ${it.name}: dup`); continue; }
    const meta = await feed(it.url);
    if (!meta || meta.images.length < 2) {
      console.log(`✗ ${it.brand} ${it.name}: ${meta ? `only ${meta.images.length} image(s)` : "no product JSON"}`);
      continue;
    }
    console.log(`${dry ? "would add" : "add"}  ${String(r.score).padStart(3)} ${(r.band ?? "").padEnd(9)} ${it.brand} — ${it.name}  $${it.price}`);
    console.log(`      ${r.breakdown.map((b) => `${b.component} ${Math.round(b.hazard)}`).join("  ")}   ${meta.images.length} imgs, stock ${meta.inStock}/${meta.variants}   "${meta.title}"`);
    if (dry) continue;
    const { data, error } = await sb.from("products").insert({
      item_name: it.name, brand: it.brand, item_price: it.price, currency: "USD", budget: budget(it.price),
      category: "Footwear", gender: "Women", occasion: it.occasion, item_url: it.url,
      fabric_composition: it.comp, materials_text: it.materialsText, description: it.description,
      item_image: meta.images[0], images: meta.images.slice(0, 6),
      toxome_score: r.score, risk_level: r.band, published: live, rejected: false, added_by: "agent",
      tags: ["batch-summer-footwear", "footwear-rubric-v1", "no-llm"],
    }).select("id, slug").single();
    console.log(error ? `      FAILED ${error.message}` : `      ${data.slug}`);
  }
}
main();
