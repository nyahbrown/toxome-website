"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "firebase/auth";
import UpgradeButton from "@/components/UpgradeButton";
import { track } from "@/lib/track";
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
import { hazardColor } from "@/lib/fabricScores";
import { EDITORS_PICKS } from "@/lib/editorsPicks";
import { DEV_WISHLIST, DEV_SCANS, DEV_SCANS_REAL } from "@/lib/devAccountData";
import WishlistHeart from "@/components/WishlistHeart";

// Accounts comped to Premium on the web, full closet access regardless of
// any App Store subscription. The founder / admin account.
const COMPED_PREMIUM_EMAILS = ["nyah@toxome.app"];

// Ask our server route for the LIVE RevenueCat "Toxome Premium" entitlement.
// source "revenuecat" → `premium` is authoritative; any other source
// ("unavailable" when the key isn't set, "error") means fall back to the
// cached Firestore flag so a real subscriber is never locked out.
async function checkRevenueCatPremium(
  user: User,
): Promise<{ premium: boolean; source: string }> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/premium-status", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return { premium: false, source: "error" };
    return (await res.json()) as { premium: boolean; source: string };
  } catch {
    return { premium: false, source: "error" };
  }
}

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
  const devParam = searchParams.get("dev");
  const devMode =
    devParam === "1" || devParam === "premium" || devParam === "closet";
  // `?dev=closet` seeds the dashboard with Nyah's 4 real scanned garments
  // instead of the generic 30-item demo set.
  const realCloset = devParam === "closet";

  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [scans, setScans] = useState<ClosetScan[] | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[] | null>(null);
  const [alternatives, setAlternatives] = useState<Product[] | null>(null);
  // IDs of real catalog products, used to decide whether a saved item has its
  // own /shop/[id] page or should link out to the store it was saved from.
  const [catalogIds, setCatalogIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!loading && !user && !devMode) {
      router.replace("/login?return=/account");
    }
  }, [user, loading, router, devMode]);

  useEffect(() => {
    // Dev preview mode, bypass auth + gating, use mock closet data so
    // every panel renders populated without a subscription or signed-in
    // user.
    if (devMode) {
      setProfile(DEV_PROFILE);
      setScans(realCloset ? DEV_SCANS_REAL : DEV_SCANS);
      setWishlist(DEV_WISHLIST);
      getPublishedProducts()
        .catch(() => [])
        .then((products) => {
          setAlternatives(pickFeatured(products));
          setCatalogIds(new Set(products.map((p) => p.id)));
        });
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

      // Authoritative premium = the live RevenueCat entitlement (verified
      // server-side), so a stale Firestore is_premium flag can't grant web
      // access. Falls back to the cached flag only if the check is unavailable.
      let livePremium = p?.isPremium === true;
      if (!comped) {
        const rc = await checkRevenueCatPremium(user);
        if (cancelled) return;
        if (rc.source === "revenuecat") livePremium = rc.premium;
      }

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
        : p
          ? { ...p, isPremium: livePremium }
          : livePremium
            ? {
                uid: user.uid,
                email: user.email ?? null,
                displayName: user.displayName ?? null,
                photoUrl: null,
                isPremium: true,
                subscriptionStatus: "monthly",
                scanCount: 0,
              }
            : null;

      setProfile(effProfile);
      setWishlist(w);

      // Only pull closet data if the user is premium, Firestore reads
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
      setCatalogIds(new Set(products.map((p) => p.id)));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, devMode, realCloset]);

  // Called the instant a web purchase succeeds. The "Toxome Premium"
  // entitlement is active in RevenueCat immediately, but the Firestore
  // is_premium mirror (written by the revenueCatWebhook) lags a beat — so we
  // flip the UI optimistically here and pull the now-unlocked closet, instead
  // of waiting on a re-fetch that might still read "free".
  const markPremium = useCallback(
    (plan: "annual" | "monthly" = "annual") => {
      if (!user) return;
      setProfile((prev) => ({
        uid: user.uid,
        email: user.email ?? prev?.email ?? null,
        displayName: user.displayName ?? prev?.displayName ?? null,
        photoUrl: prev?.photoUrl ?? null,
        isPremium: true,
        subscriptionStatus: plan,
        scanCount: prev?.scanCount ?? 0,
      }));
      getClosetScans(user.uid)
        .then(setScans)
        .catch(() => {});
    },
    [user],
  );

  // Returning from a successful web checkout: RevenueCat redirects to
  // /account?upgraded=1. Flip to premium right away (the entitlement is live;
  // the Firestore mirror may lag a beat) and strip the param so a refresh
  // doesn't re-trigger it.
  const upgraded = searchParams.get("upgraded") === "1";
  useEffect(() => {
    if (upgraded && user) {
      // The web subscription funnel's success event (RevenueCat redirects here
      // on a completed checkout). Goes to Mixpanel + Supabase via track().
      track("web_purchase_completed", { userId: user.uid });
      markPremium();
      router.replace("/account");
    }
  }, [upgraded, user, markPremium, router]);

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
            <div
              className={`account-cell ${
                profile?.isPremium && stats && stats.totalCount > 0
                  ? "account-cell--closet"
                  : "account-cell--closet-full"
              }`}
            >
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

            {/* Cleaner alternatives — beside the closet snapshot */}
            {profile?.isPremium &&
              stats &&
              stats.totalCount > 0 &&
              alternatives &&
              alternatives.length > 0 && (
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
                    <CleanerAlternativesList items={alternatives} />
                  </Panel>
                </div>
              )}

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
                    catalogIds={catalogIds}
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
                  router.replace("/");
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

// Small info "i" with a hover/click tooltip, explains the score.
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

// "Your closet" snapshot — donut hero with the average score inside the ring,
// the good/okay/bad split beneath it, and the top 5 fibers as chips.
function ClosetSnapshot({ stats }: { stats: ClosetStats }) {
  const risk = [
    { count: stats.riskBreakdown.low, color: "var(--risk-low)", label: "good" },
    { count: stats.riskBreakdown.moderate, color: "var(--orange)", label: "okay" },
    { count: stats.riskBreakdown.high, color: "var(--red)", label: "bad" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        height: "100%",
        minHeight: 240,
        padding: "8px 0",
      }}
    >
      <ClosetDonut stats={stats} size={200} />
      <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--ink-2)", flexWrap: "wrap", justifyContent: "center" }}>
        {risk.map((s) => (
          <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
            <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{s.count}</strong> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

// Compact cleaner-alternatives list for the panel beside the closet snapshot.
function CleanerAlternativesList({ items }: { items: Product[] }) {
  const alts = items.slice(0, 4);
  if (alts.length === 0) {
    return (
      <div style={{ fontSize: 14, color: "var(--ink-2)" }}>
        <Link href="/shop" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
          browse the shop →
        </Link>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
      {alts.map((p) => (
        <Link
          key={p.id}
          href={`/shop/${p.id}`}
          className="acct-card"
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            className="acct-thumb"
            style={{
              position: "relative",
              aspectRatio: "266 / 380",
              width: "100%",
              background: "var(--tan)",
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            {p.item_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.item_image}
                alt={p.item_name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
            )}
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.01em", color: "var(--ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.item_name}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.brand}
            {p.item_price != null && (
              <>
                <span style={{ color: "var(--ink-3)", margin: "0 4px" }}>·</span>${p.item_price.toLocaleString()}
              </>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */

// Full-closet fiber donut (every fiber a slice, colored by its hazard) with the
// average score sitting inside the ring.
function ClosetDonut({ stats, size }: { stats: ClosetStats; size: number }) {
  const ring = stats.fiberDistribution;
  const stroke = Math.round(size * 0.12);
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = ring.map((s) => {
    const length = s.share * circ;
    const a = { ...s, length, offset };
    offset += length;
    return a;
  });

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={a.fiber + i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={hazardColor(a.hazardScore)}
            strokeWidth={stroke}
            strokeDasharray={`${a.length} ${circ}`}
            strokeDashoffset={-a.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 46, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink)" }}>
          {stats.avgToxomeScore}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 5 }}>
          avg score
        </div>
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
            {s.brandName || s.category || "–"}
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
        justifyContent: "space-between",
        gap: 24,
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
      </div>
      {/* QR to the App Store listing — scan to download, on the right. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 9,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--hairline)",
            borderRadius: 14,
            padding: 11,
            lineHeight: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-store-qr.svg"
            alt="Scan to download the Toxome app from the App Store"
            width={112}
            height={112}
            style={{ display: "block", width: 112, height: 112 }}
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

/* ──────────────────────────────────────────────────────────────── */

function WishlistRow({
  items,
  catalogIds,
  onRemove,
  moreHref,
}: {
  items: WishlistItem[];
  catalogIds: Set<string> | null;
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
      {items.map((item) => {
        // Items saved via the extension aren't always in our catalog, so
        // /shop/[id] would 404. When we know the item isn't a catalog product,
        // link straight to the store URL it was saved from instead.
        const externalUrl = item.item_url || item.affiliate_url;
        const routeExternal =
          catalogIds !== null && !catalogIds.has(item.productId) && !!externalUrl;
        const linkStyle: React.CSSProperties = {
          textDecoration: "none",
          color: "inherit",
          display: "block",
        };
        const cardInner = (
          <>
            <div
              className="acct-thumb"
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
          </>
        );
        return (
          <div
            key={item.productId}
            style={{ position: "relative", flex: "0 0 auto", width: CARD }}
          >
            {routeExternal ? (
              <a
                href={externalUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="acct-card"
                style={linkStyle}
              >
                {cardInner}
              </a>
            ) : (
              <Link href={`/shop/${item.productId}`} className="acct-card" style={linkStyle}>
                {cardInner}
              </Link>
            )}
          </div>
        );
      })}
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

// A representative (not real) closet, used purely as the blurred teaser behind
// the locked-state unlock prompt. No user data is read for free accounts.
const SAMPLE_CLOSET_STATS: ClosetStats = {
  totalCount: 15,
  avgToxomeScore: 72,
  lastScanAt: null,
  riskBreakdown: { low: 10, moderate: 3, high: 2 },
  fiberDistribution: [
    { fiber: "cotton", share: 0.36, hazardScore: 82 },
    { fiber: "linen", share: 0.18, hazardScore: 88 },
    { fiber: "wool", share: 0.12, hazardScore: 72 },
    { fiber: "viscose", share: 0.14, hazardScore: 50 },
    { fiber: "polyester", share: 0.12, hazardScore: 24 },
    { fiber: "elastane", share: 0.08, hazardScore: 30 },
  ],
  problemCategories: [],
};

function ClosetLockedCTA({ scanCount }: { scanCount: number }) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: 340,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Blurred sample closet — a teaser of what Premium shows. Decorative;
          aria-hidden and inert so it's skipped by AT and not interactive. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
          gap: 28,
          alignItems: "center",
          padding: "8px 20px",
          filter: "blur(7px)",
          opacity: 0.5,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <ClosetSnapshot stats={SAMPLE_CLOSET_STATS} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div style={{ aspectRatio: "266 / 380", background: "var(--tan)", borderRadius: 8, marginBottom: 8 }} />
              <div style={{ height: 9, width: "85%", background: "var(--tan)", borderRadius: 3, marginBottom: 5 }} />
              <div style={{ height: 8, width: "55%", background: "var(--tan)", borderRadius: 3 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Unlock prompt — in normal flow so the card (and this container) grows
          with the revealed plans instead of clipping them. */}
      <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "rgba(252,251,247,0.82)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            border: "1px solid var(--hairline)",
            borderRadius: 16,
            boxShadow:
              "0 1px 2px rgba(59,60,58,.04), 0 18px 40px rgba(59,60,58,.10)",
            padding: "28px 30px",
            maxWidth: 540,
            width: "100%",
            textAlign: "center",
          }}
        >
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
              margin: "0 auto 22px",
              maxWidth: 440,
            }}
          >
            Toxome Premium gives you your closet&apos;s average score, the fiber
            breakdown of everything you own, and cleaner alternatives matched to
            the categories you wear most.
            {scanCount > 0 && (
              <>
                {" "}
                You&apos;ve already scanned {scanCount}{" "}
                {scanCount === 1 ? "item" : "items"}. Unlock to see them all in
                one view.
              </>
            )}
          </p>
          <UpgradeButton />
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
