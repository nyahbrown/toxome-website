import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 500;

type Status = "pending" | "live" | "rejected" | "removed" | "all";

export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") as Status) || "all";
  const q = searchParams.get("q")?.trim() || "";
  const brand = searchParams.get("brand")?.trim() || "";

  let query = supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  // Status model — derived in the query, no extra columns.
  switch (status) {
    case "pending":
      query = query
        .eq("published", false)
        .eq("rejected", false)
        .is("unpublish_reason", null);
      break;
    case "live":
      query = query.eq("published", true);
      break;
    case "rejected":
      query = query.eq("rejected", true);
      break;
    case "removed":
      query = query.eq("published", false).not("unpublish_reason", "is", null);
      break;
    case "all":
    default:
      break;
  }

  if (brand) {
    query = query.eq("brand", brand);
  }

  if (q) {
    // Case-insensitive match on item_name OR brand.
    const safe = q.replace(/[%,]/g, " ");
    query = query.or(`item_name.ilike.%${safe}%,brand.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
}
