/**
 * Recompute toxome_score + risk_level for every product that has a
 * fabric_composition, using the current shared scoring (scripts/fabricScores.js).
 * Run this whenever the fabric hazard ratings change.
 *
 *   node --env-file=.env.local scripts/recompute-scores.js            # apply
 *   node --env-file=.env.local scripts/recompute-scores.js --dry-run  # preview
 */
const { createClient } = require("@supabase/supabase-js");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const DRY = process.argv.includes("--dry-run");
const supabase = createClient(
  "https://xclvodbmllglmharezqa.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const { data, error } = await supabase
    .from("products")
    .select("id, brand, item_name, fabric_composition, toxome_score, risk_level")
    .not("fabric_composition", "is", null);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  let changed = 0;
  for (const p of data) {
    const score = calcToxomeScore(p.fabric_composition);
    const risk = scoreToRiskLevel(score);
    if (score !== p.toxome_score || risk !== p.risk_level) {
      changed++;
      console.log(
        `${p.brand} / ${p.item_name}: ${p.toxome_score}/${p.risk_level} -> ${score}/${risk}`
      );
      if (!DRY)
        await supabase
          .from("products")
          .update({ toxome_score: score, risk_level: risk })
          .eq("id", p.id);
    }
  }
  console.log(
    `\n${changed} product(s) ${DRY ? "would change" : "updated"} of ${data.length} with a fabric breakdown.`
  );
})();
