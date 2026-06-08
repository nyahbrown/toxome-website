"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getClosetScans, type ClosetScan } from "@/lib/closet";
import { DEV_SCANS } from "@/lib/devAccountData";

function riskColor(level: ClosetScan["overallHazardLevel"]) {
  return level === "low"
    ? "var(--risk-low)"
    : level === "moderate"
    ? "var(--orange)"
    : "var(--red)";
}

function ScanCard({ scan }: { scan: ClosetScan }) {
  return (
    <div>
      <div
        style={{
          position: "relative",
          paddingBottom: "100%",
          background: "var(--tan)",
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(59,60,58,.06)",
        }}
      >
        {scan.scanImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scan.scanImageUrl}
            alt={scan.itemDescription || scan.brandName || "scan"}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        <span
          aria-label={`${scan.overallHazardLevel} risk`}
          title={`${scan.overallHazardLevel} risk`}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 12,
            height: 12,
            borderRadius: 999,
            background: riskColor(scan.overallHazardLevel),
            boxShadow: "0 0 0 2px rgba(252,251,247,0.85)",
          }}
        />
      </div>
      <div style={{ padding: "12px 2px 0" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 5,
          }}
        >
          {scan.brandName || scan.category || "–"}
        </div>
        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}
        >
          {scan.itemDescription || "Scanned item"}
        </div>
      </div>
    </div>
  );
}

export default function ScansPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Dev preview (?dev=1) bypasses auth and shows the mock closet scans.
  const [devMode, setDevMode] = useState(false);
  const [devChecked, setDevChecked] = useState(false);
  const [scans, setScans] = useState<ClosetScan[] | null>(null);

  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("dev");
    setDevMode(d === "1" || d === "premium");
    setDevChecked(true);
  }, []);

  useEffect(() => {
    if (devChecked && !devMode && !loading && !user) {
      router.replace("/login?return=/account/scans");
    }
  }, [devChecked, devMode, user, loading, router]);

  useEffect(() => {
    if (!devChecked) return;
    if (devMode) {
      setScans(DEV_SCANS);
      return;
    }
    if (!user) return;
    let cancelled = false;
    getClosetScans(user.uid)
      .catch(() => [])
      .then((s) => {
        if (!cancelled) setScans(s);
      });
    return () => {
      cancelled = true;
    };
  }, [devChecked, devMode, user]);

  if (!devChecked) return null;
  if (!devMode && (loading || !user)) return null;

  const sorted = scans
    ? [...scans].sort(
        (a, b) => (b.scanDate?.getTime() ?? 0) - (a.scanDate?.getTime() ?? 0)
      )
    : null;

  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingTop: 64,
        paddingBottom: 120,
      }}
    >
      <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 44 }}>
        <h1
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            margin: "0 auto",
            maxWidth: 780,
            padding: "0 24px",
          }}
        >
          past scans
        </h1>
      </div>

      <div className="shell">
        {sorted === null ? null : sorted.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "var(--ink-3)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            no scans yet.{" "}
            <Link
              href="https://apps.apple.com/us/app/toxome/id6748622034"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--ink-2)",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              scan a label in the app
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {sorted.map((s) => (
              <ScanCard key={s.id} scan={s} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
