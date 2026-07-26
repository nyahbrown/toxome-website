/**
 * READ-ONLY big-movers report for the V2 + inversion migration. Compares each
 * product's CURRENT stored score/risk against the NEW V2 clean score, and
 * surfaces the products whose risk BAND changes — especially the ones that get
 * worse — so they can be spot-checked before recompute-scores.js writes them.
 *
 * NOTE: the stored score is old-direction (lower=better) and the new score is
 * clean (higher=better), so a raw numeric delta is meaningless. The meaningful,
 * direction-independent signal is the risk_level transition (low/moderate/high
 * concern means the same thing in both systems).
 *
 *   node --env-file=.env.local scripts/score-movers-report.js
 *   node --env-file=.env.local scripts/score-movers-report.js --worse-only
 */
const { createClient } = require("@supabase/supabase-js");
const { scoreProductRow, getUnresolvedFibers } = require("./fabricScores");

const WORSE_ONLY = process.argv.includes("--worse-only");
const RANK = { low: 0, moderate: 1, high: 2 };

const supabase = createClient(
  "https://xclvodbmllglmharezqa.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  // Page through: PostgREST caps a select at 1000 rows, and 1156 products carry
  // a composition. Without this the report silently covered 86% of the catalog
  // and read as if it had covered all of it. Mirrors recompute-scores.js.
  const PAGE = 1000;
  const data = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from("products")
      // certifications + materials_text are required: the score is not a
      // function of composition alone. `description` is intentionally NOT
      // scored — see scoreProductRow in fabricScores.js.
      .select(
        "id, brand, item_name, published, fabric_composition, toxome_score, " +
          "risk_level, certifications, materials_text"
      )
      .not("fabric_composition", "is", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) { console.error(error.message); process.exit(1); }
    data.push(...page);
    if (page.length < PAGE) break;
  }

  const rows = [];
  const transitions = {};
  let bandChanged = 0, gotWorse = 0, gotBetter = 0, nullNew = 0;

  for (const p of data) {
    const { score: newScore, risk: newRisk } = scoreProductRow(p);
    if (newScore == null) { nullNew++; continue; }
    const oldRisk = p.risk_level || "(none)";
    const changed = oldRisk !== newRisk;
    if (changed) {
      bandChanged++;
      const key = `${oldRisk} -> ${newRisk}`;
      transitions[key] = (transitions[key] || 0) + 1;
      const worse = RANK[newRisk] > (RANK[oldRisk] ?? -1);
      if (worse) gotWorse++; else gotBetter++;
      rows.push({
        worse,
        brand: p.brand, name: p.item_name, published: p.published,
        oldScore: p.toxome_score, oldRisk, newScore, newRisk,
      });
    }
  }

  // Worse first, then by new score ascending (most concerning at top).
  rows.sort((a, b) => (b.worse - a.worse) || (a.newScore - b.newScore));

  console.log("\n══ TOXOME V2 + INVERSION — CATALOG MOVERS REPORT ══");
  console.log(`(stored score = old direction lower=better; NEW = clean higher=better)\n`);
  console.log(`Products with a fabric breakdown : ${data.length}`);
  console.log(`Risk band changed               : ${bandChanged}`);
  console.log(`  ⚠ got WORSE (review these)     : ${gotWorse}`);
  console.log(`  ↑ got better                   : ${gotBetter}`);
  if (nullNew) console.log(`  ? new score null (bad comp)    : ${nullNew}`);

  console.log("\nTransitions:");
  for (const [k, n] of Object.entries(transitions).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(24)} ${n}`);
  }

  const show = WORSE_ONLY ? rows.filter((r) => r.worse) : rows;
  console.log(`\n${WORSE_ONLY ? "WORSE movers" : "All band-changers"} (${show.length}):`);
  for (const r of show) {
    const flag = r.worse ? "⚠" : " ";
    const pub = r.published ? "" : " [draft]";
    console.log(
      `  ${flag} ${String(r.brand || "").slice(0, 18).padEnd(18)} ${String(r.name || "").slice(0, 34).padEnd(34)} ` +
      `${String(r.oldScore).padStart(3)}/${r.oldRisk.padEnd(8)} -> ${String(r.newScore).padStart(3)}/${r.newRisk}${pub}`
    );
  }
  const unresolved = getUnresolvedFibers();
  if (unresolved.length) {
    console.log(
      `\n⚠ ${unresolved.length} unrecognized fiber name(s) scored as 50:\n` +
        unresolved.map((f) => `    ${JSON.stringify(f)}`).join("\n")
    );
  }
  console.log("\nRead-only. To apply: node --env-file=.env.local scripts/recompute-scores.js [--dry-run]\n");
})();
