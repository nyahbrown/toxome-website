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
  // "LENZING Plant Viscose" is NOT ECOVERO; it falls through to generic viscose.
  // Only the spelled-out "ECOVERO" (handled above) earns the 20 tier.
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
    case "cotton": return /organic/.test(text) || hasCert("gots") || hasCert("regenerative organic");
    case "viscose":
    case "rayon":
    case "bamboo": return oekoOrGots || /closed[-\s]?loop|lyocell|tencel|ecovero/.test(text);
    case "modal": return oekoOrGots || /tencel/.test(text);
    // Branded TENCEL Modal already prices the closed-loop-ish process into its
    // 26 default, so the only disclosure left to earn is a finished-garment
    // chemical test. Without this case an OEKO-TEX-certified TENCEL Modal piece
    // scored WORSE (67) than the same garment labeled generic "Modal" with
    // "tencel" in the copy (70) — better disclosure was costing points.
    case "tencel_modal": return oekoOrGots;
    // GOLS is the organic-latex standard; it caps the vulcanization
    // accelerators and fillers that make latex foam a contact sensitizer.
    case "latex_foam": return oekoOrGots || hasCert("gols") || /\bgols\b/.test(text);
    case "kapok": return oekoOrGots;
    default: return false;
  }
}

// Mirrors lib/fabricScores.ts. An unrecognized fiber silently scores 50, which
// reads as a mid-range result rather than as a failure. That silence is how 20
// fiber names went unnoticed in the app's table. Warn once per distinct name
// and expose the set. See ~/TOXOME/scoring-drift/PLAN.md Phase 0.
const unresolvedFibers = new Set();
function getUnresolvedFibers() {
  return [...unresolvedFibers];
}
function clearUnresolvedFibers() {
  unresolvedFibers.clear();
}

function fiberHazard(name, text, certs) {
  const k = resolveFiber(name);
  if (!k) {
    if (!unresolvedFibers.has(name)) {
      unresolvedFibers.add(name);
      console.warn(
        `[toxome-score] unrecognized fiber ${JSON.stringify(name)} scored as 50. ` +
          `Add it to lib/fiber-scores.json or to resolveFiber().`
      );
    }
    return 50;
  }
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

/**
 * Score a catalog ROW. Use this everywhere a product row becomes a score.
 *
 * Every writer used to call calcToxomeScore(composition) with no second
 * argument, so certifications, finish penalties, the dye prior and the
 * red-flag cap were never applied to a single catalog row. add-product.js
 * extracted certifications, wrote them to the row, then scored without them.
 * 446 published products carried certs that the score ignored.
 *
 * The composition-only call is still valid for scoring a bare fiber mix (a
 * scan, a probe, a what-if). It is the wrong call for a row that has
 * disclosure fields sitting next to it. This helper exists so the distinction
 * is made once rather than at 30 call sites.
 *
 * See ~/TOXOME/scoring-drift/PLAN.md Phase 1.
 *
 * @param {object} row  a products row: fabric_composition, certifications,
 *                      description, materials_text, item_name
 * @returns {{score: number|null, risk: string|null}}
 */
function scoreProductRow(row) {
  if (!row) return { score: null, risk: null };
  const score = calcToxomeScore(row.fabric_composition, {
    certifications: row.certifications || [],
    // ⚠ BRAND-STATED TEXT ONLY. `description` is deliberately excluded.
    //
    // The Layer-B finish rules are regexes looking for disclosed treatments
    // ("wrinkle-free", "antimicrobial", "moisture-wicking"). `materials_text`
    // and `item_name` are the brand's own words, so a hit there is a real
    // disclosure. `description` is TOXOME's editorial copy, and the house
    // voice names the villain to say the product avoids it. Feeding it to the
    // finish rules penalizes the cleanest products for our own marketing:
    //
    //   Favorite Daughter Poplin  −12  "not the wrinkle-free resin finish
    //                                   most office shirts hide"
    //   Paka Breathe Hoodie        −8  "resists odor WITHOUT an antimicrobial
    //                                   finish"
    //   DL1961 Kaylen Jean         −6  "where most performance denim leans
    //                                   synthetic"
    //
    // Measured over the full catalog: including `description` produced 13
    // down-movers, 11 of them false positives of exactly this shape. Excluding
    // it leaves 2, both genuine brand claims (a silver-ion pillowcase whose
    // materials_text says "with silver ions", and an Ibex merino tee whose
    // materials_text says "Moisture-wicking, odor-resistant"). All 8 upward
    // band flips are preserved either way.
    //
    // Rule of thumb: score what the BRAND disclosed, never what we wrote about it.
    descKeywords: [row.materials_text || "", row.item_name || ""],
  });
  return { score, risk: scoreToRiskLevel(score) };
}

module.exports = {
  FABRIC_SCORES, fabricScore, resolveFiber, calcToxomeScore, scoreToRiskLevel,
  scoreProductRow, getUnresolvedFibers, clearUnresolvedFibers,
};
