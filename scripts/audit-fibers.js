/**
 * WRONG-FIBER audit. Catches the failure mode the percent-sum audit CANNOT:
 * a stored fabric_composition whose fiber IDENTITY is fabricated, even though it
 * sums to a clean 100. (20 Jul 2026: a Jenni Kayne scrape batch defaulted four
 * items to `{cashmere:100}` / score 90 — one was really cotton, one raw silk,
 * one a modal/poly blend that belonged at 53. Every sum was exactly 100, so the
 * existing checker was blind to all of them.)
 *
 * How: re-fetch each product's own source PDP and re-parse its composition with
 * the SAME deterministic scraper the catalog is built on (scripts/scrape.js →
 * getValidatedProduct). No Anthropic API, ever — pure fetch + regex. Then compare
 * the PRIMARY fiber family (and the fiber set) stored-vs-page. When they disagree
 * it also recomputes the page-implied Toxome score so the credibility impact is
 * quantified (e.g. "90 -> 53").
 *
 * Run:  node --env-file=.env.local scripts/audit-fibers.js          (published only)
 *       node --env-file=.env.local scripts/audit-fibers.js --all    (+ unpublished)
 *
 * REPORT ONLY. It never writes to the catalog. A mismatch can be a real data bug
 * OR a page whose wording the parser reads differently than a human would, so
 * every hit is a triage item for a person to confirm against the live PDP — same
 * philosophy as the link sweep. Writes /tmp/fiber_audit_report.json.
 */
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct, shopifyProduct } = require("./scrape");
const { calcToxomeScore, scoreToRiskLevel } = require("./fabricScores");

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INCLUDE_UNPUBLISHED = process.argv.includes("--all");
const CONCURRENCY = 6;

// Collapse names that are the SAME fiber for identity purposes. Organic /
// regenerative-organic cotton is still cotton — that distinction is a scoring
// FLOOR, not a wrong-fiber, and the page parser may or may not catch the
// "organic" qualifier, so treating them as different would be pure false
// positives. Elastane==spandex==lycra and nylon==polyamide are exact synonyms
// the scraper itself already normalises inconsistently across sources.
// Collapse every fiber NAME to its BASE fiber, because this audit asks one
// question: is it a different MATERIAL than the page says? Sub-type names
// (merino wool, mulberry silk, good-earth/pima/organic cotton, European-flax
// linen, TENCEL lyocell, LENZING plant viscose, bamboo viscose) are the SAME
// base fiber — the score nuance between, say, merino and generic wool is a
// FLOOR question, not a wrong-fiber, and flagging it just buries the real hits.
// Ordered rules; first match wins. Animal fibers (cashmere/alpaca/mohair) are
// NOT wool and are matched before the wool catch-all.
const FAMILY_RULES = [
  [/cashmere/, "cashmere"],
  [/alpaca/, "alpaca"],
  [/mohair/, "mohair"],
  [/angora/, "angora"],
  [/(merino|lambswool|shetland|\bwool)/, "wool"],
  [/silk/, "silk"],
  [/(linen|flax)/, "linen"],
  [/hemp/, "hemp"],
  [/(jute)/, "jute"],
  [/ramie/, "ramie"],
  [/(cotton)/, "cotton"],
  [/modal/, "modal"], // incl. "tencel modal" / "lenzing modal" (a modal, not lyocell)
  [/(lyocell|tencel)/, "lyocell"],
  [/(viscose|rayon|bamboo|ecovero)/, "viscose"], // bamboo/plant viscose are viscose
  [/(cupro|cuprammonium|bemberg)/, "cupro"],
  [/acetate/, "acetate"],
  [/(polyester|\bpet\b|poly\b)/, "polyester"],
  [/(nylon|polyamide)/, "nylon"],
  [/(elastane|spandex|lycra)/, "elastane"],
  [/modacrylic/, "modacrylic"],
  [/acrylic/, "acrylic"],
  [/polyurethane|\bpu\b/, "polyurethane"],
  [/leather|suede/, "leather"],
  [/down|feather/, "down"],
  [/latex/, "latex"],
  [/kapok/, "kapok"],
];
const family = (f) => {
  const k = String(f).toLowerCase().trim();
  for (const [re, base] of FAMILY_RULES) if (re.test(k)) return base;
  return k;
};
const famSet = (comp) => new Set(Object.keys(comp).map(family));

