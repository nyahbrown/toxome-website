// Pluggable scheduler push adapter.
//
// The content dashboard works fully WITHOUT a scheduler connected: approving a
// draft just marks it `approved` and the VA exports it manually. When you wire a
// scheduler (set SCHEDULER_PROVIDER + its token in env), approval ALSO pushes the
// post and flips it to `scheduled`. Flip-the-switch upgrade, no code change.
//
// Supported providers (set SCHEDULER_PROVIDER to one of these):
//   - "postiz"    → POSTIZ_API_TOKEN     (+ optional POSTIZ_API_URL)
//   - "blotato"   → BLOTATO_API_TOKEN
//   - "none"/unset → no push; dashboard runs in approve-only mode
//
// Metricool's public API does not expose generic post-scheduling on lower tiers,
// so it's intentionally not an auto-push target, use it as the analytics/manual
// scheduler and keep the dashboard in approve-only mode for it.

export type SchedulerDraft = {
  id: string;
  platform: string; // instagram | twitter | pinterest
  body: string;
  title?: string | null;
  media_url?: string | null;
};

export type PushResult =
  | { ok: true; externalId: string }
  | { ok: false; configured: false } // no provider set, approve-only mode
  | { ok: false; configured: true; error: string };

function provider(): string {
  return (process.env.SCHEDULER_PROVIDER || "none").toLowerCase().trim();
}

export function schedulerConfigured(): boolean {
  const p = provider();
  if (p === "postiz") return !!process.env.POSTIZ_API_TOKEN;
  if (p === "blotato") return !!process.env.BLOTATO_API_TOKEN;
  return false;
}

export async function pushToScheduler(draft: SchedulerDraft): Promise<PushResult> {
  const p = provider();

  if (p === "postiz") {
    const token = process.env.POSTIZ_API_TOKEN;
    if (!token) return { ok: false, configured: false };
    const base = process.env.POSTIZ_API_URL || "https://api.postiz.com";
    try {
      const res = await fetch(`${base}/public/v1/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          type: "draft", // create as draft in Postiz; you confirm send there
          content: draft.title ? `${draft.title}\n\n${draft.body}` : draft.body,
          platform: draft.platform,
          media: draft.media_url ? [{ url: draft.media_url }] : [],
        }),
      });
      if (!res.ok) {
        return { ok: false, configured: true, error: `Postiz ${res.status}: ${await safeText(res)}` };
      }
      const data = (await res.json()) as { id?: string; postId?: string };
      return { ok: true, externalId: data.id || data.postId || "posted" };
    } catch (e) {
      return { ok: false, configured: true, error: `Postiz request failed: ${msg(e)}` };
    }
  }

  if (p === "blotato") {
    const token = process.env.BLOTATO_API_TOKEN;
    if (!token) return { ok: false, configured: false };
    try {
      const res = await fetch("https://backend.blotato.com/v2/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "blotato-api-key": token,
        },
        body: JSON.stringify({
          post: {
            target: { targetType: draft.platform },
            content: {
              text: draft.title ? `${draft.title}\n\n${draft.body}` : draft.body,
              mediaUrls: draft.media_url ? [draft.media_url] : [],
            },
          },
        }),
      });
      if (!res.ok) {
        return { ok: false, configured: true, error: `Blotato ${res.status}: ${await safeText(res)}` };
      }
      const data = (await res.json()) as { id?: string };
      return { ok: true, externalId: data.id || "posted" };
    } catch (e) {
      return { ok: false, configured: true, error: `Blotato request failed: ${msg(e)}` };
    }
  }

  return { ok: false, configured: false };
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return "";
  }
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
