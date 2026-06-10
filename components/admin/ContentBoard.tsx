"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zipStore, type ZipEntry } from "@/lib/zip";

// ── Types ────────────────────────────────────────────────────────────────
type Status = "draft" | "needs_edit" | "approved" | "scheduled" | "posted";

type Draft = {
  id: string;
  seq: number; // short human-referenceable id, shown as #N
  created_at: string;
  group_id: string;
  source_type: string;
  source_ref: string | null;
  platform: string;
  variant_type: string;
  title: string | null;
  body: string;
  media_url: string | null;
  media_type: string | null;
  status: Status;
  comment: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  external_id: string | null;
  push_error: string | null;
};

// The three things you ever want to look at, in order of how often you do.
type Filter = "review" | "scheduled" | "posted";
const FILTERS: { key: Filter; label: string; statuses: Status[] }[] = [
  { key: "review", label: "Needs review", statuses: ["draft", "needs_edit"] },
  { key: "scheduled", label: "Scheduled", statuses: ["approved", "scheduled"] },
  { key: "posted", label: "Posted", statuses: ["posted"] },
];

// ── Date helpers ───────────────────────────────────────────────────────────
// <input type="datetime-local"> works in local time; we store ISO/UTC.
function isoFromLocalInput(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function localInputFromIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function dayKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function prettyDay(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function prettyTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now() + 60_000;
}

// ── Platforms & formats ─────────────────────────────────────────────────────
const PLATFORMS = ["instagram", "twitter", "pinterest", "tiktok"] as const;
// Posted by hand (native), never auto-published. Mirrors MANUAL_PLATFORMS in
// lib/scheduler. Approving marks them ready; the card shows a native-post block.
const MANUAL_PLATFORMS = new Set<string>(["tiktok"]);

const PLATFORM_RANK: Record<string, number> = { instagram: 0, tiktok: 1, pinterest: 2, twitter: 3 };
const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter / X",
  pinterest: "Pinterest",
  tiktok: "TikTok",
};
// One in-palette accent dot per platform, scannable without platform-logo colors.
const PLATFORM_ACCENT: Record<string, string> = {
  instagram: "var(--blue)",
  twitter: "var(--ink-2)",
  pinterest: "var(--purple)",
  tiktok: "var(--ink)",
};

function PlatformTag({ platform, size = "md" }: { platform: string; size?: "sm" | "md" }) {
  const small = size === "sm";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: small ? 5 : 6 }}>
      <span style={{ width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: 999, background: PLATFORM_ACCENT[platform] || "var(--ink-3)", flexShrink: 0 }} />
      <span style={{ fontFamily: "var(--sans)", fontSize: small ? 9 : 10, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-2)" }}>
        {PLATFORM_LABEL[platform] || platform}
      </span>
    </span>
  );
}

// A carousel idea is all the platform drafts that share a group_id; a lone draft
// is a group of one. Lanes are keyed by format/platform so the board reads the
// way you think about it.
type Group = { id: string; drafts: Draft[] };

function laneFor(group: Group): { key: string; label: string; rank: number } {
  if (group.drafts.some((d) => d.media_type === "carousel")) return { key: "carousel", label: "Carousels", rank: 1 };
  const p = group.drafts[0].platform;
  if (p === "twitter") return { key: "tweets", label: "X · Tweets", rank: 0 };
  if (p === "instagram") return { key: "instagram", label: "Instagram · Posts", rank: 2 };
  if (p === "pinterest") return { key: "pinterest", label: "Pinterest · Pins", rank: 3 };
  if (p === "tiktok") return { key: "tiktok", label: "TikTok", rank: 4 };
  return { key: p, label: PLATFORM_LABEL[p] || p, rank: 5 };
}

const formatLabel = (group: Group): string => {
  if (group.drafts.some((d) => d.media_type === "carousel")) return "Carousel";
  if (group.drafts.some((d) => d.media_type === "video")) return "Video";
  if (group.drafts[0].platform === "twitter") return "Tweet";
  if (group.drafts[0].platform === "pinterest") return "Pin";
  return group.drafts.some((d) => d.media_url) ? "Image" : "Text";
};

// ── Media download helpers ─────────────────────────────────────────────────
async function fetchDownload(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(obj), 1500);
    return true;
  } catch {
    return false;
  }
}

