/**
 * Single source of truth for fabric hazard scoring — MIRRORS THE TOXOME APP.
 * Ported from the app's assets/data/fiber_database.json + hazard_calculator_service.dart
 * + config/scan_config.dart (SCORING_RUBRIC.md). Keep lib/fabricScores.ts in lockstep.
 *
 * Score = WEARER health only (0-100, lower = safer). Worker-health and
 * environment are informational in the app and never affect the number.
 * Levels: low 0-36, moderate 37-60, high 61-100.
 */

// Per-fiber wearer hazard scores + formula constants + thresholds come from the
// single canonical data file (lib/fiber-scores.json), shared with
// lib/fabricScores.ts so the two can't drift. Verified against the app by
// scripts/sync-fiber-scores.js.
const FIBER_DATA = require("../lib/fiber-scores.json");
const FABRIC_SCORES = FIBER_DATA.scores;
const LAMBDA_MAX = FIBER_DATA.constants.lambdaMax;
const TAU = FIBER_DATA.constants.tau;
const HIGH_HAZARD_FIBER = FIBER_DATA.constants.highHazardFiber; // worst-offender cutoff
const LOW_MAX = FIBER_DATA.thresholds.lowMax;
const MODERATE_MAX = FIBER_DATA.thresholds.moderateMax;

/** Resolve a (possibly compound / branded) fabric name to a wearer hazard score. */
function fabricScore(fabric) {
  const key = String(fabric).toLowerCase().trim().replace(/\s+/g, "_");
  if (key in FABRIC_SCORES) return FABRIC_SCORES[key];
  // Branded cellulosics: Tencel/lyocell are the cleanest (12); Lenzing ECOVERO
  // viscose is 18 — both checked before the generic keyword match.
  if (/tencel|lyocell/.test(key)) return 12;
  if (/ecovero|lenzing/.test(key)) return 18;
  // Longest known fiber word contained in the name wins, so "european_linen"
  // -> linen, "recycled_polyester" -> polyester, "mulberry_silk" -> silk.
  let best = null;
  let bestLen = 0;
  for (const known of Object.keys(FABRIC_SCORES)) {
    if (key.includes(known) && known.length > bestLen) {
      best = FABRIC_SCORES[known];
      bestLen = known.length;
    }
  }
  return best ?? 50; // unknown fiber -> neutral
}

/**
 * Combine a {fiber: fraction|percent} map into one wearer score, exactly like
 * the app: weighted average, then lifted toward the worst fiber so a small % of
 * a high-hazard fiber can't read as clean.
 *   lambda = LAMBDA_MAX * (1 - e^(-synthPct/TAU)); synthPct = % of fibers >= 60
 *   score  = weightedAvg + lambda * (worst - weightedAvg)
 */
function calcToxomeScore(fabricComposition) {
  if (!fabricComposition || Object.keys(fabricComposition).length === 0)
    return null;
  const entries = Object.entries(fabricComposition)
    .map(([f, v]) => [fabricScore(f), Number(v)])
    .filter(([, v]) => Number.isFinite(v) && v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  const weighted = entries.reduce((s, [score, v]) => s + score * v, 0) / total;
  const worst = Math.max(...entries.map(([score]) => score));
  const synthPct =
    (entries.filter(([score]) => score >= HIGH_HAZARD_FIBER).reduce((s, [, v]) => s + v, 0) /
      total) *
    100;
  const lambda = LAMBDA_MAX * (1 - Math.exp(-synthPct / TAU));
  const score = weighted + lambda * (worst - weighted);
  return Math.min(100, Math.max(0, Math.round(score)));
}

// App thresholds (hazard_calculator_service.dart _getHazardLevel).
function scoreToRiskLevel(score) {
  if (score == null) return null;
  if (score <= LOW_MAX) return "low";
  if (score <= MODERATE_MAX) return "moderate";
  return "high";
}

module.exports = { FABRIC_SCORES, fabricScore, calcToxomeScore, scoreToRiskLevel };
