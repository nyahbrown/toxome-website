"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getPublishedProducts, type Product } from "@/lib/supabase";
import { EDITORS_PICKS } from "@/lib/editorsPicks";
import { DEV_WISHLIST, DEV_SCANS } from "@/lib/devAccountData";
import { hazardColor, prettyFiber } from "@/lib/fabricScores";
import WishlistHeart from "@/components/WishlistHeart";

// Accounts comped to Premium on the web — full closet access regardless of
// any App Store subscription. The founder / admin account.
const COMPED_PREMIUM_EMAILS = ["nyah@toxome.app"];

const DEV_PROFILE: UserProfile = {
  uid: "dev-preview",
  email: "preview@toxome.app",
  displayName: "Preview",
  photoUrl: null,
  isPremium: true,
  subscriptionStatus: "monthly",
  scanCount: 14,
};

function firstName(displayName: string | null | undefined, email: string | null | undefined) {
  if (displayName) return displayName.split(" ")[0];
  if (email) return email.split("@")[0];
  return "you";
}

// Featured products = the hand-selected Editor's Picks, matched by exact
// item_name and kept in their curated order (same source the homepage uses).
function pickFeatured(products: Product[]): Product[] {
  return EDITORS_PICKS.map((name) =>
    products.find((p) => p.item_name === name)
  ).filter((p): p is Product => Boolean(p));
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

export default function AccountClient() {
  const {
    user,
    loading,
    signOut,
    wishlist: wishlistIds,
    toggleWishlist,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const devMode =
    searchParams.get("dev") === "1" ||
    searchParams.get("dev") === "premium";

  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [scans, setScans] = useState<ClosetScan[] | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[] | null>(null);
  const [alternatives, setAlternatives] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!loading && !user && !devMode) {
      router.replace("/login?return=/account");
    }
  }, [user, loading, router, devMode]);

  useEffect(() => {
    // Dev preview mode — bypass auth + gating, use mock closet data so
    // every panel renders populated without a subscription or signed-in
    // user.
    if (devMode) {
      setProfile(DEV_PROFILE);
      setScans(DEV_SCANS);
      setWishlist(DEV_WISHLIST);
      getPublishedProducts()
        .catch(() => [])
        .then((products) => setAlternatives(pickFeatured(products)));
      return;
    }

    if (!user) return;
    let cancelled = false;
    (async () => {
      const [p, w] = await Promise.all([
        getUserProfile(user.uid),
        getWishlist(user.uid).catch(() => []),
      ]);
      if (cancelled) return;

      // Comp the founder / admin account to Premium on the web so the closet
      // is never gated for them, even without an App Store subscription. Works
      // whether or not a users/{uid} profile doc exists yet.
      const comped =
        !!user.email &&
        COMPED_PREMIUM_EMAILS.includes(user.email.toLowerCase());
      const effProfile: UserProfile | null = comped
        ? {
            uid: user.uid,
            email: user.email ?? p?.email ?? null,
            displayName: user.displayName ?? p?.displayName ?? null,
            photoUrl: p?.photoUrl ?? null,
            isPremium: true,
            subscriptionStatus: p?.isPremium ? p.subscriptionStatus : "annual",
            scanCount: p?.scanCount ?? 0,
          }
        : p;

      setProfile(effProfile);
      setWishlist(w);

      // Only pull closet data if the user is premium — Firestore reads
      // for a free user would just be wasted work since we gate the UI.
      const isPremium = effProfile?.isPremium === true;
      const s = isPremium
        ? await getClosetScans(user.uid).catch(() => [])
        : [];
      if (cancelled) return;
      setScans(s);

      const products = await getPublishedProducts().catch(() => []);
      if (cancelled) return;
      setAlternatives(pickFeatured(products));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, devMode]);

  if ((loading || !user) && !devMode) {
    return (
      <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
        <Nav />
      </main>
    );
  }

  // Dev mode uses a synthetic "user" shape so the greeting renders without
  // requiring a signed-in Firebase user.
  const displayUser = user ?? {
    uid: "dev-preview",
    email: "preview@toxome.app",
    displayName: "Preview",
  };

  const stats: ClosetStats | null = scans ? computeClosetStats(scans) : null;

  // The auth `wishlistIds` set is empty in dev preview, so show the mock
  // wishlist as-is; otherwise filter to the user's actually-saved ids.
  const savedItems: WishlistItem[] | null =
    wishlist === null
      ? null
      : devMode
      ? wishlist
      : wishlist.filter((w) => wishlistIds.has(w.productId));

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
            width: "100%",
            padding: "0 clamp(20px, 4vw, 56px)",
          }}
        >
          {devMode && <DevBanner />}

          {/* Greeting hero */}
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 28,
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                account
              </div>
              <h1
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 500,
                  fontSize: "clamp(32px, 4.4vw, 48px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                hi {firstName(displayUser.displayName, displayUser.email)}.
              </h1>
            </div>
            {profile && <PlanChip profile={profile} />}
          </header>

          {/* Dashboard grid */}
          <div className="account-grid">
            {/* Closet snapshot */}
            <div className="account-cell account-cell--closet">
              <Panel
                eyebrow="your closet"
                aside={
                  profile?.isPremium && stats?.lastScanAt
                    ? `last scan · ${formatRelative(stats.lastScanAt)}`
                    : undefined
                }
              >
                {profile === undefined || scans === null ? (
                  <PanelLoading />
                ) : !profile?.isPremium ? (
                  <ClosetLockedCTA scanCount={profile?.scanCount ?? 0} />
                ) : stats && stats.totalCount > 0 ? (
                  <ClosetSnapshot stats={stats} />
                ) : (
                  <EmptyClosetCTA />
                )}
              </Panel>
            </div>

            {/* Recent scans */}
            {profile !== undefined &&
              (!profile?.isPremium ||
                (scans && scans.length > 0)) && (
                <div className="account-cell account-cell--recent">
                  <Panel
                    eyebrow="recent scans"
                    aside={
                      profile?.isPremium && scans && scans.length > 8
                        ? `${scans.length} total`
                        : undefined
                    }
                  >
                    {!profile?.isPremium ? (
                      <RecentScansLockedCTA />
                    ) : (
                      scans && (
                        <RecentScansRow
                          scans={scans}
                          moreHref={
                            devMode ? "/account/scans?dev=1" : "/account/scans"
                          }
                        />
                      )
                    )}
                  </Panel>
                </div>
              )}

            {/* Cleaner alternatives */}
            {alternatives && alternatives.length > 0 && (
              <div className="account-cell account-cell--alts">
                <Panel
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
                      margin: "0 0 18px",
                      maxWidth: 540,
                      lineHeight: 1.5,
                    }}
                  >
                    the items we&rsquo;re loving right now.
                  </p>
                  <AlternativesRow items={alternatives} />
                </Panel>
              </div>
            )}

            {/* Saved wishlist */}
            <div className="account-cell account-cell--saved">
              <Panel
                eyebrow="saved"
                aside={
                  savedItems && savedItems.length > 0 ? (
                    <Link
                      href={devMode ? "/account/wishlist?dev=1" : "/account/wishlist"}
                      style={{ color: "var(--ink-3)", textDecoration: "none" }}
                    >
                      view all →
                    </Link>
                  ) : undefined
                }
              >
                {savedItems === null ? (
                  <PanelLoading />
                ) : savedItems.length === 0 ? (
                  <EmptyWishlistCTA />
                ) : (
                  <WishlistRow
                    items={savedItems.slice(0, 12)}
                    moreHref={
                      devMode ? "/account/wishlist?dev=1" : "/account/wishlist"
                    }
                    onRemove={async (item) => {
                      await toggleWishlist({
                        id: item.productId,
                        item_name: item.item_name,
                        brand: item.brand,
                        item_price: item.item_price,
                        item_image: item.item_image,
                        affiliate_url: item.affiliate_url,
                        item_url: item.item_url,
                        brand_verified: item.brand_verified,
                        currency: "",
                        budget: null,
                        category: null,
                        gender: null,
                        region: null,
                        affiliate_program: null,
                        commission_rate: null,
                        toxome_score: null,
                        risk_level: null,
                        fabric_composition: null,
                        tags: null,
                        added_by: "",
                        published: true,
                        created_at: "",
                        updated_at: "",
                        images: null,
                        description: null,
                        materials_text: null,
                        certifications: null,
                      });
                    }}
                  />
                )}
              </Panel>
            </div>

            {/* Settings */}
            <div className="account-cell account-cell--settings">
              <Panel eyebrow="settings">
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
                {displayUser.email}
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
              </Panel>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function DevBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 24,
        padding: "10px 16px",
        background: "var(--blue)",
        borderRadius: 10,
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink)",
      }}
    >
      <span>dev preview · mock closet, premium unlocked</span>
      <Link
        href="/account"
        style={{
          color: "var(--ink)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        exit
      </Link>
    </div>
  );
}

