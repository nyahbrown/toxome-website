/**
 * Audit currently-LIVE (published) products:
 *   1. Multiple images  — backfills a 2nd angle from the product page when missing
 *                         (keeps the existing primary; only adds angles).
 *   2. Materials mapped + scored — flags products with no fabric_composition/score.
 *   3. In stock (US)   — uses getValidatedProduct().inStock (JSON-LD/Shopify offers).
 *
 * Run:  node --env-file=.env.local scripts/audit-live.js          (report only)
 *       node --env-file=.env.local scripts/audit-live.js --apply  (also backfill images)
 *
 * Writes a full report to /tmp/audit_report.json. Stock / dead-URL decisions are
 * left to a human (not auto-unpublished) — the report lists ids to act on.
 */
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { getValidatedProduct } = require("./scrape");

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes("--apply");
const CONCURRENCY = 6;

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
  // Page through the table. PostgREST caps a select at 1000 rows by default, so
  // a plain .select() silently drops everything past the first page — the audit
  // would report "all clear" on a catalog tail it never actually looked at.
  // Same fix as scripts/recompute-scores.js. Live count is 734, so this is not
  // yet biting, but it fails silently the moment it does.
  const PAGE = 1000;
  const products = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from("products")
      .select("id, brand, item_name, item_url, item_image, images, fabric_composition, toxome_score")
      .eq("published", true)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    products.push(...page);
    if (page.length < PAGE) break;
  }

  console.log(`Auditing ${products.length} live products (concurrency ${CONCURRENCY})…\n`);

  const report = {
    total: products.length,
    okInStock: 0,
    unknownStock: 0,
    soldOut: [],
    dead: [],
    imageBackfill: [],
    stillSingleImage: [],
    missingMaterials: [],
  };
  let done = 0;

  await mapLimit(products, CONCURRENCY, async (p) => {
    const label = `${p.brand} — ${p.item_name}`;
    if (!p.fabric_composition || Object.keys(p.fabric_composition || {}).length === 0) {
      report.missingMaterials.push({ id: p.id, label });
    }
    if (p.item_url) {
      const v = await getValidatedProduct(p.item_url);
      if (!v.ok) {
        report.dead.push({ id: p.id, label, reason: v.reason });
      } else {
        if (v.inStock === false) report.soldOut.push({ id: p.id, label, url: p.item_url });
        else if (v.inStock === true) report.okInStock++;
        else report.unknownStock++;

        // Backfill a 2nd image: keep the existing primary, append fresh angles.
        const existing = (p.images && p.images.length ? p.images : p.item_image ? [p.item_image] : []);
        const merged = [...new Set([...existing, ...(v.images || [])])].slice(0, 6);
        if (existing.length < 2 && merged.length >= 2) {
          report.imageBackfill.push({ id: p.id, label, images: merged });
        } else if (merged.length < 2) {
          report.stillSingleImage.push({ id: p.id, label });
        }
      }
    }
    done++;
    if (done % 25 === 0) console.log(`  …${done}/${products.length}`);
  });

  // Split `dead` by cause. The single "dead" count is misleading: on the first
  // full sweep (16 Jul 2026) it read 59, but only 29 were actually dead links.
  // These buckets need different actions, so don't collapse them:
  //   gone        — hard 404/410. Really gone.
  //   softGone    — page 200s but the final URL isn't a product page any more;
  //                 the store silently redirected to its homepage/a collection.
  //                 This was 20 of the 29 real dead links — the majority — and
  //                 an HTTP-status check alone would miss every one.
  //                 ~80% PRECISE, NOT 100%: on 16 Jul it flagged 25, of which 20
  //                 were really dead and 5 were live pages whose URL shape this
  //                 heuristic doesn't recognise (Pact, Finisterre, &Daughter,
  //                 Wrap London, BENI). So this is a TRIAGE list — confirm the
  //                 final URL before unpublishing. Never wire it to auto-act.
  //   imageBroken — the PAGE IS FINE, only the image failed to load. NOT a dead
  //                 link. Never unpublish these; fix the image.
  //   blocked     — 403. The store blocks scripted clients (Sézane, Todd Snyder).
  //                 Unverifiable here, needs a human with a browser.
  //   transient   — 5xx / timeout / fetch failure. Retry before believing it.
  const cat = (reason) => {
    if (/HTTP (404|410)/.test(reason)) return "gone";
    if (/not a product page/.test(reason)) return "softGone";
    if (/no working product image/.test(reason)) return "imageBroken";
    if (/HTTP 403/.test(reason)) return "blocked";
    return "transient";
  };
  report.deadByCause = { gone: [], softGone: [], imageBroken: [], blocked: [], transient: [] };
  for (const d of report.dead) report.deadByCause[cat(d.reason)].push(d);

  fs.writeFileSync("/tmp/audit_report.json", JSON.stringify(report, null, 2));

  const D = report.deadByCause;
  const actionable = D.gone.length + D.softGone.length;

  console.log("\n===== LIVE PRODUCT AUDIT =====");
  console.log(`Total live:            ${report.total}`);
  console.log(`In stock (US):         ${report.okInStock}`);
  console.log(`Stock unknown:         ${report.unknownStock}`);
  console.log(`SOLD OUT:              ${report.soldOut.length}`);
  console.log(`\n--- link health ---`);
  console.log(`DEAD, unpublish:       ${actionable}   (${D.gone.length} hard 404 + ${D.softGone.length} soft 404)`);
  console.log(`Image broken (page OK): ${D.imageBroken.length}   <- fix the image, do NOT unpublish`);
  console.log(`Blocked (403):         ${D.blocked.length}   <- needs a human w/ a browser`);
  console.log(`Transient:             ${D.transient.length}   <- retry next run`);
  console.log(`\nMissing materials:     ${report.missingMaterials.length}`);
  console.log(`Image backfill avail:  ${report.imageBackfill.length}`);
  console.log(`Still single image:    ${report.stillSingleImage.length}`);

  if (actionable) {
    console.log(`\n--- DEAD LINKS (${actionable}) ---`);
    for (const d of [...D.gone, ...D.softGone]) console.log(`  ${d.label}  [${d.reason}]`);
  }

  // Render the same thing into the GitHub Actions run summary when in CI, so the
  // weekly sweep is readable without opening an artifact.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [
      `## Toxome live-product sweep`,
      ``,
      `| | |`,
      `|---|---|`,
      `| Live products | ${report.total} |`,
      `| **Dead links (unpublish)** | **${actionable}** (${D.gone.length} hard + ${D.softGone.length} soft 404) |`,
      `| Image broken (page fine) | ${D.imageBroken.length} |`,
      `| Blocked 403 (needs a human) | ${D.blocked.length} |`,
      `| Transient (retry) | ${D.transient.length} |`,
      `| Sold out | ${report.soldOut.length} |`,
      `| Missing materials | ${report.missingMaterials.length} |`,
      ``,
      actionable
        ? `### Dead links\n${[...D.gone, ...D.softGone].map((d) => `- ${d.label} — \`${d.reason}\``).join("\n")}`
        : `No dead links. ✅`,
    ].join("\n");
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");
  }

  if (APPLY) {
    let n = 0;
    for (const b of report.imageBackfill) {
      const { error: e } = await supabase
        .from("products")
        .update({ images: b.images })
        .eq("id", b.id);
      if (!e) n++;
    }
    console.log(`\nApplied: backfilled images on ${n} products (primary unchanged).`);
  }
  console.log("\nFull report → /tmp/audit_report.json");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
