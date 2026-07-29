/**
 * FOOTWEAR SCORING v1 (2026-07-29).
 *
 * A shoe is an assembly, not a garment. The apparel rubric reads one
 * composition string and treats it as the whole item, which for footwear means
 * it reads the upper and never sees the sole. Scoring the Vivobarefoot Primus
 * Lite Knit Natural that way returned 85 and "low risk" on a shoe whose sole is
 * recycled polyurethane. This module scores the assembly.
 *
 * DESIGN RULES, in the order they matter:
 *
 * 1. BRAND-STATED ONLY. Every material must come from the brand's own text. A
 *    component nobody described is recorded in `missing`, never assumed. This
 *    is the same constraint the fiber rubric runs under and the reason the
 *    score is trustworthy at all.
 *
 * 2. NO SCORE WITHOUT AN UPPER AND A SOLE. Those two carry most of the
 *    exposure, and a shoe missing either cannot be honestly rated. `score` is
 *    null in that case, which the UI must render as "not scored" rather than as
 *    a zero. This is what keeps a merino sneaker with an undisclosed sole out
 *    of the catalog instead of flattering it.
 *
 * 3. WEIGHTS RENORMALISE over disclosed components only. A shoe that states
 *    upper and sole is scored on upper and sole, not silently credited for a
 *    lining nobody mentioned.
 *
 * 4. SHARED NUMBERS. Where a material exists in both tables it carries the same
 *    hazard, so a wool shoe and a wool sweater cannot disagree.
 *
 * Public score is 100 - hazard: HIGHER IS CLEANER, matching the fiber rubric,
 * and the clean bar stays 67.
 */
import DATA from "@/lib/footwear-scores.json";

// `as unknown as` because the JSON carries `_comment` keys for auditability;
// they are documentation, and the accessors below only ever look up real names.
const MATERIALS = DATA.materials as unknown as Record<string, { hazard: number; floor?: number }>;
const MODIFIERS = DATA.modifiers as unknown as Record<string, { hazard: number }>;
const WEIGHTS = DATA.constants.weights as unknown as Record<ShoeComponent, number>;
const { modifierCap, unknownMaterial } = DATA.constants;
const { lowMax, moderateMax } = DATA.thresholds;

export type ShoeComponent = "upper" | "lining" | "footbed" | "sole";
export type FootwearBand = "low" | "moderate" | "high";

/** One component as the brand described it. `parts` may be a single material
 *  ("merino wool upper") or a percentage split ("92% Tencel, 7% hotmelt"). */
export type ComponentSpec = {
  /** Material name -> share. Shares may be percents or fractions; both work.
   *  A single material with no percentage is expressed as { merino_wool: 1 }. */
  parts: Record<string, number>;
  /** True when the brand named the material but published no percentage. The
   *  score still runs (the material IS brand-stated) but the row is marked
   *  self-disclosed rather than verified. */
  estimated?: boolean;
};

export type FootwearInput = {
  upper?: ComponentSpec | null;
  lining?: ComponentSpec | null;
  footbed?: ComponentSpec | null;
  sole?: ComponentSpec | null;
  /** Stated vegetable tanning. Unlocks the leather floor (40 -> 30). */
  vegetableTanned?: boolean;
  /** Modifier keys present in footwear-scores.json `modifiers`. */
  modifiers?: string[];
};

export type FootwearResult = {
  /** 0-100, higher is cleaner. Null when upper or sole was not disclosed. */
  score: number | null;
  band: FootwearBand | null;
  /** Per-component hazard, for the "why" panel and for auditing. */
  breakdown: { component: ShoeComponent; hazard: number; weight: number; parts: string }[];
  /** Modifier keys actually applied, with their hazard cost. */
  applied: { key: string; hazard: number }[];
  /** Components the brand never described. Non-empty means an incomplete page,
   *  and upper/sole appearing here is why `score` is null. */
  missing: ShoeComponent[];
  /** True when any scored component was named without a percentage. */
  estimated: boolean;
};

const key = (s: string) =>
  s.toLowerCase().trim().replace(/™|®/g, "").replace(/[\s-]+/g, "_");

/**
 * Resolve a brand's material word to a table entry. Deliberately small and
 * explicit: a fuzzy matcher that guesses "leather" from "leather-look" would
 * invent a fact, which is the one thing this rubric must not do.
 */