function Panel({
  eyebrow,
  aside,
  children,
}: {
  eyebrow: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--white)",
        border: "1px solid var(--hairline)",
        borderRadius: 16,
        padding: 24,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 1px 2px rgba(59, 60, 58, 0.04), 0 14px 32px rgba(59, 60, 58, 0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
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
      <div style={{ flex: 1 }}>{children}</div>
    </section>
  );
}

function PanelLoading() {
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

function PlanChip({ profile }: { profile: UserProfile }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--mono)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: profile.isPremium ? "var(--ink)" : "var(--ink-3)",
        background: profile.isPremium ? "var(--blue)" : "var(--hairline)",
        padding: "5px 11px",
        borderRadius: 999,
      }}
    >
      {profile.isPremium ? `premium · ${profile.subscriptionStatus}` : "free plan"}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────── */

// Small info "i" with a hover/click tooltip — explains the score.
function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="What does this score mean?"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          padding: 0,
          border: "none",
          background: "transparent",
          color: open ? "var(--ink-2)" : "var(--ink-3)",
          cursor: "pointer",
          transition: "color 140ms ease-out",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16" />
          <circle cx="12" cy="7.6" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <span
        role="tooltip"
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: 246,
          padding: "12px 14px",
          background: "var(--ink)",
          color: "var(--cream)",
          borderRadius: 12,
          fontSize: 12.5,
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
          textTransform: "none",
          boxShadow: "0 10px 28px rgba(59,60,58,0.20)",
          zIndex: 5,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(-4px) scale(0.96)",
          transformOrigin: "top right",
          pointerEvents: open ? "auto" : "none",
          transition:
            "opacity 140ms ease-out, transform 160ms cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {text}
      </span>
    </span>
  );
}

