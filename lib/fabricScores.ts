// Toxome V2 scoring (website). Logic only, all numbers come from the canonical
// data file lib/fiber-scores.json. Mirrored by scripts/fabricScores.js.
//
// DIRECTION: the public Toxome Score is CLEAN space (0–100, HIGHER = BETTER).
// Internally the math runs in HAZARD space (0 clean → 100 concern) exactly like
// the app, and we invert once at the boundary: cleanScore = 100 − hazard.
// Each fiber has a DEFAULT (assume the common process) and an optional FLOOR
// (best hazard it reaches when a clean process/cert is disclosed).
import FIBER_DATA from "./fiber-scores.json";

type FiberEntry = { default: number; floor?: number };
const FIBERS = FIBER_DATA.fibers as Record<string, FiberEntry>;
const LAMBDA_MAX = FIBER_DATA.constants.lambdaMax;
const TAU = FIBER_DATA.constants.tau;
const HIGH_HAZARD_FIBER = FIBER_DATA.constants.highHazardFiber;
const APPLIED_CAP = FIBER_DATA.constants.appliedCap;
const LOW_MAX = FIBER_DATA.thresholds.lowMax; // HAZARD space (32)
const MODERATE_MAX = FIBER_DATA.thresholds.moderateMax; // HAZARD space (60)

// Clean-space band boundaries (higher = better): green ≥68, red <40.
const CLEAN_GREEN = 100 - LOW_MAX; // 68
const CLEAN_AMBER = 100 - MODERATE_MAX; // 40

export function fiberKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

/** Collapse a specific fiber name to a base fiber for browse/filtering. */
export function normalizeFiber(name: string): string {
  const k = (name || "").toLowerCase().trim();
  if (k.includes("organic cotton")) return "organic cotton";
  if (k.includes("cotton")) return "cotton";
  if (k.includes("silk")) return "silk";
  if (k.includes("linen")) return "linen";
  if (k.includes("hemp")) return "hemp";
  if (k.includes("alpaca")) return "alpaca";
  if (k.includes("cashmere")) return "cashmere";
  if (k.includes("merino") || k.includes("wool")) return "wool";
  return k;
}

/** Resolve a raw fiber name to a canonical key, honoring V2 variants/splits. */
export function resolveFiber(name: string): string | null {
  const k = fiberKey(name);
  if (/recycl/.test(k) && /poly|pet/.test(k)) return "recycled_polyester";
  // Only REGENERATIVE ORGANIC cotton earns the cleanest tier — "regenerative"
  // alone permits synthetic inputs (phased reduction), so bare "regenerative
  // cotton" falls through to conventional `cotton`.
  if (/regenerativ/.test(k) && /organic/.test(k) && /cotton/.test(k)) return "regenerative_organic_cotton";
  if (k.includes("organic") && k.includes("cotton")) return "organic_cotton";
  if (/tencel.*modal|modal.*tencel/.test(k)) return "tencel_modal";
  if (/tencel|lyocell/.test(k)) return "lyocell";
  if (/ecovero/.test(k)) return "ecovero";
  // Branded closed-loop names must route to their own (cleaner) entries before
  // the generic substring fallback grabs "viscose"/"modal".
  if (/lenzing/.test(k) && /viscose/.test(k)) return "lenzing_viscose";
  if (/lenzing/.test(k) && /modal/.test(k)) return "tencel_modal";
  // Lycra / "elastic" are spandex; otherwise they fall to the null→50 default
  // and UNDER-penalize the synthetic.
  if (k === "elastic" || /lycra/.test(k)) return "spandex";
  if (k in FIBERS) return k;
  let best: string | null = null;
  let bestLen = 0;
  for (const known of Object.keys(FIBERS)) {
    if (k.includes(known) && known.length > bestLen) { best = known; bestLen = known.length; }
  }
  return best;
}

