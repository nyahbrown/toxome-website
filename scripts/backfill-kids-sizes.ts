#!/usr/bin/env node
/**
 * One-time backfill: populate products.sizes for kids products by reading the
 * size variants from each product's Shopify JSON ({item_url}.json).
 *
 * Usage:
 *   node --env-file=.env.local --import tsx scripts/backfill-kids-sizes.ts [--dry-run] [--limit=N]
 *
 * Env required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Safe to re-run — it overwrites products.sizes from source each time.
 */

import { createClient } from "@supabase/supabase-js";
import { cleanSizes, sizesToBands } from "../lib/kidsSizes";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const LIMIT = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || 0);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run: node --env-file=.env.local --import tsx scripts/backfill-kids-sizes.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type Row = { id: string; item_name: string; brand: string; item_url: string | null };

/** Build the Shopify product JSON URL from a product page URL. */
function jsonUrl(itemUrl: string): string | null {
  try {
    const u = new URL(itemUrl);
    u.search = "";
    u.hash = "";
    u.pathname = u.pathname.replace(/\/+$/, "");
    if (!/\/products\//.test(u.pathname)) return null;
    return `${u.origin}${u.pathname}.json`;
  } catch {
    return null;
  }
}

/** Pull distinct size labels from a Shopify product JSON payload. */
function extractSizes(payload: unknown): string[] {
  const product = (payload as { product?: Record<string, unknown> })?.product;
  if (!product) return [];

  const options = (product.options as { name?: string; values?: string[] }[]) || [];
  const sizeOpt = options.find((o) => /\bsize\b/i.test(o?.name || ""));
  if (sizeOpt?.values?.length) return cleanSizes(sizeOpt.values);

  // Fallback: derive from variants if there's a size-named option position.
  const pos = options.findIndex((o) => /\bsize\b/i.test(o?.name || ""));
  if (pos >= 0) {
    const key = `option${pos + 1}` as const;
    const variants = (product.variants as Record<string, unknown>[]) || [];
    return cleanSizes(variants.map((v) => v[key] as string));
  }
  return [];
}

async function fetchSizes(itemUrl: string): Promise<{ sizes: string[]; note: string }> {
  const url = jsonUrl(itemUrl);
  if (!url) return { sizes: [], note: "not-a-product-url" };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { sizes: [], note: `http-${res.status}` };
    const ct = res.headers.get("content-type") || "";
    if (!/json/i.test(ct)) return { sizes: [], note: "not-json" };
    const payload = await res.json();
    return { sizes: extractSizes(payload), note: "ok" };
  } catch (e) {
    return { sizes: [], note: `err:${(e as Error).message.slice(0, 40)}` };
  }
}

async function main() {
  if (DRY_RUN) console.log("[dry-run] No writes.\n");

  let q = supabase
    .from("products")
    .select("id, item_name, brand, item_url")
    .eq("gender", "Kids")
    .order("brand");
  if (LIMIT) q = q.limit(LIMIT);
  const { data, error } = await q;
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  const rows = (data as Row[]) || [];
  console.log(`Kids products: ${rows.length}\n`);

  let withSizes = 0;
  let failed = 0;
  const unmapped = new Map<string, number>(); // sizes that produced no band
  const failures: string[] = [];

  for (const r of rows) {
    if (!r.item_url) {
      failed++;
      failures.push(`${r.brand} | ${r.item_name} | no-url`);
      continue;
    }
    const { sizes, note } = await fetchSizes(r.item_url);
    const bands = sizesToBands(sizes);

    if (note !== "ok") {
      failed++;
      failures.push(`${r.brand} | ${r.item_name} | ${note}`);
    } else if (sizes.length) {
      withSizes++;
      // Flag any size that contributes to no band (one-size aside) for QA.
      for (const s of sizes) {
        if (sizesToBands([s]).length === 0 && !/^(one ?size|o\/?s|osfa|os)$/i.test(s.trim()))
          unmapped.set(s, (unmapped.get(s) ?? 0) + 1);
      }
    }

    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from("products")
        .update({ sizes })
        .eq("id", r.id);
      if (upErr) console.error(`  update ${r.id}: ${upErr.message}`);
    }

    console.log(
      `${note === "ok" ? "✓" : "✗"} ${r.brand.padEnd(18)} ${r.item_name.slice(0, 42).padEnd(42)} [${sizes.join(", ")}] → ${bands.join("/") || "—"}`
    );
    await new Promise((res) => setTimeout(res, 250)); // be polite to source stores
  }

  console.log(`\n── Summary ──`);
  console.log(`  with sizes: ${withSizes}`);
  console.log(`  no sizes / failed: ${failed}`);
  if (failures.length) {
    console.log(`\n  Needs manual sizes:`);
    for (const f of failures) console.log(`    - ${f}`);
  }
  if (unmapped.size) {
    console.log(`\n  ⚠️ Sizes that mapped to NO age band (fix the normalizer or check source):`);
    for (const [s, n] of [...unmapped.entries()].sort((a, b) => b[1] - a[1]))
      console.log(`    - "${s}" ×${n}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
