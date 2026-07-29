/**
 * FOOTWEAR RUBRIC v1 tests.
 *
 * The rubric exists because the apparel one rated a polyurethane-soled shoe 85
 * and "low risk". The first test locks that specific regression: the same shoe
 * must now score materially worse, and the sole must be visible in the
 * breakdown. The rest cover the rules that make the score honest, above all
 * that an undisclosed upper or sole yields NO score rather than a flattering
 * one.
 *
 * Run: npm test
 */
import assert from "node:assert";
import { scoreFootwear, resolveMaterial, unresolvedMaterials } from "../lib/footwearScore";

let passed = 0;
const t = (name: string, fn: () => void) => {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`\n✗ ${name}\n  ${(e as Error).message}`);
    process.exitCode = 1;
  }
};

// ── The regression this rubric was built for ────────────────────────────────
t("Vivobarefoot Primus Lite Knit Natural is no longer 'low risk'", () => {
  const r = scoreFootwear({
    upper: { parts: { tencel: 92, hotmelt: 7, roica: 1 } },
    sole: { parts: { recycled_polyurethane: 100 } },
    footbed: { parts: { cork: 100 } },
  });
  assert.ok(r.score !== null, "should score: upper and sole are both disclosed");
  // The apparel rubric scored this shoe 85 by reading the upper alone. The
  // threshold that matters is not a number I picked, it is the distance from
  // that wrong answer, plus the band no longer saying "low".
  const APPAREL_RUBRIC_SAID = 85;
  assert.ok(
    APPAREL_RUBRIC_SAID - r.score! >= 15,
    `should drop well below the upper-only 85, got ${r.score}`,
  );
  assert.notStrictEqual(r.band, "low", "must not read as low risk");
  assert.ok(
    r.breakdown.some((b) => b.component === "sole"),
    "the sole must appear in the breakdown, which is the whole point",
  );
});

// ── Rule 2: no score without an upper and a sole ────────────────────────────
t("a merino sneaker with an undisclosed sole is NOT scored", () => {
  const r = scoreFootwear({ upper: { parts: { merino_wool: 1 }, estimated: true } });
  assert.strictEqual(r.score, null, "must refuse to score");
  assert.strictEqual(r.band, null);
  assert.ok(r.missing.includes("sole"));
});

t("an undisclosed upper is also refused", () => {
  const r = scoreFootwear({ sole: { parts: { natural_rubber: 1 } } });
  assert.strictEqual(r.score, null);
  assert.ok(r.missing.includes("upper"));
});

// ── The shoes already in the catalog should survive their own rubric ────────
t("Kyrgies wool felt on a vegetable-tanned leather sole stays clean", () => {
  const r = scoreFootwear({
    upper: { parts: { wool_felt: 100 } },
    sole: { parts: { leather: 100 } },
    vegetableTanned: true,
  });
  assert.ok(r.score !== null && r.score >= 67, `expected clean, got ${r.score}`);
});

t("vegetable tanning actually moves the number", () => {
  const spec = { upper: { parts: { wool_felt: 100 } }, sole: { parts: { leather: 100 } } };
  const chrome = scoreFootwear(spec);
  const veg = scoreFootwear({ ...spec, vegetableTanned: true });
  assert.ok(veg.score! > chrome.score!, "veg-tan must score better than chrome");
});

t("Baabuk wool on a biobased natural-rubber sole scores well", () => {
  const r = scoreFootwear({
    upper: { parts: { wool: 100 } },
    lining: { parts: { wool: 100 } },
    sole: { parts: { natural_rubber: 100 } },
    footbed: { parts: { sisal: 60, natural_latex: 40 } },
  });
  assert.ok(r.score !== null && r.score >= 67, `expected clean, got ${r.score}`);
});

t("an EVA-soled merino sneaker lands below a natural-rubber one", () => {
  const eva = scoreFootwear({
    upper: { parts: { merino_wool: 1 } },
    sole: { parts: { eva: 1 } },
  });
  const rubber = scoreFootwear({
    upper: { parts: { merino_wool: 1 } },
    sole: { parts: { natural_rubber: 1 } },
  });
  assert.ok(eva.score! < rubber.score!, "EVA must cost more than natural rubber");
});