function carouselSlideUrls(coverUrl: string): { url: string; name: string }[] | null {
  const m = coverUrl.match(/^(.*\/)slide-0\.(png|jpe?g|webp)$/i);
  if (!m) return null;
  const [, base, ext] = m;
  const slug = base.replace(/\/$/, "").split("/").pop() || "carousel";
  return Array.from({ length: 10 }, (_, i) => ({ url: `${base}slide-${i}.${ext}`, name: `${slug}-slide-${i}.${ext}` }));
}

async function downloadDraftMedia(draft: Draft): Promise<void> {
  if (!draft.media_url) return;
  const slides = draft.media_type === "carousel" ? carouselSlideUrls(draft.media_url) : null;
  if (slides) {
    const slug = slides[0].name.replace(/-slide-0\.[^.]+$/, "") || "carousel";
    const entries: ZipEntry[] = [];
    for (const s of slides) {
      const res = await fetch(s.url).catch(() => null);
      if (!res || !res.ok) break;
      entries.push({ name: s.name, data: new Uint8Array(await res.arrayBuffer()) });
    }
    if (entries.length) {
      const blob = zipStore(entries);
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = `${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(obj), 1500);
    }
  } else {
    const name = draft.media_url.split("/").pop() || "toxome-image";
    await fetchDownload(draft.media_url, name);
  }
}

function DownloadButton({ draft, style }: { draft: Draft; style: React.CSSProperties }) {
  const [busy, setBusy] = useState(false);
  if (!draft.media_url) return null;
  const isCarousel = draft.media_type === "carousel";
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await downloadDraftMedia(draft);
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      style={{ ...style, opacity: busy ? 0.6 : 1 }}
      title={isCarousel ? "Download all slides as one .zip" : "Download image"}
    >
      {busy ? "Zipping…" : isCarousel ? "↓ Slides (.zip)" : "↓ Image"}
    </button>
  );
}

function CopyButton({ text, style, label = "Copy caption" }: { text: string; style: React.CSSProperties; label?: string }) {
  const [done, setDone] = useState(false);
  if (!text.trim()) return null;
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      style={style}
      title="Copy to clipboard"
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

// ── Main board ──────────────────────────────────────────────────────────────
export default function ContentBoard({ getToken }: { getToken: () => Promise<string> }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [schedulerOn, setSchedulerOn] = useState(false);
  const [calendarFeedUrl, setCalendarFeedUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("review");
  const [showComposer, setShowComposer] = useState(false);

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const t = await getToken();
      return fetch(input, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${t}`, "Content-Type": "application/json" } });
    },
    [getToken]
  );

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await authedFetch("/api/admin/content");
      if (!res.ok) throw new Error((await res.json()).error || `Error ${res.status}`);
      const data = await res.json();
      setDrafts(data.drafts as Draft[]);
      setSchedulerOn(!!data.schedulerConfigured);
      setCalendarFeedUrl(data.calendarFeedUrl ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback(
    async (id: string, updates: Partial<Draft>) => {
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      const res = await authedFetch("/api/admin/content", { method: "PATCH", body: JSON.stringify({ id, ...updates }) });
      if (res.ok) {
        const data = await res.json();
        if (data.draft) setDrafts((prev) => prev.map((d) => (d.id === id ? data.draft : d)));
      } else {
        load();
      }
    },
    [authedFetch, load]
  );

  const remove = useCallback(
    async (id: string) => {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      await authedFetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
    },
    [authedFetch]
  );

  // Group every draft by group_id once; views slice these by status.
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Draft[]>();
    for (const d of drafts) {
      const arr = map.get(d.group_id);
      if (arr) arr.push(d);
      else map.set(d.group_id, [d]);
    }
    const rank = (p: string) => PLATFORM_RANK[p] ?? 99;
    const out: Group[] = [];
    for (const [id, members] of map) {
      out.push({ id, drafts: [...members].sort((a, b) => rank(a.platform) - rank(b.platform)) });
    }
    return out;
  }, [drafts]);

  // Per-filter counts for the segmented control.
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { review: 0, scheduled: 0, posted: 0 };
    for (const f of FILTERS) c[f.key] = drafts.filter((d) => f.statuses.includes(d.status)).length;
    return c;
  }, [drafts]);

  // Approve / flag / delete a whole group, no animation, no scoring.
  const approveGroup = useCallback(
    (group: Group, edits: GroupEdits) => {
      for (const d of group.drafts) {
        if (d.status === "posted") continue;
        const cap = edits.caps[d.id] ?? { body: d.body, title: d.title ?? "" };
        const updates: Partial<Draft> = {
          status: "approved",
          body: cap.body,
          comment: edits.comment || null,
          scheduled_at: edits.schedule ? isoFromLocalInput(edits.schedule) : null,
        };
        if (d.platform === "pinterest" || d.platform === "tiktok") updates.title = cap.title || null;
        patch(d.id, updates);
      }
    },
    [patch]
  );

  const flagGroup = useCallback(
    (group: Group, edits: GroupEdits) => {
      for (const d of group.drafts) {
        if (d.status === "posted") continue;
        const cap = edits.caps[d.id] ?? { body: d.body, title: d.title ?? "" };
        const updates: Partial<Draft> = { status: "needs_edit", body: cap.body, comment: edits.comment || null };
        if (d.platform === "pinterest" || d.platform === "tiktok") updates.title = cap.title || null;
        patch(d.id, updates);
      }
    },
    [patch]
  );

  const deleteGroup = useCallback(
    (group: Group) => {
      if (group.drafts.length > 1 && !confirm("Delete this whole set across every platform?")) return;
      group.drafts.forEach((d) => remove(d.id));
    },
    [remove]
  );

  const webcal = calendarFeedUrl ? calendarFeedUrl.replace(/^https?:/, "webcal:") : null;
  const activeStatuses = FILTERS.find((f) => f.key === filter)!.statuses;
  const activeGroups = useMemo(
    () => groups.filter((g) => g.drafts.some((d) => activeStatuses.includes(d.status))),
    [groups, activeStatuses]
  );

  return (
    <div>
      {/* Header: title + the one segmented control that runs everything */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={eyebrow}>Content</div>
          <h1 style={pageTitle}>The board</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" }}>
            {schedulerOn ? "approve publishes live" : "approve-only mode"}
          </span>
          <button onClick={() => setShowComposer((s) => !s)} style={{ ...pill, ...pillPrimary }}>
            {showComposer ? "Close" : "New draft"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ ...pill, ...(on ? pillOn : pillOff) }}>
              {f.label}
              <span style={{ marginLeft: 7, opacity: on ? 0.75 : 0.55, fontVariantNumeric: "tabular-nums" }}>{counts[f.key]}</span>
            </button>
          );
        })}
      </div>

      {showComposer && <Composer authedFetch={authedFetch} onCreated={load} />}
      {err && <div style={errNotice}>{err}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={eyebrow}>Loading</div>
          <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-3)", marginTop: 8 }}>Opening the board…</p>
        </div>
      ) : filter === "scheduled" ? (
        <ScheduledView groups={activeGroups} onPatch={patch} feedUrl={calendarFeedUrl} webcal={webcal} />
      ) : filter === "posted" ? (
        <PostedView groups={activeGroups} onPatch={patch} />
      ) : (
        <ReviewLanes groups={activeGroups} schedulerOn={schedulerOn} onApprove={approveGroup} onFlag={flagGroup} onDelete={deleteGroup} />
      )}
    </div>
  );
}

