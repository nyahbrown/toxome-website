import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public iCal (.ics) feed of the content calendar. Calendar apps can't send auth
// headers, so it's gated by a secret token in the query string instead:
//   https://toxome.app/api/calendar?token=<CALENDAR_FEED_TOKEN>
// Subscribe to that URL in Google Calendar (Other calendars → From URL) or Apple
// Calendar (File → New Calendar Subscription, using webcal://). Read-only — it
// only exposes scheduled posts, never edits anything.

const TABLE = "content_drafts";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  pinterest: "Pinterest",
  tiktok: "TikTok",
};

export async function GET(req: Request) {
  const token = process.env.CALENDAR_FEED_TOKEN;
  const { searchParams } = new URL(req.url);
  if (!token || searchParams.get("token") !== token) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Everything with a planned day: approved / scheduled / posted that has a date.
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("id, platform, title, source_ref, body, status, scheduled_at")
    .not("scheduled_at", "is", null)
    .order("scheduled_at", { ascending: true })
    .limit(1000);

  if (error) return new Response(`Error: ${error.message}`, { status: 500 });

  const stamp = toICalDate(new Date().toISOString(), true);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Toxome//Content Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Toxome content",
    "X-WR-CALDESC:Scheduled posts from the Toxome content dashboard",
  ];

  for (const d of data ?? []) {
    const day = (d.scheduled_at as string).slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const nextDay = addDay(day);
    const platform = PLATFORM_LABEL[d.platform] || d.platform;
    const headline = d.title || d.source_ref || "Post";
    const status = d.status === "posted" ? "✓ " : "";
    const summary = `${status}${platform} · ${headline}`;
    const desc = [d.body || "", "", `Platform: ${platform}`, `Status: ${d.status}`].join("\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${d.id}@toxome.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${nextDay}`,
      `SUMMARY:${escapeICal(summary)}`,
      `DESCRIPTION:${escapeICal(desc)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  // iCal requires CRLF line endings.
  const body = lines.map(foldLine).join("\r\n") + "\r\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="toxome-content.ics"',
      "Cache-Control": "no-cache, max-age=0",
    },
  });
}

function toICalDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
  if (!withTime) return date;
  return `${date}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function addDay(yyyymmdd: string): string {
  const y = +yyyymmdd.slice(0, 4);
  const m = +yyyymmdd.slice(4, 6);
  const day = +yyyymmdd.slice(6, 8);
  const d = new Date(Date.UTC(y, m - 1, day + 1));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
}

// Escape per RFC 5545: backslash, semicolon, comma, and newlines.
function escapeICal(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold lines longer than 75 octets (RFC 5545) with a leading space on continues.
function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    chunks.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest.length) chunks.push(" " + rest);
  return chunks.join("\r\n");
}
