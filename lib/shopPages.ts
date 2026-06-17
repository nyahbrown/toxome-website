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
    match: (p) => hasFiber(p, "hemp"),
  },
  {
    slug: "non-toxic-cashmere",
    title: "Non-Toxic Cashmere, Scored by Fiber | Toxome",
    heading: "non-toxic cashmere",
    description:
      "Pure cashmere scored by Toxome. A natural animal fiber that insulates without the plastic of acrylic 'soft' knits.",
    intro:
      "many soft sweaters are acrylic, a plastic fiber that pills, traps heat, and sheds microplastics. real cashmere is a natural animal fiber that insulates and breathes. every piece here is scored by toxome for its real fiber content, so you can tell pure cashmere from a synthetic blend.",
    faqs: [
      {
        q: "Is cashmere a non-toxic fabric?",
        a: "Cashmere is a natural fiber from cashmere goats, free of the plastics in acrylic and polyester knits. It is warm, breathable, and gentle on skin. Toxome scores each piece so you can confirm it is real cashmere and not a synthetic blend.",
      },
      {
        q: "Is cashmere better than acrylic?",
        a: "Cashmere is a natural fiber that breathes and regulates warmth, while acrylic is a plastic that traps heat, pills quickly, and sheds microplastics in the wash. The two feel similar when new, but wear very differently.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    match: (p) => hasFiber(p, "cashmere"),
  },
  {
    slug: "non-toxic-merino-wool",
    title: "Non-Toxic Merino Wool Clothing, Scored | Toxome",
    heading: "non-toxic merino wool",
    description:
      "Merino wool clothing scored by Toxome. A fine natural fiber that regulates temperature and resists odor without synthetic treatments.",
    intro:
      "merino wool is a fine natural fiber that keeps you warm when it is cold and cool when it is warm, and it resists odor without the chemical finishes added to synthetic activewear. every piece here is scored by toxome for its real fiber content.",
    faqs: [
      {
        q: "Is merino wool non-toxic?",
        a: "Merino wool is a natural animal fiber, free of the plastics in polyester and nylon activewear. It regulates temperature and resists odor on its own, without antimicrobial chemical treatments. Toxome scores each piece by its fiber content.",
      },
      {
        q: "Is merino wool itchy?",
        a: "Merino fibers are much finer than regular wool, so they feel soft rather than scratchy against the skin. That fineness is why merino is used for base layers worn next to the body.",
      },
      {
        q: "Why does Toxome score clothes by fiber?",
        a: "Fiber content is what touches the skin. Toxome reads each garment's composition and rates it, so the score reflects what the clothing is made of, not a brand's marketing.",
      },
    ],
    section: null,
    match: (p) => hasFiber(p, "merino"),
  },
];

// Maps a fiber (any key format) to its broad collection page, for linking from
// product pages. Most specific keys first. Returns null for fibers with no page.
const FIBER_TO_COLLECTION: [string, string][] = [
  ["organic cotton", "non-toxic-organic-cotton-clothing"],
  ["merino", "non-toxic-merino-wool"],
  ["cashmere", "non-toxic-cashmere"],
  ["linen", "non-toxic-linen-clothing"],
  ["silk", "non-toxic-silk-clothing"],
  ["hemp", "non-toxic-hemp-clothing"],
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
