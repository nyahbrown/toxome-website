"use strict";
/**
 * CROSS-ENGINE PARITY — website vs Firebase/app/extension.
 *
 * Toxome has THREE independent scorer implementations:
 *   website   lib/fiber-scores.json + lib/fabricScores.ts + scripts/fabricScores.js
 *   app       toxome/assets/data/fiber_database.json + hazard_calculator_service.dart
 *   Firebase  toxome/firebase/functions/scoring.js + fiber_database.json
 *             (toxome-extension/src/scoring.js is GENERATED from Firebase)
 *
 * The app repo already has firebase/functions/test/scoring.test.js, which checks
 * Firebase against the Dart app. Nothing has ever checked WEBSITE against either.
 * That gap is how a 51%-of-catalog divergence went unnoticed through several
 * "aligned, 0 drift confirmed" audits, all of which were manual spot checks.
 *
 * This file closes it. It is green today: every currently-known divergence is
 * in an explicit allowlist tagged with the phase that removes it. Any NEW
 * divergence fails the run.
 *
 * See ~/TOXOME/scoring-drift/PLAN.md.
 *
 * Run: npm test          (skips gracefully if the app repo isn't a sibling)
 *      APP_REPO=/path/to/toxome npm test
 */
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const web = require("../scripts/fabricScores.js");
const FIBERS = require("../lib/fiber-scores.json").fibers;

const APP_REPO = process.env.APP_REPO || path.join(__dirname, "..", "..", "toxome");
const FB_PATH = path.join(APP_REPO, "firebase", "functions", "scoring.js");
if (!fs.existsSync(FB_PATH)) {
  console.log(
    `\n⊘ App repo not found at ${APP_REPO} (set APP_REPO=…). Skipping parity — nothing to compare.`
  );
  process.exit(0);
}
const FB = require(FB_PATH);

let pass = 0, fail = 0, waived = 0;
function check(label, actual, expected) {
  try {
    assert.deepStrictEqual(actual, expected);
    pass++;
    console.log("  ✓ " + label);
  } catch {
    fail++;
    console.log("  ✗ " + label +
      "\n      expected: " + JSON.stringify(expected) +
      "\n      got:      " + JSON.stringify(actual));
  }
}
function waive(label, reason) {
  waived++;
  console.log("  ⊘ " + label + "   [" + reason + "]");
}

const webScore = (comp, opts) => web.calcToxomeScore(comp, opts);
const fbScore = (comp, opts) => FB.scoreComposition(comp, opts || {}).overallHazardScore;

// ─────────────────────────────────────────────────────────────────────────────
// ALLOWLIST — every entry is a known open bug with the phase that removes it.
// Deleting an entry and watching the test pass IS the acceptance criterion.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PHASE 2 — the app/Firebase/extension fiber DB is keyed by display name
 * ("Organic Cotton", "Tencel™ Modal") with hand-written alias lists. The
 * website's canonical snake_case keys were never added as aliases, so these
 * resolve to nothing and silently score hazard 50. The catalog stores the
 * snake_case form on real rows (6 products carry "organic_cotton"), so this is
 * live, not theoretical.
 *
 * FIX: add each canonical key below as an alias in BOTH
 * toxome/assets/data/fiber_database.json and
 * toxome/firebase/functions/fiber_database.json, then `node build-scoring.mjs`
 * in toxome-extension. Do it systematically for ALL 36 keys, not just these 9,
 * so the next fiber added can't reintroduce the gap.
 */
// ✅ CLEARED 2026-07-26 (Phase 2). Rather than adding these 9 names as aliases
// and leaving the next nine to rot, getFiberData() in the app/Firebase now
// normalizes (trademark marks, underscores, punctuation) and falls back to
// longest-substring, matching the website's resolveFiber(). Two genuine
// synonyms that no normalization could reach — bare "flax" and bare "merino" —
// were added as real aliases to Linen and Merino Wool.
const PHASE_2_UNRESOLVED_CANONICAL_KEYS = new Set([]);