// ── Review: lanes by format/platform, every card actionable at once ──────────
function ReviewLanes({
  groups,
  schedulerOn,
  onApprove,
  onFlag,
  onDelete,
}: {
  groups: Group[];
  schedulerOn: boolean;
  onApprove: (g: Group, e: GroupEdits) => void;
  onFlag: (g: Group, e: GroupEdits) => void;
  onDelete: (g: Group) => void;
}) {
  const lanes = useMemo(() => {
    const map = new Map<string, { label: string; rank: number; groups: Group[] }>();
    for (const g of groups) {
      const { key, label, rank } = laneFor(g);
      const lane = map.get(key);
      if (lane) lane.groups.push(g);
      else map.set(key, { label, rank, groups: [g] });
    }
    return [...map.values()].sort((a, b) => a.rank - b.rank);
  }, [groups]);

  if (!groups.length) {
    return <Empty title="Nothing to review" line="New drafts land here, grouped by platform and format. The daily X engine fills this each morning." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {lanes.map((lane) => (
        <Lane key={lane.label} label={lane.label} count={lane.groups.length}>
          <div style={cardGrid}>
            {lane.groups.map((g) => (
              <ReviewCard key={g.id} group={g} schedulerOn={schedulerOn} onApprove={onApprove} onFlag={onFlag} onDelete={onDelete} />
            ))}
          </div>
        </Lane>
      ))}
    </div>
  );
}

