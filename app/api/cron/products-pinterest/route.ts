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
  category: string | null;
  age_band: string | null;
  fabric_composition: Record<string, number> | null;
  fibers_present: string[] | null;
};

// Map a product to the keyword cluster people ACTUALLY search (from live
// Pinterest autocomplete research): baby, activewear (the one place "PFAS-free"
// genuinely sells), linen, organic cotton, else the generic head term. `tag`
// rides on the title (Pinterest weighs it); `lead` front-loads the description
// (only the first ~50 chars show in search). Health jargon (formaldehyde-free,
// endocrine-safe) is the body hook, never the keyword.
function cluster(p: Row): { tag: string; lead: string } {
  const hay = `${p.item_name || ""} ${p.category || ""}`.toLowerCase();
  const fibers = [
    ...Object.keys(p.fabric_composition || {}),
    ...(p.fibers_present || []),
  ]
    .join(" ")
    .toLowerCase();

  const isBaby =
    p.age_band === "baby" ||
    p.age_band === "kids" ||
    /\b(baby|newborn|toddler|kids?|onesie|romper)\b/.test(hay);
  const isActive =
    /\b(legging|sports bra|activewear|workout|athletic|yoga|running|active|bike short)\b/.test(hay);

  if (isBaby) return { tag: "Organic Cotton Baby Clothes", lead: "Organic cotton baby clothes" };
  if (isActive) return { tag: "Non-Toxic Activewear", lead: "Non-toxic workout clothes, PFAS-free" };
  if (fibers.includes("linen")) return { tag: "Linen Clothing", lead: "Linen outfit, non-toxic" };
  if (fibers.includes("cotton")) return { tag: "Organic Cotton Clothing", lead: "Organic cotton clothing" };
  return { tag: "Non-Toxic Clothing", lead: "Non-toxic clothing, scored" };
}

// Pinterest is a search engine. 2026 ranking rules drive the copy: front-load
// the validated keyword (first ~50 chars are all that show in search), full
// sentences not hashtags, value prop + soft CTA. The cluster picks the term.
function pinCaption(p: Row): string {
  const brand = (p.brand || "").trim();
  const who = brand ? `${p.item_name} by ${brand}` : p.item_name || "this piece";
  const score =
    typeof p.toxome_score === "number"
      ? ` It earns a Toxome score of ${p.toxome_score}/100 for what its fibers do to your body.`
      : "";
  return (
    `${cluster(p).lead}: ${who}.${score} ` +
    "Shop natural-fiber, non-toxic fashion on toxome.app, and know what's in your clothes."
  );
}

function pinTitle(p: Row): string {
  const name = p.item_name || "Toxome";
  // Product-led + the validated category keyword; varies per pin.
  return `${name} | ${cluster(p).tag}`;
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
    .select("id, item_name, brand, toxome_score, item_image, category, age_band, fabric_composition, fibers_present")
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