/**
 * PHASE 2 — free-text fiber names that appear in the live catalog and resolve
 * on the website (substring-longest-match) but not in the app (alias list).
 * Same fix. `latex foam` and `kapok fiber` are missed by BOTH engines and need
 * newly authored hazard values, so they are listed separately below.
 */
// ✅ CLEARED 2026-07-26 (Phase 2) by the same normalize + substring fallback.
// The list is kept as live fixtures below: these are the real names the catalog
// stores, and they must keep resolving IDENTICALLY in both engines.
const PHASE_2_UNRESOLVED_CATALOG_NAMES = [];
const CATALOG_FIBER_NAMES = [
  "LENZING plant viscose", "mulberry silk", "organic linen", "dupont spandex",
  "alpaca wool", "linen (European Flax)", "organic hemp", "european flax linen",
  "recycled linen", "pure new wool", "recycled cashmere",
  "Turkish cotton (Aegean)", "good earth cotton", "post-consumer recycled cotton",
  "flax", "merino", "organic_cotton", "latex foam", "kapok fiber",
];
// ✅ latex foam + kapok were unknown to BOTH engines and are now authored in
// all three fiber tables. Nothing should remain in this list.
const UNKNOWN_TO_BOTH_ENGINES = [];

/**
 * PHASE 3 — the two engines credit certifications with different mechanisms:
 *   website  per-fiber `floor` unlocked by disclosure (floorUnlocked())
 *   app/FB   flat `certificationBonus` subtracted from final hazard, cap 18
 * Decision recorded in PLAN.md: Model A (floors) wins, flat bonus is retired.
 * Until that port lands, any composition carrying a cert will diverge.
 */
// ✅ CLEARED 2026-07-26 (Phase 3). The app/Firebase/extension retired the flat
// certificationBonus and now credit certs per fiber via _floorUnlocked, matching
// the website. Porting it also surfaced that this engine never applied the
// website's dye-prior clearing (undyed / OEKO / GOTS), so it kept charging 6
// points for dye residues on garments whose residue test came back clean.
const PHASE_3_CERT_MODEL_DIVERGES = false;

/**
 * PHASE 3 — rounding order. Found by this harness on its first run.
 *   website   `Math.round(100 - hazard)`        scripts/fabricScores.js:142
 *   Firebase  `100 - Math.round(hazard)`        firebase/functions/scoring.js:346-348
 * Identical for every hazard EXCEPT one landing on exactly .5, where JS rounds
 * half up on different sides of the inversion and the engines differ by 1.
 * e.g. 55% linen / 45% cotton → hazard 10.5 → website 90, app 89.
 *
 * Low impact but real, and it will silently shift any product sitting on a .5
 * hazard. Fix during the Phase 3 port by making both engines round the PUBLIC
 * clean score last. Whichever side moves, some scores shift by 1, so it should
 * ride along with the recompute rather than ship on its own.
 *
 * Detected precisely (not by "close enough") so it can't mask a real 1-pt bug.
 */
function isKnownRoundingSplit(comp, webVal, fbVal) {
  if (Math.abs(webVal - fbVal) !== 1) return false;
  let total = 0, weighted = 0;
  for (const [name, pct] of Object.entries(comp)) {
    const k = web.resolveFiber(name);
    if (k == null || !(k in FIBERS)) return false;
    total += pct;
    weighted += FIBERS[k].default * pct;
  }
  if (!total) return false;
  const hazards = Object.entries(comp).map(([n]) => FIBERS[web.resolveFiber(n)].default);
  if (hazards.some((h) => h >= 60)) return false; // lambda lift, not a clean .5
  const hazard = weighted / total;
  return Math.abs(hazard - Math.floor(hazard) - 0.5) < 1e-9;
}

// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── A. Fiber-only parity: every canonical fiber at 100% ──");
for (const key of Object.keys(FIBERS)) {
  const label = `${key} @100%`;
  if (PHASE_2_UNRESOLVED_CANONICAL_KEYS.has(key)) {
    // Assert the bug still has exactly the shape we documented, so this can't
    // quietly become a different bug.
    const resolved = FB.getFiberData(key);
    if (resolved) {
      fail++;
      console.log(`  ✗ ${label} — allowlisted as unresolved but the app DOES resolve it now.` +
        `\n      Remove "${key}" from PHASE_2_UNRESOLVED_CANONICAL_KEYS.`);
    } else {
      waive(label, "Phase 2: app cannot resolve canonical key, scores 50");
    }
    continue;
  }
  check(label, fbScore({ [key]: 100 }), webScore({ [key]: 100 }));
}

console.log("\n── B. Fiber-only parity: representative blends ──");
const BLENDS = [
  { "cotton": 95, "elastane": 5 },
  { "cotton": 90, "elastane": 10 },
  { "cotton": 70, "polyester": 30 },
  { "cotton": 50, "polyester": 50 },
  { "cotton": 60, "linen": 40 },
  { "wool": 80, "nylon": 20 },
  { "linen": 55, "cotton": 45 },
  { "lyocell": 95, "elastane": 5 },
  { "viscose": 51, "cupro": 49 },
  { "silk": 100 },
  { "hemp": 55, "cotton": 45 },
  { "modal": 95, "elastane": 5 },
  { "polyester": 88, "spandex": 12 },
  { "acrylic": 60, "wool": 40 },
  { "cashmere": 90, "silk": 10 },
  { "bamboo": 95, "spandex": 5 },
];
for (const comp of BLENDS) {
  const names = Object.keys(comp);
  const label = names.map((n) => `${comp[n]}% ${n}`).join(" / ");
  if (names.some((n) => !FB.getFiberData(n))) {
    waive(label, "Phase 2: contains a fiber the app cannot resolve");
    continue;
  }
  const w = webScore(comp), f = fbScore(comp);
  if (w !== f && isKnownRoundingSplit(comp, w, f)) {
    waive(`${label}  →  web ${w} / app ${f}`, "Phase 3: rounding order on an exact .5 hazard");
    continue;
  }
  check(label, f, w);
}

console.log("\n── C. Fiber-name coverage: names the live catalog actually stores ──");
for (const name of PHASE_2_UNRESOLVED_CATALOG_NAMES) {
  const w = web.resolveFiber(name);
  if (!w) {
    fail++;
    console.log(`  ✗ "${name}" — website no longer resolves this either; allowlist is stale.`);
    continue;
  }
  if (FB.getFiberData(name)) {
    fail++;
    console.log(`  ✗ "${name}" — allowlisted as app-unresolved but the app resolves it now.` +
      `\n      Remove it from PHASE_2_UNRESOLVED_CATALOG_NAMES.`);
    continue;
  }
  waive(`"${name}" → website reads ${w}, app scores 50`, "Phase 2");
}
for (const name of UNKNOWN_TO_BOTH_ENGINES) {
  check(`"${name}" is unknown to the website engine too (needs an authored value)`,
    web.resolveFiber(name), null);
}
// The positive form: every fiber name the live catalog actually stores must
// resolve to the SAME hazard in both engines. These 19 are the real strings
// from `products.fabric_composition`, including the ones that used to silently
// score 50 in the app while the website read them correctly.
for (const name of CATALOG_FIBER_NAMES) {
  const k = web.resolveFiber(name);
  const fd = FB.getFiberData(name);
  if (!k || !fd) {
    fail++;
    console.log(`  ✗ "${name}" unresolved — website: ${k ?? "NULL"}, app: ${fd ? fd.name : "NULL"}`);
    continue;
  }
  check(`"${name}" → same hazard in both engines (${FIBERS[k].default})`,
    fd.hazardScore, FIBERS[k].default);
}

