"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { burstConfetti } from "@/lib/confetti";
import { zipStore, type ZipEntry } from "@/lib/zip";
import {
  loadGame,
  saveGame,
  registerReview,
  levelInfo,
  todayStr,
  POINTS,
  COMBO_BONUS,
  type GameState,
} from "@/lib/contentGame";

// ── Types ────────────────────────────────────────────────────────────────
type Status = "draft" | "needs_edit" | "approved" | "scheduled";

type Draft = {
  id: string;
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
  external_id: string | null;
  push_error: string | null;
};

const COLUMNS: { key: Status; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "needs_edit", label: "Needs edit" },
  { key: "approved", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
];

const PLATFORMS = ["instagram", "twitter", "pinterest"] as const;
const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter / X",
  pinterest: "Pinterest",
};

type Float = { id: number; text: string; tone: "pos" | "big" };

// ── Media download helpers ─────────────────────────────────────────────────
// Lets you save the slide PNGs to disk for manual posting while auto-push is
// still dormant. Carousel covers are stored as `…/slide-0.png`; we derive the
// sibling slides (slide-1, slide-2, …) and stop at the first one missing.
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
  // Up to 10 slides; downloader bails at the first missing file.
  return Array.from({ length: 10 }, (_, i) => ({
    url: `${base}slide-${i}.${ext}`,
    name: `${slug}-slide-${i}.${ext}`,
  }));
}

