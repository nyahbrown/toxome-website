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

  // ---- Non-toxic underwear roundup (indices 5–10) ----------------------
  // All six are LIVE, published products in the toxome.app catalog, so the
  // "shop on toxome.app" caption CTA resolves for every slide. Prices below
  // are the live Shopify variant price, not the catalog value — Cou Cou
  // ($26 → $24) and La Coochie ($12 → $8) had both drifted.
  //
  // NOTE: Jungmaven was cut from this set. The catalog has its briefs as
  // 100% hemp / score 94, but the PDP comparison table reads
  // "29 Hemp / 66 Organic Cotton / 5 Spandex". Catalog record needs fixing.
  {
    brand: "Araks",
    name: "Isabella Panty",
    url: "https://www.araks.com/products/isabella-panty-sand",
    photo:
      "https://www.araks.com/cdn/shop/files/ARAKS_ORGANIC_COTTON_SOFIA_UNDERWIRE_BRA_AND_ISABELLA_PANTY_SOCIAL_1024x1024.jpg?v=1774367359",
    // PDP: "Content: 100% GOTS Certified Organic Cotton"
    composition: { "organic cotton": 100 },
    compositionLabel: "100% GOTS Organic Cotton",
    price: 70,
    certifications: ["GOTS"],
  },
  {
    brand: "Cou Cou Intimates",
    name: "The Thong: Pointelle",
    url: "https://coucouintimates.com/products/thong-pointelle",
    photo:
      "https://cdn.shopify.com/s/files/1/0539/8924/5106/files/PDP184_819dc619-fcb3-45cc-a0be-09ac74b8e531.jpg",
    // PDP: "Fabric Composition: 100% Organic Cotton Pointelle"
    composition: { "organic cotton": 100 },
    compositionLabel: "100% Organic Cotton Pointelle",
    price: 24,
    certifications: ["GOTS", "OEKO-TEX Standard 100", "B Corp"],
  },
  {
    brand: "Industry of All Nations",
    name: "Wild Hip Brief",
    url: "https://industryofallnations.com/products/wild-womens-hip-brief",
    photo:
      "https://cdn.shopify.com/s/files/1/0897/6684/files/wild-hip-brief-wwhb-esh-xs-3808201.jpg",
    // PDP: "100% ORGANIC COTTON UNBLEACHED" — naturally pigmented, undyed
    composition: { "organic cotton": 100 },
    compositionLabel: "100% Organic Cotton, Undyed",
    price: 35,
    certifications: [],
  },
  {
    brand: "Arms of Andes",
    name: "Alpaca Wool Thong",
    url: "https://armsofandes.com/products/womens-alpaca-wool-thong-160-ultralight",
    photo:
      "https://cdn.shopify.com/s/files/1/0071/4748/7305/files/womens-low-impact-dye-thong-color-natural-blue.webp",
    // PDP: "160g/m2 of 100% Alpaca Wool, PFAS-free". Waistband is natural
    // tree rubber + cotton elastic, not synthetic (brand confirmed in Q&A).
    composition: { "alpaca wool": 100 },
    compositionLabel: "100% Alpaca Wool",
    price: 30,
    // OEKO-TEX intentionally omitted: with no local `public/certs/oeko-tex-*`
    // file the badge falls back to the unrecognizable green droplet favicon.
    // Score is 92 either way. Restore once the real STANDARD 100 mark is added.
    certifications: [],
  },
  {
    brand: "Net Positive",
    name: "Thong",
    url: "https://wearnetpositive.com/products/thong-test",
    photo:
      "https://cdn.shopify.com/s/files/1/0668/2414/3006/files/OLG13013_copy_black.jpg",
    composition: { hemp: 53, "organic cotton": 43, spandex: 4 },
    compositionLabel: "53% Hemp / 43% Organic Cotton / 4% Spandex",
    price: 18,
    certifications: ["GOTS", "OEKO-TEX Standard 100"],
  },
  {
    brand: "La Coochie",
    name: "High Rise Thong",
    url: "https://lacoochie.com/products/high-rise-thong",
    photo:
      "https://cdn.shopify.com/s/files/1/0510/1925/1862/files/Black_High_Rise_Organic_Cotton_Thong_with_Mesh_Sides.jpg",
    // PDP: "Made with GOTS-Certified 95% Organic Cotton and 5% Elastane"
    composition: { "organic cotton": 95, elastane: 5 },
    compositionLabel: "95% Organic Cotton / 5% Elastane",
    price: 8,
    certifications: ["GOTS"],
  },

  // ---- 5 best brands for non-toxic bath towels (indices 11–15) ---------
  // Prices are the BATH TOWEL variant, read off the live Shopify variant list.
  // The catalog stores the min-variant price for these, which on towels is the
  // washcloth or hand towel: Coyuchi is listed at $24 (hand towel, bath towel
  // is $48), Ettitude at $45 (hand towel, bath towel is $75), Delilah at $25
  // (face towel, bath towel 2-pack is $65). Do not trust the catalog price on
  // any multi-size home product.
  {
    brand: "Coyuchi",
    name: "Sycamore Organic Cotton Linen Bath Towel",
    url: "https://www.coyuchi.com/products/sycamore-organic-cotton-linen-towels-flax-w-praline",
    photo:
      "https://cdn.shopify.com/s/files/1/0769/0659/4596/files/SP25_SycamoreOrganicCottonLinen_BathTowelSet_Flax_Praline_1930.jpg",
    // PDP: "Crafted from a blend of 75% organic cotton and 25% linen"
    composition: { "organic cotton": 75, linen: 25 },
    compositionLabel: "75% Organic Cotton / 25% Linen",
    price: 48,
    certifications: [],
  },
  {
    brand: "Avocado",
    name: "Organic Cotton Bath Towel",
    url: "https://www.avocadogreenmattress.com/products/organic-cotton-bath-towels",
    photo:
      "https://cdn.shopify.com/s/files/1/0444/9488/0918/products/AVO_DAY_1_TOWEL_TALENT_00036.jpg?v=1762199073",
    // PDP: "Materials: GOTS-certified organic cotton (CU863367)"
    composition: { "organic cotton": 100 },
    compositionLabel: "100% GOTS Organic Cotton",
    price: 76,
    certifications: ["GOTS", "B Corp"],
  },
  {
    brand: "Delilah Home",
    name: "Organic Cotton Bath Towels, 2-Pack",
    url: "https://delilahhome.com/products/organic-cotton-bath-towels",
    photo:
      "https://cdn.shopify.com/s/files/1/0103/5524/5137/files/100-Organic-Cotton-Bath-Towels-Collection-Delilah-Home-2122.webp",
    // PDP: "European-crafted, 100% organic cotton towels"
    composition: { "organic cotton": 100 },
    compositionLabel: "100% Organic Cotton",
    price: 65,
    certifications: ["GOTS"],
  },
  {
    brand: "MagicLinen",
    name: "Waffle Bath Towel",
    url: "https://magiclinen.com/products/waffle-bath-towel",
    photo:
      "https://cdn.shopify.com/s/files/1/0640/8454/1699/products/waffle-bath-towel-2.jpg?v=1660221332",
    // PDP: "Made from linen (53%) and cotton (47%) blend". The catalog has the
    // waffle SET recorded as 100% linen scoring 94, which is wrong: same fabric,
    // and 53/47 scores 89.
    composition: { linen: 53, cotton: 47 },
    compositionLabel: "53% Linen / 47% Cotton",
    price: 56,
    certifications: [], // OEKO-TEX omitted, see the Arms of Andes note above
  },
  {
    brand: "Ettitude",
    name: "Bamboo Waffle Bath Towel",
    url: "https://www.ettitude.com/products/bath-towels",
    photo:
      "https://cdn.shopify.com/s/files/1/1956/2323/products/Ocean_TowelSet-6_21818e43-1be6-403e-9033-2b9a9564904c-599220.jpg",
    // PDP: "Bamboo Waffle Weave Towels - 100% Bamboo Lyocell"
    composition: { lyocell: 100 },
    compositionLabel: "100% Bamboo Lyocell",
    price: 75,
    certifications: [], // OEKO-TEX omitted, see the Arms of Andes note above
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
