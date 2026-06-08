/**
 * Toxome V2 scoring (Node mirror of lib/fabricScores.ts). Numbers come from the
 * canonical lib/fiber-scores.json. Keep in lockstep with the TS version.
 *
 * DIRECTION: public Toxome Score is CLEAN space (0–100, HIGHER = BETTER). Math
 * runs in HAZARD space internally (per-fiber default/floor); we invert once via
 * cleanScore = 100 − hazard. Mirrors scoring-v2-draft/scorer.mjs.
 */
const FIBER_DATA = require("../lib/fiber-scores.json");
const FIBERS = FIBER_DATA.fibers;
const LAMBDA_MAX = FIBER_DATA.constants.lambdaMax;
const TAU = FIBER_DATA.constants.tau;
const HIGH_HAZARD_FIBER = FIBER_DATA.constants.highHazardFiber;
const APPLIED_CAP = FIBER_DATA.constants.appliedCap;
const LOW_MAX = FIBER_DATA.thresholds.lowMax; // hazard space (32)
const MODERATE_MAX = FIBER_DATA.thresholds.moderateMax; // hazard space (60)
const CLEAN_GREEN = 100 - LOW_MAX; // 68
const CLEAN_AMBER = 100 - MODERATE_MAX; // 40

function fiberKey(name) {
  return String(name).toLowerCase().trim().replace(/\s+/g, "_");
}

function resolveFiber(name) {
  const k = fiberKey(name);
  if (/recycl/.test(k) && /poly|pet/.test(k)) return "recycled_polyester";
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
  let best = null, len = 0;
  for (const known of Object.keys(FIBERS)) {
    if (k.includes(known) && known.length > len) { best = known; len = known.length; }
  }
  return best;
}

function floorUnlocked(fiberK, text, certs) {
  const hasCert = (n) => certs.some((c) => c.includes(n));
  const oekoOrGots = hasCert("oeko") || hasCert("gots");
  switch (fiberK) {
    case "wool": return /non[-\s]?superwash|untreated|not superwash/.test(text);
    case "mohair": return /\bkid\b/.test(text);
    case "leather": return /veg[-\s]?tan|vegetable[-\s]?tan/.test(text);
    case "cotton": return /organic/.test(text) || hasCert("gots");
    case "viscose":
    case "rayon":
    case "bamboo": return oekoOrGots || /closed[-\s]?loop|lyocell|tencel|ecovero/.test(text);
    case "modal": return oekoOrGots || /tencel/.test(text);
    default: return false;
  }
}

function fiberHazard(name, text, certs) {
  const k = resolveFiber(name);
  if (!k) return 50;
  const f = FIBERS[k];
  if (f.floor != null && floorUnlocked(k, text || "", certs || [])) return f.floor;
  return f.default;
}

/** Per-fiber CLEAN score (higher = better). */
function fabricScore(fabric) {
  return 100 - fiberHazard(fabric, "", []);
}

const FABRIC_SCORES = Object.fromEntries(
  Object.entries(FIBERS).map(([k, v]) => [k, 100 - v.default])
);

const FINISH_RULES = [
  { re: /wrinkle[-\s]?free|non[-\s]?iron|easy[-\s]?care|permanent press|shrink[-\s]?resist/, pts: 12, clearedBy: ["oeko", "gots"] },
  { re: /water[-\s]?resist|water[-\s]?repel|stain[-\s]?resist|oil[-\s]?repel|\bdwr\b|teflon|scotchgard|performance shell/, pts: 18, clearedBy: ["pfas-free", "pfc-free", "bluesign"] },
  { re: /flame[-\s]?resist|flame[-\s]?retard|fire[-\s]?resist/, pts: 15, clearedBy: [] },
  { re: /antimicrobial|anti[-\s]?odor|odor[-\s]?control|silver[-\s]?ion|stay[-\s]?fresh|polygiene/, pts: 8, clearedBy: [] },
  { re: /\bperformance\b|activewear|moisture[-\s]?wick/, pts: 6, clearedBy: ["oeko", "gots", "bluesign"] },
];
const DARK_VIVID = /\b(black|dark|deep|vivid|bright|neon|fluoro|electric|jet)\b/;
const RED_FLAGS = {
  pfas: 1, fluorinated: 1, formaldehyde: 1, azo_amine: 1, chromium_vi: 1, cr6: 1,
  brominated_fr: 1, tris: 1, dehp: 1, dbp: 1, bbp: 1, npe: 1,
};

/** Overall Toxome Score (CLEAN, higher = better) or null. opts is optional. */
function calcToxomeScore(fabricComposition, opts) {
  opts = opts || {};
  if (!fabricComposition || Object.keys(fabricComposition).length === 0) return null;
  const text = [...(opts.careKeywords || []), ...(opts.descKeywords || []), opts.color || ""].join(" ").toLowerCase();
  const certs = (opts.certifications || []).map((c) => String(c).toLowerCase());

  const entries = Object.entries(fabricComposition)
    .map(([f, v]) => [fiberHazard(f, text, certs), Number(v)])
    .filter(([, v]) => Number.isFinite(v) && v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  const weighted = entries.reduce((s, [h, v]) => s + h * v, 0) / total;
  const worst = Math.max(...entries.map(([h]) => h));
  const synthPct = (entries.filter(([h]) => h >= HIGH_HAZARD_FIBER).reduce((s, [, v]) => s + v, 0) / total) * 100;
  const lambda = LAMBDA_MAX * (1 - Math.exp(-synthPct / TAU));
  let hazard = weighted + lambda * (worst - weighted);

  let finishPts = 0;
  for (const r of FINISH_RULES) {
    if (r.re.test(text) && !r.clearedBy.some((c) => certs.some((x) => x.includes(c)))) finishPts += r.pts;
  }
  let dyePts = 0;
  // Disperse/azo dye prior only when synthetics dominate the garment (>=50%).
  const majoritySynthetic = synthPct >= 50;
  const undyed = /undyed|natural color|raw|ecru|colou?r[-\s]?grown|no dyes/.test(text);
  const dyeCleared = certs.some((c) => c.includes("oeko") || c.includes("gots"));
  if (majoritySynthetic && !undyed && !dyeCleared) {
    dyePts += 6;
    if (DARK_VIVID.test(text)) dyePts += 4;
  }
  hazard += Math.min(APPLIED_CAP, finishPts + dyePts);

  const flags = (opts.confirmedFlags || []).map((f) => RED_FLAGS[fiberKey(f)]).filter(Boolean);
  if (flags.length && hazard < 61) hazard = 61;

  hazard = Math.min(100, Math.max(0, hazard));
  return Math.round(100 - hazard);
}

/** Risk/concern level from a CLEAN score. */
function scoreToRiskLevel(clean) {
  if (clean == null) return null;
  if (clean >= CLEAN_GREEN) return "low";
  if (clean >= CLEAN_AMBER) return "moderate";
  return "high";
}

module.exports = { FABRIC_SCORES, fabricScore, resolveFiber, calcToxomeScore, scoreToRiskLevel };
