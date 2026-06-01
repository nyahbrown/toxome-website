import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const head = () =>
    supabaseAdmin.from("products").select("*", { count: "exact", head: true });

  const [liveR, pendingR, rejectedR, removedR, totalR] = await Promise.all([
    head().eq("published", true),
    head()
      .eq("published", false)
      .eq("rejected", false)
      .is("unpublish_reason", null),
    head().eq("rejected", true),
    head().eq("published", false).not("unpublish_reason", "is", null),
    head(),
  ]);

  return NextResponse.json({
    live: liveR.count ?? 0,
    pending: pendingR.count ?? 0,
    rejected: rejectedR.count ?? 0,
    removed: removedR.count ?? 0,
    total: totalR.count ?? 0,
  });
}
