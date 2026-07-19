// Women's Activewear is one category covering a few distinct shopping intents:
// sports bras, leggings, shorts, and tops. Shoppers arrive wanting one of them,
// not the whole rail, so Women > Activewear offers a second cut on the same
// products.subcategory column that Intimates uses (see lib/intimates.ts). The
// split is STORED, not derived at read time — the title is a good default, not a
// reliable rule ("Layla Flares" never says "leggings"), and the admin dropdown
// overrides it.
//
// NOTE: mirrored by the derivation in scripts/categoryGuard.js and by
// lib/categoryGuard.ts. Keep all three in sync.

export const ACTIVEWEAR_SUBCATEGORIES = [
  "Sports Bras",
  "Leggings",
  "Shorts",
  "Tops",
] as const;
export type ActivewearSubcategory = (typeof ACTIVEWEAR_SUBCATEGORIES)[number];

// Inside Activewear, any "bra" is a sports bra — the loose \bbra\b is safe here
// because no legging/short/top noun contains the substring "bra" (verified
// against the full catalog: "Racer Bra", "Organic Sports Bra" both land here).
const BRA_RE = /\b(bras?|bralettes?)\b/;

// Checked before leggings so "Bike Shorts" reads as Shorts, not Leggings.
const SHORTS_RE = /\bshorts?\b/;

// "pants", "flares", "capris" all live in the leggings bucket — they're the same
// lower-body activewear shopping intent, cut slightly differently.
const LEGGING_RE = /\b(leggings?|tights?|pants?|flares?|capris?|joggers?)\b/;

// Tanks, crops, sleeveless tops. Checked last so a "Bike Short Top" (none in the
// catalog) would file as Shorts, matching the Bottoms-first instinct.
const TOP_RE =
  /\b(tops?|tanks?|crops?|tees?|t-shirts?|singlets?|camis?|camisoles?|sleeveless)\b/;

// Returns null for the genuine unclassifiable case — a piece that names none of
// these belongs under "All" rather than a wrong bucket.
export function deriveActivewearSubcategory(
  itemName: string
): ActivewearSubcategory | null {
  const name = (itemName || "").toLowerCase();
  if (BRA_RE.test(name)) return "Sports Bras";
  if (SHORTS_RE.test(name)) return "Shorts";
  if (LEGGING_RE.test(name)) return "Leggings";
  if (TOP_RE.test(name)) return "Tops";
  return null;
}

// The sub-filter is offered only where it means something: Women > Activewear.
// Men's activewear is a handful of pieces with no bra split, so a "Sports Bras"
// pill there would be a dead option.
export function hasActivewearSplit(
  section: string | null,
  category: string
): boolean {
  return section === "women" && category === "Activewear";
}
