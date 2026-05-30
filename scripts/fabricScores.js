/**
 * Single source of truth for fabric hazard scoring used by the Node scripts
 * (agent.js, enrich-products.js, recompute-scores.js).
 *
 * Keep lib/fabricScores.ts (the website's TypeScript copy, used for per-fiber
 * bar colors) in lockstep with this file.
 *
 * Score: 0 = clean, 100 = high concern.  Tiers: <=33 low, 34-66 moderate, >66 high.
 */

const FABRIC_SCORES = {
  organic_cotton: 5,
  hemp: 6,
  linen: 8,
  alpaca: 12,
  silk: 12,
  cashmere: 14,
  wool: 15,
  merino: 15,
  // Lenzing-branded cellulosics (TENCEL Lyocell/Modal, LENZING ECOVERO viscose)
  // are the certified, closed-loop, traceable versions — healthy. Generic /
  // unverified viscose, rayon, bamboo and modal are moderate (same process).
  tencel: 18,
  lyocell: 18,
  ecovero: 18,
  lenzing_viscose: 18,
  lenzing_ecovero: 18,
  tencel_lyocell: 18,
  tencel_modal: 18,
  cotton: 20,
  modal: 40,
  bamboo: 40,
  viscose: 40,
  rayon: 40,
  recycled_polyester: 45,
  spandex: 55,
  elastane: 55,
  fleece: 60,
  microfiber: 70,
  nylon: 70,
  polyester: 72,
  acrylic: 78,
};

/** Resolve a (possibly compound / branded) fabric name to a hazard score. */
function fabricScore(fabric) {
  const key = String(fabric).toLowerCase().trim().replace(/\s+/g, "_");
  if (key in FABRIC_SCORES) return FABRIC_SCORES[key];
  // Lenzing / Ecovero / Tencel branded fibers are the verified healthy versions,
  // even when the name also contains "viscose" (e.g. "lenzing ecovero viscose").
  // Checked BEFORE the generic match so it never falls back to plain viscose.
  if (/lenzing|ecovero|tencel/.test(key)) return 18;
  // Otherwise the longest known fiber word contained in the name wins, so
  // "european_linen" -> linen, "organic_cotton_blend" -> organic_cotton.
  let best = null;
  let bestLen = 0;
  for (const known of Object.keys(FABRIC_SCORES)) {
    if (key.includes(known) && known.length > bestLen) {
      best = FABRIC_SCORES[known];
      bestLen = known.length;
    }
  }
  return best ?? 50;
}

function calcToxomeScore(fabricComposition) {
  if (!fabricComposition || Object.keys(fabricComposition).length === 0)
    return null;
  let weighted = 0;
  let total = 0;
  for (const [fabric, pct] of Object.entries(fabricComposition)) {
    weighted += fabricScore(fabric) * Number(pct);
    total += Number(pct);
  }
  if (total === 0) return null;
  return Math.min(100, Math.max(0, Math.round(weighted / total)));
}

function scoreToRiskLevel(score) {
  if (score == null) return null;
  if (score <= 33) return "low";
  if (score <= 66) return "moderate";
  return "high";
}

module.exports = { FABRIC_SCORES, fabricScore, calcToxomeScore, scoreToRiskLevel };
