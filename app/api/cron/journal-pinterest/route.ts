import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAllArticles } from "@/lib/journal";
import { pushToScheduler, type SchedulerDraft } from "@/lib/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABLE = "journal_pins";
// At most N new pins per run, so enabling the automation (or a busy publishing
// day) never blasts a burst of pins. The backlog drains over the next few runs.
const MAX_PER_RUN = 2;

type Article = ReturnType<typeof getAllArticles>[number];

// Map an article to the keyword cluster people ACTUALLY search on Pinterest
// (validated 2026 autocomplete). The `lead` front-loads the description — only
// the first ~50 chars show in Pinterest search — so the validated keyword goes
// first, never a hashtag. Health jargon (formaldehyde-free, PFAS-free, etc.) is
// a body hook only; it is dead as a search term. Mirrors cluster() in the
// products-pinterest cron.
function cluster(a: Article): { lead: string; bodyHook: string } {
  const hay = `${a.slug} ${a.title} ${a.pillar} ${(a.keywords || []).join(" ")} ${a.dek}`.toLowerCase();
  if (/\b(baby|newborn|toddler|kids?|onesie|romper)\b/.test(hay)) {
    return { lead: "Organic cotton baby clothes", bodyHook: "" };
  }
  if (/\b(activewear|legging|spandex|elastane|workout|athletic|yoga|sports bra|performance)\b/.test(hay)) {
    return { lead: "Non-toxic workout clothes", bodyHook: "The finish on a lot of leggings isn't PFAS-free. " };
  }
  if (/\blinen\b/.test(hay)) {
    return { lead: "Linen outfits", bodyHook: "" };
  }
  if (/\b(organic|regenerative|glyphosate)\b/.test(hay) && /cotton/.test(hay)) {
    return { lead: "Organic cotton aesthetic", bodyHook: "" };
  }
  return { lead: "Non-toxic clothing", bodyHook: "" };
}

// First clean sentence of the dek — the value line after the keyword lead.
function firstSentence(dek: string): string {
  const m = dek.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : dek).trim();
}

// Pinterest is a search engine. Front-load the validated keyword (first ~50
// chars are all that show), then a value sentence from the dek, then a soft CTA.
// No hashtags.
function pinCaption(a: Article): string {
  const { lead, bodyHook } = cluster(a);
  const value = firstSentence(a.dek);
  return `${lead}: ${value} ${bodyHook}Read the full guide on toxome.app, and know what's in your clothes.`
    .replace(/\s+/g, " ")
    .trim();
}

// Daily Vercel Cron. Auto-pins every published Journal article exactly once
// with the v1 editorial-cover design (/journal/[slug]/pin). Fully automatic (no
// approval step) per the publishing decision; the journal_pins ledger guarantees
// each article posts a single time. CRON_SECRET gates the endpoint. Append
// ?dryRun=1 to preview without posting.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  const articles = getAllArticles();
  const { data: pinnedRows, error } = await supabaseAdmin.from(TABLE).select("slug");
  if (error) {
    return NextResponse.json({ error: `ledger read failed: ${error.message}` }, { status: 500 });
  }
  const done = new Set((pinnedRows || []).map((r) => r.slug));
  const pending = articles.filter((a) => !done.has(a.slug)).slice(0, MAX_PER_RUN);

  const results: Array<Record<string, unknown>> = [];
  for (const a of pending) {
    const draft: SchedulerDraft = {
      id: `journal:${a.slug}`,
      platform: "pinterest",
      title: a.title,
      body: pinCaption(a),
      media_url: `/journal/${a.slug}/pin`,
      media_type: "image",
      link: `/journal/${a.slug}`,
    };

    if (dryRun) {
      results.push({ slug: a.slug, dryRun: true, title: a.title, body: draft.body, media_url: draft.media_url, link: draft.link });
      continue;
    }

    const res = await pushToScheduler(draft);
    if (res.ok) {
      // Record only on a confirmed submission, so a failure retries next run.
      await supabaseAdmin
        .from(TABLE)
        .insert({ slug: a.slug, title: a.title, external_id: res.externalId, status: "posted" });
      results.push({ slug: a.slug, ok: true, externalId: res.externalId });
    } else {
      const reason = res.configured === false ? "scheduler not configured" : res.error;
      results.push({ slug: a.slug, ok: false, error: reason });
    }
  }

  return NextResponse.json({
    checked: articles.length,
    alreadyPinned: done.size,
    attempted: pending.length,
    posted: results.filter((r) => r.ok).length,
    dryRun,
    results,
  });
}
