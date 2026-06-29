// Kids size + age-band logic. Single source of truth shared by the shop filter
// (ShopClient), the import pipeline (extractProduct), and the backfill script.
//
// The problem this solves: every kids brand writes sizes differently —
// "0-3M", "12-24m", "2T", "2-4y", "5/6", "6X", "Newborn". We normalize each
// raw size to an age-in-MONTHS half-open range [lo, hi), then map that range to
// one or more of four shopper-facing age bands. A single product usually spans
// several sizes (e.g. 0-3M → 5T), so it can belong to multiple bands; the filter
// matches on "available in this band" (array overlap).

export type KidsAgeBand = "newborn" | "baby" | "toddler" | "kids";

export const KIDS_AGE_BANDS: { value: KidsAgeBand; label: string }[] = [
  { value: "newborn", label: "Newborn" },
  { value: "baby", label: "Baby" },
  { value: "toddler", label: "Toddler" },
  { value: "kids", label: "Kids" },
];

// Band ranges in months, half-open [lo, hi). 24 months is the baby/toddler line;
// 60 months (5y) is the toddler/kids line.
const BAND_RANGES: Record<KidsAgeBand, [number, number]> = {
  newborn: [0, 3],
  baby: [3, 24],
  toddler: [24, 60],
  kids: [60, 1200],
};

const BAND_ORDER: KidsAgeBand[] = ["newborn", "baby", "toddler", "kids"];

/**
 * Convert one raw size label to an age-in-months half-open range [lo, hi).
 * Returns null for band-agnostic ("One Size") or unrecognized labels.
 */
export function sizeToMonthRange(raw: string): [number, number] | null {
  let s = raw
    .trim()
    .toLowerCase()
    .replace(/[‒-―]/g, "-") // en/em/figure dashes → hyphen
    .replace(/\s+/g, " ");
  if (!s) return null;

  // Band-agnostic — accessories like headbands.
  if (/^(one ?size|o\/?s|osfa|os)$/.test(s)) return null;

  // Pure newborn family, incl. compounds like "Preemie-NB" / "NB - Newborn".
  if (/^(preemie|p|nb|newborn)([ -]+(preemie|p|nb|newborn))*$/.test(s)) return [0, 1];

  // Trailing "+" means open-ended upper bound (e.g. "2T+").
  let openEnded = false;
  if (s.endsWith("+")) {
    openEnded = true;
    s = s.slice(0, -1).trim();
  }

  // Normalize worded units to single letters, and newborn words inside ranges → 0.
  s = s
    .replace(/\s*(months|month|mos|mo)\b/g, "m")
    .replace(/\s*(years|year|yrs|yr)\b/g, "y")
    .replace(/\b(preemie|nb)\b/g, "0");

  const OPEN = 1200;

  // Toddler "T" sizes: nT (2T..5T) and "nT/m" spans (e.g. 5T/6).
  let m = s.match(/^(\d+)\s*t\s*\/\s*(\d+)$/);
  if (m) return [Number(m[1]) * 12, (Number(m[2]) + 1) * 12]; // 5T/6 → kids range
  m = s.match(/^(\d+)\s*t$/);
  if (m) return openEnded ? [Number(m[1]) * 12, OPEN] : BAND_RANGES.toddler;

  // Months — range "a-b m" or single "a m". 0-3M, nb-3m→0-3m, 12-24m, 12M, 24M.
  m = s.match(/^(\d+)\s*-\s*(\d+)\s*m$/);
  if (m) return [Number(m[1]), openEnded ? OPEN : Number(m[2])];
  m = s.match(/^(\d+)\s*m$/);
  if (m) {
    const v = Number(m[1]);
    return [v, openEnded ? OPEN : v + 1]; // thin slice lands single month in right band
  }

  // Years — range "a-b y" / "a/b" / bare "a-b", or single "a y" / bare "a" / "aX".
  // Bare numbers are treated as YEARS (kid sizes); month sizes always carry "M".
  m = s.match(/^(\d+)\s*[-/]\s*(\d+)\s*y?$/);
  if (m) return [Number(m[1]) * 12, openEnded ? OPEN : (Number(m[2]) + 1) * 12];
  m = s.match(/^(\d+)\s*x?\s*y?$/);
  if (m) {
    const yr = Number(m[1]);
    if (yr >= 2 && yr <= 16) return [yr * 12, openEnded ? OPEN : (yr + 1) * 12];
  }

  return null;
}

/** Age bands a single raw size belongs to (half-open overlap). */
export function sizeToBands(raw: string): KidsAgeBand[] {
  const range = sizeToMonthRange(raw);
  if (!range) return [];
  const [a, b] = range;
  return BAND_ORDER.filter((band) => {
    const [c, d] = BAND_RANGES[band];
    return a < d && c < b; // [a,b) overlaps [c,d)
  });
}

/** Union of age bands across a product's size list, in canonical order. */
export function sizesToBands(sizes: string[] | null | undefined): KidsAgeBand[] {
  if (!sizes?.length) return [];
  const set = new Set<KidsAgeBand>();
  for (const size of sizes) for (const band of sizeToBands(size)) set.add(band);
  return BAND_ORDER.filter((band) => set.has(band));
}

/**
 * Clean + dedupe a raw list of size strings (e.g. Shopify variant option
 * values) into the distinct labels we store in products.sizes. Preserves the
 * source casing/format that shoppers recognize; just trims and dedupes.
 */
export function cleanSizes(rawSizes: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rawSizes) {
    const label = (r ?? "").trim().replace(/\s+/g, " ");
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}