const ALIASES: Record<string, string> = {
  tencel: "lyocell",
  tencel_lyocell: "lyocell",
  merino: "merino_wool",
  australian_merino_wool: "merino_wool",
  felted_wool: "wool_felt",
  felt: "wool_felt",
  canvas: "cotton_canvas",
  organic_cotton_canvas: "cotton_canvas",
  vegetable_tanned_leather: "leather",
  veg_tanned_leather: "leather",
  natural_latex_foam: "natural_latex",
  latex: "natural_latex",
  vulcanized_rubber: "natural_rubber",
  rubber: "natural_rubber",
  recycled_polyurethane: "polyurethane",
  pu: "polyurethane",
  roica: "elastane",
  spandex: "elastane",
  lycra: "elastane",
  ethylene_vinyl_acetate: "eva",
  recycled_eva: "eva",
  hot_melt: "hotmelt",
};

export function resolveMaterial(name: string): string | null {
  const k = key(name);
  const aliased = ALIASES[k] ?? k;
  return aliased in MATERIALS ? aliased : null;
}

/** Names this rubric could not resolve, so a caller can surface them instead of
 *  letting an unknown silently score 50. */
export function unresolvedMaterials(input: FootwearInput): string[] {
  const out: string[] = [];
  for (const c of ["upper", "lining", "footbed", "sole"] as ShoeComponent[]) {
    const spec = input[c];
    if (!spec) continue;
    for (const raw of Object.keys(spec.parts)) {
      if (!resolveMaterial(raw)) out.push(raw);
    }
  }
  return [...new Set(out)];
}

/** Share-weighted hazard for one component. */
function componentHazard(spec: ComponentSpec, vegTanned: boolean): number {
  const entries = Object.entries(spec.parts);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (!total) return unknownMaterial;

  let hazard = 0;
  for (const [raw, share] of entries) {
    const m = resolveMaterial(raw);
    // An unrecognised material scores the neutral 50 rather than 0. Silence
    // must never read as clean.
    const base = m ? MATERIALS[m] : { hazard: unknownMaterial } as { hazard: number; floor?: number };
    const h =
      m && base.floor != null && vegTanned && (m === "leather" || m === "suede" || m === "nubuck")
        ? base.floor
        : base.hazard;
    hazard += h * (share / total);
  }
  return hazard;
}

export function scoreFootwear(input: FootwearInput): FootwearResult {
  const components: ShoeComponent[] = ["upper", "lining", "footbed", "sole"];
  const breakdown: FootwearResult["breakdown"] = [];
  const missing: ShoeComponent[] = [];
  let estimated = false;

  for (const c of components) {
    const spec = input[c];
    if (!spec || !Object.keys(spec.parts).length) {
      missing.push(c);
      continue;
    }
    if (spec.estimated) estimated = true;
    breakdown.push({
      component: c,
      hazard: componentHazard(spec, !!input.vegetableTanned),
      weight: WEIGHTS[c],
      parts: Object.entries(spec.parts)
        .sort((a, b) => b[1] - a[1])
        .map(([k2, v]) => `${v}% ${k2.replace(/_/g, " ")}`)
        .join(", "),
    });
  }

  const applied = (input.modifiers ?? [])
    .filter((m) => m in MODIFIERS)
    .map((m) => ({ key: m, hazard: MODIFIERS[m].hazard }));

  // Rule 2: upper and sole are non-negotiable.
  if (missing.includes("upper") || missing.includes("sole")) {
    return { score: null, band: null, breakdown, applied, missing, estimated };
  }

  // Rule 3: renormalise over what was actually disclosed.
  const weightSum = breakdown.reduce((a, b) => a + b.weight, 0);
  const blended = breakdown.reduce((a, b) => a + b.hazard * (b.weight / weightSum), 0);

  const modifierHazard = Math.min(
    modifierCap,
    applied.reduce((a, b) => a + b.hazard, 0),
  );
  const hazard = Math.min(100, Math.max(0, blended + modifierHazard));
  const score = Math.round(100 - hazard);

  return {
    score,
    band: hazard <= lowMax ? "low" : hazard <= moderateMax ? "moderate" : "high",
    breakdown,
    applied,
    missing,
    estimated,
  };
}

/** Same band vocabulary the fiber rubric publishes. */
export function footwearBandLabel(band: FootwearBand): string {
  return band === "low" ? "low" : band === "moderate" ? "moderate" : "high";
}
