import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAllArticles } from "@/lib/journal";
import { articlePhotoPool } from "@/lib/journal-products";
import { pushToScheduler, absolutize, type SchedulerDraft } from "@/lib/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABLE = "journal_pins";
// At most N new pins per run, so enabling the automation (or a busy publishing
// day) never blasts a burst of pins. The backlog drains over the next few runs.
const MAX_PER_RUN = 2;

type Article = ReturnType<typeof getAllArticles>[number];

// Real Pinterest board ids on the Toxome account (Blotato account 7264). A pin
// only gets search distribution from a topically-matched keyword board; every
// pin used to land on the generic "Toxome" board, which has ~zero reach.
const BOARD_BABY = "984036656020889232"; // Non-Toxic Baby
const BOARD_WORKOUT = "984036656021258049"; // Non-Toxic Workout Clothes
const BOARD_LINEN = "984036656021257869"; // Linen Outfits & Summer Capsule
const BOARD_ORGANIC_COTTON = "984036656021257882"; // Organic Cotton Aesthetic
const BOARD_FABRIC_GUIDE = "984036656021258074"; // Is It Toxic? Fabric Guide
const BOARD_SENSITIVE_SKIN = "984036656021258067"; // Clothes for Sensitive Skin
const BOARD_BRANDS = "984036656021257853"; // Non-Toxic Clothing Brands (default)

// Route an article to the keyword board people ACTUALLY search on Pinterest
// (validated 2026 autocomplete). First match wins, so the ladder runs from most
// specific to most general.
function cluster(a: Article): string {
  const hay = `${a.slug} ${a.title} ${a.pillar} ${(a.keywords || []).join(" ")} ${a.dek}`.toLowerCase();
  if (/\b(baby|newborn|toddler|kids?|onesie|romper)\b/.test(hay)) return BOARD_BABY;
  if (/\b(activewear|legging|spandex|elastane|workout|athletic|yoga|sports bra|performance)\b/.test(hay)) {
    return BOARD_WORKOUT;
  }
  if (/\blinen\b/.test(hay)) return BOARD_LINEN;
  if (/\b(organic|regenerative|glyphosate)\b/.test(hay) && /cotton/.test(hay)) return BOARD_ORGANIC_COTTON;
  if (/\b(viscose|modal|ecovero|polyester|rayon|fabric guide)\b/.test(hay) || /\bis .+ toxic\b/.test(hay)) {
    return BOARD_FABRIC_GUIDE;
  }
  if (/\b(sensitive skin|eczema|allerg\w*)\b/.test(hay)) return BOARD_SENSITIVE_SKIN;
  return BOARD_BRANDS;
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [text.trim()];
}

// A single orphaned first sentence ("One comes from a plant.") reads as a cut-
// off fragment when the dek's next line is its payoff ("The other comes from
// oil."). So the pin description accumulates WHOLE sentences from the dek until
// they read as a complete thought, instead of always grabbing just the first
// one. Never cuts a sentence mid-way.
const MIN_CHARS = 45; // stop once accumulated text feels like a complete thought
const MAX_CHARS = 200; // hard ceiling — never add a sentence that would cross it
const MAX_SENTENCES = 3; // hard ceiling on sentence count regardless of length
function pinDescription(dek: string): string {
  const sentences = splitSentences(dek);
  let out = "";
  let count = 0;
  for (const s of sentences) {
    if (count >= MAX_SENTENCES) break;
    const next = out ? `${out} ${s}` : s;
    if (out && next.length > MAX_CHARS) break; // would cross the ceiling — stop before, never mid-sentence
    out = next;
    count++;
    if (out.length >= MIN_CHARS) break;
  }
  return out.trim();
}

// One (article, photo) pin: the unit of work. `photoUrl` — not `photoIndex` —
// is the ledger's dedupe key, since photoIndex is just a position in a pool
// that depends on live product data and can silently shift under a catalog
// change. photoIndex is kept only for ordering/debugging.
type PinJob = { article: Article; photoIndex: number; photoUrl: string };

// One row per (article, photo) the cron has finished with, whatever the outcome:
// `posted` went to Pinterest, `skipped` never will (its image didn't render, see
// preflightPin). Both keep the photo out of future runs. The table's primary key
// is (slug, photo_index), which a plain insert collides with whenever a catalog
// change shifts an article's pool under an index that was already written — so
// this upserts, and the failure is surfaced instead of swallowed.
type LedgerRow = {
  slug: string;
  photo_index: number;
  photo_url: string;
  title: string;
  status: "posted" | "skipped";
  external_id?: string;
  error?: string;
};
async function ledgerWrite(row: LedgerRow): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from(TABLE).upsert(row, { onConflict: "slug,photo_index" });
  return error ? { error: error.message } : {};
}