console.log("\n── D. Certification handling (Phase 3: expected to diverge) ──");
const CERT_CASES = [
  [{ "cotton": 100 }, ["GOTS"]],
  [{ "cotton": 100 }, ["OEKO-TEX Standard 100"]],
  [{ "bamboo": 100 }, ["OEKO-TEX Standard 100"]],
  [{ "viscose": 100 }, ["OEKO-TEX Standard 100"]],
  [{ "polyester": 100 }, ["OEKO-TEX Standard 100"]],
  [{ "linen": 100 }, ["OEKO-TEX Standard 100"]],
];
for (const [comp, certs] of CERT_CASES) {
  const name = Object.keys(comp)[0];
  const w = webScore(comp, { certifications: certs });
  const f = fbScore(comp, { certifications: certs });
  const label = `${name} + ${certs[0]}  →  web ${w} / app ${f}`;
  if (w === f) {
    check(label + " (agree)", f, w);
  } else if (PHASE_3_CERT_MODEL_DIVERGES) {
    waive(label, `Phase 3: cert models differ by ${f - w}`);
  } else {
    check(label, f, w);
  }
}
// The argument for retiring the flat bonus, stated as measured facts rather
// than as an opinion, so the Phase 3 port is judged against it.
//
// Both engines DO credit polyester for OEKO-TEX, but for different reasons:
//   app       flat −10 hazard, untied to any mechanism, same for every fiber
//   website   −6, and only by clearing the majority-synthetic dye prior, which
//             is exactly what a finished-fabric residue test speaks to
// The website's credit is bounded by a stated mechanism; the app's is not.
// The sharper contrast is the SPREAD across fibers: the flat bonus pays the
// same 10 points to polyester and to linen. Model A pays each fiber only what
// its own evidence supports.
{
  const cert = { certifications: ["OEKO-TEX Standard 100"] };
  const fbGain = (c) => fbScore(c, cert) - fbScore(c);
  const webGain = (c) => webScore(c, cert) - webScore(c);

  // Before Phase 3 the app paid a flat 10 to polyester and to cotton alike for
  // OEKO-TEX. It now pays what each fiber's own evidence supports, identically
  // to the website: polyester gets 6 (the dye prior is cleared, nothing else to
  // unlock) and cotton gets 0 (a residue test says nothing about how it grew).
  check("app and website now credit OEKO-TEX identically per fiber",
    [fbGain({ polyester: 100 }), fbGain({ cotton: 100 })],
    [webGain({ polyester: 100 }), webGain({ cotton: 100 })]);
  check("website pays polyester 6 (dye prior cleared) and linen 0 (nothing left to unlock)",
    [webGain({ polyester: 100 }), webGain({ linen: 100 })], [6, 0]);
  check("no fiber is paid a flat rate any more: polyester 6, cotton 0, same cert",
    [fbGain({ polyester: 100 }), fbGain({ cotton: 100 })], [6, 0]);
  // Cotton's floor is unlocked by GOTS or an "organic" disclosure, NOT by
  // OEKO-TEX — a residue test says nothing about how the cotton was grown.
  // That distinction is the whole point of Model A and is invisible under a
  // flat bonus, which pays the same for either cert.
  const gots = { certifications: ["GOTS"] };
  check("website pays cotton 8 on GOTS (its own floor) but 0 on OEKO-TEX",
    [webScore({ cotton: 100 }, gots) - webScore({ cotton: 100 }), webGain({ cotton: 100 })],
    [8, 0]);
  // The flat bonus also used to be silently truncated by the 100 clamp on
  // already-clean fibers (linen got 6 of its 10, for no stated reason). With
  // the bonus retired, linen correctly gets nothing at all for a residue test.
  check("linen gets nothing for OEKO-TEX in either engine (no floor to unlock)",
    [fbGain({ linen: 100 }), webGain({ linen: 100 })], [0, 0]);
}

console.log("\n── E. Website engine golden values (regression lock) ──");
check("95% tencel modal / 5% elastane, no cert = 67", webScore({ "tencel modal": 95, "elastane": 5 }), 67);
check("95% tencel modal / 5% elastane + OEKO-TEX = 72 (cert floor fix 2026-07-26)",
  webScore({ "tencel modal": 95, "elastane": 5 }, { certifications: ["OEKO-TEX Standard 100"] }), 72);
