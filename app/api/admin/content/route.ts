import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pushToScheduler, schedulerConfigured } from "@/lib/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 500;
const TABLE = "content_drafts";

const STATUSES = ["draft", "needs_edit", "approved", "scheduled"] as const;
type Status = (typeof STATUSES)[number];

// GET — list drafts (optionally filtered by status). Returns scheduler config so
// the UI can show whether approve will auto-push or just mark approved.
export async function GET(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (status && (STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ drafts: data ?? [], schedulerConfigured: schedulerConfigured() });
}

// POST — create one or more drafts. Accepts a single object or an array (used by
// the /toxome-distribute generator to drop a whole platform group in at once).
export async function POST(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = Array.isArray(payload) ? payload : [payload];
  const clean = rows.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return {
      group_id: typeof o.group_id === "string" ? o.group_id : undefined,
      source_type: str(o.source_type) || "manual",
      source_ref: str(o.source_ref) || null,
      platform: str(o.platform) || "instagram",
      variant_type: str(o.variant_type) || "post",
      title: str(o.title) || null,
      body: str(o.body) || "",
      media_url: str(o.media_url) || null,
      media_type: str(o.media_type) || null,
      comment: str(o.comment) || null,
      status: "draft" as Status,
    };
  });

  const { data, error } = await supabaseAdmin.from(TABLE).insert(clean).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] }, { status: 201 });
}

// PATCH — edit copy / comment / status for one draft. When status moves to
// "approved" and a scheduler is configured, push the post and flip to "scheduled".
export async function PATCH(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = str(payload.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if ("body" in payload) updates.body = str(payload.body) ?? "";
  if ("title" in payload) updates.title = str(payload.title) || null;
  if ("comment" in payload) updates.comment = str(payload.comment) || null;
  if ("media_url" in payload) updates.media_url = str(payload.media_url) || null;

  let requestedStatus: Status | null = null;
  if ("status" in payload) {
    const s = str(payload.status);
    if (!s || !(STATUSES as readonly string[]).includes(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    requestedStatus = s as Status;
    updates.status = requestedStatus;
  }

  // Apply the field/status update first.
  const { data: updated, error } = await supabaseAdmin
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // On approval, try to push to the scheduler (if one is wired up).
  if (requestedStatus === "approved" && updated) {
    const result = await pushToScheduler({
      id: updated.id,
      platform: updated.platform,
      body: updated.body,
      title: updated.title,
      media_url: updated.media_url,
    });

    if (result.ok) {
      const { data: scheduled } = await supabaseAdmin
        .from(TABLE)
        .update({ status: "scheduled", external_id: result.externalId, push_error: null, scheduled_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      return NextResponse.json({ draft: scheduled ?? updated, pushed: true });
    }

    if (result.configured) {
      // Scheduler is set up but the push failed — keep it approved, surface the error.
      const { data: withErr } = await supabaseAdmin
        .from(TABLE)
        .update({ push_error: result.error })
        .eq("id", id)
        .select("*")
        .single();
      return NextResponse.json({ draft: withErr ?? updated, pushed: false, pushError: result.error });
    }
    // No scheduler configured — approve-only mode. Nothing more to do.
  }

  return NextResponse.json({ draft: updated });
}

// DELETE — remove a draft by ?id=
export async function DELETE(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v == null) return null;
  return String(v);
}
