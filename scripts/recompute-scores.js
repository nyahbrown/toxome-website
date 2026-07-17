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
  // Page through the table. PostgREST caps a select at 1000 rows by default, so
  // a plain .select() silently drops everything past the first page — the tail
  // of the catalog would keep its stale score and no run would ever report it.
  const PAGE = 1000;
  const data = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from("products")
      .select("id, brand, item_name, fabric_composition, toxome_score, risk_level")
      .not("fabric_composition", "is", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    data.push(...page);
    if (page.length < PAGE) break;
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