check("branded TENCEL Modal is never worse than generic modal on the same cert",
  webScore({ "tencel modal": 95, "elastane": 5 }, { certifications: ["OEKO-TEX Standard 100"] }) >=
  webScore({ "modal": 95, "elastane": 5 }, { certifications: ["OEKO-TEX Standard 100"] }), true);
check("100% organic cotton = 92", webScore({ "organic cotton": 100 }), 92);
// 70 hazard, +6 majority-synthetic dye prior → 76 → clean 24. NOT 30: the dye
// prior applies to a bare 100% synthetic. Getting this wrong is easy, hence the lock.
check("100% polyester = 24 (dye prior applies)", webScore({ "polyester": 100 }), 24);
check("100% polyester, undyed disclosed = 30 (dye prior cleared)",
  webScore({ "polyester": 100 }, { descKeywords: ["undyed"] }), 30);
check("Lycra resolves to spandex, not the null→50 default",
  web.resolveFiber("lycra"), "spandex");

console.log("\n── F. scoreProductRow: brand-stated text only (Phase 1) ──");
{
  const { scoreProductRow } = web;
  // Toxome's editorial voice names the villain to say a product avoids it.
  // Feeding `description` to the Layer-B finish regexes penalized the cleanest
  // products for our own copy. These are the real rows that regressed.
  const editorialTraps = [
    ["Favorite Daughter poplin", { cotton: 100 }, "100% cotton",
      "A breathable natural fiber, not the wrinkle-free resin finish most office shirts hide."],
    ["Paka hoodie", { alpaca: 70, lyocell: 30 }, "70% Baby Alpaca, 30% TENCEL Lyocell",
      "Alpaca holds warmth lightly and resists odor without an antimicrobial finish."],
    ["DL1961 jean", { cotton: 98, elastane: 2 }, "98% cotton, 2% elastane",
      "Two low-impact fibers, no polyester, where most performance denim leans synthetic."],
  ];
  for (const [label, comp, materials, description] of editorialTraps) {
    const bare = web.calcToxomeScore(comp);
    const { score } = scoreProductRow({
      fabric_composition: comp, materials_text: materials,
      description, item_name: label, certifications: [],
    });
    check(`${label}: editorial copy naming a finish does NOT penalize`, score, bare);
  }
  // The mirror image: when the BRAND states the treatment, it must still bite.
  const silverIon = scoreProductRow({
    fabric_composition: { silk: 100 },
    materials_text: "100% GOTS certified organic silk with silver ions",
    description: "A silk pillowcase.", item_name: "Organic Silver Ion Silk Pillowcase",
    certifications: ["GOTS"],
  });
  check("brand-stated 'silver ions' in materials_text IS penalized",
    silverIon.score < web.calcToxomeScore({ silk: 100 }, { certifications: ["GOTS"] }), true);
  // And the whole point of Phase 1: a cert on the row reaches the score at all.
  const certd = scoreProductRow({
    fabric_composition: { "tencel modal": 95, elastane: 5 },
    materials_text: "95% TENCEL Modal, 5% elastane", item_name: "Gisele set",
    certifications: ["OEKO-TEX Standard 100"],
  });
  check("a row's certifications reach the score (the Phase 1 fix)", certd.score, 72);
  check("...and the risk band comes back with it", certd.risk, "low");
}
check("LENZING plant viscose gets no branded credit (generic viscose)",
  web.resolveFiber("LENZING plant viscose"), "viscose");

console.log(`\n${pass} passed, ${fail} failed, ${waived} waived (known bugs, see allowlist)`);
if (fail > 0) {
  console.log("\nA failure here means the engines drifted in a NEW way, or an\n" +
    "allowlisted bug was fixed without removing its allowlist entry.\n");
  process.exit(1);
}