// Which disclosures unlock a fiber's verified floor (the clean version).
function floorUnlocked(fiberK: string, text: string, certs: string[]): boolean {
  const hasCert = (n: string) => certs.some((c) => c.includes(n));
  const oekoOrGots = hasCert("oeko") || hasCert("gots");
  switch (fiberK) {
    case "wool": return /non[-\s]?superwash|untreated|not superwash/.test(text);
    case "mohair": return /\bkid\b/.test(text);
    case "leather": return /veg[-\s]?tan|vegetable[-\s]?tan/.test(text);
    case "cotton": return /organic/.test(text) || hasCert("gots") || hasCert("regenerative organic");
    case "viscose":
    case "rayon":
    case "bamboo": return oekoOrGots || /closed[-\s]?loop|lyocell|tencel|ecovero/.test(text);
    case "modal": return oekoOrGots || /tencel/.test(text);
    default: return false;
  }
}

/** Internal: per-fiber HAZARD given disclosure context (default, or floor if unlocked). */
function fiberHazard(name: string, text = "", certs: string[] = []): number {
  const k = resolveFiber(name);
  if (!k) return 50;
  const f = FIBERS[k];
  if (f.floor != null && floorUnlocked(k, text, certs)) return f.floor;
  return f.default;
}

/** Public: per-fiber CLEAN score (0–100, higher = better). No disclosure context. */
export function fiberScore(name: string): number {
  return 100 - fiberHazard(name);
}

// Back-compat hazard map (clean space). Prefer fiberScore().
export const FABRIC_SCORES: Record<string, number> = Object.fromEntries(
  Object.entries(FIBERS).map(([k, v]) => [k, 100 - v.default])
);

/** Risk/concern level from a CLEAN score. Direction-independent label. */
export function scoreToRiskLevel(
  clean: number | null
): "low" | "moderate" | "high" | null {
  if (clean == null) return null;
  if (clean >= CLEAN_GREEN) return "low"; // low concern (best)
  if (clean >= CLEAN_AMBER) return "moderate";
  return "high"; // high concern (worst)
}

/** Color from a CLEAN score (green = high/best). */
export function scoreColor(clean: number | null): string {
  if (clean == null) return "var(--ink-3)";
  if (clean >= CLEAN_GREEN) return "var(--risk-low)";
  if (clean >= CLEAN_AMBER) return "var(--orange)";
  return "var(--red)";
}
export function fiberColor(name: string): string {
  return scoreColor(fiberScore(name));
}
// Deprecated aliases (now interpret CLEAN scores). Kept so existing imports
// render correctly without edits.
export const hazardColor = scoreColor;
export const fiberHazardColor = fiberColor;

// ── Layer B: applied-chemical penalties (hazard space) ───────────────────────
const FINISH_RULES: { re: RegExp; pts: number; clearedBy: string[] }[] = [
  { re: /wrinkle[-\s]?free|non[-\s]?iron|easy[-\s]?care|permanent press|shrink[-\s]?resist/, pts: 12, clearedBy: ["oeko", "gots"] },
  { re: /water[-\s]?resist|water[-\s]?repel|stain[-\s]?resist|oil[-\s]?repel|\bdwr\b|teflon|scotchgard|performance shell/, pts: 18, clearedBy: ["pfas-free", "pfc-free", "bluesign"] },
  { re: /flame[-\s]?resist|flame[-\s]?retard|fire[-\s]?resist/, pts: 15, clearedBy: [] },
  { re: /antimicrobial|anti[-\s]?odor|odor[-\s]?control|silver[-\s]?ion|stay[-\s]?fresh|polygiene/, pts: 8, clearedBy: [] },
  { re: /\bperformance\b|activewear|moisture[-\s]?wick/, pts: 6, clearedBy: ["oeko", "gots", "bluesign"] },
];
const DARK_VIVID = /\b(black|dark|deep|vivid|bright|neon|fluoro|electric|jet)\b/;
const RED_FLAGS: Record<string, boolean> = {
  pfas: true, fluorinated: true, formaldehyde: true, azo_amine: true,
  chromium_vi: true, cr6: true, brominated_fr: true, tris: true,
  dehp: true, dbp: true, bbp: true, npe: true,
};

export interface ScoreOpts {
  careKeywords?: string[];
  descKeywords?: string[];
  certifications?: string[];
  color?: string | null;
  confirmedFlags?: string[];
}

