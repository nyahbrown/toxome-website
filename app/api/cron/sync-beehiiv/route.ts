import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { subscribeToBeehiiv, beehiivConfigured } from "@/lib/beehiiv.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Nightly safety net: the newsletter route already pushes new signups to
// beehiiv on the spot (best-effort), but if beehiiv ever hiccups at signup
// time, this reconciles Supabase `newsletter_signups` (source of truth) →
// beehiiv so nobody is ever permanently lost. Safe to re-run: beehiiv dedupes
// by email, and we send no welcome email / no reactivation here — these
// people already have a Supabase row, most already made it to beehiiv on
// their first try. CRON_SECRET gates the endpoint (set in Vercel + vercel.json).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!beehiivConfigured()) {
    return NextResponse.json({ ok: false, error: "beehiiv not configured" }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from("newsletter_signups")
    .select("email, source");
  if (error) {
    return NextResponse.json({ ok: false, error: `Supabase read failed: ${error.message}` }, { status: 500 });
  }

  const emails = [...new Set((data ?? []).map((r) => r.email?.trim().toLowerCase()).filter(Boolean))] as string[];

  let ok = 0;
  let failed = 0;
  for (const email of emails) {
    const result = await subscribeToBeehiiv(email, {
      source: "cron_reconcile",
      sendWelcomeEmail: false,
      reactivateExisting: false,
    });
    if (result.ok) {
      ok++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, checked: emails.length, synced: ok, failed });
}