// Blotato does not upload the image, it FETCHES the media_url we hand it. A pin
// whose image doesn't come back as a real image is dead on arrival: Blotato
// can't fetch it, the post never lands, nothing is written to the ledger, and
// the same broken pin is retried on every run forever. So the pin image is
// pulled once before the post is submitted, and a pin that fails this is
// recorded as `skipped` instead of being pushed (see below).
async function preflightPin(mediaUrl: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const url = absolutize(mediaUrl);
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return { ok: false, reason: `pin image returned ${res.status}` };
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) {
      return { ok: false, reason: `pin image is not an image (content-type: ${type || "none"})` };
    }
    const bytes = (await res.arrayBuffer()).byteLength;
    if (bytes < 1000) return { ok: false, reason: `pin image is empty (${bytes} bytes)` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `pin image fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// Daily Vercel Cron. Auto-pins the Journal to Pinterest the way The Good Trade
// does it (56.3k followers, Pinterest is their #1 traffic source, and we audited
// their pins directly):
//   • the pin IMAGE is a bare photograph — no logo, no text, no scrim
//     (/journal/[slug]/pin/[i]);
//   • the pin TITLE is the SEO roundup headline, verbatim;
//   • the pin DESCRIPTION is a complete short thought pulled from the dek — no
//     keyword prefix, no hashtags, no "read on toxome.app" CTA;
//   • each article yields SEVERAL pins over time, one per photo in its pool, all
//     linking back to the article and filed to a topically-matched board.
// Fully automatic (no approval step); the journal_pins ledger keys on the
// resolved photo_url so a given photo posts exactly once even if the catalog
// reorders an article's photo pool. Every pin's image is fetched before the pin
// is submitted, and one that won't render is filed as `skipped` rather than
// pushed to a scheduler that would fail on it forever. CRON_SECRET gates the
// endpoint. Append
// ?dryRun=1 to preview without posting (previews the WHOLE queue, not just the
// run's cap).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  const articles = getAllArticles();
  const { data: pinnedRows, error } = await supabaseAdmin.from(TABLE).select("photo_url");
  if (error) {
    return NextResponse.json({ error: `ledger read failed: ${error.message}` }, { status: 500 });
  }
  const done = new Set((pinnedRows || []).map((r) => r.photo_url).filter((u): u is string => !!u));

  // Full work-list of (article, photo) pairs, ordered photo-index-first so the
  // drip goes wide before it goes deep: every article's hero pins before any
  // article's second photo does. A brand-new article therefore pins the day it
  // ships instead of queueing behind an older article's remaining five photos.
  const pools = await Promise.all(articles.map((a) => articlePhotoPool(a)));
  const maxPhotos = Math.max(0, ...pools.map((p) => p.length));
  const jobs: PinJob[] = [];
  for (let photoIndex = 0; photoIndex < maxPhotos; photoIndex++) {
    articles.forEach((article, ai) => {
      const pool = pools[ai];
      if (photoIndex >= pool.length) return;
      const photoUrl = pool[photoIndex];
      if (done.has(photoUrl)) return;
      jobs.push({ article, photoIndex, photoUrl });
    });
  }
  const pending = jobs.slice(0, MAX_PER_RUN);
  // A dry run previews the WHOLE queue, not just tonight's two, so the caption
  // and board routing can be reviewed before the drip runs for weeks.
  const preview = dryRun ? jobs : pending;

  const results: Array<Record<string, unknown>> = [];
  for (const { article: a, photoIndex, photoUrl } of preview) {
    const draft: SchedulerDraft = {
      id: `journal:${a.slug}:${photoIndex}`,
      platform: "pinterest",
      title: a.title,
      body: pinDescription(a.dek),
      media_url: `/journal/${a.slug}/pin/${photoIndex}`,
      media_type: "image",
      link: `/journal/${a.slug}`,
      boardId: cluster(a),
    };

    if (dryRun) {
      results.push({
        slug: a.slug,
        photo_index: photoIndex,
        photo_url: photoUrl,
        dryRun: true,
        title: draft.title,
        body: draft.body,
        media_url: draft.media_url,
        link: draft.link,
        boardId: draft.boardId,
      });
      continue;
    }

    // Never hand Pinterest a media_url that doesn't render.
    const check = await preflightPin(draft.media_url!);
    if (!check.ok) {
      // Retire the pin instead of retrying it forever: a `skipped` row keeps the
      // photo out of every future run (the ledger dedupes on photo_url) and out
      // of Pinterest, and leaves the reason on the row. The queue drains past it.
      const { error: ledgerError } = await ledgerWrite({
        slug: a.slug,
        photo_index: photoIndex,
        photo_url: photoUrl,
        title: a.title,
        status: "skipped",
        error: check.reason,
      });
      results.push({
        slug: a.slug,
        photo_index: photoIndex,
        ok: false,
        skipped: true,
        media_url: draft.media_url,
        error: check.reason,
        ...(ledgerError ? { ledgerError } : {}),
      });
      continue;
    }

    const res = await pushToScheduler(draft);
    if (res.ok) {
      // Record only on a confirmed submission, so a failure retries next run.
      const { error: ledgerError } = await ledgerWrite({
        slug: a.slug,
        photo_index: photoIndex,
        photo_url: photoUrl,
        title: a.title,
        external_id: res.externalId,
        status: "posted",
      });
      results.push({
        slug: a.slug,
        photo_index: photoIndex,
        ok: true,
        externalId: res.externalId,
        ...(ledgerError ? { ledgerError } : {}),
      });
    } else {
      const reason = res.configured === false ? "scheduler not configured" : res.error;
      results.push({ slug: a.slug, photo_index: photoIndex, ok: false, error: reason });
    }
  }

  return NextResponse.json({
    checked: articles.length,
    pinsPossible: jobs.length + done.size,
    alreadyPinned: done.size,
    queued: jobs.length,
    attempted: pending.length,
    posted: results.filter((r) => r.ok).length,
    skipped: results.filter((r) => r.skipped).length,
    dryRun,
    results,
  });
}