/**
 * Overall Toxome Score from a {fiber: fraction|percent} map, CLEAN space
 * (0–100, higher = better), or null. opts adds Layer-B finish/dye penalties,
 * cert-driven floor unlock, and the confirmed red-flag cap. Without opts it's a
 * fiber-only score (the catalog case). Mirrors scripts/fabricScores.js and the
 * draft oracle scoring-v2-draft/scorer.mjs.
 */
export function calcToxomeScore(
  composition: Record<string, number> | null | undefined,
  opts: ScoreOpts = {}
): number | null {
  if (!composition || Object.keys(composition).length === 0) return null;
  const text = [...(opts.careKeywords || []), ...(opts.descKeywords || []), opts.color || ""].join(" ").toLowerCase();
  const certs = (opts.certifications || []).map((c) => c.toLowerCase());

  const entries = Object.entries(composition)
    .map(([f, v]) => [fiberHazard(f, text, certs), Number(v)] as const)
    .filter(([, v]) => Number.isFinite(v) && v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  const weighted = entries.reduce((s, [h, v]) => s + h * v, 0) / total;
  const worst = Math.max(...entries.map(([h]) => h));
  const synthPct = (entries.filter(([h]) => h >= HIGH_HAZARD_FIBER).reduce((s, [, v]) => s + v, 0) / total) * 100;
  const lambda = LAMBDA_MAX * (1 - Math.exp(-synthPct / TAU));
  let hazard = weighted + lambda * (worst - weighted);

  // Layer B, finishes + dye prior
  let finishPts = 0;
  for (const r of FINISH_RULES) {
    if (r.re.test(text) && !r.clearedBy.some((c) => certs.some((x) => x.includes(c)))) finishPts += r.pts;
  }
  let dyePts = 0;
  // Disperse/azo dye prior only when synthetics dominate the garment (≥50%), so
  // a little stretch (e.g. 8% elastane) in a mostly-natural piece isn't penalized.
  const majoritySynthetic = synthPct >= 50;
  const undyed = /undyed|natural color|raw|ecru|colou?r[-\s]?grown|no dyes/.test(text);
  const dyeCleared = certs.some((c) => c.includes("oeko") || c.includes("gots"));
  if (majoritySynthetic && !undyed && !dyeCleared) {
    dyePts += 6;
    if (DARK_VIVID.test(text)) dyePts += 4;
  }
  hazard += Math.min(APPLIED_CAP, finishPts + dyePts);

  // Confirmed red-flag cap → force into high-concern band
  const flags = (opts.confirmedFlags || []).map((f) => RED_FLAGS[fiberKey(f)]).filter(Boolean);
  if (flags.length && hazard < 61) hazard = 61;

  hazard = Math.min(100, Math.max(0, hazard));
  return Math.round(100 - hazard); // CLEAN score
}

const FIBER_LABELS: Record<string, string> = {
  organic_cotton: "Organic cotton", cotton: "Cotton", linen: "Linen", hemp: "Hemp",
  tencel: "Tencel", lyocell: "Lyocell", saxcell: "SaXcell", tencel_lyocell: "Tencel Lyocell",
  tencel_modal: "Tencel Modal", ecovero: "LENZING ECOVERO™", lenzing_viscose: "LENZING™ Viscose",
  lenzing_ecovero: "LENZING ECOVERO™", modal: "Modal", bamboo: "Bamboo", wool: "Wool",
  merino: "Merino wool", alpaca: "Alpaca", cashmere: "Cashmere", mohair: "Mohair", cupro: "Cupro",
  ramie: "Ramie", acetate: "Acetate", leather: "Leather", polyurethane: "Polyurethane", silk: "Silk",
  recycled_polyester: "Recycled polyester", polyester: "Polyester", nylon: "Nylon", acrylic: "Acrylic",
  spandex: "Spandex", elastane: "Elastane", viscose: "Viscose", rayon: "Rayon",
  microfiber: "Microfiber", fleece: "Fleece",
};

export function prettyFiber(name: string): string {
  const key = fiberKey(name);
  if (FIBER_LABELS[key]) return FIBER_LABELS[key];
  return name.split(/[_\s-]+/).map((p) => p[0]?.toUpperCase() + p.slice(1)).join(" ");
}