// Merged "your closet" card — score + risk tray beside the fiber tray.
function ClosetSnapshot({ stats }: { stats: ClosetStats }) {
  const segments = [
    { count: stats.riskBreakdown.low, color: "var(--risk-low)", label: "low" },
    { count: stats.riskBreakdown.moderate, color: "var(--orange)", label: "moderate" },
    { count: stats.riskBreakdown.high, color: "var(--red)", label: "high" },
  ];
  const total = segments.reduce((n, s) => n + s.count, 0) || 1;

  const tray: React.CSSProperties = {
    background: "var(--cream)",
    borderRadius: 14,
    padding: "22px 24px",
    border: "1px solid var(--hairline)",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "0.82fr 1.18fr",
        gap: 14,
        height: "100%",
      }}
    >
      {/* Score + risk tray */}
      <div
        style={{
          ...tray,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span style={{ position: "absolute", top: 14, right: 14 }}>
          <InfoTip text="Your closet's average Toxome score (0–100). Lower is cleaner — it means fewer hazardous fibers and finishes across what you've scanned. Roughly: under 30 is low-risk, 30–60 moderate, 60+ high." />
        </span>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 600,
            fontSize: 60,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "var(--ink)",
            marginBottom: 6,
          }}
        >
          {stats.avgToxomeScore}
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 18,
          }}
        >
          avg score · {stats.totalCount} items
        </div>
        <div
          style={{
            display: "flex",
            height: 10,
            borderRadius: 999,
            overflow: "hidden",
            background: "var(--tan)",
            boxShadow: "inset 0 1px 2px rgba(59,60,58,0.08)",
            marginBottom: 12,
          }}
        >
          {segments.map((s) =>
            s.count > 0 ? (
              <div key={s.label} style={{ width: `${(s.count / total) * 100}%`, background: s.color }} />
            ) : null
          )}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--ink-2)", flexWrap: "wrap" }}>
          {segments.map((s) => (
            <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
              <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{s.count}</strong> {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Fiber tray */}
      <div style={{ ...tray }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 16,
          }}
        >
          what you own
        </div>
        <FiberDonut stats={stats} size={148} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function FiberDonut({ stats, size = 180 }: { stats: ClosetStats; size?: number }) {
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

  const stroke = Math.round(size * 0.12);
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
        gap: size > 150 ? 40 : 26,
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

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: size > 150 ? 240 : 150 }}>
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

// A thin chevron at the end of a horizontal rail that links to the full grid
// page. `height` centers it against the card image, not the whole card.
function MoreCaret({
  href,
  label,
  height,
}: {
  href: string;
  label: string;
  height: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      style={{
        flex: "0 0 auto",
        alignSelf: "flex-start",
        height,
        width: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-3)",
        textDecoration: "none",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </Link>
  );
}

function RecentScansRow({
  scans,
  moreHref,
}: {
  scans: ClosetScan[];
  moreHref: string;
}) {
  const recent = [...scans]
    .filter((s) => s.scanImageUrl)
    .sort((a, b) => {
      const at = a.scanDate?.getTime() ?? 0;
      const bt = b.scanDate?.getTime() ?? 0;
      return bt - at;
    })
    .slice(0, 15);

  if (recent.length === 0) {
    return (
      <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
        Your recent scans will appear here once you save items to your closet.
      </p>
    );
  }

  const THUMB = 116;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 6,
        scrollbarWidth: "thin",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {recent.map((s) => (
        <div key={s.id} style={{ flex: "0 0 auto", width: THUMB }}>
          <div
            style={{
              position: "relative",
              width: THUMB,
              height: THUMB,
              background: "var(--tan)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.scanImageUrl}
              alt={s.itemDescription || s.brandName || "scan"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <span
              aria-label={`${s.overallHazardLevel} risk`}
              title={`${s.overallHazardLevel} risk`}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 10,
                height: 10,
                borderRadius: 999,
                background:
                  s.overallHazardLevel === "low"
                    ? "var(--risk-low)"
                    : s.overallHazardLevel === "moderate"
                    ? "var(--orange)"
                    : "var(--red)",
                boxShadow: "0 0 0 2px rgba(252,251,247,0.85)",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginTop: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {s.brandName || s.category || "—"}
          </div>
        </div>
      ))}
      <MoreCaret href={moreHref} label="See all past scans" height={THUMB} />
    </div>
  );
}

function RecentScansLockedCTA() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        flexWrap: "wrap",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          opacity: 0.35,
          filter: "blur(4px)",
          flex: 1,
          minWidth: 220,
          maxWidth: 360,
        }}
      >
        {[
          "var(--tan)",
          "var(--risk-low)",
          "var(--orange)",
          "var(--tan)",
        ].map((c, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              background: c,
              borderRadius: 8,
            }}
          />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 8,
          }}
        >
          premium
        </div>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 20,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            margin: "0 0 8px",
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          See every item you&apos;ve scanned.
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.5,
            margin: "0 0 14px",
          }}
        >
          Your scan history lives in the app. Unlock to keep them all in one
          view here.
        </p>
        <a
          href="https://apps.apple.com/us/app/toxome/id6748622034"
          target="_blank"
          rel="noopener noreferrer"
          className="pill-cta"
          style={{ height: 40, padding: "0 18px" }}
        >
          Download the app
        </a>
      </div>
    </div>
  );
}

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
              fontFamily: "var(--sans)",
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

