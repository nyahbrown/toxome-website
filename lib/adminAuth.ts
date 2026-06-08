// Server-side admin authentication.
// API routes must independently verify the caller, never trust the client.
// The client sends a Firebase ID token as `Authorization: Bearer <token>`;
// we verify it against Firebase's identity toolkit REST endpoint and confirm
// the email matches the single allowed admin.

export const ADMIN_EMAIL = "nyah@toxome.app";

export async function verifyAdmin(
  req: Request
): Promise<{ ok: boolean; email?: string }> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) return { ok: false };

  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) return { ok: false };

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return { ok: false };

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return { ok: false };

    const data = (await res.json()) as {
      users?: { email?: string }[];
    };
    const email = data.users?.[0]?.email;
    if (email && email === ADMIN_EMAIL) {
      return { ok: true, email };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
