import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-brand outbound-click report for the admin "Brand traffic" panel.
// ?days=7|30|90  (omit or days=all → all time)
export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = new URL(req.url).searchParams.get("days");
  const p_days =
    daysParam === "all" || daysParam === null ? null : Number(daysParam);

  const { data, error } = await supabaseAdmin.rpc("get_brand_report", {
    p_days: Number.isFinite(p_days as number) ? p_days : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  // Totals across all brands, so the header can show the headline number.
  const totals = rows.reduce(
    (acc: { clicks: number; shoppers: number }, r: { clicks: number; unique_shoppers: number }) => {
      acc.clicks += Number(r.clicks);
      acc.shoppers += Number(r.unique_shoppers);
      return acc;
    },
    { clicks: 0, shoppers: 0 }
  );

  return NextResponse.json({ rows, totals, brandCount: rows.length });
}
