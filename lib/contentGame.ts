// Gamification layer for the content approval dashboard.
// Single-user (Nyah), desktop — state lives in localStorage. The real work
// (approvals) persists to Supabase; this is the motivation/dopamine layer on top.

export type GameState = {
  xp: number;
  streakDays: number;
  lastReviewDate: string | null; // YYYY-MM-DD (local)
  dailyGoal: number;
  todayDate: string | null;
  todayCount: number;
  bestCombo: number;
  totalReviewed: number;
};

const KEY = "toxome_content_game_v1";

export const DEFAULT_STATE: GameState = {
  xp: 0,
  streakDays: 0,
  lastReviewDate: null,
  dailyGoal: 10,
  todayDate: null,
  todayCount: 0,
  bestCombo: 0,
  totalReviewed: 0,
};

// Points per action.
export const POINTS = {
  approve: 10,
  approveThoughtful: 15, // approved after editing copy or leaving a comment
  needsEdit: 5,
  clearQueue: 50, // bonus for emptying the review queue
} as const;

// Combo milestones → bonus points when a streak of approvals hits them.
export const COMBO_BONUS: Record<number, number> = { 3: 10, 5: 25, 10: 75, 20: 200 };

// Editorial-flavored level ladder. Each entry is the XP needed to ENTER it.
const LEVELS: { at: number; title: string }[] = [
  { at: 0, title: "Intern" },
  { at: 100, title: "Junior Stylist" },
  { at: 300, title: "Stylist" },
  { at: 600, title: "Editor" },
  { at: 1000, title: "Senior Editor" },
  { at: 1600, title: "Features Editor" },
  { at: 2500, title: "Deputy Editor" },
  { at: 4000, title: "Editor-in-Chief" },
  { at: 6500, title: "Creative Director" },
  { at: 10000, title: "Founder" },
];

export type LevelInfo = {
  level: number; // 1-based
  title: string;
  into: number; // xp earned into current level
  span: number; // xp width of current level (Infinity-safe number)
  nextAt: number | null; // total xp needed for next level, null if maxed
  pct: number; // 0..1 progress to next level
};

export function levelInfo(xp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].at) idx = i;
  }
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const span = next ? next.at - cur.at : 1;
  const into = xp - cur.at;
  return {
    level: idx + 1,
    title: cur.title,
    into,
    span,
    nextAt: next ? next.at : null,
    pct: next ? Math.min(1, into / span) : 1,
  };
}

// Local YYYY-MM-DD for "today" (browser local time).
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayStr(d);
}

export function loadGame(): GameState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<GameState>) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveGame(s: GameState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / privacy errors */
  }
}

// Apply one review action. Returns the new state plus whether the daily goal
// was just reached and whether the streak advanced (for celebration cues).
export function registerReview(
  state: GameState,
  points: number
): { next: GameState; goalJustHit: boolean; streakAdvanced: boolean } {
  const today = todayStr();
  const next: GameState = { ...state };

  // Streak
  let streakAdvanced = false;
  if (next.lastReviewDate === today) {
    // already counted today — streak unchanged
  } else if (next.lastReviewDate === yesterdayStr()) {
    next.streakDays = next.streakDays + 1;
    streakAdvanced = true;
  } else {
    next.streakDays = 1;
    streakAdvanced = true;
  }
  next.lastReviewDate = today;

  // Daily count
  if (next.todayDate !== today) {
    next.todayDate = today;
    next.todayCount = 0;
  }
  const beforeCount = next.todayCount;
  next.todayCount = beforeCount + 1;

  // XP + totals
  next.xp = next.xp + points;
  next.totalReviewed = next.totalReviewed + 1;

  const goalJustHit = beforeCount < next.dailyGoal && next.todayCount >= next.dailyGoal;

  return { next, goalJustHit, streakAdvanced };
}