// Base fibers that are structural add-ins, never a real garment's majority
// material. When the page parse says a garment is >=50% one of these, the parser
// almost certainly scraped a "100% spandex" stretch/size line out of loose page
// text — untrusted, so we don't raise a wrong-fiber flag off it.
const STRUCTURAL_ONLY = new Set(["elastane"]);

// Fallback for pages that state fabric only in prose (no "NN% fiber" the parser
// can catch) — the Jenni Kayne cotton items hid their composition in "Italian
// washed poplin" text but still carried a structured `Filter: Cotton` tag.
// RESTRICTED to explicitly material-prefixed tags: bare fiber words in a tag
// list are usually site-wide category/nav pollution (Brooklinen tags "modal"
// and "down" on a 100%-cotton sheet set because it sells those elsewhere), which
// produced pure noise on the first run. Returns the base-fiber SET the brand
// structurally claims for THIS product — never a score.
const MATERIAL_TAG_RE = /^\s*(?:filter|material|fabric|fibre|fiber|made\s*of|composition)\s*:\s*(.+)$/i;
function fibersFromTags(tags) {
  const found = new Set();
  for (const t of tags || []) {
    const m = String(t).match(MATERIAL_TAG_RE);
    if (!m) continue;
    const fam = family(m[1]);
    // Only keep it when the value actually resolved to a known base fiber
    // (family() returns the lowercased input unchanged when nothing matched).
    if (fam !== m[1].toLowerCase().trim() || FAMILY_RULES.some(([re]) => re.test(m[1].toLowerCase())))
      found.add(fam);
  }
  return found;
}

function primaryFamily(comp) {
  let best = null;
  let bv = -Infinity;
  for (const [k, v] of Object.entries(comp)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > bv) {
      bv = n;
      best = k;
    }
  }
  return best == null ? null : family(best);
}

const fmt = (comp) =>
  Object.entries(comp)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([k, v]) => `${v}% ${k}`)
    .join(", ");

async function mapLimit(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        await fn(items[idx], idx);
      } catch (e) {
        console.error("  worker error:", e.message);
      }
    }
  });
  await Promise.all(workers);
}

