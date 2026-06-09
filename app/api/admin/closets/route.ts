import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fibers classified as synthetic. Everything else → natural/semi.
const SYNTHETIC_FIBERS = new Set([
  "polyester",
  "recycled polyester",
  "nylon",
  "recycled nylon",
  "acrylic",
  "elastane",
  "spandex",
  "polyurethane",
  "pu",
  "lycra",
  "polypropylene",
  "modacrylic",
]);

function isSynthetic(fiber: string): boolean {
  const f = fiber.toLowerCase().trim();
  // Match prefix (e.g. "recycled polyester" → still synthetic).
  for (const s of SYNTHETIC_FIBERS) {
    if (f === s || f.startsWith(s) || f.includes(s)) return true;
  }
  return false;
}

// Category alias map — keys must be lowercased.
// Normalises translated category names into English title-case equivalents.
const CATEGORY_ALIASES: Record<string, string> = {
  // Bottoms
  unterteile: "Bottoms",
  bas: "Bottoms",
  "parte inferior": "Bottoms",
  // Sweaters
  pullover: "Sweaters",
  suéteres: "Sweaters",
  sueteres: "Sweaters",
  pull: "Sweaters",
  chandails: "Sweaters",
  jersey: "Sweaters",
  jerséis: "Sweaters",
  // Tops
  hauts: "Tops",
  oberteile: "Tops",
  "partes superiores": "Tops",
  // Dresses
  robes: "Dresses",
  robe: "Dresses",
  kleider: "Dresses",
  vestidos: "Dresses",
  vestido: "Dresses",
  // Outerwear
  vestes: "Outerwear",
  manteaux: "Outerwear",
  oberbekleidung: "Outerwear",
  abrigos: "Outerwear",
};

function normalizeCategory(raw: string | null): string | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return CATEGORY_ALIASES[key] ?? raw;
}

