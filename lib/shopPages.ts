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
    title: "Non-Toxic Baby Clothes, GOTS Certified Organic Cotton | Toxome",
    heading: "non-toxic baby clothes",
    description:
      "GOTS certified organic cotton baby clothes, free of the toxic dyes and finishes conventional textiles are allowed to use. Every piece is scored by Toxome and safe against newborn skin.",
    intro:
      "every baby piece here is gots certified, which means organic cotton grown and finished without the toxic dyes, formaldehyde, and heavy metals that conventional clothing is allowed to use. newborn skin is thinner and more absorbent than adult skin, so what sits against it all day matters more than almost anything else you buy. nothing in this collection carries the polyester or synthetic finishes found in most baby clothes.",
    faqs: [
      {
        q: "Are these baby clothes really chemical-free?",
        a: "Every piece is GOTS certified, the leading organic textile standard. GOTS bans the toxic dyes, formaldehyde, chlorine bleaching, and heavy metals that conventional clothing can use, and restricts processing to inputs that pass strict toxicity and biodegradability tests. No fabric is completely free of chemistry, but GOTS is the strongest assurance that what touches your baby's skin was made without the harmful ones.",
      },
      {
        q: "What does GOTS certified mean?",
        a: "GOTS (Global Organic Textile Standard) certifies that a garment is made from organic fibers and processed without the harmful chemicals common in textile manufacturing. It covers the whole supply chain, from the cotton field to the dye, so the certification reflects the finished garment and not just the raw material.",
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
      p.age_band === "baby" && hasFiber(p, "organic cotton") && hasCert(p, "gots"),
  },
];

export function getCollection(slug: string): ShopCollection | null {
  return SHOP_COLLECTIONS.find((c) => c.slug === slug) ?? null;
}

export function allCollectionSlugs(): string[] {
  return SHOP_COLLECTIONS.map((c) => c.slug);
}
