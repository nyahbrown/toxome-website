/**
 * One-off: correct the Faithfull the Brand "Hedy Maxi Dress" composition.
 *
 * Its material is "55% linen, 45% LENZING EcoVero rayon", but it was stored with
 * the 45% share keyed as generic `rayon`. LENZING EcoVero is a cleaner branded
 * viscose process, so it should key as `ecovero`, which lifts the score 81 -> 88
 * (both "low"). Root cause of the mis-key is the scrape.js LENZING parser bug
 * fixed the same day; this backfills the one live row that predated the fix.
 *
 *   node --env-file=.env.local scripts/fix-faithfull-ecovero.js            # apply
 *   node --env-file=.env.local scripts/fix-faithfull-ecovero.js --dry-run  # preview
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const DRY = process.argv.includes("--dry-run");

(async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const s = createClient(
    "https://xclvodbmllglmharezqa.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await s
    .from("products")
    .select("id, brand, item_name, fabric_composition, materials_text, toxome_score, risk_level")
    .eq("brand", "Faithfull the Brand")
    .eq("item_name", "Hedy Maxi Dress");
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (data.length !== 1) {
    console.log(`Expected 1 row, got ${data.length} — aborting.`);
    return;
  }

  const p = data[0];
  // Guard: only remap when the material text actually confirms EcoVero, and only
  // when the current comp still holds the mis-keyed `rayon` share.
  if (!/ecovero/i.test(p.materials_text || "")) {
    console.log("materials_text does not confirm EcoVero — aborting.");
    return;
  }
  if (!(p.fabric_composition && "rayon" in p.fabric_composition)) {
    console.log("No `rayon` key to remap — already fixed? Aborting.");
    return;
  }

  const newComp = {};
  for (const [k, v] of Object.entries(p.fabric_composition)) {
    newComp[k === "rayon" ? "ecovero" : k] = v;
  }
  const score = calcToxomeScore(newComp);
  const risk = scoreToRiskLevel(score);

  console.log(`${p.brand} / ${p.item_name}`);
  console.log(`  comp  ${JSON.stringify(p.fabric_composition)} -> ${JSON.stringify(newComp)}`);
  console.log(`  score ${p.toxome_score}/${p.risk_level} -> ${score}/${risk}`);

  if (DRY) {
    console.log("\nDry run — no write.");
    return;
  }
  const { error: uErr } = await s
    .from("products")
    .update({ fabric_composition: newComp, toxome_score: score, risk_level: risk })
    .eq("id", p.id);
  if (uErr) {
    console.error(uErr.message);
    process.exit(1);
  }
  console.log("\nUpdated.");
})();
