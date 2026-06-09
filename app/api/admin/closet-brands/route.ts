import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/closet-brands
// Query params:
//   ?days=N  — window to last N days (omit for all-time)
//
// Response shape:
// {
//   brands: Array<{
//     brand_name: string;
//     brand_normalized: string;
//     item_count: number;
//     closet_count: number;   // distinct hashed_uid
//     avg_score: number | null;
//     top_category: string | null;
//   }>;
//   totals: {
//     total_items: number;
//     total_closets: number;
//     avg_score: number | null;
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

  let query = supabaseAdmin
    .from("closet_brands")
    .select("brand_name, brand_normalized, category, clean_score, hashed_uid, saved_at")
    .limit(50000);

  if (days && days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("saved_at", since);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];

  // Aggregate in JS — volume is low enough that this is fine.
  type BrandAgg = {
    brand_name: string;
    brand_normalized: string;
    item_count: number;
    uids: Set<string>;
    scores: number[];
    categories: Map<string, number>;
  };

  const map = new Map<string, BrandAgg>();

  for (const row of rows) {
    const key = (row.brand_normalized as string) || (row.brand_name as string) || "";
    if (!key) continue;

    let agg = map.get(key);
    if (!agg) {
      agg = {
        brand_name: (row.brand_name as string) ?? key,
        brand_normalized: key,
        item_count: 0,
        uids: new Set<string>(),
        scores: [],
        categories: new Map<string, number>(),
      };
      map.set(key, agg);
    }

    agg.item_count += 1;

    const uid = row.hashed_uid as string | null;
    if (uid) agg.uids.add(uid);

    const score = row.clean_score as number | null;
    if (score != null) agg.scores.push(score);

    const cat = row.category as string | null;
    if (cat) agg.categories.set(cat, (agg.categories.get(cat) ?? 0) + 1);
  }

  const brands = [...map.values()]
    .map((agg) => {
      const avg_score =
        agg.scores.length > 0
          ? Math.round(
              (agg.scores.reduce((s, n) => s + n, 0) / agg.scores.length) * 10
            ) / 10
          : null;

      let top_category: string | null = null;
      let topCount = 0;
      for (const [cat, cnt] of agg.categories) {
        if (cnt > topCount) {
          topCount = cnt;
          top_category = cat;
        }
      }

      return {
        brand_name: agg.brand_name,
        brand_normalized: agg.brand_normalized,
        item_count: agg.item_count,
        closet_count: agg.uids.size,
        avg_score,
        top_category,
      };
    })
    .sort((a, b) => b.closet_count - a.closet_count || b.item_count - a.item_count);

  // Totals row.
  const allUids = new Set(rows.map((r) => r.hashed_uid as string).filter(Boolean));
  const allScores = rows
    .map((r) => r.clean_score as number | null)
    .filter((s): s is number => s != null);
  const overall_avg =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce((s, n) => s + n, 0) / allScores.length) * 10
        ) / 10
      : null;

  return NextResponse.json({
    brands,
    totals: {
      total_items: rows.length,
      total_closets: allUids.size,
      avg_score: overall_avg,
    },
  });
}
