#!/usr/bin/env node
/**
 * One-time backfill: populate Supabase `closet_brands` from Firestore `scans`
 * where is_saved_to_closet == true (project cleantex-ced0e).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json \
 *   node --env-file=.env.local scripts/backfill-closet-brands.mjs
 *
 * OR with the JSON content directly:
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' \
 *   node --env-file=.env.local scripts/backfill-closet-brands.mjs
 *
 * How to get a service account key (if you don't have one):
 *   Firebase console → Project settings → Service accounts →
 *   "Generate new private key" → download the JSON file.
 *
 * Optional flags:
 *   --truncate        Clear closet_brands before inserting (DESTROYS existing data — use with care).
 *   --assume-clean    Treat stored overallHazardScore as a clean score directly (no inversion).
 *                     By default the script stores the raw value with a warning, since old
 *                     Firestore rows used an INVERTED hazard direction (lower = safer in the
 *                     old schema, higher = safer in the V2 clean schema). The founder should
 *                     decide which rows need manual recompute.
 *   --dry-run         Print counts without writing to Supabase.
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL      (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_APPLICATION_CREDENTIALS  (path to service-account JSON)   }  one
 *   FIREBASE_SERVICE_ACCOUNT         (service-account JSON as string) }  required
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ---- Parse flags -------------------------------------------------------

const args = process.argv.slice(2);
const TRUNCATE = args.includes("--truncate");
const ASSUME_CLEAN = args.includes("--assume-clean");
const DRY_RUN = args.includes("--dry-run");

if (DRY_RUN) console.log("[dry-run] No writes will be made to Supabase.\n");

// ---- Env validation ----------------------------------------------------

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n" +
      "(run with: node --env-file=.env.local scripts/backfill-closet-brands.mjs)"
  );
  process.exit(1);
}

// ---- Firebase init -----------------------------------------------------

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    console.error(
      "Could not parse FIREBASE_SERVICE_ACCOUNT as JSON. Ensure it is a valid JSON string."
    );
    process.exit(1);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    serviceAccount = JSON.parse(
      readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
    );
  } catch {
    console.error(
      `Could not read service account file at ${process.env.GOOGLE_APPLICATION_CREDENTIALS}.\n` +
        "To get a service account key:\n" +
        "  Firebase console → Project settings → Service accounts → Generate new private key"
    );
    process.exit(1);
  }
}
// else: fall through to Application Default Credentials
// (`gcloud auth application-default login`).

const firebaseApp = initializeApp({
  credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "cleantex-ced0e",
});
const db = getFirestore(firebaseApp);

// ---- Supabase client ---------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ---- Helpers -----------------------------------------------------------

/** Normalize brand name: lowercase, collapse non-alnum to single space, trim. */
function normalizeBrand(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** SHA-256 hash of 'toxome:' + uid — matches the backfill convention. */
function hashUid(uid) {
  return createHash("sha256").update(`toxome:${uid}`).digest("hex");
}

/**
 * Convert Firestore composition array [{fiber, percentage}] to {fiber: pct} object.
 * Accepts both percentage (0-100) and fraction (0-1) — normalizes to 0-100.
 */
function parseComposition(comp) {
  if (!comp || !Array.isArray(comp)) return null;
  const out = {};
  for (const entry of comp) {
    const fiber =
      (entry.fiber ?? entry.material ?? "").toString().trim().toLowerCase();
    if (!fiber) continue;
    let pct = Number(entry.percentage ?? entry.pct ?? entry.percent ?? 0);
    // If all values are <= 1 it's likely a fraction — convert.
    if (pct <= 1 && pct > 0) pct = pct * 100;
    out[fiber] = Math.round(pct * 10) / 10;
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ---- Batch insert helper -----------------------------------------------

const BATCH_SIZE = 500;

async function batchInsert(rows) {
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("closet_brands").insert(chunk);
    if (error) {
      console.error(`  Insert error (chunk ${i / BATCH_SIZE + 1}):`, error.message);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
    if (i % 5000 === 0 && i > 0) {
      process.stdout.write(`  ... ${i} processed\n`);
    }
  }
  return { inserted, errors };
}

// ---- Main --------------------------------------------------------------

async function main() {
  console.log("Fetching Firestore scans where is_saved_to_closet == true...");

  // NOTE: Firestore does not support server-side filtering on missing fields.
  // We filter is_saved_to_closet in JS to handle rows where the field is absent.
  const snap = await db.collection("scans").get();
  console.log(`  Total scan docs fetched: ${snap.size}`);

  const saved = snap.docs.filter((d) => {
    const data = d.data();
    return data.is_saved_to_closet === true;
  });
  console.log(`  Docs with is_saved_to_closet=true: ${saved.length}`);

  if (saved.length === 0) {
    console.log("Nothing to backfill. Exiting.");
    process.exit(0);
  }

  // ---- Score direction warning -----------------------------------------
  if (!ASSUME_CLEAN) {
    console.warn(
      "\n  WARNING: Old Firestore rows stored overallHazardScore in HAZARD direction\n" +
        "  (lower = safer in the old schema; V2 uses CLEAN direction where higher = safer).\n" +
        "  The raw stored value is written to clean_score as-is.\n" +
        "  Run with --assume-clean if you are confident the scores are already in clean direction,\n" +
        "  or recompute via the recompute-scores.js script after backfill.\n"
    );
  }

  // ---- Build rows ------------------------------------------------------

  const rows = [];
  let skippedNoBrand = 0;

  for (const doc of saved) {
    const d = doc.data();

    const brand_name = (d.brand_name ?? d.brandName ?? "").toString().trim();
    if (!brand_name) {
      skippedNoBrand += 1;
      continue;
    }

    const brand_normalized = normalizeBrand(brand_name);

    const category = (d.category ?? d.scan_category ?? null)?.toString().trim() || null;

    // Composition: Firestore stores as array, Supabase wants {fiber: pct} object.
    const composition = parseComposition(d.composition ?? d.fibers ?? null);

    // Score: stored in overallHazardScore (or hazardScore / cleanScore).
    const rawScore = d.overallHazardScore ?? d.hazardScore ?? d.cleanScore ?? null;
    const clean_score = rawScore != null ? Number(rawScore) : null;

    const hazard_level =
      (d.overallHazardLevel ?? d.hazardLevel ?? null)?.toString().trim() || null;

    const uid = (d.userId ?? d.uid ?? d.user_id ?? "").toString().trim();
    const hashed_uid = uid ? hashUid(uid) : null;

    // saved_at: the Firestore field is snake_case `scan_date` (a Timestamp).
    // Leave it OUT of the row when unknown so the DB default (now()) applies —
    // the column is NOT NULL, so passing null fails.
    let saved_at = null;
    const ts = d.scan_date ?? d.scanDate ?? d.createdAt ?? d.created;
    if (ts?.toDate) saved_at = ts.toDate().toISOString();
    else if (typeof ts === "string") saved_at = ts;

    rows.push({
      brand_name,
      brand_normalized,
      category,
      clean_score,
      hazard_level,
      composition,
      country: null, // not stored in Firestore scans
      hashed_uid,
      ...(saved_at ? { saved_at } : {}),
    });
  }

  console.log(`  Rows to insert: ${rows.length} (skipped ${skippedNoBrand} with no brand name)`);

  if (DRY_RUN) {
    console.log("\n[dry-run] Sample of first 5 rows:");
    console.log(JSON.stringify(rows.slice(0, 5), null, 2));
    console.log("\n[dry-run] Done. No data written.");
    process.exit(0);
  }

  // ---- Optionally truncate ---------------------------------------------

  if (TRUNCATE) {
    console.warn(
      "\n  WARNING: --truncate will delete ALL existing rows in closet_brands.\n" +
        "  Waiting 3 seconds before proceeding... (Ctrl+C to abort)\n"
    );
    await new Promise((r) => setTimeout(r, 3000));
    const { error: truncErr } = await supabase
      .from("closet_brands")
      .delete()
      .neq("brand_normalized", "__never_matches_sentinel__"); // delete all rows
    if (truncErr) {
      console.error("Truncate failed:", truncErr.message);
      process.exit(1);
    }
    console.log("  closet_brands table cleared.");
  }

  // ---- Insert ----------------------------------------------------------

  console.log(`\nInserting ${rows.length} rows in batches of ${BATCH_SIZE}...`);
  const { inserted, errors } = await batchInsert(rows);

  console.log(`\nDone.`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors:   ${errors}`);
  if (errors > 0) {
    console.warn("  Some rows failed to insert. Check error messages above.");
  }

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
