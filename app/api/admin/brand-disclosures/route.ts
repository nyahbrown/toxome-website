import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "brand-disclosures";
const SIGN_TTL = 60 * 60; // 1 hour

type DisclosureRow = {
  id: string;
  product_id: string | null;
  brand_name: string;
  product_name: string | null;
  product_url: string | null;
  contact_email: string;
  claims: string[] | null;
  message: string | null;
  document_paths: string[] | null;
  status: string;
  resolved_rung: string | null;
  admin_notes: string | null;
  created_at: string;
};

// GET /api/admin/brand-disclosures
// Lists pending disclosures (newest first) with signed URLs for each document.
export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("brand_disclosures")
    .select(
      "id, product_id, brand_name, product_name, product_url, contact_email, claims, message, document_paths, status, resolved_rung, admin_notes, created_at"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as DisclosureRow[];

  // Generate signed URLs for every document so the admin can open private files.
  const disclosures = await Promise.all(
    rows.map(async (row) => {
      const paths = row.document_paths ?? [];
      const documents = await Promise.all(
        paths.map(async (path) => {
          const { data: signed } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(path, SIGN_TTL);
          const name = path.split("/").pop() ?? path;
          return { name, url: signed?.signedUrl ?? null };
        })
      );
      return { ...row, documents };
    })
  );

  return NextResponse.json({ disclosures });
}

// POST /api/admin/brand-disclosures
// Body: { id: string, action: 'approve' | 'reject', rung?: string, admin_notes?: string }
// Approve sets status/resolved_rung/reviewed_at, and if product_id is set,
// updates that product's verification_rung to the chosen rung.
export async function POST(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    id?: string;
    action?: string;
    rung?: string;
    admin_notes?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, action, rung, admin_notes } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  const notes = typeof admin_notes === "string" && admin_notes.trim() ? admin_notes.trim() : null;

  if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("brand_disclosures")
      .update({ status: "rejected", reviewed_at: nowIso, admin_notes: notes })
      .eq("id", id)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "rejected", id });
  }

  // approve — requires a valid rung.
  if (rung !== "self_disclosed" && rung !== "verified") {
    return NextResponse.json(
      { error: "rung must be 'self_disclosed' or 'verified'" },
      { status: 400 }
    );
  }

  // Fetch the row first so we know whether a product is linked.
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("brand_disclosures")
    .select("id, product_id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Disclosure not found" }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("brand_disclosures")
    .update({
      status: "approved",
      resolved_rung: rung,
      reviewed_at: nowIso,
      admin_notes: notes,
    })
    .eq("id", id)
    .eq("status", "pending");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const productId = existing.product_id as string | null;
  let appliedToProduct = false;

  if (productId) {
    const { error: prodError } = await supabaseAdmin
      .from("products")
      .update({ verification_rung: rung })
      .eq("id", productId);
    if (prodError) {
      return NextResponse.json({ error: prodError.message }, { status: 500 });
    }
    appliedToProduct = true;
  }

  return NextResponse.json({
    ok: true,
    action: "approved",
    id,
    rung,
    appliedToProduct,
    // Hint for the admin UI when no product is linked.
    note: appliedToProduct
      ? null
      : "No product linked. Set this product's verification rung manually.",
  });
}
