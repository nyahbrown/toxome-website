import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchClothingToxinNews } from "@/lib/xNews";
import { writeTweets } from "@/lib/xTweetWriter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABLE = "content_drafts";
const DAILY_TOTAL = 5; // 3 news + 2 evergreen; fills with evergreen when news is thin
const MAX_NEWS = 3;
const MIN_EVERGREEN = 2;

// Daily Vercel Cron. When CRON_SECRET is set, Vercel sends it as a bearer token
// and we require it (also lets you trigger by hand with the same header). The
// route only DRAFTS, nothing publishes until Nyah approves in the dashboard.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. recent news on the beat
  let news = await fetchClothingToxinNews({ maxAgeHours: 72, limit: 12 });

  // 2. skip stories already drafted (dedupe by source_ref), keep the freshest few
  const { data: recent } = await supabaseAdmin
    .from(TABLE)
    .select("source_ref, body")
    .eq("platform", "twitter")
    .order("created_at", { ascending: false })
    .limit(120);
  const usedUrls = new Set((recent || []).map((r) => r.source_ref).filter(Boolean));
  news = news.filter((n) => !usedUrls.has(n.url)).slice(0, MAX_NEWS);

  const evergreenCount = Math.max(MIN_EVERGREEN, DAILY_TOTAL - news.length);

  // 3. draft tweets in the toxome voice
  let tweets;
  try {
    tweets = await writeTweets({
      news,
      evergreenCount,
      avoidBodies: (recent || []).map((r) => r.body).filter(Boolean) as string[],
      dateLabel: new Date().toISOString().slice(0, 10),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  if (!tweets.length) return NextResponse.json({ ok: true, inserted: 0, note: "no tweets generated" });

  // 4. drop into the dashboard as twitter drafts for approval
  const rows = tweets.map((t) => ({
    source_type: t.kind === "news" ? "news" : "evergreen",
    source_ref: t.source_url,
    platform: "twitter",
    variant_type: "post",
    title: null,
    body: t.body,
    media_url: null,
    media_type: null,
    comment: t.source_url ? `source (drop as a reply): ${t.source_url}` : `angle: ${t.angle}`,
    status: "draft",
  }));

  const { data, error } = await supabaseAdmin.from(TABLE).insert(rows).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, inserted: data?.length ?? 0, news: news.length, evergreen: evergreenCount });
}
