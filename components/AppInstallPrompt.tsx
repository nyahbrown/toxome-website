"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const APP_STORE = "https://apps.apple.com/us/app/toxome/id6748622034";
const DISMISS_KEY = "tox-app-prompt-dismissed";
const DISMISS_DAYS = 7;

/**
 * Custom install prompt for the Toxome iOS app.
 *
 * Why this exists: the native iOS "Smart App Banner" (apple-itunes-app meta in
 * layout) ONLY renders in Safari. Most of our traffic arrives through the
 * in-app browsers of Instagram, TikTok, and Pinterest, where that banner never
 * shows, so those visitors currently get no install prompt at all. This fills
 * that gap. The app is iOS-only, so we target iOS webviews / non-Safari iOS
 * browsers and stay out of Safari's way (it has Apple's banner) and off Android
 * (there is no Android app to install).
 */

type Variant = "shop" | "scanner" | "save" | "default";

const COPY: Record<Variant, { title: string; sub: string }> = {
  shop: {
    title: "shop the clean edit",
    sub: "the full catalog, in the app.",
  },
  scanner: {
    title: "scan your own closet",
    sub: "any label, an instant score.",
  },
  save: {
    title: "save it to your closet",
    sub: "your closet lives in the app.",
  },
  default: {
    title: "toxome, on your phone",
    sub: "shop clean, scan your closet.",
  },
};

function variantForPath(path: string): Variant {
  if (path === "/shop" || path.startsWith("/shop/")) return "shop";
  if (path === "/methodology" || path === "/guide" || path.startsWith("/guide/"))
    return "scanner";
  return "default";
}

/** True on iOS/iPadOS. The app is iOS-only, so this gates every prompt. */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iP(hone|od|ad)/.test(ua) ||
    // iPadOS 13+ reports as Mac; disambiguate by touch support.
    (/Macintosh/.test(ua) && "ontouchend" in document)
  );
}

/** iOS, but NOT Safari (Safari gets Apple's own banner). Everything else = no prompt. */
function shouldAutoShow(): boolean {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent;
  const inApp =
    /(Instagram|musical_ly|BytedanceWebview|TikTok|Trill|FBAN|FBAV|FB_IAB|Pinterest|Snapchat|Line|Twitter|LinkedInApp)/i.test(
      ua
    );
  // True Safari carries a "Version/x Safari" token; in-app WKWebViews and
  // Chrome/Firefox on iOS (CriOS/FxiOS) do not, or add their own token.
  const isRealSafari =
    /Version\/[\d.]+.*Safari/.test(ua) &&
    !inApp &&
    !/(CriOS|FxiOS|EdgiOS)/.test(ua);
  return !isRealSafari;
}

function dismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!ts) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function AppInstallPrompt() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<Variant>("default");

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode; just close for this session */
    }
  }, []);

  // Auto-show on eligible devices after a short beat, unless recently dismissed.
  useEffect(() => {
    if (!shouldAutoShow() || dismissedRecently()) return;
    const t = setTimeout(() => {
      setVariant(variantForPath(pathname));
      setOpen(true);
    }, 1600);
    return () => clearTimeout(t);
    // Only the first eligible view auto-shows; navigation won't re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Explicit trigger (e.g. a save/heart tap) force-shows with tailored copy,
  // bypassing the device gate and frequency cap since the user asked for it.
  useEffect(() => {
    const onTrigger = (e: Event) => {
      const detail = (e as CustomEvent).detail as { variant?: Variant } | undefined;
      setVariant(detail?.variant ?? variantForPath(pathname));
      setOpen(true);
    };
    window.addEventListener("tox:app-prompt", onTrigger);
    return () => window.removeEventListener("tox:app-prompt", onTrigger);
  }, [pathname]);

  if (!open) return null;
  const { title, sub } = COPY[variant];

  return (
    <div
      role="region"
      aria-label="Get the Toxome app"
      className="tox-app-prompt"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 18,
        background: "var(--cream)",
        border: "1px solid var(--hairline-strong)",
        boxShadow: "0 12px 40px -12px rgba(59,60,58,0.36)",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 46,
          height: 46,
          borderRadius: 11,
          overflow: "hidden",
          border: "1px solid var(--hairline)",
        }}
      >
        <Image
          src="/app-icon.png"
          alt=""
          width={46}
          height={46}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.35,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      </div>

      <a
        href={APP_STORE}
        onClick={close}
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          height: 38,
          padding: "0 18px",
          borderRadius: 999,
          background: "var(--ink)",
          color: "var(--cream)",
          fontFamily: "var(--sans)",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.005em",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        get
      </a>

      <button
        type="button"
        aria-label="Dismiss"
        onClick={close}
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          marginLeft: -4,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--ink-3)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <style jsx>{`
        .tox-app-prompt {
          animation: tox-app-prompt-in 340ms var(--ease-out-strong);
        }
        @keyframes tox-app-prompt-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tox-app-prompt {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Fire from anywhere (e.g. a save tap) to force the prompt open with tailored
 * copy. No-ops on non-iOS (there is no app to install) and returns false so the
 * caller can fall back to its normal flow (e.g. web login).
 */
export function triggerAppPrompt(
  variant: "save" | "shop" | "scanner" | "default" = "save"
): boolean {
  if (!isIosDevice()) return false;
  window.dispatchEvent(new CustomEvent("tox:app-prompt", { detail: { variant } }));
  return true;
}
