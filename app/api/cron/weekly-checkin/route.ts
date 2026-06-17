import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Weekly Vercel Cron (Mondays). Pulls the aggregate-only summary from the
// Supabase RPC get_weekly_checkin() and emails it to the founder via Resend.
// Same auth pattern as the other crons: when CRON_SECRET is set, Vercel sends
// it as a bearer token and we require it (also lets you trigger by hand).
const REPORT_TO = process.env.REPORT_TO || "nyah@toxome.app";
const REPORT_FROM = process.env.REPORT_FROM || "Toxome Reports <onboarding@resend.dev>";

type Pair = { current: number; previous: number };
type Summary = {
  generated_at: string;
  window: { current_start: string; previous_start: string };
  totals: {
    events: Pair;
    unique_visitors: Pair;
    product_views: Pair;
    outbound_clicks: Pair;
    searches: Pair;
    items_liked: Pair;
    signups: Pair;
  };
  signups_by_method: Record<string, number>;
  top_products: { name: string; views: number }[];
  top_outbound_brands: { brand: string; clicks: number }[];
  top_searches: { query: string; count: number }[];
};

// "+193%", "−12%", or "new" when prior was zero but current isn't.
function delta(p: Pair): string {
  if (p.previous === 0) return p.current > 0 ? "new" : "0%";
  const pct = Math.round(((p.current - p.previous) / p.previous) * 100);
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

function kpiRow(label: string, p: Pair): string {
  const d = delta(p);
  const up = p.current >= p.previous;
  const color = d === "0%" ? "#8A9199" : up ? "#5b7a4f" : "#C84242";
  return `<tr>
    <td style="padding:8px 0;color:#57636C;font-size:14px">${label}</td>
    <td style="padding:8px 0;text-align:right;font-size:18px;font-weight:600;color:#3B3C3A">${p.current}</td>
    <td style="padding:8px 0 8px 14px;text-align:right;font-size:13px;color:${color}">${d}</td>
    <td style="padding:8px 0 8px 10px;text-align:right;font-size:12px;color:#8A9199">prev ${p.previous}</td>
  </tr>`;
}

function list(items: string[]): string {
  if (!items.length) return `<p style="color:#8A9199;font-size:13px;margin:4px 0 0">No data this week.</p>`;
  return `<ol style="margin:6px 0 0;padding-left:20px;color:#3B3C3A;font-size:14px;line-height:1.7">${items
    .map((i) => `<li>${i}</li>`)
    .join("")}</ol>`;
}

function buildHtml(s: Summary): string {
  const t = s.totals;
  const cv =
    t.unique_visitors.current > 0
      ? `${((t.signups.current / t.unique_visitors.current) * 100).toFixed(1)}%`
      : "—";
  const start = new Date(s.window.current_start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const end = new Date(s.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `<div style="background:#FCFBF7;padding:28px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:14px;padding:28px 30px">
      <p style="margin:0;font-size:11px;letter-spacing:0.13em;text-transform:uppercase;color:#8A9199;font-weight:600">Toxome · Weekly Check-in</p>
      <h1 style="margin:6px 0 2px;font-size:22px;color:#3B3C3A;font-weight:600">${start} – ${end}</h1>
      <p style="margin:0 0 18px;color:#8A9199;font-size:13px">vs. the previous 7 days</p>

      <table style="width:100%;border-collapse:collapse">
        ${kpiRow("Unique visitors", t.unique_visitors)}
        ${kpiRow("Product views", t.product_views)}
        ${kpiRow("Outbound clicks", t.outbound_clicks)}
        ${kpiRow("Searches", t.searches)}
        ${kpiRow("Items saved", t.items_liked)}
        ${kpiRow("Signups", t.signups)}
      </table>

      <div style="margin:18px 0;padding:12px 14px;background:#FCFBF7;border-radius:10px">
        <span style="color:#57636C;font-size:14px">Visitor → signup conversion</span>
        <span style="float:right;font-size:16px;font-weight:600;color:#3B3C3A">${cv}</span>
      </div>

      <h2 style="margin:22px 0 0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#57636C">Top products viewed</h2>
      ${list(s.top_products.map((p) => `${p.name} <span style="color:#8A9199">— ${p.views}</span>`))}

      <h2 style="margin:22px 0 0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#57636C">Top outbound brands</h2>
      ${list(s.top_outbound_brands.map((b) => `${b.brand} <span style="color:#8A9199">— ${b.clicks} clicks</span>`))}

      <h2 style="margin:22px 0 0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#57636C">Top searches</h2>
      ${list(s.top_searches.map((q) => `${q.query} <span style="color:#8A9199">— ${q.count}</span>`))}

      <p style="margin:24px 0 0;color:#8A9199;font-size:12px;line-height:1.6">First-party data from your Supabase events table. For traffic sources + page speed, see your <a href="https://vercel.com/nyahbrown-9828s-projects/toxome-website/analytics" style="color:#A8BDD3">Vercel dashboard</a>.</p>
    </div>
  </div>`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set — add it in Vercel env vars." },
      { status: 500 }
    );
  }

  // 1. Aggregate-only weekly summary (no PII).
  const { data, error } = await supabaseAdmin.rpc("get_weekly_checkin");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const summary = data as Summary;

  // 2. Build the email.
  const v = summary.totals.unique_visitors;
  const subject = `Toxome weekly: ${v.current} visitors (${delta(v)})`;
  const html = buildHtml(summary);

  // 3. Send via Resend.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: REPORT_FROM, to: REPORT_TO, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: `Resend failed (${res.status})`, detail },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sent_to: REPORT_TO, subject });
}
