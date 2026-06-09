import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Normalize a brand name the same way the DB helper does:
// lowercase → collapse non-alphanumeric runs to single space → trim.
function normalizeBrand(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// GET /api/admin/brand-submissions
// Returns pending submissions grouped by normalized name with a count, the
// latest raw_name seen, a sample scan_category, and the earliest created_at.
export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("brand_submissions")
    .select("id, raw_name, normalized, scan_category, scan_score, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by normalized, keeping the latest raw_name + sample category.
  const grouped = new Map<
    string,
    {
      normalized: string;
      raw_name: string;
      count: number;
      scan_category: string | null;
      latest_at: string;
    }
  >();

  for (const row of data ?? []) {
    const key = row.normalized ?? normalizeBrand(row.raw_name ?? "");
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        normalized: key,
        raw_name: row.raw_name ?? key,
        count: 1,
        scan_category: row.scan_category ?? null,
        latest_at: row.created_at ?? "",
      });
    } else {
      existing.count += 1;
      // Keep the most recent raw_name (rows are already ordered newest-first).
      if (!existing.raw_name && row.raw_name) existing.raw_name = row.raw_name;
      if (!existing.scan_category && row.scan_category)
        existing.scan_category = row.scan_category;
    }
  }

  const submissions = [...grouped.values()].sort((a, b) => b.count - a.count);
  return NextResponse.json({ submissions });
}

// POST /api/admin/brand-submissions
// Body: { action: 'approve' | 'reject', normalized: string, name: string }
export async function POST(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; normalized?: string; name?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, normalized, name } = body;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }
  if (!normalized || typeof normalized !== "string") {
    return NextResponse.json({ error: "normalized is required" }, { status: 400 });
  }

  if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("brand_submissions")
      .update({ status: "rejected" })
      .eq("normalized", normalized)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "rejected", normalized });
  }

  // approve: upsert into brands, then stamp all matching pending submissions.
  const brandName = name || normalized;

  // Check whether a brands row already exists for this normalized key.
  const { data: existing } = await supabaseAdmin
    .from("brands")
    .select("id, aliases")
    .eq("normalized", normalized)
    .maybeSingle();

  let brandId: string | null = null;

  if (existing) {
    brandId = existing.id as string;
    // Optionally push any new raw variants into aliases (deduped).
    const { data: pendingRows } = await supabaseAdmin
      .from("brand_submissions")
      .select("raw_name")
      .eq("normalized", normalized)
      .eq("status", "pending");

    const currentAliases: string[] = (existing.aliases as string[]) ?? [];
    const newRaws = (pendingRows ?? [])
      .map((r) => (r.raw_name as string) ?? "")
      .filter((r) => r && r !== brandName && !currentAliases.includes(r));

    if (newRaws.length > 0) {
      await supabaseAdmin
        .from("brands")
        .update({ aliases: [...currentAliases, ...newRaws] })
        .eq("id", brandId);
    }
  } else {
    // Insert new brand row.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("brands")
      .insert({ name: brandName, normalized, status: "active" })
      .select("id")
      .single();

    if (insertError) {
      // Could be a race-condition conflict — try to fetch instead.
      const { data: fallback } = await supabaseAdmin
        .from("brands")
        .select("id")
        .eq("normalized", normalized)
        .maybeSingle();
      brandId = (fallback?.id as string) ?? null;
    } else {
      brandId = inserted.id as string;
    }
  }

  // Mark all pending submissions for this normalized name as approved.
  const updatePayload: Record<string, unknown> = { status: "approved" };
  if (brandId) updatePayload.merged_brand_id = brandId;

  const { error: stampError } = await supabaseAdmin
    .from("brand_submissions")
    .update(updatePayload)
    .eq("normalized", normalized)
    .eq("status", "pending");

  if (stampError) {
    return NextResponse.json({ error: stampError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: "approved", normalized, brand_id: brandId });
}
