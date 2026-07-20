// Display helpers for the admin "What's in closets" table (/admin/brands).
//
// Closet rows come from raw user-logged data (public.closet_brands): mostly
// lowercase, full of acronyms, misspellings, aliases, and non-brand junk
// ("olaf t shirt", "edit row", "unkown"). This module cleans that up at the
// PRESENTATION layer only — the underlying user data is never mutated.
//
//   - formatBrandName(): proper casing with acronym / ampersand / accent fixes
//   - CLOSET_BRAND_ALIASES: merge obvious short-forms into their real brand
//   - isJunkClosetBrand(): hide entries that are not brands at all
//
// All keys are matched on a normalized form: lowercased, straight apostrophes,
// collapsed whitespace.

function normKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[‘’′`]/g, "'") // curly / prime apostrophes -> straight
    .replace(/\s+/g, " ");
}

// Tokens that should render fully uppercase when they appear as a whole word.
const ACRONYMS = new Set([
  "nyc",
  "usa",
  "uk",
  "nsf",
  "vs",
  "hq",
  "ri",
  "so",
  "csb",
  "dl",
  "ck",
  "pjs",
]);

// Small words that stay lowercase unless they lead the name. Kept deliberately
// tight — words like "on"/"in"/"for" are often meaningful in brand names
// ("Cotton On"), so only the classic connectors are lowercased.
const CONNECTORS = new Set(["of", "the", "and", "by"]);

// Canonical display strings for names where plain title-casing is wrong:
// acronyms, ampersands, accents, possessives, and a few confident misspellings.
// Keyed by normKey(brand_name).
const BRAND_OVERRIDES: Record<string, string> = {
  "h&m": "H&M",
  "abercrombie&fitch": "Abercrombie & Fitch",
  "scotch and soda": "Scotch & Soda",
  "line + dot": "Line & Dot",
  "petal + pup": "Petal & Pup",
  "christopher banks": "Christopher & Banks",
  "j crew": "J.Crew",
  "l'agence": "L'Agence",
  lagence: "L'Agence",
  vs: "VS",
  "vs pink": "VS PINK",
  nsf: "NSF",
  doen: "DÔEN",
  toteme: "Totême",
  kookai: "Kookaï",
  prana: "prAna",
  "a piece apart": "Apiece Apart",
  "victoria secret": "Victoria's Secret",
  "north face": "The North Face",
  "crazy shirt -hawaii's original": "Crazy Shirts",
  // Confident misspelling fixes
  holister: "Hollister",
  intimissi: "Intimissimi",
  "urban oufitters": "Urban Outfitters",
  "adrianna papel": "Adrianna Papell",
  // User-requested short-form -> real brand (also merged via ALIASES below)
  brandy: "Brandy Melville",
  ref: "Reformation",
};

// Merge short-forms / variants into a single canonical closet row so counts add
// up under one brand. Key = normKey of the variant, value = normKey of the
// canonical brand it should fold into.
export const CLOSET_BRAND_ALIASES: Record<string, string> = {
  brandy: "brandy melville",
  ref: "reformation",
  lagence: "l'agence",
};

// Non-brand junk to hide from the admin table entirely (descriptions, colors,
// placeholders, non-clothing entries, bare geographies). Matched on normKey.
const JUNK_BRANDS = new Set([
  // placeholders / non-answers
  "unknown",
  "unkown",
  "other",
  "none",
  "n/a",
  "na",
  "test",
  "thrift",
  "thift",
  "best",
  "bamboo",
  // garment descriptions, not brands
  "black bra",
  "pink cardi",
  "olaf t shirt",
  "zara brown trousers",
  "zara body",
  "calvin klein top",
  "polo navy",
  "m&s pjs",
  "m&s jumpers",
  "new dunnes dress",
  "under armour shirt",
  "vs diamant",
  "små pieces",
  "lidl tøj",
  "cool termodynamisk",
  "pude",
  // codes / non-clothing / places
  "edit row",
  "hspf26 may",
  "red bull:/",
  "kfc",
  "grækenland",
  "ibiza",
  "india",
]);

/** True when a closet brand entry is junk that should not be shown. */
export function isJunkClosetBrand(raw: string | null | undefined): boolean {
  if (!raw) return true;
  const key = normKey(raw);
  if (!key) return true;
  if (JUNK_BRANDS.has(key)) return true;
  // "red bull:/" and similar trailing punctuation variants
  if (key.startsWith("red bull")) return true;
  return false;
}

/** The canonical normalized key a closet brand should aggregate under. */
export function canonicalClosetKey(normalized: string): string {
  const key = normKey(normalized);
  return CLOSET_BRAND_ALIASES[key] ?? key;
}

/** Render a raw closet brand name with proper casing. Presentation only. */
export function formatBrandName(raw: string | null | undefined): string {
  if (!raw) return "";
  const key = normKey(raw);
  if (BRAND_OVERRIDES[key]) return BRAND_OVERRIDES[key];

  return key
    .split(" ")
    .map((word, i) => {
      const bare = word.replace(/[^a-z0-9]/g, "");
      if (ACRONYMS.has(bare)) return word.toUpperCase();
      if (i > 0 && CONNECTORS.has(bare)) return word;
      // Uppercase the first alphanumeric character, keep the rest as-is.
      return word.replace(/[a-z0-9]/, (c) => c.toUpperCase());
    })
    .join(" ");
}
