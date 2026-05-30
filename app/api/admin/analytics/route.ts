import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Full brand-traffic dashboard in one round-trip: KPIs (+ previous period for
// deltas), daily trend, top brands, top products, and top searches.
// ?days=7|30|90  (omit or days=all → all time)
export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = new URL(req.url).searchParams.get("days");
  const parsed = daysParam === "all" || daysParam === null ? null : Number(daysParam);
  const p_days = Number.isFinite(parsed as number) ? parsed : null;

  const { data, error } = await supabaseAdmin.rpc("get_brand_dashboard", { p_days });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The function already returns the full shaped object as jsonb.
  return NextResponse.json(data);
}
