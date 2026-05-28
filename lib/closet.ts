import { db } from "./firebase";
import { collection, doc, getDocs, query, where } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { fiberKey, fiberScore } from "./fabricScores";

// Subset of the iOS app's scans/{scan} document — only the fields we
// actually surface on the website.
export interface ClosetScan {
  id: string;
  itemDescription: string;
  brandName: string;
  category: string;
  scanImageUrl: string;
  scanDate: Date | null;
  overallHazardScore: number; // 0–100; lower = cleaner
  overallHazardLevel: "low" | "moderate" | "high";
  naturalFiberPercentage: number;
  composition: { fiber: string; percentage: number }[];
}

export interface ClosetStats {
  totalCount: number;
  avgToxomeScore: number;
  lastScanAt: Date | null;
  riskBreakdown: { low: number; moderate: number; high: number };
  fiberDistribution: {
    fiber: string; // raw key (cotton, polyester, ...)
    share: number; // 0–1
    hazardScore: number; // 0–100
  }[];
  problemCategories: string[];
}

export async function getClosetScans(uid: string): Promise<ClosetScan[]> {
  // iOS app stores userId as a DocumentReference to users/{uid}, so we
  // query against that ref shape.
  const userRef = doc(db, "users", uid);
  const q = query(
    collection(db, "scans"),
    where("userId", "==", userRef),
    where("isSavedToCloset", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const composition = Array.isArray(data.composition)
      ? (data.composition as { fiber?: string; percentage?: number }[]).map(
          (c) => ({
            fiber: String(c.fiber ?? ""),
            percentage: Number(c.percentage ?? 0),
          })
        )
      : [];
    const ts = data.scan_date as Timestamp | undefined;
    return {
      id: d.id,
      itemDescription: String(data.itemDescription ?? ""),
      brandName: String(data.brandName ?? ""),
      category: String(data.category ?? ""),
      scanImageUrl: String(data.scanImageUrl ?? ""),
      scanDate: ts && typeof ts.toDate === "function" ? ts.toDate() : null,
      overallHazardScore: Number(data.overallHazardScore ?? 50),
      overallHazardLevel:
        (data.overallHazardLevel as "low" | "moderate" | "high") ?? "moderate",
      naturalFiberPercentage: Number(data.naturalFiberPercentage ?? 0),
      composition,
    };
  });
}

export function computeClosetStats(scans: ClosetScan[]): ClosetStats {
  if (scans.length === 0) {
    return {
      totalCount: 0,
      avgToxomeScore: 0,
      lastScanAt: null,
      riskBreakdown: { low: 0, moderate: 0, high: 0 },
      fiberDistribution: [],
      problemCategories: [],
    };
  }

  const avgToxomeScore = Math.round(
    scans.reduce((sum, s) => sum + s.overallHazardScore, 0) / scans.length
  );

  const riskBreakdown = { low: 0, moderate: 0, high: 0 };
  for (const s of scans) {
    const level = s.overallHazardLevel;
    if (level === "low" || level === "moderate" || level === "high") {
      riskBreakdown[level]++;
    }
  }

  // Sum fiber percentages across all scans, then normalize to shares.
  const fiberAcc: Record<string, number> = {};
  for (const s of scans) {
    for (const c of s.composition) {
      if (!c.fiber) continue;
      const k = fiberKey(c.fiber);
      fiberAcc[k] = (fiberAcc[k] ?? 0) + (c.percentage || 0);
    }
  }
  const total = Object.values(fiberAcc).reduce((a, b) => a + b, 0);
  const fiberDistribution =
    total > 0
      ? Object.entries(fiberAcc)
          .map(([fiber, sum]) => ({
            fiber,
            share: sum / total,
            hazardScore: fiberScore(fiber),
          }))
          .sort((a, b) => b.share - a.share)
      : [];

  // A "problem category" is one where ≥50% of the owned pieces in that
  // category were scored high-risk. Used to power the "cleaner
  // alternatives" cross-link.
  const catCounts: Record<string, { total: number; high: number }> = {};
  for (const s of scans) {
    const c = s.category || "Other";
    catCounts[c] ??= { total: 0, high: 0 };
    catCounts[c].total++;
    if (s.overallHazardLevel === "high") catCounts[c].high++;
  }
  const problemCategories = Object.entries(catCounts)
    .filter(([, v]) => v.high / v.total >= 0.5)
    .sort((a, b) => b[1].high - a[1].high)
    .map(([c]) => c);

  const lastScanAt = scans.reduce<Date | null>((latest, s) => {
    if (!s.scanDate) return latest;
    if (!latest || s.scanDate > latest) return s.scanDate;
    return latest;
  }, null);

  return {
    totalCount: scans.length,
    avgToxomeScore,
    lastScanAt,
    riskBreakdown,
    fiberDistribution,
    problemCategories,
  };
}
