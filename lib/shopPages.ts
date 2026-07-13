// Programmatic shop collection pages: SEO landing pages that are simply the
// existing directory, pre-filtered to one attribute (a fiber, a category, a
// certification). The page IS the catalog re-cut, so the search intent
// ("non-toxic baby clothes") and the commerce (shop those exact scored items)
// land on the same place.
//
// To add a page: append an entry here that clears real catalog depth, give it
// unique copy, and it auto-generates a route + sitemap URL. Only ship slugs
// with both depth and genuine search demand — no auto-spinning every combo.

import type { Product } from "@/types/product";
import type { ShopSection } from "@/app/shop/ShopClient";

export type CollectionFaq = { q: string; a: string };

export type ShopCollection = {
  slug: string;
  // SEO <title>, keyword-first.
  title: string;
  // Page H1 (rendered by ShopClient via its `heading` prop).
  heading: string;
  // Meta description.
  description: string;
  // Unique, server-rendered intro copy. Carries the page's rankable content.
  intro: string;
  faqs: CollectionFaq[];
  // Which ShopClient filter UI to show (kids age bands, etc.).
  section: ShopSection;
  // Server-side predicate that selects this collection's products.
  match: (p: Product) => boolean;
  // Optional fiber-guide slug (in lib/fiberGuide.ts). When set, the collection
  // page links back to that fiber's health guide, closing the shop <-> guide loop.
  guideSlug?: string;
};

// Fiber match that tolerates the catalog's mixed key formats ("organic cotton"
// vs "organic_cotton"). This is the canonicalization-at-generation-time layer
// we use instead of a DB migration: underscores become spaces, then substring
// match. (The split keys are a real data-quality issue worth cleaning up later.)
export function hasFiber(p: Product, fiber: string): boolean {
  if (!p.fabric_composition) return false;
  const target = fiber.toLowerCase();
  return Object.keys(p.fabric_composition).some((k) =>
    k.toLowerCase().replace(/_/g, " ").includes(target)
  );
}

// Certification match. Used to keep a collection's certification claim honest:
// only items that actually carry the cert appear on a page that claims it.
export function hasCert(p: Product, cert: string): boolean {
  if (!p.certifications) return false;
  const target = cert.toLowerCase();
  return p.certifications.some((c) => c.toLowerCase().includes(target));
}

