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

// Pinterest pin description: the dek, a soft CTA, and a few keyword hashtags
// (Pinterest is a search engine, so the keywords matter). The title rides on the
// pin target separately; this is the body/description.
function pinCaption(a: Article): string {
  const tags = (a.keywords || [])
    .slice(0, 4)
    .map((k) => "#" + k.replace(/[^a-z0-9]+/gi, ""))
    .filter((t) => t.length > 2)
    .join(" ");
  return [
    a.dek,
    "Read the full guide on toxome.app, and know what's in your clothes.",
    tags,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// Daily Vercel Cron. Auto-pins every published Journal article exactly once.
// Fully automatic (no approval step) per the publishing decision; the
// journal_pins ledger guarantees each article posts a single time. CRON_SECRET
// gates the endpoint. Append ?dryRun=1 to preview without posting.
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
      results.push({ slug: a.slug, dryRun: true, title: a.title, media_url: draft.media_url, link: draft.link });
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
