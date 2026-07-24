"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AccountLinkRequiredError } from "@/contexts/AuthContext";
import { track } from "@/lib/track";

// Sign-in prompt shown when a signed-out shopper taps the wishlist heart on the
// product grid. Google/Apple sign in inline (signInWithPopup resolves in-page,
// so the shopper never leaves the grid — the parent applies the pending like
// once auth completes). Email create-account / sign-in route to /login, which
// already reads the stashed pendingLike + return param and applies the like on
// arrival. Matches the newsletter popup surface (white card, hairline, ink CTA)
// but centered with a scrim, since this interrupts a deliberate save action.
type Props = {
  productId: string;
  returnPath: string;
  onClose: () => void;
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.152 9.57c.02 2.13 1.868 2.84 1.888 2.848-.015.05-.295 1.01-.973 2.003-.586.86-1.194 1.716-2.152 1.734-.94.017-1.243-.558-2.32-.558-1.075 0-1.412.54-2.303.575-.925.035-1.63-.93-2.221-1.787-1.21-1.752-2.135-4.95-.893-7.108.617-1.072 1.72-1.75 2.918-1.768.91-.017 1.767.612 2.322.612.556 0 1.598-.757 2.694-.646.459.02 1.746.186 2.573 1.4-.067.041-1.536.897-1.52 2.673M10.4 3.51c.49-.594.82-1.42.73-2.243-.706.028-1.56.47-2.067 1.064-.454.526-.852 1.367-.745 2.174.787.061 1.592-.4 2.082-.995"
      />
    </svg>
  );
}

const socialButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  height: 44,
  width: "100%",
  borderRadius: 999,
  border: "1px solid var(--hairline-strong)",
  background: "var(--white)",
  color: "var(--ink)",
  fontFamily: "var(--sans)",
  fontSize: 14,
  letterSpacing: "-0.005em",
  cursor: "pointer",
};

export default function SaveSignInPopup({
  productId,
  returnPath,
  onClose,
}: Props) {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    track("save_signin_prompt_shown", { productId });
  }, [productId]);

  // Close on Escape, and lock body scroll while the modal is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  async function oauth(method: "google" | "apple") {
    if (busy) return;
    setError("");
    setBusy(method);
    track("save_signin_prompt_action", { productId, metadata: { choice: method } });
    try {
      await (method === "google" ? signInWithGoogle() : signInWithApple());
      // Success: the parent's pending-like effect fills the heart once the auth
      // state flips. Just dismiss.
      onClose();
    } catch (e) {
      // The account exists under a different method: the linking UI lives on
      // /login. Send them there with the like still stashed.
      if (e instanceof AccountLinkRequiredError) {
        router.push(`/login?return=${encodeURIComponent(returnPath)}`);
        return;
      }
      const code = (e as { code?: string })?.code;
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        // They backed out of the provider window — no error, let them retry.
        setBusy(null);
        return;
      }
      setError("That didn't work. Try again, or use email below.");
      setBusy(null);
    }
  }

  function goToLogin(mode: "signup" | "signin") {
    const choice = mode === "signup" ? "create_account" : "email_signin";
    track("save_signin_prompt_action", { productId, metadata: { choice } });
    const q =
      mode === "signup"
        ? `?mode=signup&return=${encodeURIComponent(returnPath)}`
        : `?return=${encodeURIComponent(returnPath)}`;
    router.push(`/login${q}`);
  }

  return (
    <div
      className="save-pop-scrim"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(59,60,58,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to save this item"
        className="save-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(380px, calc(100vw - 32px))",
          background: "var(--white)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: 16,
          padding: 26,
          boxShadow:
            "0 24px 64px -16px rgba(59,60,58,0.28), 0 6px 18px -8px rgba(59,60,58,0.14)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 26,
            height: 26,
            border: "none",
            background: "transparent",
            color: "var(--ink-3)",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>

        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            margin: "0 0 10px",
          }}
        >
          save to your closet
        </p>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 22,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            margin: "0 0 6px",
            fontWeight: 500,
          }}
        >
          Save what you love.
        </p>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--ink-2)",
            margin: "0 0 18px",
          }}
        >
          Sign in to keep this piece in your saved list and pick up on any
          device.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            style={{
              ...socialButtonStyle,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy && busy !== "google" ? 0.55 : 1,
            }}
            onClick={() => oauth("google")}
            disabled={!!busy}
          >
            <GoogleIcon />
            {busy === "google" ? "..." : "continue with google"}
          </button>
          <button
            style={{
              ...socialButtonStyle,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy && busy !== "apple" ? 0.55 : 1,
            }}
            onClick={() => oauth("apple")}
            disabled={!!busy}
          >
            <AppleIcon />
            {busy === "apple" ? "..." : "continue with apple"}
          </button>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "var(--red)", margin: "10px 0 0" }}>
            {error}
          </p>
        )}

        <button
          onClick={() => goToLogin("signup")}
          disabled={!!busy}
          style={{
            marginTop: 12,
            height: 44,
            width: "100%",
            borderRadius: 999,
            border: "1px solid var(--ink)",
            background: "var(--ink)",
            color: "var(--white)",
            fontFamily: "var(--sans)",
            fontSize: 14,
            letterSpacing: "-0.005em",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.55 : 1,
          }}
        >
          create account with email
        </button>

        <p
          style={{
            fontSize: 13,
            color: "var(--ink-2)",
            textAlign: "center",
            margin: "16px 0 0",
          }}
        >
          already have an account?{" "}
          <button
            onClick={() => goToLogin("signin")}
            disabled={!!busy}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              textDecoration: "underline",
            }}
          >
            sign in
          </button>
        </p>

        <style jsx>{`
          .save-pop {
            animation: savePopIn 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
          }
          @keyframes savePopIn {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: none;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .save-pop {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
