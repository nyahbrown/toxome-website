import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pushToScheduler, type SchedulerDraft } from "@/lib/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Ledger so each product auto-pins exactly once (mirrors journal_pins).
const TABLE = "product_pins";
// At most N new pins per run, so the daily cron drips fresh pins rather than
// blasting the whole catalog. The backlog drains over subsequent runs.
const MAX_PER_RUN = 3;

type Row = {
  id: string;
  item_name: string | null;
  brand: string | null;
  toxome_score: number | null;
  item_image: string | null;
};

// Pinterest is a search engine. The 2026 ranking rules drive the copy:
//   - Front-load the primary long-tail keyword: only the first ~50 chars show
//     in search, so "non-toxic clothing" leads every description.
//   - Full sentences, written for humans, NOT hashtag stuffing (near-worthless).
//   - Weave the niche's long-tail search terms (natural fiber, organic cotton,
//     sensitive skin) naturally; close with a value prop + soft CTA.
// The title also carries a keyword (Pinterest weighs it), product-led so the
// account isn't hundreds of identically-prefixed pins.
function pinCaption(p: Row): string {
  const brand = (p.brand || "").trim();
  const who = brand ? `${p.item_name} by ${brand}` : p.item_name || "this piece";
  const score =
    typeof p.toxome_score === "number"
      ? ` It earns a Toxome score of ${p.toxome_score}/100 for what its fibers do to your body.`
      : "";
  return (
    `Non-toxic clothing, scored: ${who}.${score} ` +
    "Shop natural-fiber, organic-cotton fashion for sensitive skin on toxome.app, and know what's in your clothes."
  );
}

function pinTitle(p: Row): string {
  const name = p.item_name || "Toxome";
  // Product-led with the primary keyword for search; varies per pin.
  return `${name} | Non-Toxic Clothing`;
}

// Daily Vercel Cron. Auto-pins published products to Pinterest exactly once
// each, newest first, as the locked V2 "cover" pin (rendered live by
// /shop/[id]/pin). Fully automatic (no approval step) per the publishing
// decision; the product_pins ledger guarantees a single post per product.
// CRON_SECRET gates the endpoint. Append ?dryRun=1 to preview without posting.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  // Ledger of already-pinned products. Tolerate a missing table (pre-migration)
  // so a dry run can preview before the ledger exists.
  const done = new Set<string>();
  const { data: pinnedRows, error: ledgerErr } = await supabaseAdmin
    .from(TABLE)
    .select("product_id");
  if (ledgerErr && !/does not exist|schema cache/i.test(ledgerErr.message)) {
    return NextResponse.json({ error: `ledger read failed: ${ledgerErr.message}` }, { status: 500 });
  }
  for (const r of pinnedRows || []) done.add((r as { product_id: string }).product_id);

  // Candidate products: published, with an image + score, newest first.
  const { data: products, error: prodErr } = await supabaseAdmin
    .from("products")
    .select("id, item_name, brand, toxome_score, item_image")
    .eq("published", true)
    .not("item_image", "is", null)
    .not("toxome_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (prodErr) {
    return NextResponse.json({ error: `products read failed: ${prodErr.message}` }, { status: 500 });
  }

  const pending = (products || []).filter((p) => !done.has(p.id)).slice(0, MAX_PER_RUN);

  const results: Array<Record<string, unknown>> = [];
  for (const p of pending as Row[]) {
    const draft: SchedulerDraft = {
      id: `product:${p.id}`,
      platform: "pinterest",
      title: pinTitle(p),
      body: pinCaption(p),
      media_url: `/shop/${p.id}/pin`,
      media_type: "image",
      link: `/shop/${p.id}`,
    };

    if (dryRun) {
      results.push({ id: p.id, dryRun: true, title: draft.title, body: draft.body, media_url: draft.media_url, link: draft.link });
      continue;
    }

    const res = await pushToScheduler(draft);
    if (res.ok) {
      // Record only on a confirmed submission, so a failure retries next run.
      await supabaseAdmin
        .from(TABLE)
        .insert({ product_id: p.id, title: draft.title, external_id: res.externalId, status: "posted" });
      results.push({ id: p.id, ok: true, externalId: res.externalId });
    } else {
      const reason = res.configured === false ? "scheduler not configured" : res.error;
      results.push({ id: p.id, ok: false, error: reason });
    }
  }

  return NextResponse.json({
    alreadyPinned: done.size,
    attempted: pending.length,
    posted: results.filter((r) => r.ok).length,
    dryRun,
    results,
  });
}
