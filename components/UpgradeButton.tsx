"use client";

// On-brand plan selection for Toxome Premium. Renders Monthly + Annual cards in
// the site's own design; each links to the user's RevenueCat Web Purchase Link
// with the plan pre-selected (package_id), so the customer goes straight from
// our page toward Stripe Checkout — they never see RevenueCat's generic picker.
// On success RevenueCat redirects to /account?upgraded=1 and AccountClient flips
// to premium.
//
// Until the purchase link is configured (NEXT_PUBLIC_REVENUECAT_PURCHASE_LINK
// unset) or for a logged-out edge case, this falls back to the App Store CTA so
// the page is never broken.
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  purchaseLinkForUser,
  webBillingEnabled,
  PACKAGE_MONTHLY,
  PACKAGE_ANNUAL,
} from "@/lib/revenuecat";
import { track } from "@/lib/track";

const APP_STORE_URL = "https://apps.apple.com/us/app/toxome/id6748622034";

export default function UpgradeButton() {
  const { user } = useAuth();
  // Plans stay hidden behind a single CTA until the user opts in — one clear
  // action first, the annual/monthly choice second.
  const [showPlans, setShowPlans] = useState(false);

  if (!webBillingEnabled || !user) {
    return (
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="pill-cta"
        style={{ justifyContent: "center" }}
      >
        Download the app to unlock
      </a>
    );
  }

  if (!showPlans) {
    return (
      <button
        type="button"
        className="pill-cta"
        style={{ justifyContent: "center" }}
        onClick={() => {
          track("web_upgrade_plans_shown", { userId: user.uid });
          setShowPlans(true);
        }}
      >
        Upgrade to Premium
      </button>
    );
  }

  // PremiumPlans' own `.plan-cards` entrance animation plays the reveal.
  return (
    <div style={{ textAlign: "left" }}>
      <button
        type="button"
        className="plan-back"
        onClick={() => setShowPlans(false)}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        back
      </button>
      <PremiumPlans uid={user.uid} />
    </div>
  );
}

// The two on-brand plan cards. Exported so the upgrade-preview page renders the
// exact same UI customers see.
export function PremiumPlans({ uid }: { uid: string }) {
  return (
    <div className="plan-cards">
      <PlanCard
        href={purchaseLinkForUser(uid, PACKAGE_ANNUAL)}
        onSelect={() =>
          track("web_upgrade_opened", {
            userId: uid,
            metadata: { plan: "annual" },
          })
        }
        eyebrow="annual"
        badge="best value · 37% off"
        price="$29.99"
        cadence="/year"
        note="3 days free, then billed yearly"
        featured
      />
      <PlanCard
        href={purchaseLinkForUser(uid, PACKAGE_MONTHLY)}
        onSelect={() =>
          track("web_upgrade_opened", {
            userId: uid,
            metadata: { plan: "monthly" },
          })
        }
        eyebrow="monthly"
        price="$3.99"
        cadence="/month"
        note="billed monthly"
      />
    </div>
  );
}

function PlanCard({
  href,
  onSelect,
  eyebrow,
  badge,
  price,
  cadence,
  note,
  featured = false,
}: {
  href: string;
  onSelect: () => void;
  eyebrow: string;
  badge?: string;
  price: string;
  cadence: string;
  note: string;
  featured?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onSelect}
      className={featured ? "plan-card plan-card--featured" : "plan-card"}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          minHeight: 18,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          {eyebrow}
        </span>
        {badge && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink)",
              background: "var(--blue)",
              borderRadius: 999,
              padding: "3px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          {price}
        </span>
        <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{cadence}</span>
      </div>

      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{note}</span>
    </a>
  );
}
