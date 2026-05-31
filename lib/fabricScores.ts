// Per-fiber WEARER hazard scores + formula constants + thresholds all come from
// the single canonical data file (lib/fiber-scores.json), which mirrors the
// Toxome APP and is verified against it by scripts/sync-fiber-scores.js. This
// file holds only LOGIC — no hand-maintained numbers — so it can't drift from
// scripts/fabricScores.js (which reads the same JSON).
import FIBER_DATA from "./fiber-scores.json";

export const FABRIC_SCORES: Record<string, number> = FIBER_DATA.scores;

const LAMBDA_MAX = FIBER_DATA.constants.lambdaMax;
const TAU = FIBER_DATA.constants.tau;
const HIGH_HAZARD_FIBER = FIBER_DATA.constants.highHazardFiber;
const LOW_MAX = FIBER_DATA.thresholds.lowMax;
const MODERATE_MAX = FIBER_DATA.thresholds.moderateMax;

export function fiberKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

/**
 * Collapse a specific fiber name to the base fiber used for browse/filtering,
 * so "mulberry silk" filters under silk, "european linen" under linen, "merino
 * wool" under wool, etc. Organic cotton is kept distinct from conventional
 * cotton (the brand browses organic cotton specifically, not generic cotton).
 */
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

export function fiberScore(name: string): number {
  const key = fiberKey(name);
  if (key in FABRIC_SCORES) return FABRIC_SCORES[key];
  // Branded cellulosics: Tencel/lyocell are cleanest (12); Lenzing ECOVERO
  // viscose is 18 — checked before the generic keyword match.
  if (/tencel|lyocell/.test(key)) return 12;
  if (/ecovero|lenzing/.test(key)) return 18;
  // Otherwise: the longest known fiber word contained in the name wins, so
  // "european_linen" -> linen, "organic_cotton_blend" -> organic_cotton.
  let best: number | null = null;
  let bestLen = 0;
  for (const known of Object.keys(FABRIC_SCORES)) {
    if (key.includes(known) && known.length > bestLen) {
      best = FABRIC_SCORES[known];
      bestLen = known.length;
    }
  }
  return best ?? 50;
}

// App hazard-level thresholds (hazard_calculator_service.dart): low 0-36,
// moderate 37-60, high 61-100.
export function hazardColor(score: number): string {
  if (score <= LOW_MAX) return "var(--risk-low)";
  if (score <= MODERATE_MAX) return "var(--orange)";
  return "var(--red)";
}

export function fiberHazardColor(name: string): string {
  return hazardColor(fiberScore(name));
}

// Overall product score from a {fiber: fraction|percent} map. Mirrors the app:
// weighted average lifted toward the worst fiber so a small % of a high-hazard
// fiber can't read as clean. Keep in lockstep with scripts/fabricScores.js.
export function calcToxomeScore(
  composition: Record<string, number> | null | undefined
): number | null {
  if (!composition || Object.keys(composition).length === 0) return null;
  const entries = Object.entries(composition)
    .map(([f, v]) => [fiberScore(f), Number(v)] as const)
    .filter(([, v]) => Number.isFinite(v) && v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  const weighted = entries.reduce((s, [score, v]) => s + score * v, 0) / total;
  const worst = Math.max(...entries.map(([score]) => score));
  const synthPct =
    (entries
      .filter(([score]) => score >= HIGH_HAZARD_FIBER)
      .reduce((s, [, v]) => s + v, 0) /
      total) *
    100;
  const lambda = LAMBDA_MAX * (1 - Math.exp(-synthPct / TAU));
  const score = weighted + lambda * (worst - weighted);
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function scoreToRiskLevel(
  score: number | null
): "low" | "moderate" | "high" | null {
  if (score == null) return null;
  if (score <= LOW_MAX) return "low";
  if (score <= MODERATE_MAX) return "moderate";
  return "high";
}

const FIBER_LABELS: Record<string, string> = {
  organic_cotton: "Organic cotton",
  cotton: "Cotton",
  linen: "Linen",
  hemp: "Hemp",
  tencel: "Tencel",
  lyocell: "Lyocell",
  saxcell: "SaXcell",
  tencel_lyocell: "Tencel Lyocell",
  tencel_modal: "Tencel Modal",
  ecovero: "LENZING ECOVERO™",
  lenzing_viscose: "LENZING™ Viscose",
  lenzing_ecovero: "LENZING ECOVERO™",
  modal: "Modal",
  bamboo: "Bamboo",
  wool: "Wool",
  merino: "Merino wool",
  alpaca: "Alpaca",
  cashmere: "Cashmere",
  mohair: "Mohair",
  cupro: "Cupro",
  ramie: "Ramie",
  acetate: "Acetate",
  leather: "Leather",
  polyurethane: "Polyurethane",
  silk: "Silk",
  recycled_polyester: "Recycled polyester",
  polyester: "Polyester",
  nylon: "Nylon",
  acrylic: "Acrylic",
  spandex: "Spandex",
  elastane: "Elastane",
  viscose: "Viscose",
  rayon: "Rayon",
  microfiber: "Microfiber",
  fleece: "Fleece",
};

export function prettyFiber(name: string): string {
  const key = fiberKey(name);
  if (FIBER_LABELS[key]) return FIBER_LABELS[key];
  return name
    .split(/[_\s-]+/)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}
