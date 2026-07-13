// Pluggable scheduler push adapter.
//
// The content dashboard works fully WITHOUT a scheduler connected: approving a
// draft just marks it `approved` and you export it manually. When you wire a
// scheduler (set SCHEDULER_PROVIDER + its credentials in env), approval ALSO
// publishes the post and flips it to `scheduled`. Flip-the-switch upgrade, no
// code change in the dashboard.
//
// Supported providers (set SCHEDULER_PROVIDER to one of these):
//   - "blotato"   → BLOTATO_API_KEY (+ per-platform account ids, see below)
//   - "postiz"    → POSTIZ_API_TOKEN (+ optional POSTIZ_API_URL) — UNVERIFIED stub
//   - "none"/unset → no push; dashboard runs in approve-only mode
//
// ── Blotato setup (the live provider) ───────────────────────────────────────
// 1. Connect Instagram (Business/Creator), X, and Pinterest inside the Blotato
//    dashboard (Settings → connect accounts).
// 2. Generate an API key (Settings → API) → BLOTATO_API_KEY.
// 3. Run `node scripts/blotato-accounts.js` to print the account + board ids,
//    then paste these into .env.local:
//      SCHEDULER_PROVIDER=blotato
//      BLOTATO_API_KEY=...
//      BLOTATO_INSTAGRAM_ACCOUNT_ID=...
//      BLOTATO_TWITTER_ACCOUNT_ID=...
//      BLOTATO_PINTEREST_ACCOUNT_ID=...
//      BLOTATO_PINTEREST_BOARD_ID=...
//      NEXT_PUBLIC_SITE_URL=https://toxome.app   (used to absolutize media)
// Blotato fetches media from public https URLs directly — no pre-upload needed.

export type SchedulerDraft = {
  id: string;
  platform: string; // instagram | twitter | pinterest
  body: string;
  title?: string | null;
  media_url?: string | null;
  media_type?: string | null; // image | carousel | video | null
  scheduled_at?: string | null; // ISO; if in the future, publish then instead of now
  link?: string | null; // Pinterest pin destination URL (defaults to the site root)
  // Pinterest board to file the pin under. Pinterest is a search engine, so a
  // pin only ranks on a topically-matched keyword board — callers that know the
  // topic (e.g. the journal cron's cluster()) pass the board id here. Omitted →
  // BLOTATO_PINTEREST_BOARD_ID, the generic catch-all board.
  boardId?: string | null;
};

export type PushResult =
  | { ok: true; externalId: string }
  | { ok: false; configured: false } // no provider set, approve-only mode
  | { ok: false; configured: true; error: string };

function provider(): string {
  return (process.env.SCHEDULER_PROVIDER || "none").toLowerCase().trim();
}

function blotatoKey(): string | undefined {
  // Prefer the docs name; accept the legacy name so an older .env keeps working.
  return process.env.BLOTATO_API_KEY || process.env.BLOTATO_API_TOKEN;
}

export function schedulerConfigured(): boolean {
  const p = provider();
  if (p === "blotato") return !!blotatoKey();
  if (p === "postiz") return !!process.env.POSTIZ_API_TOKEN;
  return false;
}

// Platforms we deliberately never auto-publish through the API. TikTok throttles
// For-You distribution on third-party-API posts (a public TikTok post landed ~1
// view in 5h), so it's posted natively by hand off the same rendered slides.
// Approving a TikTok draft still marks it `approved` (ready to post), it just
// never hits Blotato. Instagram + Pinterest are unaffected. Re-enable a platform
// by removing it from this set.
const MANUAL_PLATFORMS = new Set(["tiktok"]);

export function isManualPlatform(platform: string): boolean {
  return MANUAL_PLATFORMS.has((platform || "").toLowerCase().trim());
}

export async function pushToScheduler(draft: SchedulerDraft): Promise<PushResult> {
  // Manual platforms skip the API entirely; the route leaves them `approved` and
  // the dashboard shows a "post natively" block (caption + slide download).
  if (isManualPlatform(draft.platform)) return { ok: false, configured: false };
  const p = provider();
  if (p === "blotato") return pushToBlotato(draft);
  if (p === "postiz") return pushToPostiz(draft);
  return { ok: false, configured: false };
}

