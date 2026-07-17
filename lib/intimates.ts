// Women's Intimates is one category covering two distinct shopping intents:
// bras and underwear. Shoppers arrive wanting one or the other, never both.
//
// This used to be modelled as two sibling categories (Intimates + Underwear),
// but nothing decided which a product landed in — the same Subset line had rows
// in both. They're merged under Intimates now, with the real distinction here.
//
// The split is STORED on products.subcategory, not derived at read time, because
// the title is a good default and not a reliable rule: Cou Cou's "The
// Balconette" is a bra that never says "bra", and a camisole is neither. This
// function seeds new products; the admin dropdown overrides it.
//
// NOTE: mirrored by the SQL in migration add_product_subcategory and by
// scripts/categoryGuard.js. Keep all three in sync.

export const INTIMATES_SUBCATEGORIES = ["Bras", "Underwear"] as const;
export type IntimatesSubcategory = (typeof INTIMATES_SUBCATEGORIES)[number];

// "balconette" earns its place: it's the one bra style in the catalog whose name
// omits the word entirely. "demi", "plunge" and "racerback" are deliberately
// absent — every product using them already says "Bra", and alone they'd catch
// tank tops.
const BRA_RE = /\b(bras?|bralettes?|balconettes?)\b/;

// Checked second. No noun here contains the substring "bra", so the loose \bbra\b
// above cannot collide with one — verified against the full catalog.
const UNDERWEAR_RE =
  /\b(thongs?|briefs?|bikinis?|boxers?|boyshorts?|boy shorts?|hipsters?|panty|panties|shorty|shorties|cheeky|knickers?)\b/;

// Returns null for the genuine third case — a camisole or slip filed under
// Intimates is neither, and belongs under "All" rather than a wrong bucket.
export function deriveIntimatesSubcategory(
  itemName: string
): IntimatesSubcategory | null {
  const name = (itemName || "").toLowerCase();
  if (BRA_RE.test(name)) return "Bras";
  if (UNDERWEAR_RE.test(name)) return "Underwear";
  return null;
}

// The sub-filter is offered only where it means something: Women > Intimates.
// Men's Intimates is boxers and briefs with no bras in it, so a Bras pill there
// would be a dead option.
export function hasIntimatesSplit(
  section: string | null,
  category: string
): boolean {
  return section === "women" && category === "Intimates";
}