async function downloadDraftMedia(draft: Draft): Promise<void> {
  if (!draft.media_url) return;
  const slides = draft.media_type === "carousel" ? carouselSlideUrls(draft.media_url) : null;
  if (slides) {
    // Bundle every slide into ONE .zip so a carousel downloads as a single
    // file. Fetch slides in order; stop at the first gap (end of the set).
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

function CopyCaptionButton({ text, style }: { text: string; style: React.CSSProperties }) {
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
          /* clipboard blocked — ignore */
        }
      }}
      style={style}
      title="Copy the caption text"
    >
      {done ? "Copied ✓" : "Copy caption"}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export default function ContentBoard({ getToken }: { getToken: () => Promise<string> }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [schedulerOn, setSchedulerOn] = useState(false);
  const [view, setView] = useState<"review" | "board">("review");
  const [showComposer, setShowComposer] = useState(false);

  // Game state (persisted to localStorage)
  const [game, setGame] = useState<GameState>(() => loadGame());
  useEffect(() => saveGame(game), [game]);

  // Review session state
  const [index, setIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [anim, setAnim] = useState<"approve" | "reject" | "skip" | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const floatId = useRef(0);
  const busy = useRef(false);

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const t = await getToken();
      return fetch(input, {
        ...init,
        headers: { ...(init.headers || {}), Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      });
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

  // The review queue = things awaiting your decision (status "draft"), oldest first.
  const queue = useMemo(
    () =>
      drafts
        .filter((d) => d.status === "draft")
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [drafts]
  );

  const byStatus = useMemo(() => {
    const map: Record<Status, Draft[]> = { draft: [], needs_edit: [], approved: [], scheduled: [] };
    for (const d of drafts) map[d.status]?.push(d);
    return map;
  }, [drafts]);

  const spawnFloat = useCallback((text: string, tone: "pos" | "big") => {
    const id = ++floatId.current;
    setFloats((f) => [...f, { id, text, tone }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 850);
  }, []);

  const todayCount = game.todayDate === todayStr() ? game.todayCount : 0;
  const lvl = levelInfo(game.xp);

  // Apply a review decision with animation + scoring.
  const decide = useCallback(
    (action: "approve" | "needs_edit" | "skip", current: Draft, edits: { body: string; title: string; comment: string }) => {
      if (busy.current) return;
      busy.current = true;
      const dir = action === "approve" ? "approve" : action === "needs_edit" ? "reject" : "skip";
      setAnim(dir);

      setTimeout(() => {
        if (action === "skip") {
          setCombo(0);
          setIndex((i) => i + 1);
        } else {
          const thoughtful =
            edits.body.trim() !== current.body.trim() || edits.comment.trim().length > 0;
          const base =
            action === "approve" ? (thoughtful ? POINTS.approveThoughtful : POINTS.approve) : POINTS.needsEdit;

          // Combo only builds on approvals.
          let nextCombo = action === "approve" ? combo + 1 : 0;
          let bonus = 0;
          if (action === "approve" && COMBO_BONUS[nextCombo]) bonus = COMBO_BONUS[nextCombo];
          setCombo(nextCombo);

          const updates: Partial<Draft> = {
            status: action === "approve" ? "approved" : "needs_edit",
            body: edits.body,
            comment: edits.comment || null,
          };
          if (current.platform === "pinterest") updates.title = edits.title || null;
          patch(current.id, updates);

          const total = base + bonus;
          const res = registerReview(game, total);
          setGame((g) => {
            const r = registerReview(g, total);
            const merged = { ...r.next };
            if (nextCombo > merged.bestCombo) merged.bestCombo = nextCombo;
            return merged;
          });

          spawnFloat(`+${total}${bonus ? ` (combo ×${nextCombo})` : ""}`, bonus ? "big" : "pos");

          if (res.goalJustHit) {
            burstConfetti({ count: 90 });
            spawnFloat("daily goal hit", "big");
          }
          // index stays — the approved/flagged card drops out of the queue and
          // the next one slides into this slot.
        }
        setAnim(null);
        busy.current = false;
      }, 240);
    },
    [combo, game, patch, spawnFloat]
  );

  // Celebrate clearing the whole queue — but only when it actually drained from
  // a non-empty state this session (not just because you opened an empty board).
  const clearedRef = useRef(false);
  const hadItemsRef = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (queue.length > 0) {
      hadItemsRef.current = true;
      clearedRef.current = false;
      return;
    }
    if (queue.length === 0 && hadItemsRef.current && !clearedRef.current && view === "review") {
      clearedRef.current = true;
      burstConfetti({ count: 160 });
      setGame((g) => ({ ...g, xp: g.xp + POINTS.clearQueue }));
    }
  }, [queue.length, loading, view]);

  return (
    <div>
      <GameStyles />

      {/* HUD */}
      <GameHud game={game} todayCount={todayCount} lvl={lvl} combo={combo} queueLeft={queue.length} />

      {/* View toggle + composer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 0 18px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["review", "board"] as const).map((v) => {
            const on = view === v;
            return (
              <button key={v} onClick={() => setView(v)} style={{ ...pill, ...(on ? pillOn : pillOff) }}>
                {v === "review" ? "Review" : "Board"}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" }}>
            {schedulerOn ? "approve → pushes to scheduler" : "approve-only mode"}
          </span>
          <button onClick={() => setShowComposer((s) => !s)} style={{ ...pill, ...pillPrimary }}>
            {showComposer ? "Close" : "New draft"}
          </button>
        </div>
      </div>

      {showComposer && <Composer authedFetch={authedFetch} onCreated={load} />}

      {err && <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--red)", marginBottom: 16 }}>{err}</div>}

      {loading ? (
        <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-3)" }}>Loading…</span>
      ) : view === "review" ? (
        <ReviewMode
          queue={queue}
          index={index}
          anim={anim}
          floats={floats}
          schedulerOn={schedulerOn}
          totalDrafts={drafts.length}
          onDecide={decide}
          onRemove={remove}
          dailyGoal={game.dailyGoal}
          todayCount={todayCount}
        />
      ) : (
        <BoardView byStatus={byStatus} onPatch={patch} onRemove={remove} schedulerOn={schedulerOn} />
      )}
    </div>
  );
}

// ── HUD ───────────────────────────────────────────────────────────────────
function GameHud({
  game,
  todayCount,
  lvl,
  combo,
  queueLeft,
}: {
  game: GameState;
  todayCount: number;
  lvl: ReturnType<typeof levelInfo>;
  combo: number;
  queueLeft: number;
}) {
  const goalPct = Math.min(1, game.dailyGoal ? todayCount / game.dailyGoal : 0);
  return (
    <div style={hud}>
      {/* Streak */}
      <Stat>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flame active={game.streakDays > 0} />
          <span style={statBig}>{game.streakDays}</span>
        </div>
        <span style={statLabel}>day streak</span>
      </Stat>

      {/* Level + XP bar */}
      <div style={{ ...statCell, flex: 1, minWidth: 220 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Lv {lvl.level} · {lvl.title}
          </span>
          <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" }}>
            {game.xp} XP{lvl.nextAt != null ? ` · ${lvl.nextAt - game.xp} to next` : " · max"}
          </span>
        </div>
        <div style={xpTrack}>
          <div style={{ ...xpFill, width: `${Math.round(lvl.pct * 100)}%` }} />
        </div>
      </div>

      {/* Daily goal ring */}
      <Stat>
        <Ring pct={goalPct} label={`${todayCount}/${game.dailyGoal}`} />
        <span style={statLabel}>today</span>
      </Stat>

      {/* Combo */}
      <Stat>
        <span style={{ ...statBig, color: combo >= 2 ? "var(--orange)" : "var(--ink-3)", transform: combo >= 2 ? `scale(${Math.min(1.4, 1 + combo * 0.05)})` : "none", transition: "transform .15s" }}>
          ×{combo}
        </span>
        <span style={statLabel}>combo</span>
      </Stat>

      {/* Queue left */}
      <Stat>
        <span style={statBig}>{queueLeft}</span>
        <span style={statLabel}>in queue</span>
      </Stat>
    </div>
  );
}

// ── Review mode (gamified focus) ──────────────────────────────────────────
function ReviewMode({
  queue,
  index,
  anim,
  floats,
  schedulerOn,
  totalDrafts,
  onDecide,
  onRemove,
  dailyGoal,
  todayCount,
}: {
  queue: Draft[];
  index: number;
  anim: "approve" | "reject" | "skip" | null;
  floats: Float[];
  schedulerOn: boolean;
  totalDrafts: number;
  onDecide: (a: "approve" | "needs_edit" | "skip", d: Draft, e: { body: string; title: string; comment: string }) => void;
  onRemove: (id: string) => void;
  dailyGoal: number;
  todayCount: number;
}) {
  const current = queue.length ? queue[Math.min(index, queue.length - 1)] : null;

  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  // Reset editable fields whenever the current card changes.
  useEffect(() => {
    setBody(current?.body ?? "");
    setTitle(current?.title ?? "");
    setComment(current?.comment ?? "");
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts — ignored while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!current) return;
      const edits = { body, title, comment };
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        onDecide("approve", current, edits);
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        onDecide("needs_edit", current, edits);
      } else if (e.key === "s" || e.key === "S" || e.key === "ArrowRight") {
        e.preventDefault();
        onDecide("skip", current, edits);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, body, title, comment, onDecide]);

  if (!current) {
    return <Cleared totalDrafts={totalDrafts} todayCount={todayCount} dailyGoal={dailyGoal} />;
  }

  const isPin = current.platform === "pinterest";
  const animStyle: React.CSSProperties =
    anim === "approve"
      ? { transform: "translateX(60px) rotate(4deg)", opacity: 0 }
      : anim === "reject"
      ? { transform: "translateX(-60px) rotate(-4deg)", opacity: 0 }
      : anim === "skip"
      ? { transform: "translateY(-30px)", opacity: 0 }
      : { transform: "none", opacity: 1 };

  return (
    <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
      {/* floating points */}
      <div style={{ position: "absolute", top: -6, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 3 }}>
        {floats.map((f) => (
          <span key={f.id} className="float-up" style={{ position: "absolute", fontFamily: "var(--sans)", fontWeight: 700, fontSize: f.tone === "big" ? 26 : 19, color: f.tone === "big" ? "var(--orange)" : "var(--blue)" }}>
            {f.text}
          </span>
        ))}
      </div>

      <div className="card-in" key={current.id} style={{ ...reviewCard, ...animStyle }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={platformBadge}>{PLATFORM_LABEL[current.platform] || current.platform}</span>
          <button onClick={() => onRemove(current.id)} style={xBtn} title="Delete">
            ×
          </button>
        </div>
        {current.source_ref && (
          <div style={{ ...sourceLine, marginBottom: 14 }} title={current.source_ref}>
            {current.variant_type} · from {current.source_ref}
          </div>
        )}

        {current.media_url ? (
          current.media_type === "video" ? (
            <video src={current.media_url} style={reviewMedia} controls muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.media_url} alt="" style={reviewMedia} />
          )
        ) : (
          <div style={{ ...reviewMedia, ...mediaEmptyInner }}>no visual yet</div>
        )}

        {current.media_url && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 4 }}>
            <DownloadButton draft={current} style={miniGhost} />
            <CopyCaptionButton text={body} style={miniGhost} />
          </div>
        )}

        {isPin && (
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pin title (the search query)" style={titleInput} />
        )}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={bodyArea} />
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="your note / change request…" style={commentArea} />
      </div>

      {/* actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
        <button onClick={() => onDecide("needs_edit", current, { body, title, comment })} style={{ ...bigBtn, ...bigGhost }}>
          Needs edit <kbd style={kbd}>E</kbd>
        </button>
        <button onClick={() => onDecide("skip", current, { body, title, comment })} style={{ ...bigBtn, ...bigGhost }}>
          Skip <kbd style={kbd}>S</kbd>
        </button>
        <button onClick={() => onDecide("approve", current, { body, title, comment })} style={{ ...bigBtn, ...bigApprove }}>
          {schedulerOn ? "Approve + push" : "Approve"} <kbd style={{ ...kbd, ...kbdDark }}>A</kbd>
        </button>
      </div>
      <p style={{ textAlign: "center", fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)", marginTop: 12 }}>
        keyboard: A approve · E needs edit · S skip
      </p>
    </div>
  );
}

function Cleared({ totalDrafts, todayCount, dailyGoal }: { totalDrafts: number; todayCount: number; dailyGoal: number }) {
  return (
    <div style={{ ...reviewCard, maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "48px 28px" }}>
      <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--blue)", marginBottom: 10 }}>
        Queue cleared
      </div>
      <h2 style={{ fontFamily: "var(--sans)", fontSize: 26, letterSpacing: "-0.02em", margin: "0 0 10px", color: "var(--ink)" }}>
        {totalDrafts === 0 ? "Nothing to review yet" : "Inbox zero"}
      </h2>
      <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", margin: "0 0 6px" }}>
        {totalDrafts === 0
          ? "Add a draft above, or let the generator drop a batch in here."
          : `You reviewed ${todayCount} today${todayCount >= dailyGoal ? " — goal smashed." : `, ${Math.max(0, dailyGoal - todayCount)} off today's goal.`}`}
      </p>
    </div>
  );
}

// ── Board view (Kanban) ────────────────────────────────────────────────
function BoardView({
  byStatus,
  onPatch,
  onRemove,
  schedulerOn,
}: {
  byStatus: Record<Status, Draft[]>;
  onPatch: (id: string, u: Partial<Draft>) => void;
  onRemove: (id: string) => void;
  schedulerOn: boolean;
}) {
  const empty = COLUMNS.every((c) => byStatus[c.key].length === 0);
  if (empty) {
    return (
      <div style={{ ...card, textAlign: "center", padding: "40px 24px" }}>
        <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--ink-2)", margin: "0 0 6px" }}>Nothing here yet.</p>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Add a draft above to get started.</p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }}>
      {COLUMNS.map((col) => (
        <div key={col.key}>
          <div style={columnHeader}>
            {col.label}
            <span style={{ color: "var(--ink-3)", fontWeight: 400 }}> · {byStatus[col.key].length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {byStatus[col.key].map((d) => (
              <MiniCard key={d.id} draft={d} onPatch={onPatch} onRemove={onRemove} schedulerOn={schedulerOn} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniCard({
  draft,
  onPatch,
  onRemove,
  schedulerOn,
}: {
  draft: Draft;
  onPatch: (id: string, u: Partial<Draft>) => void;
  onRemove: (id: string) => void;
  schedulerOn: boolean;
}) {
  const [body, setBody] = useState(draft.body);
  const [comment, setComment] = useState(draft.comment ?? "");
  useEffect(() => setBody(draft.body), [draft.body]);
  useEffect(() => setComment(draft.comment ?? ""), [draft.comment]);

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={platformBadge}>{PLATFORM_LABEL[draft.platform] || draft.platform}</span>
        <button onClick={() => onRemove(draft.id)} style={xBtn} title="Delete">
          ×
        </button>
      </div>
      {draft.source_ref && (
        <div style={sourceLine} title={draft.source_ref}>
          {draft.variant_type} · {draft.source_ref}
        </div>
      )}
      {draft.media_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.media_url} alt="" style={media} />
      ) : (
        <div style={mediaEmpty}>no visual yet</div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => body !== draft.body && onPatch(draft.id, { body })}
        rows={4}
        style={bodyArea}
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => comment !== (draft.comment ?? "") && onPatch(draft.id, { comment: comment || null })}
        rows={2}
        placeholder="note…"
        style={commentArea}
      />
      {draft.push_error && (
        <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--red)", marginBottom: 6 }}>push failed: {draft.push_error}</div>
      )}
      {draft.status === "scheduled" && draft.external_id && (
        <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>pushed · {draft.external_id}</div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <DownloadButton draft={draft} style={miniGhost} />
        <CopyCaptionButton text={body} style={miniGhost} />
        {draft.status !== "approved" && draft.status !== "scheduled" && (
          <button onClick={() => onPatch(draft.id, { status: "approved" })} style={miniApprove}>
            {schedulerOn ? "Approve + push" : "Approve"}
          </button>
        )}
        {draft.status !== "needs_edit" && draft.status !== "scheduled" && (
          <button onClick={() => onPatch(draft.id, { status: "needs_edit" })} style={miniGhost}>
            Needs edit
          </button>
        )}
        {draft.status !== "draft" && (
          <button onClick={() => onPatch(draft.id, { status: "draft" })} style={miniGhost}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ── New-draft composer ──────────────────────────────────────────────────
function Composer({
  authedFetch,
  onCreated,
}: {
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  onCreated: () => void;
}) {
  const [platform, setPlatform] = useState<string>("instagram");
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
        variant_type: platform === "pinterest" ? "pin" : platform === "twitter" ? "tweet_thread" : "reel_caption",
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
    <div style={{ ...card, marginBottom: 20, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={selectInput}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABEL[p]}
            </option>
          ))}
        </select>
        <input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="source (TikTok url / article title)" style={{ ...titleInput, flex: 1, marginBottom: 0 }} />
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="post copy…" style={bodyArea} />
      <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="image / video url (optional)" style={{ ...titleInput, marginBottom: 10 }} />
      <button onClick={submit} disabled={saving || !body.trim()} style={{ ...pill, ...pillPrimary }}>
        {saving ? "Saving…" : "Add to board"}
      </button>
    </div>
  );
}

// ── Small UI bits ─────────────────────────────────────────────────────────
function Stat({ children }: { children: React.ReactNode }) {
  return <div style={statCell}>{children}</div>;
}

function Flame({ active }: { active: boolean }) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden>
      <path
        d="M8 0.5C8 0.5 3 4.5 3 9.5C3 11 3.7 12 4.5 12.7C4.2 12 4.1 11.2 4.5 10.3C5 9 6.5 8.2 6.5 8.2C6.5 8.2 6 10 7 11.2C7.8 12.2 9 12.6 9 14C9 15 8.3 15.8 7.4 15.9C9 16.4 13 15.2 13 10.5C13 5.5 8 0.5 8 0.5Z"
        fill={active ? "var(--orange)" : "var(--ink-3)"}
      />
    </svg>
  );
}

function Ring({ pct, label }: { pct: number; label: string }) {
  const size = 46;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hairline-strong)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--blue)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .4s" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, fill: "var(--ink)" }}>
        {label}
      </text>
    </svg>
  );
}

function GameStyles() {
  return (
    <style>{`
      @keyframes floatUp { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-46px); opacity: 0; } }
      .float-up { animation: floatUp .85s ease-out forwards; }
      @keyframes cardIn { 0% { transform: translateY(10px) scale(.985); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
      .card-in { animation: cardIn .26s ease-out; }
    `}</style>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const hud: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
  background: "var(--white)",
  border: "1px solid var(--hairline-strong)",
  borderRadius: 14,
  padding: "14px 18px",
};
const statCell: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 64 };
const statBig: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" };
const statLabel: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)" };
const xpTrack: React.CSSProperties = { height: 8, borderRadius: 999, background: "var(--tan)", overflow: "hidden" };
const xpFill: React.CSSProperties = { height: "100%", background: "var(--blue)", borderRadius: 999, transition: "width .4s ease" };

const card: React.CSSProperties = { background: "var(--white)", border: "1px solid var(--hairline-strong)", borderRadius: 12, padding: 14 };
const reviewCard: React.CSSProperties = { background: "var(--white)", border: "1px solid var(--hairline-strong)", borderRadius: 16, padding: 22, transition: "transform .24s ease, opacity .24s ease" };

const columnHeader: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-2)", marginBottom: 12 };
const platformBadge: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--blue)" };
const sourceLine: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-3)", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const media: React.CSSProperties = { width: "100%", borderRadius: 8, marginBottom: 10, display: "block", aspectRatio: "4 / 5", objectFit: "cover", background: "var(--tan)" };
const reviewMedia: React.CSSProperties = { width: "100%", borderRadius: 10, marginBottom: 14, display: "block", aspectRatio: "4 / 5", objectFit: "cover", background: "var(--tan)" };
const mediaEmpty: React.CSSProperties = { width: "100%", aspectRatio: "4 / 5", borderRadius: 8, marginBottom: 10, background: "var(--tan)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" };
const mediaEmptyInner: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" };

const baseInput: React.CSSProperties = { width: "100%", fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)", background: "var(--cream)", border: "1px solid var(--hairline-strong)", borderRadius: 8, padding: "10px 12px", boxSizing: "border-box" };
const titleInput: React.CSSProperties = { ...baseInput, fontSize: 13, marginBottom: 8 };
const selectInput: React.CSSProperties = { ...baseInput, fontSize: 13, width: "auto" };
const bodyArea: React.CSSProperties = { ...baseInput, marginBottom: 8, resize: "vertical", lineHeight: 1.5 };
const commentArea: React.CSSProperties = { ...baseInput, fontSize: 13, marginBottom: 10, resize: "vertical", background: "var(--white)", borderStyle: "dashed" };

const pill: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 13, padding: "8px 16px", borderRadius: 999, cursor: "pointer", letterSpacing: "-0.005em" };
const pillOn: React.CSSProperties = { border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--white)" };
const pillOff: React.CSSProperties = { border: "1px solid var(--hairline-strong)", background: "var(--white)", color: "var(--ink-2)" };
const pillPrimary: React.CSSProperties = { border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--white)" };

const bigBtn: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 14, fontWeight: 500, padding: "12px 22px", borderRadius: 999, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 };
const bigGhost: React.CSSProperties = { border: "1px solid var(--hairline-strong)", background: "var(--white)", color: "var(--ink-2)" };
const bigApprove: React.CSSProperties = { border: "1px solid var(--blue)", background: "var(--blue)", color: "var(--ink)" };

const miniApprove: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 12, padding: "7px 12px", borderRadius: 999, cursor: "pointer", background: "var(--blue)", color: "var(--ink)", border: "1px solid var(--blue)" };
const miniGhost: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 12, padding: "7px 12px", borderRadius: 999, cursor: "pointer", background: "var(--white)", color: "var(--ink-2)", border: "1px solid var(--hairline-strong)" };

const kbd: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 5, background: "rgba(59,60,58,0.08)", color: "var(--ink-2)" };
const kbdDark: React.CSSProperties = { background: "rgba(59,60,58,0.18)", color: "var(--ink)" };

const xBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: 18, lineHeight: 1, padding: 0 };
