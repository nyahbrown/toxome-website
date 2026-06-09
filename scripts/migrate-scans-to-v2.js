/**
 * One-time migration: rewrite every Firestore `scans` document's stored score
 * into the V2 CLEAN direction (higher = cleaner).
 *
 * WHY: old app binaries wrote `overallHazardScore` in the OLD hazard direction
 * (lower = better). V2 flipped to clean space AND recalibrated fibers + added a
 * dye prior, so a blind `100 - x` is wrong. This RECOMPUTES each scan's score
 * from its saved composition via the canonical scorer (scripts/fabricScores.js)
 * — the exact engine the app + website already use at read-time — and writes it
 * back. Idempotent: re-running yields the same values.
 *
 * Touches ALL scans (not just closet items).
 *
 * RUN (from toxome-website/, needs `npm i -D firebase-admin` once):
 *   # dry run first — reports old→new, writes nothing:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/cleantex-ced0e-sa.json \
 *     node scripts/migrate-scans-to-v2.js --dry-run
 *   # then apply:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/cleantex-ced0e-sa.json \
 *     node scripts/migrate-scans-to-v2.js
 *
 * Get the service-account JSON: Firebase console (project cleantex-ced0e) →
 * Project settings → Service accounts → Generate new private key.
 *
 * ORDER: run THIS before scripts/backfill-closet-brands.mjs so the backfill
 * copies corrected scores (or re-run the backfill afterward).
 */
const admin = require("firebase-admin");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const DRY = process.argv.includes("--dry-run");

// Auth via Application Default Credentials: either GOOGLE_APPLICATION_CREDENTIALS
// (a service-account JSON) OR `gcloud auth application-default login`.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "cleantex-ced0e",
  });
}
const db = admin.firestore();

// Firestore stores composition as [{fiber, percentage}]; the scorer wants
// {fiber: pct}. Percentages saved as 0–1 fractions are scaled to 0–100.
function toCompositionObject(arr) {
  const out = {};
  if (!Array.isArray(arr)) return out;
  for (const c of arr) {
    const fiber = c && (c.fiber != null ? c.fiber : c.name);
    let pct = Number(c && c.percentage);
    if (!fiber || !Number.isFinite(pct) || pct <= 0) continue;
    if (pct > 0 && pct <= 1) pct = pct * 100;
    out[fiber] = (out[fiber] || 0) + pct;
  }
  return out;
}

(async () => {
  console.log(`Reading scans…${DRY ? " (DRY RUN)" : ""}`);
  const snap = await db.collection("scans").get();

  let scanned = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  const movers = [];

  const BATCH = 400;
  let batch = db.batch();
  let inBatch = 0;

  for (const doc of snap.docs) {
    scanned++;
    const d = doc.data();
    const comp = toCompositionObject(d.composition);
    if (Object.keys(comp).length === 0) {
      skipped++;
      continue;
    }
    const clean = calcToxomeScore(comp);
    if (clean == null) {
      skipped++;
      continue;
    }
    const level = scoreToRiskLevel(clean); // 'low' | 'moderate' | 'high' concern

    const oldScore = d.overallHazardScore;
    if (Number(oldScore) === clean && d.overallHazardLevel === level) {
      unchanged++;
      continue;
    }

    movers.push({ id: doc.id, old: oldScore, new: clean, level });
    updated++;

    if (!DRY) {
      batch.update(doc.ref, {
        overallHazardScore: clean,
        overallHazardLevel: level,
      });
      inBatch++;
      if (inBatch >= BATCH) {
        await batch.commit();
        batch = db.batch();
        inBatch = 0;
      }
    }
  }
  if (!DRY && inBatch > 0) await batch.commit();

  movers.sort(
    (a, b) =>
      Math.abs(b.new - (Number(b.old) || 50)) -
      Math.abs(a.new - (Number(a.old) || 50))
  );

  console.log(
    `\nScanned ${scanned} | ${DRY ? "would update" : "updated"} ${updated} | ` +
      `unchanged ${unchanged} | skipped (no composition) ${skipped}`
  );
  console.log("\nBiggest movers (old → new clean, concern):");
  for (const m of movers.slice(0, 25)) {
    console.log(`  ${m.id}: ${m.old} → ${m.new}  (${m.level})`);
  }
  if (DRY) {
    console.log("\nDRY RUN — nothing written. Re-run without --dry-run to apply.");
  } else {
    console.log("\nDone. Stored scores now match the V2 clean engine.");
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
