import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Builds the weekly curated-digest newsletter DRAFT and parks it for review.
// Triggered Wednesday by Pikey (GitHub Actions) over HTTP, not a Vercel cron,
// so it doesn't count against the Hobby 2-cron limit. Does three things:
//   1. Drafts the digest with Claude from the newest clean products.
//   2. Saves it to content_drafts (status=draft) for review in /admin/content.
//   3. Tries to create a matching DRAFT post in beehiiv (skips gracefully if the
//      plan doesn't allow API post creation — Nyah sends manually either way).
// Auth: NEWSLETTER_TRIGGER_SECRET (falls back to CRON_SECRET).

const PRODUCT_COUNT = 4;

function authed(req: Request): boolean {
  const secret = process.env.NEWSLETTER_TRIGGER_SECRET || process.env.CRON_SECRET;
  if (!secret) return false; // refuse to run unauthenticated
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type Product = {
  item_name: string;
  brand: string | null;
  item_price: number | null;
  currency: string | null;
  toxome_score: number | null;
  item_image: string | null;
  affiliate_url: string | null;
  item_url: string | null;
  id: string;
};

const NEWSLETTER_SYSTEM = `you are the editor of "the fashion wellness letter", toxome's weekly newsletter. write a short curated digest in toxome's locked editorial voice: a 50/50 vogue x goop blend, scientifically grounded, second person, warm but precise. emoji banned. em dashes banned (use commas or periods). no ai throat-clearing, no "in today's world", no hype.

you are given this week's newest clean products. write:
1. a subject line (under 60 chars, lowercase, no clickbait).
2. a short intro (2-3 sentences) on a fashion-wellness theme that connects to the products.
3. "this week's edit" — the products as a clean list, each: name, brand, one short reason it's worth it (tie to fiber/score).
4. one fabric or health tip (2 sentences).
5. a soft closing CTA to scan their own closet in the toxome app, and a line pointing to the journal at https://toxome.app/journal.

return your output in EXACTLY this format and nothing else (no code fences, no json):
SUBJECT: <the subject line>
===HTML===
<the email body as clean inline-styled HTML: no <style> or <link> tags, no <html>/<head> wrappers, just body content. brand cream/charcoal palette used sparingly, scannable.>`;

type DraftResult = { subject: string; html: string } | { error: string };

async function draftWithClaude(products: Product[]): Promise<DraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "ANTHROPIC_API_KEY is not set in Vercel env" };
  const productLines = products
    .map(
      (p) =>
        `- ${p.item_name} | brand: ${p.brand ?? "n/a"} | score: ${p.toxome_score ?? "n/a"} | price: ${p.item_price ?? "?"} ${p.currency ?? ""} | link: ${p.affiliate_url || p.item_url || ""}`
    )
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: NEWSLETTER_SYSTEM,
      messages: [{ role: "user", content: `this week's newest clean products:\n${productLines}` }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { error: `anthropic ${res.status}: ${detail.slice(0, 200)}` };
  }
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  // Delimiter format avoids fragile JSON-escaping of a large HTML body.
  const marker = "===HTML===";
  const idx = text.indexOf(marker);
  if (idx === -1) return { error: `claude format off: ${text.slice(0, 150)}` };
  const subjMatch = text.slice(0, idx).match(/SUBJECT:\s*(.+)/i);
  const subject = subjMatch ? subjMatch[1].trim() : "";
  const html = text.slice(idx + marker.length).trim();
  if (!subject || !html) return { error: "claude missing subject or html" };
  return { subject, html };
}

// Best-effort beehiiv draft. Returns the post id on success, null otherwise
// (e.g. the plan doesn't include API post creation — that's fine).
async function createBeehiivDraft(subject: string, html: string): Promise<string | null> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !pubId) return null;
  try {
    const res = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subject,
        body_content: html,
        status: "draft",
        email_settings: { email_subject_line: subject },
      }),
    });
    if (!res.ok) {
      console.warn(`beehiiv draft create skipped (${res.status})`);
      return null;
    }
    const data = await res.json();
    return data?.data?.id ?? null;
  } catch (e) {
    console.warn("beehiiv draft create error:", e);
    return null;
  }
}

// Temporary safe diagnostic: GET ?debug=1 reports only presence + length of the
// secrets (never values) so we can see what the live function actually reads.
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("debug") !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const n = process.env.NEWSLETTER_TRIGGER_SECRET;
  const c = process.env.CRON_SECRET;
  return NextResponse.json({
    newsletterSecretPresent: typeof n === "string",
    newsletterSecretLen: n ? n.length : 0,
    cronSecretPresent: typeof c === "string",
    cronSecretLen: c ? c.length : 0,
  });
}

export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. newest published, non-rejected products for "this week's edit"
  const { data: products, error: pErr } = await supabaseAdmin
    .from("products")
    .select("id, item_name, brand, item_price, currency, toxome_score, item_image, affiliate_url, item_url")
    .eq("published", true)
    .eq("rejected", false)
    .order("created_at", { ascending: false })
    .limit(PRODUCT_COUNT);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // 2. draft the digest
  const draft = await draftWithClaude((products ?? []) as Product[]);
  if ("error" in draft) {
    return NextResponse.json({ error: `Draft generation failed: ${draft.error}` }, { status: 502 });
  }

  // 3. save for review in /admin/content
  const { data: inserted, error: iErr } = await supabaseAdmin
    .from("content_drafts")
    .insert({
      source_type: "newsletter",
      platform: "newsletter",
      variant_type: "email",
      title: draft.subject,
      body: draft.html,
      status: "draft",
    })
    .select("id")
    .single();
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // 4. best-effort beehiiv draft
  const beehiivId = await createBeehiivDraft(draft.subject, draft.html);

  return NextResponse.json({
    ok: true,
    draftId: inserted?.id,
    subject: draft.subject,
    adminUrl: "https://toxome.app/admin/content",
    beehiivDraftCreated: Boolean(beehiivId),
    beehiivEditUrl: beehiivId ? "https://app.beehiiv.com/" : null,
  });
}