function Lane({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button onClick={() => setOpen((o) => !o)} style={laneHead}>
        <span style={{ display: "inline-flex", width: 14, justifyContent: "center", color: "var(--ink-3)", transform: open ? "none" : "rotate(-90deg)", transition: "transform .15s" }}>▾</span>
        <span style={laneLabel}>{label}</span>
        <span style={laneCount}>{count}</span>
      </button>
      {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </section>
  );
}

type GroupEdits = { caps: Record<string, { body: string; title: string }>; comment: string; schedule: string };

// One reviewable card: shared media once, a caption editor per platform, a shared
// schedule, and one Approve that publishes every platform (TikTok stays native).
function ReviewCard({
  group,
  schedulerOn,
  onApprove,
  onFlag,
  onDelete,
}: {
  group: Group;
  schedulerOn: boolean;
  onApprove: (g: Group, e: GroupEdits) => void;
  onFlag: (g: Group, e: GroupEdits) => void;
  onDelete: (g: Group) => void;
}) {
  const [caps, setCaps] = useState<Record<string, { body: string; title: string }>>(() => {
    const next: Record<string, { body: string; title: string }> = {};
    for (const d of group.drafts) next[d.id] = { body: d.body, title: d.title ?? "" };
    return next;
  });
  const [comment, setComment] = useState("");
  const existingSchedule = group.drafts.find((d) => d.scheduled_at);
  const [schedule, setSchedule] = useState(existingSchedule ? localInputFromIso(existingSchedule.scheduled_at) : "");
  const [done, setDone] = useState<null | "approved" | "flagged">(null);

  const setCap = (id: string, p: Partial<{ body: string; title: string }>) =>
    setCaps((c) => ({ ...c, [id]: { body: c[id]?.body ?? "", title: c[id]?.title ?? "", ...p } }));

  const edits = { caps, comment, schedule };
  const mediaDraft = group.drafts.find((d) => d.media_url) ?? group.drafts[0];
  const scheduledFuture = isFuture(isoFromLocalInput(schedule));
  const autoPlatforms = group.drafts.filter((d) => !MANUAL_PLATFORMS.has(d.platform));
  const manualPlatforms = group.drafts.filter((d) => MANUAL_PLATFORMS.has(d.platform));
  const autoLabel = autoPlatforms.map((d) => PLATFORM_LABEL[d.platform] || d.platform).join(" · ");
  const approveLabel = !schedulerOn ? "Approve" : autoLabel ? `${scheduledFuture ? "Schedule" : "Publish"} → ${autoLabel}` : "Mark ready";

  const flagged = group.drafts.some((d) => d.status === "needs_edit");
  const pushError = group.drafts.find((d) => d.push_error)?.push_error;

  return (
    <div style={{ ...cardSurface, opacity: done ? 0.5 : 1, transition: "opacity .25s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {group.drafts.map((d) => (
            <PlatformTag key={d.id} platform={d.platform} />
          ))}
          <span style={chip}>{formatLabel(group)}</span>
          <span style={idTag}>#{group.drafts[0].seq}</span>
          {flagged && <span style={{ ...chip, color: "var(--orange)", borderColor: "var(--orange)" }}>needs edit</span>}
        </div>
        <button onClick={() => onDelete(group)} style={xBtn} title="Delete">×</button>
      </div>

      {mediaDraft.source_ref && <div style={sourceLine} title={mediaDraft.source_ref}>from {mediaDraft.source_ref}</div>}

      {mediaDraft.media_url &&
        (mediaDraft.media_type === "video" ? (
          <video src={mediaDraft.media_url} style={cardMedia} controls muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaDraft.media_url} alt="" style={cardMedia} />
        ))}

      {/* a caption editor per platform */}
      {group.drafts.map((d) => {
        const cap = caps[d.id] ?? { body: d.body, title: d.title ?? "" };
        const usesTitle = d.platform === "pinterest" || d.platform === "tiktok";
        return (
          <div key={d.id} style={{ marginTop: 12 }}>
            {group.drafts.length > 1 && (
              <div style={{ marginBottom: 6 }}>
                <PlatformTag platform={d.platform} />
              </div>
            )}
            {usesTitle && (
              <input
                value={cap.title}
                onChange={(e) => setCap(d.id, { title: e.target.value })}
                placeholder={d.platform === "pinterest" ? "pin title (the search query)" : "tiktok title (optional, ≤90 chars)"}
                style={titleInput}
              />
            )}
            <textarea value={cap.body} onChange={(e) => setCap(d.id, { body: e.target.value })} rows={d.platform === "twitter" ? 5 : 4} style={bodyArea} />
            {MANUAL_PLATFORMS.has(d.platform) && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ ...sourceLine, marginBottom: 0, whiteSpace: "normal" }}>posted by hand (API throttles reach), grab these then post in-app:</span>
                <DownloadButton draft={mediaDraft} style={miniGhost} />
                <CopyButton text={cap.body} style={miniGhost} />
              </div>
            )}
          </div>
        );
      })}

      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={1} placeholder="note to self (optional)…" style={{ ...commentArea, marginTop: 12 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
        <span style={miniLabel}>Publish at</span>
        <input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} style={dateInput} />
        <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-3)" }}>{schedule ? (scheduledFuture ? "" : "now") : "now"}</span>
      </div>

      {pushError && <div style={{ ...errNotice, margin: "12px 0 0", fontSize: 12 }}>push failed: {pushError}</div>}
      {manualPlatforms.length > 0 && (
        <p style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-3)", margin: "10px 0 0" }}>
          {manualPlatforms.map((d) => PLATFORM_LABEL[d.platform] || d.platform).join(" · ")} is posted by hand; approving marks it ready and hands you the slides + caption above.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => {
            setDone("approved");
            onApprove(group, edits);
          }}
          style={{ ...btn, ...btnApprove }}
        >
          {approveLabel}
        </button>
        <button
          onClick={() => {
            setDone("flagged");
            onFlag(group, edits);
          }}
          style={{ ...btn, ...btnGhost }}
        >
          Needs edit
        </button>
      </div>
    </div>
  );
}

