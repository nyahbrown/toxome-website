import { NextResponse } from "next/server";
import { revalidateProductSurfaces } from "@/lib/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Requires REVALIDATE_SECRET to be set in the environment AND a deploy created
 * after it was set — env vars only take effect on deployments built afterward.
 *
 * On-demand revalidation hook for product writes that DON'T go through the admin
 * API — backfill scripts, the app, or direct Supabase edits. Point a Supabase
 * Database Webhook (products table; insert/update/delete) at this route with the
 * shared secret and any catalog change flushes the relevant pages immediately.
 *
 * Auth: send the secret as `Authorization: Bearer <secret>`, an
 * `x-revalidate-secret` header, or a `?secret=` query param. Set REVALIDATE_SECRET
 * in the environment; if it is unset the route refuses every call (safe default).
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  const provided =
    req.headers.get("x-revalidate-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";
  return provided === secret;
}

type ProductRow = { id?: string; brand?: string | null } & Record<string, unknown>;

type SupabaseWebhookPayload = {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  record?: ProductRow | null;
  old_record?: ProductRow | null;
  id?: string;
};

/**
 * Columns that never change what a product surface renders. An UPDATE that only
 * touches these (e.g. a re-scrape stamping `updated_at`, an internal re-review)
 * shouldn't flush any cache — that no-op fan-out was the main ISR-write drain.
 * Everything NOT in this set is treated as shopper-visible, so new columns fail
 * safe (they trigger a flush) rather than silently going stale.
 */
const NON_RENDERING_COLUMNS = new Set([
  "id",
  "created_at",
  "updated_at",
  "reviewed_at",
  "added_by",
  "unpublish_reason",
  "commission_rate",
]);

/**
 * True if an UPDATE changed at least one shopper-visible column. INSERT / DELETE
 * (no `old_record` to diff against) always count as meaningful.
 */
function isMeaningfulChange(payload: SupabaseWebhookPayload): boolean {
  if (payload.type !== "UPDATE") return true;
  const { record, old_record } = payload;
  if (!record || !old_record) return true; // can't diff — fail safe, flush.
  for (const key of new Set([...Object.keys(record), ...Object.keys(old_record)])) {
    if (NON_RENDERING_COLUMNS.has(key)) continue;
    if (JSON.stringify(record[key]) !== JSON.stringify(old_record[key])) return true;
  }
  return false;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SupabaseWebhookPayload = {};
  try {
    body = await req.json();
  } catch {
    // No / invalid body is fine — fall back to a full catalog flush.
  }

  const id = body.id ?? body.record?.id ?? body.old_record?.id ?? undefined;

  // Skip no-op updates (e.g. a re-scrape that only bumped updated_at). These
  // used to flush the whole catalog for a change no shopper would ever see.
  if (!isMeaningfulChange(body)) {
    return NextResponse.json({ revalidated: false, skipped: "no-op", id: id ?? null });
  }

  const brand = body.record?.brand ?? body.old_record?.brand ?? undefined;
  revalidateProductSurfaces(id, brand);

  return NextResponse.json({ revalidated: true, id: id ?? null });
}