// GET /api/admin/closets
// Query params:
//   ?days=N        — restrict to last N days (omit for all-time)
//   ?brands=all    — return ALL brands in topBrands (no cap); other data still included
//
// Response shape:
// {
//   totals: { total_items, total_closets, avg_score, avg_synthetic_pct };
//   scoreBands: { good, okay, bad };          // ≥68 / 40-67 / <40
//   topBrands: Array<{ brand, closets, items, avg_score, top_category }>;
//   categories: Array<{ category, items, avg_score }>;
//   byCountry: Array<{ country, closets, items }>;
//   composition: { avg_synthetic_pct };
//   scans: {
//     total,
//     bySource: { app_camera, app_barcode, app_url, extension },
//     topScannedBrands: Array<{ brand, scans }>,
//   };
// }
export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : null;
  const allBrands = searchParams.get("brands") === "all";

  const since =
    days && days > 0
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      : null;

  // ---- Fetch closet_brands ------------------------------------------------

  let closetQuery = supabaseAdmin
    .from("closet_brands")
    .select(
      "brand_name, brand_normalized, category, clean_score, hazard_level, composition, country, hashed_uid, saved_at"
    )
    .limit(50000);

  if (since) closetQuery = closetQuery.gte("saved_at", since);

  const { data: closetRows, error: closetErr } = await closetQuery;
  if (closetErr) {
    return NextResponse.json({ error: closetErr.message }, { status: 500 });
  }

  const rows = closetRows ?? [];

  // ---- Aggregate closet_brands in JS --------------------------------------

  type BrandAgg = {
    brand: string;
    uids: Set<string>;
    items: number;
    scores: number[];
    categories: Map<string, number>;
  };

  const brandMap = new Map<string, BrandAgg>();
  const catMap = new Map<string, { items: number; scores: number[] }>();
  const countryMap = new Map<string, { uids: Set<string>; items: number }>();
  const allUids = new Set<string>();
  const allScores: number[] = [];
  let scoreBandGood = 0;
  let scoreBandOkay = 0;
  let scoreBandBad = 0;
  const syntheticPcts: number[] = [];

  for (const row of rows) {
    const key =
      (row.brand_normalized as string) || (row.brand_name as string) || "";
    if (!key) continue;

    // ---- Brand map
    let ba = brandMap.get(key);
    if (!ba) {
      ba = {
        brand: (row.brand_name as string) ?? key,
        uids: new Set<string>(),
        items: 0,
        scores: [],
        categories: new Map<string, number>(),
      };
      brandMap.set(key, ba);
    }
    ba.items += 1;
    const uid = row.hashed_uid as string | null;
    if (uid) {
      ba.uids.add(uid);
      allUids.add(uid);
    }
    const score = row.clean_score as number | null;
    if (score != null) {
      ba.scores.push(score);
      allScores.push(score);
      if (score >= 68) scoreBandGood += 1;
      else if (score >= 40) scoreBandOkay += 1;
      else scoreBandBad += 1;
    }
    const cat = normalizeCategory(row.category as string | null);
    if (cat) {
      ba.categories.set(cat, (ba.categories.get(cat) ?? 0) + 1);
      let ca = catMap.get(cat);
      if (!ca) { ca = { items: 0, scores: [] }; catMap.set(cat, ca); }
      ca.items += 1;
      if (score != null) ca.scores.push(score);
    }

    // ---- Country map
    const country = (row.country as string | null) ?? "Unknown";
    let co = countryMap.get(country);
    if (!co) { co = { uids: new Set<string>(), items: 0 }; countryMap.set(country, co); }
    co.items += 1;
    if (uid) co.uids.add(uid);

    // ---- Composition — synthetic %
    const comp = row.composition as Record<string, number> | null;
    if (comp && typeof comp === "object") {
      let synPct = 0;
      let totalPct = 0;
      for (const [fiber, pct] of Object.entries(comp)) {
        const p = Number(pct);
        if (!isNaN(p)) {
          totalPct += p;
          if (isSynthetic(fiber)) synPct += p;
        }
      }
      if (totalPct > 0) syntheticPcts.push((synPct / totalPct) * 100);
    }
  }

  const avg_score =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce((s, n) => s + n, 0) / allScores.length) * 10
        ) / 10
      : null;

  const avg_synthetic_pct =
    syntheticPcts.length > 0
      ? Math.round(
          (syntheticPcts.reduce((s, n) => s + n, 0) / syntheticPcts.length) * 10
        ) / 10
      : null;

  // topBrands — sorted by distinct closets desc, then items desc.
  // Default: top 40. When ?brands=all is set, return the full list.
  const allBrandsSorted = [...brandMap.values()]
    .map((ba) => {
      const ba_avg =
        ba.scores.length > 0
          ? Math.round(
              (ba.scores.reduce((s, n) => s + n, 0) / ba.scores.length) * 10
            ) / 10
          : null;
      let top_category: string | null = null;
      let topCnt = 0;
      for (const [c, cnt] of ba.categories) {
        if (cnt > topCnt) { topCnt = cnt; top_category = c; }
      }
      return {
        brand: ba.brand,
        closets: ba.uids.size,
        items: ba.items,
        avg_score: ba_avg,
        top_category,
      };
    })
    .sort((a, b) => b.closets - a.closets || b.items - a.items);

  const topBrands = allBrands ? allBrandsSorted : allBrandsSorted.slice(0, 40);

  // categories
  const categories = [...catMap.entries()]
    .map(([category, ca]) => ({
      category,
      items: ca.items,
      avg_score:
        ca.scores.length > 0
          ? Math.round(
              (ca.scores.reduce((s, n) => s + n, 0) / ca.scores.length) * 10
            ) / 10
          : null,
    }))
    .sort((a, b) => b.items - a.items);

  // byCountry
  const byCountry = [...countryMap.entries()]
    .map(([country, co]) => ({ country, closets: co.uids.size, items: co.items }))
    .sort((a, b) => b.items - a.items);

  // ---- Fetch scan_events --------------------------------------------------

  let scanQuery = supabaseAdmin
    .from("scan_events")
    .select("source, brand_name, brand_normalized, scanned_at")
    .limit(50000);

  if (since) scanQuery = scanQuery.gte("scanned_at", since);

  const { data: scanRows, error: scanErr } = await scanQuery;
  if (scanErr) {
    return NextResponse.json({ error: scanErr.message }, { status: 500 });
  }

  const sRows = scanRows ?? [];

  const bySource: Record<string, number> = {
    app_camera: 0,
    app_barcode: 0,
    app_url: 0,
    extension: 0,
  };
  const scannedBrandMap = new Map<string, number>();

  for (const sr of sRows) {
    const src = (sr.source as string) ?? "";
    if (src in bySource) bySource[src] += 1;

    const bn =
      (sr.brand_normalized as string) || (sr.brand_name as string) || "";
    if (bn) scannedBrandMap.set(bn, (scannedBrandMap.get(bn) ?? 0) + 1);
  }

  const topScannedBrands = [...scannedBrandMap.entries()]
    .map(([brand, scans]) => ({ brand, scans }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 20);

  return NextResponse.json({
    totals: {
      total_items: rows.length,
      total_closets: allUids.size,
      avg_score,
      avg_synthetic_pct,
    },
    scoreBands: { good: scoreBandGood, okay: scoreBandOkay, bad: scoreBandBad },
    topBrands,
    categories,
    byCountry,
    composition: { avg_synthetic_pct },
    scans: {
      total: sRows.length,
      bySource,
      topScannedBrands,
    },
  });
}
