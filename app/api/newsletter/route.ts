import { createClient } from "@supabase/supabase-js";

// Server-side newsletter subscribe. Does two things on every signup:
//   1. Writes the email to Supabase `newsletter_signups` (our own copy of the list).
//   2. Pushes the subscriber to beehiiv (the sending engine).
// The beehiiv API key is read server-side only and never reaches the browser.
// If beehiiv isn't configured yet, we still capture to Supabase so the site
// keeps working, the signup is never lost.

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Service-role client bypasses RLS for the insert. Lazily created so a missing
// env var surfaces as a clear server error rather than a module-load crash.
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function addToBeehiiv(email: string, source: string): Promise<boolean> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  // Not configured yet, skip silently so Supabase capture still succeeds.
  if (!apiKey || !pubId) return false;

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: source,
          referring_site: "toxome.app",
        }),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`beehiiv subscribe failed (${res.status}): ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("beehiiv subscribe error:", err);
    return false;
  }
}

export async function POST(request: Request) {
  let body: { email?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body.source === "string" ? body.source : "website";

  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { ok: false, error: "Please enter a valid email." },
      { status: 400 }
    );
  }

  // Capture to Supabase (our own list). Duplicate is fine, already on the list.
  let supabaseOk = false;
  const db = supabaseAdmin();
  if (db) {
    const { error } = await db.from("newsletter_signups").insert({ email, source });
    if (!error || error.code === "23505") {
      supabaseOk = true;
    } else {
      console.error("Supabase newsletter insert error:", error.message);
    }
  }

  // Push to the sending engine.
  const beehiivOk = await addToBeehiiv(email, source);

  // Succeed if either side accepted the email, we don't want a beehiiv hiccup
  // to show the user an error after we've already saved them, and vice versa.
  if (supabaseOk || beehiivOk) {
    return Response.json({ ok: true });
  }
  return Response.json(
    { ok: false, error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