// ── Scheduled: a plain upcoming list, grouped by day, plus undated approveds ──
function ScheduledView({
  groups,
  onPatch,
  feedUrl,
  webcal,
}: {
  groups: Group[];
  onPatch: (id: string, u: Partial<Draft>) => void;
  feedUrl: string | null;
  webcal: string | null;
}) {
  const drafts = groups.flatMap((g) => g.drafts);
  const dated = [...drafts].filter((d) => d.scheduled_at).sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""));
  const undated = drafts.filter((d) => !d.scheduled_at);

  const byDay = (() => {
    const map = new Map<string, Draft[]>();
    for (const d of dated) {
      const k = dayKey(d.scheduled_at);
      const arr = map.get(k);
      if (arr) arr.push(d);
      else map.set(k, [d]);
    }
    return [...map.entries()];
  })();

  return (
    <div>
      <SubscribePanel feedUrl={feedUrl} webcal={webcal} />
      {drafts.length === 0 ? (
        <Empty title="Nothing scheduled" line="Approve drafts in Needs review and they line up here. Give one a time and it publishes itself." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {byDay.map(([k, items]) => (
            <section key={k}>
              <div style={laneHeadStatic}>
                <span style={laneLabel}>{prettyDay(items[0].scheduled_at)}</span>
                <span style={laneCount}>{items.length}</span>
              </div>
              <div style={{ ...cardGrid, marginTop: 12 }}>
                {items.map((d) => (
                  <ScheduleRow key={d.id} draft={d} onPatch={onPatch} />
                ))}
              </div>
            </section>
          ))}
          {undated.length > 0 && (
            <Lane label="No time yet" count={undated.length}>
              <div style={cardGrid}>
                {undated.map((d) => (
                  <ScheduleRow key={d.id} draft={d} onPatch={onPatch} />
                ))}
              </div>
            </Lane>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ draft, onPatch }: { draft: Draft; onPatch: (id: string, u: Partial<Draft>) => void }) {
  return (
    <div style={{ ...cardSurface, padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
      {draft.media_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.media_url} alt="" style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "var(--tan)" }} />
      ) : (
        <div style={{ width: 48, height: 60, borderRadius: 8, background: "var(--tan)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)" }}>TXT</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <PlatformTag platform={draft.platform} size="sm" />
          <span style={{ ...idTag, fontSize: 10 }}>#{draft.seq}</span>
          {draft.scheduled_at && <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: isFuture(draft.scheduled_at) ? "var(--ink-2)" : "var(--ink-3)" }}>{prettyTime(draft.scheduled_at)}</span>}
        </div>
        <div style={clamp2}>{draft.title || draft.body.slice(0, 100)}</div>
        {draft.push_error && <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--red)", marginTop: 5 }}>push failed: {draft.push_error}</div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
          <input
            type="datetime-local"
            value={localInputFromIso(draft.scheduled_at)}
            onChange={(e) => onPatch(draft.id, { scheduled_at: isoFromLocalInput(e.target.value) })}
            style={dateInput}
          />
          <DownloadButton draft={draft} style={miniGhost} />
          <CopyButton text={draft.body} style={miniGhost} />
          <button onClick={() => onPatch(draft.id, { status: "posted" })} style={miniGhost} title="Mark as posted">Mark posted</button>
        </div>
      </div>
    </div>
  );
}

// ── Posted: read-back lanes with an undo toggle ──────────────────────────────
function PostedView({ groups, onPatch }: { groups: Group[]; onPatch: (id: string, u: Partial<Draft>) => void }) {
  const drafts = groups.flatMap((g) => g.drafts).filter((d) => d.status === "posted");
  drafts.sort((a, b) => (b.posted_at || b.created_at).localeCompare(a.posted_at || a.created_at));
  if (!drafts.length) return <Empty title="Nothing posted yet" line="Once a post goes live (or you mark a native post done) it lands here." />;
  return (
    <div style={cardGrid}>
      {drafts.map((d) => (
        <div key={d.id} style={{ ...cardSurface, padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
          {d.media_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.media_url} alt="" style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "var(--tan)" }} />
          ) : (
            <div style={{ width: 48, height: 60, borderRadius: 8, background: "var(--tan)", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <PlatformTag platform={d.platform} size="sm" />
              <span style={{ ...idTag, fontSize: 10 }}>#{d.seq}</span>
              {d.posted_at && <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--ink-3)" }}>{prettyDay(d.posted_at)}</span>}
            </div>
            <div style={clamp2}>{d.title || d.body.slice(0, 100)}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => onPatch(d.id, { status: "approved" })} style={miniPosted} title="Unmark posted">✓ Posted</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── iCal subscribe ───────────────────────────────────────────────────────────
function SubscribePanel({ feedUrl, webcal }: { feedUrl: string | null; webcal: string | null }) {
  const [open, setOpen] = useState(false);
  if (!feedUrl) return null;
  return (
    <div style={{ ...cardSurface, padding: open ? 18 : 12, marginBottom: 22 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ ...laneHead, marginBottom: open ? 12 : 0 }}>
        <span style={{ display: "inline-flex", width: 14, justifyContent: "center", color: "var(--ink-3)", transform: open ? "none" : "rotate(-90deg)", transition: "transform .15s" }}>▾</span>
        <span style={laneLabel}>Sync to your calendar</span>
      </button>
      {open && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <a href={webcal || "#"} style={{ ...miniPosted, textDecoration: "none" }}>Add to Apple Calendar</a>
            <CopyButton text={feedUrl} style={miniGhost} label="Copy feed link" />
            <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" }}>Google: Other calendars → From URL → paste</span>
          </div>
          <input readOnly value={feedUrl} onFocus={(e) => e.currentTarget.select()} style={{ ...baseInput, fontSize: 12 }} />
          <p style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-3)", margin: "8px 0 0" }}>Keep this link private, it carries your feed token.</p>
        </>
      )}
    </div>
  );
}

// ── New-draft composer ──────────────────────────────────────────────────────
function Composer({ authedFetch, onCreated }: { authedFetch: (input: string, init?: RequestInit) => Promise<Response>; onCreated: () => void }) {
  const [platform, setPlatform] = useState<string>("twitter");
  const [sourceRef, setSourceRef] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    await authedFetch("/api/admin/content", {
      method: "POST",
      body: JSON.stringify({
        platform,
        variant_type: platform === "pinterest" ? "pin" : platform === "twitter" ? "post" : platform === "tiktok" ? "carousel" : "reel_caption",
        source_ref: sourceRef || null,
        body,
        media_url: mediaUrl || null,
        media_type: mediaUrl ? "image" : null,
      }),
    });
    setSaving(false);
    setBody("");
    setMediaUrl("");
    setSourceRef("");
    onCreated();
  };

  return (
    <div style={{ ...cardSurface, marginBottom: 22, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={selectInput}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
          ))}
        </select>
        <input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="source (url / article title, optional)" style={{ ...titleInput, flex: 1, marginBottom: 0 }} />
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="post copy…" style={bodyArea} />
      <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="image / carousel cover url (optional)" style={{ ...titleInput, marginBottom: 10 }} />
      <button onClick={submit} disabled={saving || !body.trim()} style={{ ...pill, ...pillPrimary }}>{saving ? "Saving…" : "Add to board"}</button>
    </div>
  );
}

function Empty({ title, line }: { title: string; line: string }) {
  return (
    <div style={{ ...cardSurface, textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)", margin: "0 auto", maxWidth: 380, lineHeight: 1.5 }}>{line}</p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const eyebrow: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-3)" };
const pageTitle: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", margin: "5px 0 0" };

const cardSurface: React.CSSProperties = { background: "var(--white)", border: "1px solid var(--hairline-strong)", borderRadius: 14, padding: 16 };
const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14, alignItems: "start" };
const cardMedia: React.CSSProperties = { width: "100%", borderRadius: 10, marginTop: 4, display: "block", aspectRatio: "4 / 5", objectFit: "cover", background: "var(--tan)" };

const laneHead: React.CSSProperties = { display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" };
const laneHeadStatic: React.CSSProperties = { display: "flex", alignItems: "center", gap: 9 };
const laneLabel: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" };
const laneCount: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" };

const sourceLine: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-3)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const idTag: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" };
const chip: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", border: "1px solid var(--hairline-strong)", borderRadius: 999, padding: "2px 8px" };
const miniLabel: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-3)" };
const clamp2: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" };

const baseInput: React.CSSProperties = { width: "100%", fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)", background: "var(--cream)", border: "1px solid var(--hairline-strong)", borderRadius: 8, padding: "10px 12px", boxSizing: "border-box" };
const titleInput: React.CSSProperties = { ...baseInput, fontSize: 13, marginBottom: 8 };
const selectInput: React.CSSProperties = { ...baseInput, fontSize: 13, width: "auto" };
const bodyArea: React.CSSProperties = { ...baseInput, marginBottom: 0, resize: "vertical", lineHeight: 1.5 };
const commentArea: React.CSSProperties = { ...baseInput, fontSize: 13, marginBottom: 0, resize: "vertical", background: "var(--white)", borderStyle: "dashed" };

const pill: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 13, padding: "8px 16px", borderRadius: 999, cursor: "pointer", letterSpacing: "-0.005em" };
const pillOn: React.CSSProperties = { border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--white)" };
const pillOff: React.CSSProperties = { border: "1px solid var(--hairline-strong)", background: "var(--white)", color: "var(--ink-2)" };
const pillPrimary: React.CSSProperties = { border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--white)" };

const btn: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, padding: "10px 18px", borderRadius: 999, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 };
const btnApprove: React.CSSProperties = { border: "1px solid var(--blue)", background: "var(--blue)", color: "var(--ink)" };
const btnGhost: React.CSSProperties = { border: "1px solid var(--hairline-strong)", background: "var(--white)", color: "var(--ink-2)" };

const miniGhost: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 12, padding: "6px 11px", borderRadius: 999, cursor: "pointer", background: "var(--white)", color: "var(--ink-2)", border: "1px solid var(--hairline-strong)" };
const miniPosted: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 12, padding: "6px 11px", borderRadius: 999, cursor: "pointer", background: "var(--risk-low)", color: "var(--ink)", border: "1px solid var(--risk-low)" };
const dateInput: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 12, padding: "5px 9px", borderRadius: 8, background: "var(--white)", color: "var(--ink)", border: "1px solid var(--hairline-strong)", cursor: "pointer" };
const xBtn: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 18, lineHeight: 1, width: 26, height: 26, flexShrink: 0, borderRadius: 999, border: "1px solid var(--hairline-strong)", background: "var(--white)", color: "var(--ink-3)", cursor: "pointer" };

const errNotice: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 13, color: "var(--red)", background: "var(--white)", border: "1px solid var(--hairline-strong)", borderRadius: 10, padding: "11px 14px", marginBottom: 16 };
