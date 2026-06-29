import { NextResponse } from "next/server";
import { revalidateProductSurfaces } from "@/lib/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
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

type SupabaseWebhookPayload = {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  record?: { id?: string } | null;
  old_record?: { id?: string } | null;
  id?: string;
};

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
  revalidateProductSurfaces(id);

  return NextResponse.json({ revalidated: true, id: id ?? null });
}