// ── Rule 3: weights renormalise over disclosed components only ──────────────
t("a two-component shoe is not silently credited for a missing lining", () => {
  const r = scoreFootwear({
    upper: { parts: { polyester: 100 } },
    sole: { parts: { polyurethane: 100 } },
  });
  // Both parts are plastic, so the blend must stay in plastic territory rather
  // than being diluted toward clean by components nobody described.
  assert.ok(r.score! < 40, `all-plastic shoe should score low, got ${r.score}`);
  assert.deepStrictEqual(r.missing.sort(), ["footbed", "lining"]);
});

// ── Modifiers ───────────────────────────────────────────────────────────────
t("a waterproof membrane costs more than a stated PFC-free one", () => {
  const base = { upper: { parts: { wool: 1 } }, sole: { parts: { natural_rubber: 1 } } };
  const plain = scoreFootwear(base);
  const pfcFree = scoreFootwear({ ...base, modifiers: ["waterproof_pfc_free"] });
  const membrane = scoreFootwear({ ...base, modifiers: ["waterproof_membrane"] });
  assert.ok(membrane.score! < pfcFree.score!, "PFAS membrane must cost most");
  assert.ok(pfcFree.score! < plain.score!, "any coating costs something");
});

t("modifiers are capped so they cannot swamp the materials", () => {
  const r = scoreFootwear({
    upper: { parts: { linen: 1 } },
    sole: { parts: { natural_rubber: 1 } },
    modifiers: ["waterproof_membrane", "antimicrobial_treatment", "solvent_cemented"],
  });
  const rawModifiers = r.applied.reduce((a, b) => a + b.hazard, 0);
  assert.ok(rawModifiers > 20, "test needs modifiers exceeding the cap to be meaningful");
  // Recompute the material blend from the breakdown, then check the score is
  // strictly better than it would be had the modifiers applied uncapped.
  const weightSum = r.breakdown.reduce((a, b) => a + b.weight, 0);
  const blended = r.breakdown.reduce((a, b) => a + b.hazard * (b.weight / weightSum), 0);
  const uncapped = Math.round(100 - (blended + rawModifiers));
  const capped = Math.round(100 - (blended + 20));
  assert.strictEqual(r.score, capped, `cap should hold at 20, got ${r.score}`);
  assert.ok(r.score! > uncapped, "capping must actually help");
});

// ── Unknowns must never read as clean ───────────────────────────────────────
t("an unrecognised material scores neutral, not zero-hazard", () => {
  const known = scoreFootwear({
    upper: { parts: { linen: 1 } },
    sole: { parts: { natural_rubber: 1 } },
  });
  const unknown = scoreFootwear({
    upper: { parts: { linen: 1 } },
    sole: { parts: { mystery_foam: 1 } },
  });
  assert.ok(unknown.score! < known.score!, "an unknown sole must not be free");
  assert.deepStrictEqual(unresolvedMaterials({ sole: { parts: { mystery_foam: 1 } } }), [
    "mystery_foam",
  ]);
});

// ── Aliases + parity with the fiber table ───────────────────────────────────
t("brand spellings resolve", () => {
  for (const [raw, want] of [
    ["Tencel™", "lyocell"],
    ["Roica", "elastane"],
    ["recycled polyurethane", "polyurethane"],
    ["Australian Merino Wool", "merino_wool"],
    ["vulcanized rubber", "natural_rubber"],
    ["Hot Melt", "hotmelt"],
  ] as const) {
    assert.strictEqual(resolveMaterial(raw), want, `${raw} should resolve to ${want}`);
  }
  assert.strictEqual(resolveMaterial("leather-look"), null, "must not guess");
});

t("shared materials carry the fiber table's numbers", async () => {
  const fibers = (await import("../lib/fiber-scores.json", { with: { type: "json" } })).default
    .fibers as unknown as Record<string, { default: number; floor?: number }>;
  const shoe = (await import("../lib/footwear-scores.json", { with: { type: "json" } })).default
    .materials as unknown as Record<string, { hazard: number; floor?: number }>;
  for (const k of ["wool", "merino_wool", "organic_cotton", "cotton", "lyocell", "linen", "hemp", "silk", "leather", "polyester", "nylon", "elastane", "polyurethane"]) {
    assert.strictEqual(
      shoe[k].hazard,
      fibers[k].default,
      `${k} must not disagree between the two rubrics`,
    );
  }
  assert.strictEqual(shoe.leather.floor, fibers.leather.floor, "veg-tan floor must match");
});

console.log(`\n✓ footwear rubric: ${passed} checks passed`);
