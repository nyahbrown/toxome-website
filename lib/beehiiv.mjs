// Single source of truth for subscribing an email to beehiiv (the sending
// engine). Imported by the newsletter API route, the nightly reconcile cron,
// and the one-time backfill script so there is exactly ONE beehiiv call shape.
//
// beehiiv dedupes by email, so calling this repeatedly is safe (idempotent).
// Env vars (server-side only, never exposed to the browser):
//   BEEHIIV_API_KEY        — Authorization: Bearer <key>
//   BEEHIIV_PUBLICATION_ID — pub_XXXX

const beehiivEndpoint = (pubId) =>
  `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`;

/**
 * Subscribe (or reactivate) an email in beehiiv. Best-effort: returns a result
 * object and never throws, so a beehiiv outage can never break the caller.
 *
 * @param {string} email
 * @param {object} [opts]
 * @param {string} [opts.source="website"]     utm_source tag for attribution
 * @param {boolean} [opts.sendWelcomeEmail=true]   send beehiiv's welcome email
 * @param {boolean} [opts.reactivateExisting=true] re-subscribe if unsubscribed
 * @returns {Promise<{ ok: boolean, configured: boolean, status?: number, error?: string }>}
 */
export async function subscribeToBeehiiv(email, opts = {}) {
  const {
    source = "website",
    sendWelcomeEmail = true,
    reactivateExisting = true,
  } = opts;

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  // Not configured yet — skip silently so the caller (e.g. Supabase capture)
  // still succeeds. The signup is never lost.
  if (!apiKey || !pubId) return { ok: false, configured: false };

  try {
    const res = await fetch(beehiivEndpoint(pubId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        reactivate_existing: reactivateExisting,
        send_welcome_email: sendWelcomeEmail,
        utm_source: source,
        referring_site: "toxome.app",
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`beehiiv subscribe failed (${res.status}): ${detail}`);
      return { ok: false, configured: true, status: res.status, error: detail };
    }
    return { ok: true, configured: true, status: res.status };
  } catch (err) {
    console.error("beehiiv subscribe error:", err);
    return { ok: false, configured: true, error: String(err) };
  }
}

/** True when both beehiiv env keys are present. */
export function beehiivConfigured() {
  return Boolean(
    process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUBLICATION_ID
  );
}
