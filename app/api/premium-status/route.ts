// Authoritative premium check for the website.
//
// The website otherwise gates on the cached `is_premium` flag in Firestore,
// which the RevenueCat webhook keeps in sync but can drift (stale flags, missed
// expirations, leftover test purchases). This route asks RevenueCat directly for
// the LIVE "Toxome Premium" entitlement, so the web gates exactly like the app.
//
// Security: the caller proves identity with their Firebase ID token; we verify
// it and only ever check the entitlement for THAT verified uid — never a uid the
// client supplies. Requires REVENUECAT_SECRET_KEY (server-only). If the key is
// missing or anything errors, we return a non-authoritative source so the client
// falls back to the Firestore flag and a real subscriber is never locked out.

const ENTITLEMENT = "Toxome Premium";

export async function POST(req: Request) {
  const header =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return Response.json({ source: "error" }, { status: 401 });
  }
  const idToken = header.slice("Bearer ".length).trim();

  const firebaseKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const rcKey = process.env.REVENUECAT_SECRET_KEY;
  // No key configured yet → tell the client to fall back to the cached flag.
  if (!firebaseKey || !rcKey) {
    return Response.json({ source: "unavailable" });
  }

  // 1. Verify the Firebase ID token and extract the caller's own uid.
  let uid: string | undefined;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!res.ok) return Response.json({ source: "error" }, { status: 401 });
    const data = (await res.json()) as { users?: { localId?: string }[] };
    uid = data.users?.[0]?.localId;
  } catch {
    return Response.json({ source: "error" }, { status: 500 });
  }
  if (!uid) return Response.json({ source: "error" }, { status: 401 });

  // 2. Ask RevenueCat for this subscriber's live entitlements.
  try {
    const rc = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
      { headers: { Authorization: `Bearer ${rcKey}` } },
    );
    if (!rc.ok) return Response.json({ source: "error" }, { status: 502 });
    const body = (await rc.json()) as {
      subscriber?: {
        entitlements?: Record<
          string,
          { expires_date?: string | null; grace_period_expires_date?: string | null }
        >;
      };
    };
    const ent = body?.subscriber?.entitlements?.[ENTITLEMENT];
    const now = Date.now();
    const inFuture = (d?: string | null) => !!d && new Date(d).getTime() > now;
    // Active when it's a lifetime grant (no expiry) or hasn't expired (incl.
    // billing grace period).
    const active =
      !!ent &&
      (ent.expires_date == null ||
        inFuture(ent.expires_date) ||
        inFuture(ent.grace_period_expires_date));
    return Response.json({ premium: active, source: "revenuecat" });
  } catch {
    return Response.json({ source: "error" }, { status: 502 });
  }
}