function WishlistRow({
  items,
  onRemove,
  moreHref,
}: {
  items: WishlistItem[];
  onRemove: (item: WishlistItem) => void | Promise<void>;
  moreHref: string;
}) {
  const CARD = 150;
  const IMG_H = Math.round((CARD * 334) / 266); // keep the 266/334 ratio

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        overflowX: "auto",
        paddingBottom: 6,
        scrollbarWidth: "thin",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {items.map((item) => (
        <div
          key={item.productId}
          style={{ position: "relative", flex: "0 0 auto", width: CARD }}
        >
          <Link
            href={`/shop/${item.productId}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div
              style={{
                position: "relative",
                width: CARD,
                height: IMG_H,
                background: "var(--tan)",
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 10,
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
              <WishlistHeart
                isWishlisted
                onClick={() => onRemove(item)}
                stopPropagation
              />
            </div>
            <div
              style={{
                fontFamily: "var(--sans)",
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                marginBottom: 2,
              }}
            >
              {item.item_name}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-2)" }}>
              {item.brand}
            </div>
          </Link>
        </div>
      ))}
      <MoreCaret href={moreHref} label="See all saved items" height={IMG_H} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function EmptyClosetCTA() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <p
          style={{
            fontFamily: "var(--sans)",
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
            margin: 0,
            maxWidth: 420,
          }}
        >
          Scan a clothing label with the Toxome app to see your closet&apos;s
          Toxome score, fiber breakdown, and cleaner alternatives here.
        </p>
      </div>

      {/* QR code to the App Store listing */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--hairline)",
            borderRadius: 14,
            padding: 12,
            lineHeight: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-store-qr.svg"
            alt="Scan to download the Toxome app from the App Store"
            width={132}
            height={132}
            style={{ display: "block", width: 132, height: 132 }}
          />
        </div>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          scan to download
        </span>
      </div>
    </div>
  );
}

function ClosetLockedCTA({ scanCount }: { scanCount: number }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Blurred preview of the closet score behind the CTA */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          filter: "blur(6px)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 600,
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
            fontFamily: "var(--sans)",
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
