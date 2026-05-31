/**
 * Drift guard: verify (or sync) the website's canonical scoring data
 * (lib/fiber-scores.json) against the Toxome APP — the source of truth.
 *
 *   node scripts/sync-fiber-scores.js            # verify only — exits 1 on drift
 *   node scripts/sync-fiber-scores.js --write     # update lib/fiber-scores.json from the app
 *   APP_REPO=/path/to/toxome node scripts/sync-fiber-scores.js
 *
 * Reads the app's per-fiber hazardScore (assets/data/fiber_database.json) and
 * the formula constants/thresholds (lib/config/scan_config.dart +
 * lib/services/hazard_calculator_service.dart). Needs the app repo present as a
 * sibling dir (../toxome) or via APP_REPO; exits gracefully (0) if it isn't,
 * so this never breaks a build where the app repo is absent.
 */
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");
const WEB_JSON = path.join(__dirname, "..", "lib", "fiber-scores.json");
const APP_REPO =
  process.env.APP_REPO || path.join(__dirname, "..", "..", "toxome");

function norm(name) {
  return String(name)
    .toLowerCase()
    .replace(/™|®/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function appPath(...p) {
  return path.join(APP_REPO, ...p);
}

function loadAppScores() {
  const db = JSON.parse(
    fs.readFileSync(appPath("assets", "data", "fiber_database.json"), "utf8")
  );
  const fibers = db.fibers || db;
  const out = {};
  const add = (name, v) => {
    if (name && typeof v === "number") out[norm(name)] = v;
  };
  if (Array.isArray(fibers)) {
    for (const f of fibers) add(f.name || f.fiber, f.hazardScore);
  } else {
    for (const [k, v] of Object.entries(fibers))
      add(k, typeof v === "object" ? v.hazardScore : v);
  }
  return out;
}

function num(re, text, fallback) {
  const m = text.match(re);
  return m ? Number(m[1]) : fallback;
}

function loadAppConstants() {
  const cfg = fs.readFileSync(
    appPath("lib", "config", "scan_config.dart"),
    "utf8"
  );
  const haz = fs.readFileSync(
    appPath("lib", "services", "hazard_calculator_service.dart"),
    "utf8"
  );
  return {
    constants: {
      lambdaMax: num(/itemPenaltyLambdaMax\s*=\s*([\d.]+)/, cfg, 0.45),
      tau: num(/itemPenaltyTau\s*=\s*([\d.]+)/, cfg, 12.0),
      highHazardFiber: num(/highHazardFiberThreshold\s*=\s*(\d+)/, cfg, 60),
    },
    thresholds: {
      lowMax: num(/score\s*>=\s*0\s*&&\s*score\s*<=\s*(\d+)/, haz, 36),
      // app: high is `>= 61`, so moderateMax = that - 1
      moderateMax: num(/score\s*>=\s*(\d+)\)\s*\{?\s*\n?\s*return\s+HazardLevel\.high/, haz, 61) - 1,
    },
  };
}

function main() {
  if (!fs.existsSync(appPath("assets", "data", "fiber_database.json"))) {
    console.log(
      `App repo not found at ${APP_REPO} (set APP_REPO=…). Skipping sync — nothing to verify.`
    );
    process.exit(0);
  }

  const web = JSON.parse(fs.readFileSync(WEB_JSON, "utf8"));
  const appScores = loadAppScores();
  const app = loadAppConstants();

  const drift = [];
  const missing = []; // in app, not on website
  for (const [fiber, appVal] of Object.entries(appScores)) {
    if (!(fiber in web.scores)) missing.push(`${fiber}=${appVal}`);
    else if (web.scores[fiber] !== appVal)
      drift.push(`${fiber}: web ${web.scores[fiber]} ≠ app ${appVal}`);
  }
  const constDrift = [];
  for (const k of Object.keys(app.constants))
    if (web.constants[k] !== app.constants[k])
      constDrift.push(`${k}: web ${web.constants[k]} ≠ app ${app.constants[k]}`);
  for (const k of Object.keys(app.thresholds))
    if (web.thresholds[k] !== app.thresholds[k])
      constDrift.push(`${k}: web ${web.thresholds[k]} ≠ app ${app.thresholds[k]}`);

  console.log(`App fibers: ${Object.keys(appScores).length} | website fibers: ${Object.keys(web.scores).length}`);
  console.log(`Fiber-score drift: ${drift.length} | missing on website: ${missing.length} | constant/threshold drift: ${constDrift.length}`);
  if (drift.length) console.log("  DRIFT:\n   " + drift.join("\n   "));
  if (missing.length) console.log("  MISSING (in app, not website):\n   " + missing.join("\n   "));
  if (constDrift.length) console.log("  CONSTANTS:\n   " + constDrift.join("\n   "));

  if (!drift.length && !missing.length && !constDrift.length) {
    console.log("\n✓ Website scoring is in sync with the app.");
    process.exit(0);
  }

  if (WRITE) {
    for (const [fiber, appVal] of Object.entries(appScores)) web.scores[fiber] = appVal;
    web.constants = { ...web.constants, ...app.constants };
    web.thresholds = { ...web.thresholds, ...app.thresholds };
    fs.writeFileSync(WEB_JSON, JSON.stringify(web, null, 2) + "\n");
    console.log("\n✎ Wrote app values into lib/fiber-scores.json. Review the diff + recompute live scores (scripts/recompute-scores.js).");
    process.exit(0);
  }
  console.log("\n✗ Drift detected. Run with --write to sync from the app.");
  process.exit(1);
}

main();