export const SHOP_COLLECTIONS: ShopCollection[] = [
  {
    slug: "non-toxic-baby-clothes",
    title: "Non-Toxic Baby Clothes, Certified Organic Cotton | Toxome",
    heading: "non-toxic baby clothes",
    description:
      "Organic cotton baby clothes certified to GOTS or OEKO-TEX, free of the toxic dyes and finishes conventional textiles are allowed to use. Every piece is scored by Toxome and safe against newborn skin.",
    intro:
      "every baby piece here is certified to gots or oeko-tex, standards that screen textiles for the toxic dyes, formaldehyde, and heavy metals conventional clothing is allowed to use. newborn skin is thinner and more absorbent than adult skin, so what sits against it all day matters more than almost anything else you buy. nothing in this collection carries the polyester or synthetic finishes found in most baby clothes.",
    faqs: [
      {
        q: "Are these baby clothes really chemical-free?",
        a: "Every piece is certified to GOTS or OEKO-TEX, the leading standards for harmful substances in textiles. They ban or strictly limit the toxic dyes, formaldehyde, chlorine bleaching, and heavy metals that conventional clothing can use. No fabric is completely free of chemistry, but these certifications are the strongest assurance that what touches your baby's skin was made without the harmful ones.",
      },
      {
        q: "What do GOTS and OEKO-TEX mean?",
        a: "GOTS (Global Organic Textile Standard) certifies organic fibers processed without harmful chemicals across the whole supply chain, from the cotton field to the dye. OEKO-TEX Standard 100 tests the finished product for over a thousand harmful substances. Both confirm a garment was made without the toxic inputs common in conventional textiles.",
      },
      {
        q: "What is the safest fabric for baby clothes?",
        a: "Organic cotton: breathable, grown without synthetic pesticides, and free of the plastic fibers in polyester blends. Every baby piece in this collection is GOTS certified organic cotton.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "kids",
    match: (p) =>
      p.age_band === "baby" &&
      hasFiber(p, "organic cotton") &&
      (hasCert(p, "gots") || hasCert(p, "oeko")),
  },
  {
    slug: "gots-certified-clothing",
    title: "GOTS Certified Organic Clothing | Toxome",
    heading: "gots certified clothing",
    description:
      "Every piece is GOTS certified: organic fibers processed without the toxic dyes, formaldehyde, and heavy metals conventional textiles are allowed to use.",
    intro:
      "gots is the leading organic textile standard, and every piece here carries it. that means organic fibers processed without the toxic dyes, formaldehyde, chlorine bleaching, and heavy metals that conventional clothing is allowed to use. toxome scores each one on top of the certification, so you see both the seal and the fiber breakdown.",
    faqs: [
      {
        q: "What does GOTS certified mean?",
        a: "GOTS (Global Organic Textile Standard) certifies that a garment is made from organic fibers and processed without the harmful chemicals common in textile manufacturing. It covers the whole supply chain, from the field to the dye, so the certification reflects the finished garment and not just the raw material.",
      },
      {
        q: "Is GOTS certified clothing free of harmful chemicals?",
        a: "GOTS bans the toxic dyes, formaldehyde, chlorine bleaching, and heavy metals that conventional textiles can use, and limits processing to inputs that pass strict toxicity and biodegradability tests. No fabric is completely free of chemistry, but GOTS is the strongest assurance that a garment was made without the harmful ones.",
      },
      {
        q: "Is GOTS better than OEKO-TEX?",
        a: "They answer different questions. OEKO-TEX tests a finished product for harmful substances; GOTS certifies that the fibers are organic and the whole supply chain meets strict environmental and toxicity rules. GOTS is the broader standard, and many garments carry both.",
      },
    ],
    section: null,
    match: (p) => hasCert(p, "gots"),
  },
  {
    slug: "non-toxic-silk-dresses",
    title: "Non-Toxic Silk Dresses, Scored by Fiber | Toxome",
    heading: "non-toxic silk dresses",
    description:
      "Real silk dresses, scored by Toxome and free of the plastic fibers in synthetic 'silky' fabrics. Natural, breathable, and gentle on skin.",
    intro:
      "most dresses sold as silky are polyester, a plastic fiber that traps heat and sits against the skin without breathing. every dress here is real silk, a natural protein fiber that regulates temperature and feels light on the body. toxome scores each one by its actual fiber content, so you can tell genuine silk from a synthetic imitation.",
    faqs: [
      {
        q: "Is silk a non-toxic fabric?",
        a: "Silk is a natural protein fiber spun by silkworms, free of the petroleum-based plastics in polyester and nylon. It breathes, regulates temperature, and carries none of the microplastic shedding of synthetic 'silky' fabrics. Toxome scores each dress so you can confirm it is real silk.",
      },
      {
        q: "How can I tell real silk from polyester?",
        a: "Check the composition label: real silk lists 'silk,' while imitations list polyester, nylon, or 'satin' with no fiber named. Toxome reads the label for you and scores the garment by what it is actually made of.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Dresses" &&
      hasFiber(p, "silk"),
  },
  {
    slug: "non-toxic-linen-dresses",
    title: "Non-Toxic Linen Dresses, Scored by Fiber | Toxome",
    heading: "non-toxic linen dresses",
    description:
      "Pure linen dresses, scored by Toxome and free of plastic fibers. Breathable flax that keeps you cool and softens with every wash.",
    intro:
      "linen comes from the flax plant, one of the oldest and cleanest fibers people have worn. it breathes, pulls heat away from the body, and softens with every wash, the opposite of the polyester blends that fill summer dress racks. every dress here is scored by toxome for its real fiber content, so you know you are buying flax, not plastic.",
    faqs: [
      {
        q: "Is linen a non-toxic fabric?",
        a: "Linen is a natural fiber made from the flax plant, free of the petroleum-based plastics in synthetic fabrics. It needs little water or pesticide to grow and breathes better than almost any other fiber, which is why it stays cool in heat. Toxome scores each dress by its fiber content.",
      },
      {
        q: "Is linen better than cotton for summer?",
        a: "Linen is more breathable and dries faster than cotton, so it feels cooler in heat and humidity. Both are natural fibers; linen simply moves heat and moisture away from the body more efficiently.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Dresses" &&
      hasFiber(p, "linen"),
  },
  {
    slug: "womens-organic-cotton-tops",
    title: "Women's Organic Cotton Tops, Scored by Fiber | Toxome",
    heading: "women's organic cotton tops",
    description:
      "Organic cotton tops for women, scored by Toxome and free of the plastic blends and pesticides in conventional cotton.",
    intro:
      "a top sits against your skin all day, so the fiber matters. conventional cotton is one of the most pesticide-heavy crops, and many 'cotton' tops are cut with polyester to lower the price. every top here is organic cotton, grown without synthetic pesticides, and scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is organic cotton better than regular cotton?",
        a: "Organic cotton is grown without the synthetic pesticides and fertilizers used on conventional cotton, one of the most chemically treated crops in the world. The finished fiber is the same soft, breathable cotton, grown in a way that keeps those chemicals off the field and off your skin.",
      },
      {
        q: "Are cotton tops non-toxic?",
        a: "Pure cotton is a natural, breathable fiber. The catch is that many 'cotton' tops are blended with polyester, and conventional cotton is grown with heavy pesticides. Toxome scores each top by fiber content so you can choose organic cotton without the plastic blend.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Tops" &&
      hasFiber(p, "organic cotton"),
  },
  {
    slug: "non-toxic-organic-cotton-clothing",
    title: "Non-Toxic Organic Cotton Clothing, Scored | Toxome",
    heading: "non-toxic organic cotton clothing",
    description:
      "Organic cotton clothing scored by Toxome, grown without synthetic pesticides and free of the plastic fibers in conventional blends.",
    intro:
      "conventional cotton is one of the most pesticide-heavy crops in the world, and much of what is labeled cotton is cut with polyester to lower the price. organic cotton skips the synthetic pesticides and stays a pure, breathable natural fiber. every piece here is scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is organic cotton non-toxic?",
        a: "Organic cotton is a natural plant fiber grown without synthetic pesticides or fertilizers, and it carries none of the plastic found in polyester blends. It is one of the cleanest everyday fibers for skin contact. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is organic cotton better than regular cotton?",
        a: "Organic cotton is grown without the synthetic pesticides and fertilizers used on conventional cotton, one of the most chemically treated crops in the world. The finished fiber is the same soft, breathable cotton, grown in a way that keeps those chemicals off the field and off your skin.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "organic_cotton",
    match: (p) => hasFiber(p, "organic cotton"),
  },
  {
    slug: "non-toxic-linen-clothing",
    title: "Non-Toxic Linen Clothing, Scored by Fiber | Toxome",
    heading: "non-toxic linen clothing",
    description:
      "Pure linen clothing scored by Toxome. Breathable flax that keeps you cool, needs little water to grow, and softens with every wash.",
    intro:
      "linen is spun from the flax plant, one of the oldest and lowest-impact fibers people have worn. it breathes, pulls heat off the body, and softens every time you wash it. every piece here is scored by toxome for its real fiber content, so you know you are wearing flax, not a plastic blend.",
    faqs: [
      {
        q: "Is linen a non-toxic fabric?",
        a: "Linen is a natural fiber made from the flax plant, free of the petroleum-based plastics in synthetic fabrics. It needs little water or pesticide to grow and breathes better than almost any other fiber. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Why is linen good for hot weather?",
        a: "Linen is more breathable than almost any other fabric and wicks moisture away from the skin, so it feels cool and dries fast in heat and humidity. It is a natural plant fiber with no plastic content.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "linen",
    match: (p) => hasFiber(p, "linen"),
  },
  {
    slug: "non-toxic-silk-clothing",
    title: "Non-Toxic Silk Clothing, Scored by Fiber | Toxome",
    heading: "non-toxic silk clothing",
    description:
      "Real silk clothing scored by Toxome and free of the plastic fibers in synthetic 'silky' fabrics. Natural, breathable, temperature-regulating.",
    intro:
      "most things sold as silky are polyester, a plastic fiber that traps heat against the skin. real silk is a natural protein fiber that breathes and regulates temperature. every piece here is scored by toxome for its real fiber content, so you can tell genuine silk from a synthetic imitation.",
    faqs: [
      {
        q: "Is silk a non-toxic fabric?",
        a: "Silk is a natural protein fiber spun by silkworms, free of the petroleum-based plastics in polyester and nylon. It breathes, regulates temperature, and carries none of the microplastic shedding of synthetic 'silky' fabrics. Toxome scores each piece so you can confirm it is real silk.",
      },
      {
        q: "How can I tell real silk from polyester?",
        a: "Check the composition label: real silk lists 'silk,' while imitations list polyester, nylon, or 'satin' with no fiber named. Toxome reads the label for you and scores the garment by what it is actually made of.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "silk",
    match: (p) => hasFiber(p, "silk"),
  },
  {
    slug: "non-toxic-hemp-clothing",
    title: "Non-Toxic Hemp Clothing, Scored by Fiber | Toxome",
    heading: "non-toxic hemp clothing",
    description:
      "Hemp clothing scored by Toxome. A durable, breathable plant fiber grown with little water and no need for pesticides.",
    intro:
      "hemp is one of the most durable plant fibers, and it grows fast with little water and no need for pesticides. it breathes like linen and gets softer with wear. every piece here is scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is hemp fabric non-toxic?",
        a: "Hemp is a natural plant fiber grown without the pesticides conventional cotton relies on, and it contains none of the plastic of synthetic fabrics. It is breathable, durable, and clean against the skin. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is hemp clothing durable?",
        a: "Hemp is one of the strongest natural fibers, so hemp clothing tends to outlast cotton and resist stretching. It also softens with each wash without losing strength.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "hemp",
    match: (p) => hasFiber(p, "hemp"),
  },
  {
    slug: "non-toxic-cashmere",
    title: "Non-Toxic Cashmere, Ethically Sourced | Toxome",
    heading: "non-toxic cashmere",
    description:
      "Pure cashmere scored by Toxome. A natural goat fiber that insulates without the plastic of acrylic knits, dehaired for softness and free of synthetic blends.",
    intro:
      "many soft sweaters are acrylic, a plastic fiber that pills, traps heat, and sheds microplastics in the wash. real cashmere is the fine under-layer combed from cashmere goats, and how good it feels comes down to how well it was made. the fine fluff is dehaired to pull out the coarse guard hairs, and only a rushed job leaves those hairs in to scratch. every piece here is scored by toxome for its real fiber content, so you can tell well-made, pure cashmere from a synthetic blend.",
    faqs: [
      {
        q: "Is cashmere non-toxic?",
        a: "Cashmere is a natural fiber from cashmere goats, free of the plastics in acrylic and polyester knits. It is warm, breathable, and gentle on skin. Look for OEKO-TEX Standard 100 for safe dyes and finishes. Toxome scores each piece so you can confirm it is real cashmere and not a synthetic blend.",
      },
      {
        q: "Is cashmere better than acrylic?",
        a: "Cashmere is a natural fiber that breathes and regulates warmth, while acrylic is a plastic that traps heat, pills quickly, and sheds microplastics in the wash. The two feel similar when new, but wear very differently.",
      },
      {
        q: "Why is some cashmere scratchy?",
        a: "It takes only a few missed guard hairs to make soft cashmere itch. That poking is prickle, not an allergy. Cheap cashmere is usually cheap because the dehairing step was rushed, so buy on fineness and how well it was dehaired, not just the word cashmere.",
      },
      {
        q: "Is cashmere ethically sourced?",
        a: "Cashmere goats graze close to the ground and can wear out fragile grassland, and each goat gives so little fiber that one sweater takes many goats. Responsibly sourced cashmere manages grazing and animal welfare, so look for that alongside OEKO-TEX certification.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "cashmere",
    match: (p) => hasFiber(p, "cashmere"),
  },
  {
    slug: "non-toxic-merino-wool",
    title: "Non-Toxic Merino Wool Clothing | Toxome",
    heading: "non-toxic merino wool",
    description:
      "Merino wool clothing scored by Toxome. A fine natural fiber that regulates temperature and resists odor, without the superwash plastic coating on most machine-washable knits.",
    intro:
      "merino wool comes from sheep bred for an especially fine fleece, fine enough to feel soft against the skin instead of scratchy, which is why it is used for base layers worn right on the body. it keeps you warm when it is cold and cool when it is warm, and it resists odor on its own without the antimicrobial finishes added to synthetic activewear. the catch is the superwash treatment, a chlorine bath and thin plastic coating many merinos get so they can be machine washed. every piece here is scored by toxome for its real fiber content, so you can choose fine, untreated merino.",
    faqs: [
      {
        q: "Is merino wool non-toxic?",
        a: "Merino wool is a natural animal fiber, free of the plastics in polyester and nylon activewear. It regulates temperature and resists odor on its own, without antimicrobial chemical treatments. The concern is the superwash coating, so choose untreated merino with OEKO-TEX Standard 100 and the Responsible Wool Standard, which also bans mulesing. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is merino wool itchy?",
        a: "Merino fibers are much finer than regular wool, so they feel soft rather than scratchy against the skin. Any itch is prickle, a physical poking, not a true allergy. That fineness is why merino is worn as a base layer next to the body.",
      },
      {
        q: "Is merino wool good for sensitive skin?",
        a: "Because it is so fine, merino is well tolerated and can even suit eczema-prone skin. Pick fine grades around 17 to 18.5 microns and untreated, non-superwash merino when you can.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "merino_wool",
    match: (p) => hasFiber(p, "merino"),
  },
  {
    slug: "oeko-tex-certified-clothing",
    title: "OEKO-TEX Certified Clothing | Toxome",
    heading: "oeko-tex certified clothing",
    description:
      "Every piece is OEKO-TEX certified: the finished fabric is tested for over a thousand harmful substances, so what touches your skin is screened for the chemicals conventional textiles can carry.",
    intro:
      "oeko-tex standard 100 is the textile world's harmful-substance test, and every piece here carries it. that means the finished fabric was checked for over a thousand chemicals, from formaldehyde and heavy metals to the azo dyes that sit in conventional clothing. toxome scores each one on top of the certification, so you see both the seal and the fiber breakdown.",
    faqs: [
      {
        q: "What does OEKO-TEX certified mean?",
        a: "OEKO-TEX Standard 100 certifies that every component of a textile, the fabric, thread, buttons, and dyes, has been tested for harmful substances and stayed under strict limits. It tests the finished product, so the label reflects what actually reaches your skin.",
      },
      {
        q: "Is OEKO-TEX certified clothing safe?",
        a: "OEKO-TEX screens for over a thousand harmful chemicals, including formaldehyde, heavy metals, and restricted azo dyes, and caps them well below legal limits. No fabric is free of all chemistry, but OEKO-TEX is strong assurance the harmful ones were tested out.",
      },
      {
        q: "Is OEKO-TEX the same as GOTS?",
        a: "No. OEKO-TEX tests a finished product for harmful substances; GOTS certifies organic fibers and a clean supply chain end to end. GOTS is the broader standard, OEKO-TEX is focused on what's in the final fabric, and many garments carry both.",
      },
    ],
    section: null,
    match: (p) => hasCert(p, "oeko"),
  },
  {
    slug: "mens-organic-cotton-tops",
    title: "Men's Organic Cotton Tops, Scored by Fiber | Toxome",
    heading: "men's organic cotton tops",
    description:
      "Organic cotton tops for men, scored by Toxome and free of the plastic blends and pesticides in conventional cotton.",
    intro:
      "a top sits against your skin all day, so the fiber matters. conventional cotton is one of the most pesticide-heavy crops, and many 'cotton' tops are cut with polyester to lower the price. every top here is organic cotton, grown without synthetic pesticides, and scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is organic cotton better than regular cotton?",
        a: "Organic cotton is grown without the synthetic pesticides and fertilizers used on conventional cotton, one of the most chemically treated crops in the world. The finished fiber is the same soft, breathable cotton, grown in a way that keeps those chemicals off the field and off your skin.",
      },
      {
        q: "Are cotton tops non-toxic?",
        a: "Pure cotton is a natural, breathable fiber. The catch is that many 'cotton' tops are blended with polyester, and conventional cotton is grown with heavy pesticides. Toxome scores each top by fiber content so you can choose organic cotton without the plastic blend.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "men",
    match: (p) =>
      p.gender?.toLowerCase() === "men" &&
      p.category === "Tops" &&
      hasFiber(p, "organic cotton"),
  },
  {
    slug: "organic-cotton-bedding",
    title: "Organic Cotton Bedding & Sheets, Scored | Toxome",
    heading: "organic cotton bedding",
    description:
      "Organic cotton sheets, duvet covers, and bedding scored by Toxome. Breathable natural cotton you sleep against for hours, without the plastic of polyester microfiber.",
    intro:
      "you spend a third of your life against your sheets, so what they're made of matters more than almost anything else you own. a lot of bedding sold as soft is polyester microfiber, a plastic that traps heat and sheds in the wash. every piece here is organic cotton, grown without synthetic pesticides and breathable enough to actually sleep in, scored by toxome for its fiber content.",
    faqs: [
      {
        q: "Is organic cotton bedding better?",
        a: "Organic cotton sheets are breathable, grown without the synthetic pesticides used on conventional cotton, and free of the plastic in polyester microfiber bedding. Because you sleep against them for hours, the cleaner fiber matters more here than almost anywhere.",
      },
      {
        q: "Is polyester or microfiber bedding bad?",
        a: "Polyester and microfiber are plastic. They trap heat, don't breathe the way cotton does, and shed microplastics in the wash. For something you sleep against all night, a natural fiber like organic cotton is the cleaner choice.",
      },
      {
        q: "Why does Toxome score bedding by fiber?",
        a: "Fiber content is what touches your skin all night. Toxome reads each item's composition and rates it, so the score reflects what the bedding is actually made of, not a brand's marketing.",
      },
    ],
    section: "home",
    match: (p) =>
      p.category === "Bedding" &&
      hasFiber(p, "organic cotton") &&
      /(sheet|duvet|pillow|sham|bedding|comforter|quilt|coverlet|mattress|blanket)/i.test(
        p.item_name
      ),
  },
  {
    slug: "non-toxic-silk-tops",
    title: "Non-Toxic Silk Tops, Scored by Fiber | Toxome",
    heading: "non-toxic silk tops",
    description:
      "Real silk tops and blouses for women, scored by Toxome and free of the plastic fibers in synthetic 'silky' fabrics.",
    intro:
      "most blouses sold as silky are polyester, a plastic fiber that traps heat against the skin. real silk is a natural protein fiber that breathes and regulates temperature. every top here is scored by toxome for its real fiber content, so you can tell genuine silk from a synthetic imitation.",
    faqs: [
      {
        q: "Is silk a non-toxic fabric?",
        a: "Silk is a natural protein fiber spun by silkworms, free of the petroleum-based plastics in polyester and nylon. It breathes, regulates temperature, and carries none of the microplastic shedding of synthetic 'silky' fabrics. Toxome scores each piece so you can confirm it is real silk.",
      },
      {
        q: "How can I tell real silk from polyester?",
        a: "Check the composition label: real silk lists 'silk,' while imitations list polyester, nylon, or 'satin' with no fiber named. Toxome reads the label for you and scores the garment by what it is actually made of.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Tops" &&
      hasFiber(p, "silk"),
  },
  {
    slug: "non-toxic-linen-pants",
    title: "Non-Toxic Linen Pants, Scored by Fiber | Toxome",
    heading: "non-toxic linen pants",
    description:
      "Pure linen pants and trousers for women, scored by Toxome. Breathable flax that keeps you cool, free of 'linen-look' plastic blends.",
    intro:
      "linen comes from the flax plant, one of the most breathable fibers you can wear, which is why it stays cool when cotton goes damp. every pair here is scored by toxome for its real fiber content, so you know you're getting flax, not a 'linen-look' polyester blend.",
    faqs: [
      {
        q: "Is linen good for pants?",
        a: "Linen is breathable, strong, and gets softer with wear, which makes it ideal for warm-weather trousers. It wrinkles more than cotton, but that relaxed crease is part of the look.",
      },
      {
        q: "Is linen a non-toxic fabric?",
        a: "Linen is a natural fiber made from the flax plant, free of the petroleum-based plastics in synthetic fabrics. It needs little water or pesticide to grow and breathes better than almost any other fiber. Toxome scores each pair by its fiber content.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Bottoms" &&
      hasFiber(p, "linen"),
  },
  {
    slug: "non-toxic-organic-cotton-dresses",
    title: "Non-Toxic Organic Cotton Dresses, Scored | Toxome",
    heading: "non-toxic organic cotton dresses",
    description:
      "Organic cotton dresses for women, scored by Toxome and free of the plastic blends and pesticides in conventional cotton. Breathable, everyday-soft, clean against the skin.",
    intro:
      "a dress moves with you all day, so the fiber against your skin matters. conventional cotton is one of the most pesticide-heavy crops, and plenty of 'cotton' dresses are cut with polyester to drop the price. every dress here is organic cotton, grown without synthetic pesticides, and scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Are organic cotton dresses non-toxic?",
        a: "Organic cotton is a natural plant fiber grown without synthetic pesticides or fertilizers, and it carries none of the plastic found in polyester blends. It breathes and stays soft against the skin. Toxome scores each dress by its fiber content so you can confirm it is organic cotton and not a synthetic blend.",
      },
      {
        q: "Is organic cotton better than regular cotton?",
        a: "Organic cotton is grown without the synthetic pesticides and fertilizers used on conventional cotton, one of the most chemically treated crops in the world. The finished fiber is the same soft, breathable cotton, grown in a way that keeps those chemicals off the field and off your skin.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Dresses" &&
      hasFiber(p, "organic cotton"),
  },
  {
    slug: "non-toxic-linen-tops",
    title: "Non-Toxic Linen Tops, Scored by Fiber | Toxome",
    heading: "non-toxic linen tops",
    description:
      "Pure linen tops and blouses for women, scored by Toxome. Breathable flax that stays cool, free of the 'linen-look' polyester blends on most racks.",
    intro:
      "linen comes from the flax plant, the most breathable fiber you can wear, which is why a linen top stays cool when a synthetic one turns clammy. every top here is scored by toxome for its real fiber content, so you know you are getting flax, not a 'linen-look' plastic blend.",
    faqs: [
      {
        q: "Is linen a non-toxic fabric?",
        a: "Linen is a natural fiber made from the flax plant, free of the petroleum-based plastics in synthetic fabrics. It needs little water or pesticide to grow and breathes better than almost any other fiber. Toxome scores each top by its fiber content.",
      },
      {
        q: "Is linen good for hot weather?",
        a: "Linen is more breathable than almost any other fabric and wicks moisture away from the skin, so it feels cool and dries fast in heat and humidity. It is a natural plant fiber with no plastic content.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Tops" &&
      hasFiber(p, "linen"),
  },
  {
    slug: "organic-cotton-underwear",
    title: "Organic Cotton Underwear for Women, Scored | Toxome",
    heading: "organic cotton underwear",
    description:
      "Organic cotton underwear and intimates for women, scored by Toxome. Breathable natural cotton where it matters most, without polyester or synthetic finishes.",
    intro:
      "underwear sits against the most absorbent skin on your body all day, so the fiber matters more here than almost anywhere. most 'everyday' underwear is polyester or nylon with synthetic finishes. every piece here is organic cotton, grown without synthetic pesticides and breathable where it counts, scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is organic cotton underwear better?",
        a: "Underwear sits against sensitive, absorbent skin all day, so a breathable natural fiber matters more here than in most clothing. Organic cotton is grown without synthetic pesticides and carries none of the plastic in polyester or nylon. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is polyester underwear bad?",
        a: "Polyester and nylon are plastic fibers that trap heat and moisture and don't breathe the way cotton does. For something worn against the most sensitive skin all day, a natural fiber like organic cotton is the cleaner choice.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      p.gender?.toLowerCase() === "women" &&
      p.category === "Intimates" &&
      hasFiber(p, "organic cotton"),
  },
  {
    slug: "non-toxic-pajamas",
    title: "Non-Toxic Pajamas & Sleepwear, Scored | Toxome",
    heading: "non-toxic pajamas",
    description:
      "Pajamas and sleepwear made from natural fibers, scored by Toxome. Breathable cotton, linen, and silk you sleep in for hours, without polyester.",
    intro:
      "you spend hours a night in your pajamas, so what they're made of matters more than most of your wardrobe. a lot of sleepwear sold as soft is polyester, a plastic that traps heat and doesn't breathe. every piece here is built on a natural fiber, cotton, linen, or silk, and scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "What is the best fabric for pajamas?",
        a: "Natural fibers: cotton and linen breathe and pull heat away from the body, and silk regulates temperature without trapping it. All three beat polyester, which holds heat and moisture against the skin while you sleep. Every piece here is built on a natural fiber and scored by Toxome.",
      },
      {
        q: "Is it bad to sleep in polyester?",
        a: "Polyester is a plastic that traps heat and moisture and doesn't breathe, which can leave you warm and clammy overnight. For something you spend hours in against bare skin, a breathable natural fiber like cotton, linen, or silk is the cleaner choice.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    match: (p) =>
      p.category === "Pajamas" &&
      (hasFiber(p, "cotton") ||
        hasFiber(p, "linen") ||
        hasFiber(p, "silk") ||
        hasFiber(p, "bamboo")),
  },
  {
    slug: "non-toxic-activewear",
    title: "Non-Toxic Activewear, Scored by Fiber | Toxome",
    heading: "non-toxic activewear",
    description:
      "Activewear built on natural fibers like organic cotton and merino wool, scored by Toxome instead of the pure plastic most leggings are made of.",
    intro:
      "most activewear is polyester and elastane, plastic worn tight against sweating skin, and much of it carries pfas water-repellent and anti-odor finishes. every piece here is built on a natural fiber like organic cotton or merino wool and scored by toxome for its real fiber content, so you can find the cleaner end of the rack.",
    faqs: [
      {
        q: "Is activewear toxic?",
        a: "Most activewear is polyester or nylon with elastane, and performance finishes on leggings and tops can include PFAS, the 'forever chemicals' used to repel water and odor. Worn tight against sweating skin, that combination is a real exposure. Toxome scores each piece by fiber so you can choose natural-fiber options.",
      },
      {
        q: "Does activewear have PFAS?",
        a: "PFAS often show up in the water-repellent and sweat-wicking finishes on performance gear. Not every piece carries them, but they are common in conventional activewear. Choosing activewear built on natural fibers, without the performance finishes, is the simplest way to avoid them.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    match: (p) =>
      p.category === "Activewear" &&
      (hasFiber(p, "cotton") ||
        hasFiber(p, "merino") ||
        hasFiber(p, "wool") ||
        hasFiber(p, "linen") ||
        hasFiber(p, "hemp")),
  },
  {
    slug: "non-toxic-wool-sweaters",
    title: "Non-Toxic Wool & Cashmere Sweaters, Scored | Toxome",
    heading: "non-toxic wool sweaters",
    description:
      "Sweaters knit from wool, cashmere, and alpaca, scored by Toxome and free of the acrylic plastic in most 'soft' knits.",
    intro:
      "most soft sweaters are acrylic, a plastic fiber that pills, traps heat, and sheds microplastics in the wash. every sweater here is knit from a natural animal fiber, wool, cashmere, or alpaca, that insulates and breathes, scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is acrylic a bad fabric for sweaters?",
        a: "Acrylic is a plastic fiber. It traps heat, pills quickly, and sheds microplastics in the wash, and it doesn't breathe the way a natural fiber does. Wool, cashmere, and alpaca insulate while still letting the body breathe, which is why they wear so differently over time.",
      },
      {
        q: "Is wool a non-toxic fabric?",
        a: "Wool is a natural animal fiber, free of the plastics in acrylic and polyester knits. It insulates, breathes, and resists odor without chemical treatments. Toxome scores each sweater by its fiber content so you can tell natural wool from a synthetic blend.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    match: (p) =>
      p.category === "Sweaters" &&
      (hasFiber(p, "wool") ||
        hasFiber(p, "cashmere") ||
        hasFiber(p, "alpaca")),
  },
  {
    slug: "summer-edit",
    title: "Summer Edit: Non-Toxic Natural-Fiber Clothing | Toxome",
    heading: "summer edit",
    description:
      "Summer dresses, tops, and bottoms cut only from natural fibers: linen, organic cotton, hemp, and silk, scored by Toxome and free of the polyester that traps heat against your skin. Farm to closet, no plastic in the heat.",
    intro:
      "summer heat is where synthetic clothing turns against you. polyester, nylon, and recycled poly are plastic, and plastic traps heat and sweat against your skin instead of letting it out. this edit is the opposite: dresses, tops, and bottoms cut only from natural fibers grown on a farm, not spun from petroleum. linen and hemp pull heat off the body, organic cotton stays soft and breathable, silk regulates temperature on its own. every piece is scored by toxome for its real fiber content, so there is no plastic hiding in the heat.",
    faqs: [
      {
        q: "What fabrics are best for hot weather?",
        a: "Natural plant fibers. Linen and hemp are the most breathable fabrics you can wear and pull heat and moisture off the body, organic cotton stays soft and lets air through, and silk regulates temperature on its own. Polyester and nylon are plastic, so they trap heat and sweat against the skin. Every piece in this edit is a natural fiber, scored by Toxome.",
      },
      {
        q: "Why is polyester bad to wear in summer?",
        a: "Polyester, nylon, and recycled poly are plastic fibers. They do not breathe, so in heat they hold warmth and moisture against your skin and can leave you clammy and overheated. They also shed microplastics in the wash. A natural fiber like linen or cotton lets heat escape, which is why it stays cool when a synthetic one does not.",
      },
      {
        q: "What does farm to closet mean?",
        a: "Every fiber in this edit was grown, not manufactured from petroleum. Linen comes from the flax plant, cotton and hemp from the field, silk from silkworms. That plant-and-animal origin is what lets these fabrics breathe, and it is the opposite of polyester, which starts as oil. Toxome scores each piece by its real fiber content so you can see exactly what it is made of.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: "women",
    match: (p) =>
      (p.gender?.toLowerCase() === "women" ||
        p.gender?.toLowerCase() === "unisex") &&
      (p.category === "Dresses" ||
        p.category === "Tops" ||
        p.category === "Bottoms") &&
      (hasFiber(p, "linen") ||
        hasFiber(p, "flax") ||
        hasFiber(p, "cotton") ||
        hasFiber(p, "hemp") ||
        hasFiber(p, "silk") ||
        hasFiber(p, "tencel") ||
        hasFiber(p, "lyocell") ||
        hasFiber(p, "ramie")) &&
      !hasFiber(p, "polyester") &&
      !hasFiber(p, "nylon") &&
      !hasFiber(p, "acrylic") &&
      !hasFiber(p, "elastane") &&
      !hasFiber(p, "elastic") &&
      !hasFiber(p, "spandex") &&
      !hasFiber(p, "lycra"),
  },
  {
    slug: "non-toxic-wool-clothing",
    title: "Non-Toxic Wool Clothing, Untreated and Responsibly Made | Toxome",
    heading: "non-toxic wool clothing",
    description:
      "Untreated wool clothing scored by Toxome. A natural animal fiber that insulates and resists odor, without the superwash plastic coating or moth-proofing chemicals.",
    intro:
      "wool is a natural animal fiber that insulates, breathes, and resists odor without any chemical help, and the old idea that everyone is allergic to it is a myth. the itch people blame on wool is usually stiff fibers poking the skin, a feeling called prickle, not a real allergy. what actually matters is the treatment. a superwash finish coats the fiber in a thin plastic film and leaves chlorine traces, and some wool is moth-proofed with permethrin, a pesticide locked into the cloth. every piece here is scored by toxome for its real fiber content, so you can favor untreated wool over the coated kind.",
    faqs: [
      {
        q: "Is wool a non-toxic fabric?",
        a: "Wool is a natural animal fiber, free of the plastics in acrylic and polyester knits. The real concern is the treatment: a superwash finish leaves a thin plastic coating and chlorine traces, and some wool is moth-proofed with permethrin, a pesticide. Choose untreated wool with OEKO-TEX Standard 100 and the Responsible Wool Standard, which also bans mulesing. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is everyone allergic to wool?",
        a: "No. A 2017 dermatology review found wool is not a true allergen. The itch most people blame on an allergy is prickle, stiff fibers physically poking the tiny nerves in your skin. Finer, untreated wool feels soft and is well tolerated, even on sensitive skin.",
      },
      {
        q: "What does superwash wool mean?",
        a: "Superwash is a chlorine bath that wears down the fiber's surface scales, followed by a thin plastic resin coating, so the wool can be machine washed without felting. It leaves chlorine traces and a plastic film against your skin. Untreated, non-superwash wool skips both.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "wool",
    match: (p) => hasFiber(p, "wool"),
  },
  {
    slug: "non-toxic-tencel-lyocell-clothing",
    title: "Non-Toxic TENCEL Lyocell Clothing | Toxome",
    heading: "non-toxic tencel lyocell clothing",
    description:
      "TENCEL Lyocell clothing scored by Toxome. A smooth fiber regenerated from wood in a closed loop that reuses its solvent, free of the carbon disulfide behind ordinary viscose.",
    intro:
      "tencel lyocell starts as wood pulp dissolved in a non-toxic solvent and spun into thread, and the factory runs a closed loop that captures over 99 percent of that solvent and reuses it instead of dumping it. that skips the harsh carbon disulfide older fabrics like viscose rely on. it is about as clean as a manufactured fiber gets against your skin, smooth and good at pulling moisture away. your real risk is what gets added later, the dyes and wrinkle-proof coatings that can leave formaldehyde behind, so every piece here is scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is TENCEL lyocell non-toxic?",
        a: "TENCEL lyocell is made from wood in a closed loop with a non-toxic solvent that is captured and reused, so the finished thread carries almost no leftover chemistry. It is smooth and moisture-wicking, which is gentle on skin. The thing to check is the dye and finish, so look for OEKO-TEX Standard 100. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is TENCEL the same as viscose or rayon?",
        a: "No. Plain viscose and rayon are made with carbon disulfide, a harsh chemical, often in an open process that discharges it. TENCEL lyocell uses a non-toxic solvent recaptured in a closed loop. Look for the TENCEL brand name to confirm the clean process.",
      },
      {
        q: "Is lyocell better than cotton?",
        a: "It depends what you value. Lyocell is smooth, absorbent, biodegradable, and made in a closed loop, while cotton is a plant fiber grown in a field. Both beat polyester. As always, the finish matters as much as the fiber, so check for OEKO-TEX.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "tencel_lyocell",
    match: (p) => hasFiber(p, "tencel"),
  },
  {
    slug: "non-toxic-ramie-clothing",
    title: "Non-Toxic Ramie Clothing | Toxome",
    heading: "non-toxic ramie clothing",
    description:
      "Ramie clothing scored by Toxome. A strong, breathable plant fiber that resists mildew, best when enzyme-softened and OEKO-TEX tested for clean finishing.",
    intro:
      "ramie is a strong, linen-like fiber from a plant in the nettle family. it breathes well, dries fast, and naturally resists mildew, so it is genuinely nice to wear in heat. two things decide whether a piece feels good: how well it was softened, since raw ramie is stiff and can prickle until it is enzyme-softened, and how thoroughly the harsh degumming chemicals were rinsed out. every piece here is scored by toxome for its real fiber content, so you can favor smooth, well-finished ramie.",
    faqs: [
      {
        q: "Is ramie a non-toxic fabric?",
        a: "Ramie is a natural plant fiber, breathable and mildew-resistant, free of the plastics in synthetic fabrics. The catch is finishing: turning the stalk into soft fiber uses strong chemical baths that have to be fully rinsed out. Choose OEKO-TEX Standard 100 ramie. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Why is some ramie scratchy?",
        a: "Raw ramie is stiff, and its tiny surface hairs poke the skin, a feeling called prickle. Softening it with enzymes cut that discomfort by nearly half in one study. Trust your hands: smooth ramie was finished well, stiff and scratchy ramie was not.",
      },
      {
        q: "Is ramie like linen?",
        a: "Yes. Both are breathable plant fibers that stay cool, dry fast, and wrinkle. Ramie is even stronger than linen and holds its shape well, which is why the two are often blended.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "ramie",
    match: (p) => hasFiber(p, "ramie"),
  },
  {
    slug: "non-toxic-alpaca-clothing",
    title: "Non-Toxic Alpaca Clothing | Toxome",
    heading: "non-toxic alpaca clothing",
    description:
      "Alpaca clothing scored by Toxome. A warm natural fiber with no lanolin and a smooth surface, often gentler on sensitive skin than sheep wool.",
    intro:
      "alpaca fiber comes from the alpaca, a relative of the camel raised high in the andes, and it is often easier on touchy skin than sheep wool for two reasons you can feel. it has no lanolin, the waxy grease behind most real wool-grease reactions, and its surface is smoother and rounder, so it pokes less. the softer grades are dehaired to pull out the thick, coarse hairs. every piece here is scored by toxome for its real fiber content, so you can choose fine, dehaired alpaca over the coarse kind.",
    faqs: [
      {
        q: "Is alpaca non-toxic?",
        a: "Alpaca is a natural animal fiber, free of the plastics in acrylic and polyester knits, and it is warm and breathable. Because it has no lanolin and a smoother surface, it is often gentler than sheep wool. Look for OEKO-TEX Standard 100 to limit leftover dyes. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is alpaca better than wool for sensitive skin?",
        a: "Often, yes. Alpaca has no lanolin, the wax that causes most wool-grease reactions, and its rounder fiber pokes the skin less. Comfort still comes down to fineness, so look for dehaired baby or royal alpaca around 18 to 22 microns.",
      },
      {
        q: "Is alpaca itchy?",
        a: "Coarse alpaca with thick hairs left in can poke, but fine, dehaired alpaca feels soft against the skin. Any itch is prickle, a physical poking, not a true allergy.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    guideSlug: "alpaca",
    match: (p) => hasFiber(p, "alpaca"),
  },
];

// Maps a fiber (any key format) to its broad collection page, for linking from
// product pages. Most specific keys first. Returns null for fibers with no page.
const FIBER_TO_COLLECTION: [string, string][] = [
  ["organic cotton", "non-toxic-organic-cotton-clothing"],
  // "merino" must precede "wool": a "merino wool" key should route to merino,
  // not the broad wool page.
  ["merino", "non-toxic-merino-wool"],
  ["cashmere", "non-toxic-cashmere"],
  ["tencel", "non-toxic-tencel-lyocell-clothing"],
  ["ramie", "non-toxic-ramie-clothing"],
  ["alpaca", "non-toxic-alpaca-clothing"],
  ["linen", "non-toxic-linen-clothing"],
  ["silk", "non-toxic-silk-clothing"],
  ["hemp", "non-toxic-hemp-clothing"],
  ["wool", "non-toxic-wool-clothing"],
];

export function collectionSlugForFiber(fiber: string): string | null {
  const k = fiber.toLowerCase().replace(/_/g, " ");
  for (const [key, slug] of FIBER_TO_COLLECTION) {
    if (k.includes(key)) return slug;
  }
  return null;
}

export function getCollection(slug: string): ShopCollection | null {
  return SHOP_COLLECTIONS.find((c) => c.slug === slug) ?? null;
}

export function allCollectionSlugs(): string[] {
  return SHOP_COLLECTIONS.map((c) => c.slug);
}
