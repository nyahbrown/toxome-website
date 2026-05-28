"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  getClosetScans,
  computeClosetStats,
  type ClosetScan,
  type ClosetStats,
} from "@/lib/closet";
import {
  getWishlist,
  getUserProfile,
  type WishlistItem,
  type UserProfile,
} from "@/lib/firestore";
import { getCleanerAlternatives, type Product } from "@/lib/supabase";
import { hazardColor, prettyFiber } from "@/lib/fabricScores";

function firstName(displayName: string | null | undefined, email: string | null | undefined) {
  if (displayName) return displayName.split(" ")[0];
  if (email) return email.split("@")[0];
  return "you";
}

function formatRelative(date: Date | null) {
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [scans, setScans] = useState<ClosetScan[] | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[] | null>(null);
  const [alternatives, setAlternatives] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?return=/account");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [p, w] = await Promise.all([
        getUserProfile(user.uid),
        getWishlist(user.uid).catch(() => []),
      ]);
      if (cancelled) return;
      setProfile(p);
      setWishlist(w);

      // Only pull closet data if the user is premium — Firestore reads
      // for a free user would just be wasted work since we gate the UI.
      const isPremium = p?.isPremium === true;
      const s = isPremium
        ? await getClosetScans(user.uid).catch(() => [])
        : [];
      if (cancelled) return;
      setScans(s);

      const stats = computeClosetStats(s);
      const alts = await getCleanerAlternatives(
        stats.problemCategories,
        4
      ).catch(() => []);
      if (cancelled) return;
      setAlternatives(alts);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
        <Nav />
      </main>
    );
  }

  const stats: ClosetStats | null = scans ? computeClosetStats(scans) : null;

  return (
    <>
      <Nav />
      <main
        style={{
          background: "var(--cream)",
          minHeight: "100vh",
          paddingTop: 88,
          paddingBottom: 120,
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          {/* Greeting */}
          <div style={{ marginBottom: 48 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              account
            </div>
            <h1
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontSize: "clamp(36px, 5vw, 56px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                margin: 0,
              }}
            >
              hi {firstName(user.displayName, user.email)}.
            </h1>
          </div>

          <SectionDivider />

          {/* The closet — gated for non-premium users */}
          <Section
            eyebrow="the closet"
            aside={
              profile?.isPremium && stats?.lastScanAt
                ? `last scan · ${formatRelative(stats.lastScanAt)}`
                : undefined
            }
          >
            {profile === undefined || scans === null ? (
              <SectionLoading />
            ) : !profile?.isPremium ? (
              <ClosetLockedCTA scanCount={profile?.scanCount ?? 0} />
            ) : stats && stats.totalCount > 0 ? (
              <ClosetSnapshot stats={stats} />
            ) : (
              <EmptyClosetCTA />
            )}
          </Section>

          {/* Fiber donut — only when premium and has data */}
          {profile?.isPremium && stats && stats.fiberDistribution.length > 0 && (
            <>
              <SectionDivider />
              <Section eyebrow="what you own">
                <FiberDonut stats={stats} />
              </Section>
            </>
          )}

          {/* Cleaner alternatives */}
          {alternatives && alternatives.length > 0 && (
            <>
              <SectionDivider />
              <Section
                eyebrow="cleaner alternatives"
                aside={
                  <Link
                    href="/shop"
                    style={{ color: "var(--ink-3)", textDecoration: "none" }}
                  >
                    view all →
                  </Link>
                }
              >
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ink-2)",
                    margin: "0 0 20px",
                    maxWidth: 540,
                    lineHeight: 1.5,
                  }}
                >
                  {stats && stats.problemCategories.length > 0
                    ? `Low-risk picks for the categories where your closet leans high — ${stats.problemCategories
                        .slice(0, 3)
                        .join(", ")
                        .toLowerCase()}.`
                    : "Editor's picks — our cleanest verified items right now."}
                </p>
                <AlternativesRow items={alternatives} />
              </Section>
            </>
          )}

          {/* Saved (wishlist preview) */}
          <SectionDivider />
          <Section
            eyebrow="saved"
            aside={
              wishlist && wishlist.length > 0 ? (
                <Link
                  href="/account/wishlist"
                  style={{ color: "var(--ink-3)", textDecoration: "none" }}
                >
                  view all →
                </Link>
              ) : undefined
            }
          >
            {wishlist === null ? (
              <SectionLoading />
            ) : wishlist.length === 0 ? (
              <EmptyWishlistCTA />
            ) : (
              <WishlistRow items={wishlist.slice(0, 4)} />
            )}
          </Section>

          {/* Settings */}
          <SectionDivider />
          <Section eyebrow="settings">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontSize: 14,
                color: "var(--ink-2)",
              }}
            >
              <div>
                <span style={{ color: "var(--ink-3)" }}>email · </span>
                {user.email}
              </div>
              {profile && (
                <div>
                  <span style={{ color: "var(--ink-3)" }}>plan · </span>
                  {profile.isPremium
                    ? `Premium (${profile.subscriptionStatus})`
                    : "Free"}
                </div>
              )}
              <button
                onClick={async () => {
                  await signOut();
                  router.replace("/shop");
                }}
                className="pill-cta ghost"
                style={{ alignSelf: "flex-start", height: 44 }}
              >
                sign out
              </button>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function Section({
  eyebrow,
  aside,
  children,
}: {
  eyebrow: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ padding: "40px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <span className="eyebrow">{eyebrow}</span>
        {aside && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            {aside}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--hairline)",
      }}
    />
  );
}

