// Products for the TikTok / Instagram slideshows. These are NOT catalog
// products — they are hand-fed retailer URLs we score and render as slides, so
// they live here rather than in Supabase. Compositions are page-grounded (read
// off the PDP), scores come from the canonical scorer so the number on the
// slide always matches the app and the site.
import { calcToxomeScore, scoreToRiskLevel } from "@/lib/fabricScores";

export type Slide = {
  brand: string;
  name: string;
  url: string;
  photo: string;
  // Machine-readable composition — what the scorer runs on.
  composition: Record<string, number>;
  // Composition as the brand writes it on the tag, for the Instagram overlay.
  // Kept separate from `composition` on purpose: the scorer needs "elastane",
  // but the label should read "Lycra" when that's what the PDP says.
  compositionLabel: string;
  // USD, verified against the linked Shopify variant (not the scraper — it read
  // the wrong market and returned $105 for the Studio.K shorts, which are $79).
  price: number;
  certifications: string[];
};

export const SLIDES: Slide[] = [
  {
    brand: "Studio.K",
    name: "93' Low Rise Shorts",
    url: "https://www.studiokatelier.com/en-us/products/93-low-rise-shorts-heather-grey",
    photo: "https://cdn.shopify.com/s/files/1/2346/0113/files/Beso_Red_93_Shorts_Grey_3.jpg",
    // PDP: "94% LENZING™ ECOVERO™ | 6% Recycled Lycra"
    composition: { "lenzing ecovero": 94, elastane: 6 },
    compositionLabel: "94% LENZING™ ECOVERO™ / 6% Lycra",
    price: 79,
    certifications: ["OEKO-TEX Standard 100"],
  },
  {
    brand: "Organic Basics",
    name: "Everyday Straight Leg Pants",
    url: "https://us.organicbasics.com/products/womens-everyday-straight-leg-pants-eclipse",
    photo:
      "https://cdn.shopify.com/s/files/1/0677/0340/6886/files/dg_organic_basics-women-organic_cotton-everyday-Straight_leg_pants-eclipse-studio-1.jpg",
    // PDP: "57% Organic Cotton, 38% TENCEL™ Modal, 5% Elastane"
    composition: { "organic cotton": 57, "tencel modal": 38, elastane: 5 },
    compositionLabel: "57% Organic Cotton / 38% TENCEL™ Modal / 5% Elastane",
    price: 56, // on sale, was $70
    certifications: [],
  },
  {
    brand: "Los Angeles Apparel",
    name: "Cotton Spandex Athletic Stripe Yoga Legging",
    url: "https://losangelesapparel.net/products/83530-cotton-spandex-athletic-stripe-yoga-legging",
    photo: "https://cdn.shopify.com/s/files/1/2152/0639/files/83530-MIDNIGHTNAVYREDORANGE-1.jpg",
    // PDP: "Cotton Spandex: 95% Cotton / 5% Elastane". The Heather Grey colorway
    // is a different fabric (87/8/5 with poly) — the linked variant is Midnight
    // Navy/Red Orange, so it is the clean 95/5.
    composition: { cotton: 95, elastane: 5 },
    compositionLabel: "95% Cotton / 5% Elastane",
    price: 56,
    certifications: [],
  },
  {
    brand: "Lost & Found",
    name: "Athleisure Legging",
    url: "https://lostandfoundathleisure.com/products/asset-pack-16341729282-example-product-2",
    photo:
      "https://lostandfoundathleisure.com/cdn/shop/files/68BEF0FC-2E4B-4928-ADDD-F4820221C6BD.jpg?v=1779151108&width=1200",
    composition: { cotton: 95, spandex: 5 },
    compositionLabel: "95% Cotton / 5% Spandex",
    price: 38,
    certifications: [],
  },
  {
    brand: "Brandy Melville",
    name: "Priscilla Capri Pants",
    url: "https://us.brandymelville.com/products/priscilla-capri-pants-2",
    photo: "https://cdn.shopify.com/s/files/1/0455/9827/7796/files/M065P-622PS30A0000-5.jpg",
    // PDP: "96% cotton 4% elastane"
    composition: { cotton: 96, elastane: 4 },
    compositionLabel: "96% Cotton / 4% Elastane",
    price: 24,
    certifications: [],
  },
];

export function slideScore(slide: Slide): number | null {
  return calcToxomeScore(slide.composition, { certifications: slide.certifications });
}

export function slideRisk(slide: Slide): "low" | "moderate" | "high" | null {
  return scoreToRiskLevel(slideScore(slide));
}

/** File name for a downloaded slide, e.g. `toxome-ig-1-studio-k.png`. */
export function slideFileName(slide: Slide, i: number, kind: "tiktok" | "ig"): string {
  const slug = slide.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `toxome-${kind}-${i + 1}-${slug}.png`;
}