// ── Blotato ──────────────────────────────────────────────────────────────────
const BLOTATO_BASE = "https://backend.blotato.com/v2";

const BLOTATO_ACCOUNT_ENV: Record<string, string> = {
  instagram: "BLOTATO_INSTAGRAM_ACCOUNT_ID",
  twitter: "BLOTATO_TWITTER_ACCOUNT_ID",
  pinterest: "BLOTATO_PINTEREST_ACCOUNT_ID",
  tiktok: "BLOTATO_TIKTOK_ACCOUNT_ID",
};

// Platforms that cannot publish text-only (a post must carry media).
const MEDIA_REQUIRED = new Set(["instagram", "pinterest", "tiktok"]);

// Per-platform carousel ceiling, used when expanding slide-0…slide-N.
const CAROUSEL_MAX: Record<string, number> = { instagram: 10, tiktok: 20, pinterest: 5, twitter: 4 };

// X/Twitter post character ceiling.
const TWEET_LIMIT = 280;

function blotatoAccountId(platform: string): string | undefined {
  const key = BLOTATO_ACCOUNT_ENV[platform];
  return key ? process.env[key] : undefined;
}

async function pushToBlotato(draft: SchedulerDraft): Promise<PushResult> {
  const key = blotatoKey();
  if (!key) return { ok: false, configured: false };

  const platform = draft.platform; // instagram | twitter | pinterest
  const accountId = blotatoAccountId(platform);
  if (!accountId) {
    return {
      ok: false,
      configured: true,
      error: `No Blotato account connected for "${platform}" — set ${BLOTATO_ACCOUNT_ENV[platform] || "the account id env var"}`,
    };
  }

  const mediaUrls = await resolveMediaUrls(draft, CAROUSEL_MAX[platform] ?? 10);

  // Instagram, Pinterest, and TikTok require media; X allows text-only.
  if (MEDIA_REQUIRED.has(platform) && mediaUrls.length === 0) {
    return { ok: false, configured: true, error: `${platform} requires an image, but this draft has no media` };
  }

  // Pinterest and TikTok carry the title on the target and use the body as the
  // description. Instagram/X fold a title (if any) into the post text.
  const titleOnTarget = platform === "pinterest" || platform === "tiktok";
  const text = titleOnTarget ? draft.body : draft.title ? `${draft.title}\n\n${draft.body}` : draft.body;

  // X/Twitter hard-caps posts at 280 chars. Catch it here with an actionable
  // message instead of letting Blotato bounce it back as an opaque 422.
  if (platform === "twitter") {
    const len = [...text.trim()].length;
    if (len > TWEET_LIMIT) {
      return {
        ok: false,
        configured: true,
        error: `Tweet is ${len} characters, ${len - TWEET_LIMIT} over the ${TWEET_LIMIT} limit. Trim it and re-approve.`,
      };
    }
  }

  const target: Record<string, unknown> = { targetType: platform };
  if (platform === "pinterest") {
    const boardId = draft.boardId || process.env.BLOTATO_PINTEREST_BOARD_ID;
    if (!boardId) {
      return { ok: false, configured: true, error: "Pinterest needs a boardId on the draft or BLOTATO_PINTEREST_BOARD_ID" };
    }
    target.boardId = boardId;
    if (draft.title) target.title = draft.title;
    target.link = draft.link ? absolutize(draft.link) : siteBase();
  }
  if (platform === "tiktok") {
    // NOTE: currently unreachable, TikTok is a MANUAL_PLATFORM (posted natively).
    // Kept intact so re-enabling = dropping "tiktok" from MANUAL_PLATFORMS.
    // Direct Post: public, no in-app finish step. Never isDraft:true — TikTok
    // drafts land in the app inbox AND drop the caption, which breaks automation.
    target.privacyLevel = "PUBLIC_TO_EVERYONE";
    target.isDraft = false;
    target.imageCoverIndex = 0;
    target.autoAddMusic = true; // photo slideshows get a TikTok-recommended track (no silent post). No effect on video.
    // Blotato REQUIRES these interaction/disclosure flags on the TikTok target
    // (organic post → all false). Omitting any of them is a 400.
    target.disabledComments = false;
    target.disabledDuet = false;
    target.disabledStitch = false;
    target.isBrandedContent = false;
    target.isYourBrand = false;
    target.isAiGenerated = false;
    if (draft.title) target.title = draft.title.slice(0, 90); // TikTok title cap
  }
  if (platform === "instagram" && draft.media_type === "video") {
    target.mediaType = "reel"; // a single video posts as a Reel, not a feed image
  }

  const payload: Record<string, unknown> = {
    post: { accountId, content: { text, mediaUrls, platform }, target },
  };
  // If a future time is set, hand it to Blotato so it publishes then (omitting
  // scheduledTime = publish now). 2-minute floor keeps "now" approvals immediate.
  if (draft.scheduled_at) {
    const when = new Date(draft.scheduled_at).getTime();
    if (!Number.isNaN(when) && when > Date.now() + 2 * 60_000) {
      payload.scheduledTime = new Date(draft.scheduled_at).toISOString();
    }
  }

  try {
    const res = await fetch(`${BLOTATO_BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "blotato-api-key": key },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, configured: true, error: `Blotato ${res.status}: ${await safeText(res)}` };
    }
    const data = (await res.json()) as { postSubmissionId?: string; id?: string };
    // Blotato publishes asynchronously; this is the submission id, not the live
    // platform post id. Failures surface at my.blotato.com/failed.
    return { ok: true, externalId: data.postSubmissionId || data.id || "submitted" };
  } catch (e) {
    return { ok: false, configured: true, error: `Blotato request failed: ${msg(e)}` };
  }
}

// ── Media resolution ──────────────────────────────────────────────────────────
// Drafts store media as site-relative paths (e.g. /carousel/<slug>/slide-0.png)
// and carousels store only the cover. Blotato needs absolute public URLs and the
// FULL set of carousel slides, so we absolutize and probe sibling slides here.
async function resolveMediaUrls(draft: SchedulerDraft, maxSlides = 10): Promise<string[]> {
  if (!draft.media_url) return [];
  const cover = absolutize(draft.media_url);

  if (draft.media_type === "carousel") {
    const m = cover.match(/^(.*\/)slide-0\.(png|jpe?g|webp)$/i);
    if (m) {
      const [, prefix, ext] = m;
      const urls: string[] = [];
      // Expand slide-0…slide-N up to the platform's carousel cap; stop at the
      // first gap (a missing slide = end of the set).
      for (let i = 0; i < maxSlides; i++) {
        const u = `${prefix}slide-${i}.${ext}`;
        if (!(await urlExists(u))) break;
        urls.push(u);
      }
      if (urls.length) return urls;
    }
  }
  return [cover];
}

function absolutize(u: string): string {
  if (/^https?:\/\//i.test(u)) return u;
  return `${siteBase()}${u.startsWith("/") ? "" : "/"}${u}`;
}

function siteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://toxome.app";
  return raw.replace(/\/+$/, "");
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Postiz (UNVERIFIED stub) ──────────────────────────────────────────────────
// Kept for the self-host path but NOT validated against the current Postiz
// public API (which expects integration ids + an upload step). Do not rely on
// this until it's rewritten and tested against a live instance.
async function pushToPostiz(draft: SchedulerDraft): Promise<PushResult> {
  const token = process.env.POSTIZ_API_TOKEN;
  if (!token) return { ok: false, configured: false };
  const base = process.env.POSTIZ_API_URL || "https://api.postiz.com";
  try {
    const res = await fetch(`${base}/public/v1/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        type: "draft",
        content: draft.title ? `${draft.title}\n\n${draft.body}` : draft.body,
        platform: draft.platform,
        media: draft.media_url ? [{ url: absolutize(draft.media_url) }] : [],
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

// ── helpers ────────────────────────────────────────────────────────────────
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