function SectionLoading() {
  return (
    <div
      style={{
        height: 80,
        background: "var(--hairline)",
        borderRadius: 8,
        opacity: 0.35,
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────── */

function ClosetSnapshot({ stats }: { stats: ClosetStats }) {
  const total =
    stats.riskBreakdown.low +
    stats.riskBreakdown.moderate +
    stats.riskBreakdown.high;
  const segments = [
    { count: stats.riskBreakdown.low, color: "var(--risk-low)", label: "low" },
    {
      count: stats.riskBreakdown.moderate,
      color: "var(--orange)",
      label: "moderate",
    },
    {
      count: stats.riskBreakdown.high,
      color: "var(--red)",
      label: "high",
    },
  ];
  const scoreColor = hazardColor(stats.avgToxomeScore);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 24,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
          }}
        >
          {stats.avgToxomeScore}
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 999,
              background: scoreColor,
              marginLeft: 12,
              verticalAlign: "middle",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span>avg toxome score</span>
          <span>{stats.totalCount} items in closet</span>
        </div>
      </div>

      {/* Segmented risk bar */}
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "var(--hairline)",
          marginBottom: 12,
        }}
      >
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.label}
              style={{
                width: `${(s.count / total) * 100}%`,
                background: s.color,
                transition: "width 300ms ease",
              }}
            />
          ) : null
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 12,
          color: "var(--ink-2)",
          letterSpacing: "-0.005em",
        }}
      >
        {segments.map((s) => (
          <span
            key={s.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: s.color,
              }}
            />
            {s.count} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function FiberDonut({ stats }: { stats: ClosetStats }) {
  const TOP_N = 5;
  const top = stats.fiberDistribution.slice(0, TOP_N);
  const otherShare =
    1 - top.reduce((sum, f) => sum + f.share, 0);
  const slices =
    otherShare > 0.005
      ? [
          ...top,
          { fiber: "other", share: otherShare, hazardScore: 50 },
        ]
      : top;

  const size = 180;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = slices.map((s) => {
    const length = s.share * circumference;
    const arc = {
      ...s,
      length,
      offset,
    };
    offset += length;
    return arc;
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 40,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ flexShrink: 0 }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={stroke}
        />
        {arcs.map((a, i) => (
          <circle
            key={a.fiber + i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={a.fiber === "other" ? "var(--ink-3)" : hazardColor(a.hazardScore)}
            strokeWidth={stroke}
            strokeDasharray={`${a.length} ${circumference}`}
            strokeDashoffset={-a.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        ))}
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 240 }}>
        {slices.map((s) => (
          <div
            key={s.fiber}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              color: "var(--ink)",
              letterSpacing: "-0.005em",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background:
                  s.fiber === "other"
                    ? "var(--ink-3)"
                    : hazardColor(s.hazardScore),
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>
              {s.fiber === "other" ? "Other" : prettyFiber(s.fiber)}
            </span>
            <span style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(s.share * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function AlternativesRow({ items }: { items: Product[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 20,
      }}
    >
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/shop/${p.id}`}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            style={{
              position: "relative",
              aspectRatio: "266 / 334",
              background: "var(--tan)",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {p.item_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.item_image}
                alt={p.item_name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            {p.item_name}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)" }}>
            {p.brand}
            {p.item_price != null && (
              <>
                <span style={{ color: "var(--ink-3)", margin: "0 6px" }}>·</span>
                ${p.item_price.toLocaleString()}
              </>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function WishlistRow({ items }: { items: WishlistItem[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 20,
      }}
    >
      {items.map((item) => (
        <Link
          key={item.productId}
          href={`/shop/${item.productId}`}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            style={{
              position: "relative",
              aspectRatio: "266 / 334",
              background: "var(--tan)",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {item.item_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.item_image}
                alt={item.item_name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            {item.item_name}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{item.brand}</div>
        </Link>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function EmptyClosetCTA() {
  return (
    <div
      style={{
        padding: "32px 28px",
        background: "var(--white)",
        border: "1px solid var(--hairline)",
        borderRadius: 14,
      }}
    >
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: 22,
          letterSpacing: "-0.015em",
          color: "var(--ink)",
          margin: "0 0 8px",
          fontWeight: 500,
        }}
      >
        Your closet is empty.
      </p>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-2)",
          lineHeight: 1.5,
          margin: "0 0 20px",
          maxWidth: 480,
        }}
      >
        Scan a clothing label with the Toxome app to see your closet's Toxome
        score, fiber breakdown, and cleaner alternatives here.
      </p>
      <a
        href="https://apps.apple.com/us/app/toxome/id6748622034"
        target="_blank"
        rel="noopener noreferrer"
        className="pill-cta"
        style={{ justifyContent: "center" }}
      >
        Download the app
      </a>
    </div>
  );
}

function ClosetLockedCTA({ scanCount }: { scanCount: number }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "32px 28px",
        background: "var(--white)",
        border: "1px solid var(--hairline)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Blurred preview of the closet score behind the CTA */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          padding: "32px 28px",
          opacity: 0.18,
          filter: "blur(6px)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            marginBottom: 20,
          }}
        >
          ——
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background:
              "linear-gradient(to right, var(--risk-low) 0 35%, var(--orange) 35% 65%, var(--red) 65% 100%)",
          }}
        />
      </div>

      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 10,
          }}
        >
          premium
        </div>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 24,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            margin: "0 0 10px",
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          Unlock your closet score.
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.55,
            margin: "0 0 22px",
            maxWidth: 460,
          }}
        >
          Toxome Premium gives you your closet&apos;s average score, the fiber
          breakdown of everything you own, and cleaner alternatives matched to
          the categories you wear most.
          {scanCount > 0 && (
            <>
              {" "}
              You&apos;ve already scanned {scanCount}{" "}
              {scanCount === 1 ? "item" : "items"} — unlock to see them all in
              one view.
            </>
          )}
        </p>
        <a
          href="https://apps.apple.com/us/app/toxome/id6748622034"
          target="_blank"
          rel="noopener noreferrer"
          className="pill-cta"
          style={{ justifyContent: "center" }}
        >
          Download the app to unlock
        </a>
      </div>
    </div>
  );
}

function EmptyWishlistCTA() {
  return (
    <div
      style={{
        fontSize: 14,
        color: "var(--ink-2)",
        lineHeight: 1.5,
      }}
    >
      Nothing saved yet.{" "}
      <Link
        href="/shop"
        style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}
      >
        Browse the shop →
      </Link>
    </div>
  );
}