async function run() {
  if (!SUPABASE_URL || !KEY) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, KEY);

  // Page through the table — PostgREST caps a select at 1000 rows, and a plain
  // .select() silently drops the tail (see recompute-scores.js / audit-live.js).
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from("products")
      .select("id, brand, item_name, item_url, fabric_composition, toxome_score, risk_level, published")
      .not("fabric_composition", "is", null)
      .not("item_url", "is", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (!INCLUDE_UNPUBLISHED) q = q.eq("published", true);
    const { data: page, error } = await q;
    if (error) throw error;
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  // Skip empty composition objects — that's the "missing materials" audit's job.
  const products = rows.filter(
    (p) => p.fabric_composition && Object.keys(p.fabric_composition).length > 0
  );

  console.log(
    `Fiber audit: ${products.length} products with a composition + url ` +
      `(${INCLUDE_UNPUBLISHED ? "published + unpublished" : "published only"}), ` +
      `concurrency ${CONCURRENCY}…\n`
  );

  const report = {
    total: products.length,
    scope: INCLUDE_UNPUBLISHED ? "all" : "published",
    matched: 0,
    fiberMismatch: [], // HIGH: primary fiber family differs — the wrong-fiber bug
    setMismatch: [], // MEDIUM: same primary, but the fiber set differs
    unverifiable: [], // page dead/blocked or no parseable composition — can't judge
  };
  let done = 0;

  await mapLimit(products, CONCURRENCY, async (p) => {
    const label = `${p.brand} — ${p.item_name}`;
    const stored = p.fabric_composition;

    const v = await getValidatedProduct(p.item_url);
    if (!v.ok) {
      report.unverifiable.push({ id: p.id, label, published: p.published, reason: v.reason });
    } else if (!v.composition || Object.keys(v.composition).length === 0) {
      // No parseable percentages — try the brand's material tag as a fallback so
      // prose-only pages (Jenni Kayne et al.) aren't all silently unverifiable.
      const shopify = await shopifyProduct(v.finalUrl).catch(() => null);
      const tagFibers = fibersFromTags(shopify && shopify.tags);
      const storedPrim = primaryFamily(stored);
      const storedSet = famSet(stored);
      const overlap = [...tagFibers].some((f) => storedSet.has(f));
      if (tagFibers.size === 0) {
        report.unverifiable.push({
          id: p.id,
          label,
          published: p.published,
          reason: "no composition parseable on page",
        });
      } else if (!overlap) {
        // The brand's own material tag shares NO fiber with what we store — e.g.
        // tagged Cotton, stored Cashmere. Require zero overlap (not merely a
        // missing primary) so a single category tag on a multi-fiber blend
        // (Paka "alpaca" on a cotton/lyocell/alpaca piece) doesn't false-flag.
        report.fiberMismatch.push({
          id: p.id,
          label,
          published: p.published,
          source: "tag",
          storedPrimary: storedPrim,
          pagePrimary: [...tagFibers].join("/"),
          stored: fmt(stored),
          page: `brand tags: ${[...tagFibers].join(", ")}`,
          storedScore: p.toxome_score,
          pageScore: null, // tags carry no percentages — score can't be recomputed
          pageRisk: null,
          url: v.finalUrl,
        });
      } else {
        report.matched++; // tag confirms the stored primary fiber
      }
    } else {
      const page = v.composition;
      const storedPrim = primaryFamily(stored);
      const pagePrim = primaryFamily(page);
      const storedSet = famSet(stored);
      const pageSet = famSet(page);
      const setsEqual =
        storedSet.size === pageSet.size && [...storedSet].every((f) => pageSet.has(f));
      const pagePrimPct = Math.max(
        ...Object.entries(page)
          .filter(([k]) => family(k) === pagePrim)
          .map(([, v]) => Number(v))
      );

      if (setsEqual) {
        // Identical base-fiber SET — same materials, only the percentages/order
        // differ. That's the percent-sum audit's job, not wrong-fiber; here it's
        // a match so a 49/49 tie or a swapped blend doesn't cry wolf.
        report.matched++;
      } else if (STRUCTURAL_ONLY.has(pagePrim) && pagePrimPct >= 50) {
        // No real garment is majority elastane/spandex — the parser grabbed a
        // stretch/size line out of page text (Woolly "100% spandex"). Untrusted
        // page parse, not a data bug: report as unverifiable, never a mismatch.
        report.unverifiable.push({
          id: p.id,
          label,
          published: p.published,
          reason: `page parse implausible (primary ${pagePrim} ${pagePrimPct}%)`,
        });
      } else if (storedPrim !== pagePrim) {
        // Quantify the hit: what would the score be off the page's own fibers?
        const pageScore = calcToxomeScore(page, {
          descKeywords: v.descText ? [v.descText] : [],
          certifications: v.certifications || [],
        });
        report.fiberMismatch.push({
          id: p.id,
          label,
          published: p.published,
          source: "composition",
          storedPrimary: storedPrim,
          pagePrimary: pagePrim,
          stored: fmt(stored),
          page: fmt(page),
          storedScore: p.toxome_score,
          pageScore,
          pageRisk: scoreToRiskLevel(pageScore),
          url: v.finalUrl,
        });
      } else if (
        storedSet.size !== pageSet.size ||
        [...storedSet].some((f) => !pageSet.has(f))
      ) {
        const missingOnStored = [...pageSet].filter((f) => !storedSet.has(f));
        const extraOnStored = [...storedSet].filter((f) => !pageSet.has(f));
        report.setMismatch.push({
          id: p.id,
          label,
          published: p.published,
          stored: fmt(stored),
          page: fmt(page),
          // Page discloses a fiber we don't store — often a synthetic that should
          // pull the score down (the "silently absorbed synthetic" case).
          missingOnStored,
          extraOnStored,
          url: v.finalUrl,
        });
      } else {
        report.matched++;
      }
    }
    done++;
    if (done % 25 === 0) console.log(`  …${done}/${products.length}`);
  });

  // Flattering hits first: a stored score higher than the page-implied score is
  // the moat failing in the direction that matters (users trusting too-clean a
  // number). Then the rest of the fiber mismatches, then set mismatches.
  const flattering = (m) =>
    m.pageScore != null && m.storedScore != null && m.storedScore > m.pageScore;
  report.fiberMismatch.sort((a, b) => {
    if (flattering(a) !== flattering(b)) return flattering(a) ? -1 : 1;
    const da = (a.storedScore ?? 0) - (a.pageScore ?? 0);
    const db = (b.storedScore ?? 0) - (b.pageScore ?? 0);
    return db - da;
  });

  fs.writeFileSync("/tmp/fiber_audit_report.json", JSON.stringify(report, null, 2));

  const flatteringCount = report.fiberMismatch.filter(flattering).length;

  console.log("\n===== WRONG-FIBER AUDIT =====");
  console.log(`Scanned:                ${report.total} (${report.scope})`);
  console.log(`Fiber match:            ${report.matched}`);
  console.log(`FIBER MISMATCH:         ${report.fiberMismatch.length}   <- primary fiber wrong`);
  console.log(`  of which flattering:  ${flatteringCount}   <- stored score too high`);
  console.log(`Set mismatch:           ${report.setMismatch.length}   <- missing/extra fiber`);
  console.log(`Unverifiable:           ${report.unverifiable.length}   <- page dead/blocked/no comp`);

  if (report.fiberMismatch.length) {
    console.log(`\n--- FIBER MISMATCH (confirm each against the live PDP) ---`);
    for (const m of report.fiberMismatch) {
      const flag = flattering(m) ? " ⚠ FLATTERING" : "";
      const pub = m.published ? "live" : "unpub";
      const pageScoreStr =
        m.pageScore == null ? "no % on page → score n/a" : `page-implied ${m.pageScore}/${m.pageRisk}`;
      console.log(
        `  [${pub}] ${m.label}${flag}  (via ${m.source})\n` +
          `        stored: ${m.stored}  (score ${m.storedScore})\n` +
          `        page:   ${m.page}  (${pageScoreStr})\n` +
          `        ${m.url}`
      );
    }
  }
  if (report.setMismatch.length) {
    console.log(`\n--- SET MISMATCH (page lists a fiber we don't store) ---`);
    for (const m of report.setMismatch) {
      const pub = m.published ? "live" : "unpub";
      const miss = m.missingOnStored.length ? ` +page:[${m.missingOnStored.join(",")}]` : "";
      const extra = m.extraOnStored.length ? ` +stored:[${m.extraOnStored.join(",")}]` : "";
      console.log(`  [${pub}] ${m.label}  stored: ${m.stored} | page: ${m.page}${miss}${extra}`);
    }
  }

  // GitHub Actions run summary — readable without opening the artifact.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [
      `## Toxome wrong-fiber audit`,
      ``,
      `| | |`,
      `|---|---|`,
      `| Scanned (${report.scope}) | ${report.total} |`,
      `| Fiber match | ${report.matched} |`,
      `| **Fiber mismatch** | **${report.fiberMismatch.length}** (${flatteringCount} flattering) |`,
      `| Set mismatch | ${report.setMismatch.length} |`,
      `| Unverifiable | ${report.unverifiable.length} |`,
      ``,
      report.fiberMismatch.length
        ? `### Fiber mismatches\n${report.fiberMismatch
            .map(
              (m) =>
                `- ${m.published ? "🔴 live" : "unpub"} **${m.label}**${flattering(m) ? " ⚠ flattering" : ""} — stored \`${m.stored}\` (score ${m.storedScore}) vs page \`${m.page}\` (${m.pageScore == null ? "no % on page" : "implied " + m.pageScore}) — [PDP](${m.url})`
            )
            .join("\n")}`
        : `No fiber mismatches. ✅`,
    ].join("\n");
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");
  }

  console.log("\nFull report → /tmp/fiber_audit_report.json");

  // Fail the check only when a LIVE product's wrong fiber makes it look CLEANER
  // than reality (stored score > page-implied) — that's the moat failing in the
  // direction that matters, and the Jenni Kayne bug's signature. Mismatches that
  // are naming ambiguities or that would only LOWER the score (score goes up on
  // correction) still print for triage but don't hold the weekly check red on
  // noise nobody will action.
  const liveFlattering = report.fiberMismatch.filter(
    (m) => m.published && flattering(m)
  ).length;
  if (liveFlattering > 0) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
