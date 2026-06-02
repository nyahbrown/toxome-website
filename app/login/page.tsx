"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import ConsentNote from "@/components/ConsentNote";
import type { Product } from "@/types/product";

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
    <svg width="17" height="17" viewBox="0 0 814 1000" aria-hidden="true" style={{ fill: "var(--ink)" }}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.1 190.5-49.1 30.8 0 130.4 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return") || "/shop";

  const { user, loading, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, sendPasswordReset, toggleWishlist } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  // Newsletter opt-in shown on the create-account form, default selected.
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  // Social-first: the email/password form is collapsed until the visitor taps
  // "or … with email".
  const [emailOpen, setEmailOpen] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.replace(returnTo);
    }
  }, [user, loading, router, returnTo]);

  async function handlePostLogin() {
    const pendingId = sessionStorage.getItem("pendingLike");
    const pendingRaw = sessionStorage.getItem("pendingLikeProduct");
    if (pendingId && pendingRaw) {
      try {
        const product = JSON.parse(pendingRaw) as Product;
        await toggleWishlist(product);
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("pendingLike");
      sessionStorage.removeItem("pendingLikeProduct");
    }
    router.replace(returnTo);
  }

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle();
      await handlePostLogin();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  }

  async function handleApple() {
    setError("");
    try {
      await signInWithApple();
      await handlePostLogin();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setResetSent(false);
    const target = email.trim();
    if (!target) {
      setError("Enter your email above and we'll send a reset link.");
      return;
    }
    try {
      await sendPasswordReset(target);
      setResetSent(true);
    } catch (e: unknown) {
      if (e instanceof Error) {
        const msg = e.message;
        if (msg.includes("user-not-found")) {
          // Don't leak account existence — confirm reset either way.
          setResetSent(true);
        } else if (msg.includes("invalid-email")) {
          setError("That email doesn't look right.");
        } else {
          setError(msg);
        }
      }
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        if (subscribeNewsletter) {
          // Fire-and-forget opt-in — never block account creation on it.
          fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              source: "account_signup",
            }),
          }).catch(() => {});
        }
      }
      await handlePostLogin();
    } catch (e: unknown) {
      if (e instanceof Error) {
        const msg = e.message;
        if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
          setError("Wrong password. Please try again.");
        } else if (msg.includes("user-not-found")) {
          setError("No account found with that email.");
        } else if (msg.includes("email-already-in-use")) {
          setError("An account with this email already exists.");
        } else if (msg.includes("weak-password")) {
          setError("Password must be at least 6 characters.");
        } else {
          setError(msg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 8,
    padding: "12px 16px",
    background: "var(--white)",
    color: "var(--ink)",
    fontSize: 14,
    fontFamily: "var(--sans)",
    outline: "none",
    boxSizing: "border-box",
  };

  const socialButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 999,
    padding: "12px 24px",
    background: "var(--white)",
    color: "var(--ink)",
    fontSize: 14,
    fontFamily: "var(--sans)",
    cursor: "pointer",
    letterSpacing: "-0.005em",
  };

  const submitButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 999,
    padding: "12px 24px",
    background: "var(--ink)",
    color: "var(--white)",
    fontSize: 14,
    fontFamily: "var(--sans)",
    cursor: submitting ? "not-allowed" : "pointer",
    letterSpacing: "-0.005em",
    opacity: submitting ? 0.6 : 1,
  };

  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingTop: 64,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "64px 24px 80px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {/* Brand mark — logo above "Toxome", same eye + wordmark used in
              the footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginBottom: 28,
            }}
          >
            <Image
              src="/toxome-logo.png"
              alt=""
              width={56}
              height={36}
              style={{ height: 36, width: "auto", display: "block" }}
              priority
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                textTransform: "none",
              }}
            >
              Toxome
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 0 10px",
            }}
          >
            {mode === "signin" ? "sign in" : "create account"}
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              color: "var(--ink-3)",
              margin: 0,
              letterSpacing: "-0.005em",
            }}
          >
            {mode === "signin"
              ? "save items, sync with the app"
              : "join to save items and sync with the app"}
          </p>
        </div>

        {/* Social buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={socialButtonStyle} onClick={handleGoogle}>
            <GoogleIcon />
            continue with google
          </button>
          <button style={socialButtonStyle} onClick={handleApple}>
            <AppleIcon />
            continue with apple
          </button>
        </div>

        {/* Email — social-first; the email/password form expands on tap. */}
        <div style={{ marginTop: 18 }}>
          {!emailOpen ? (
            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                aria-expanded={emailOpen}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  color: "var(--ink-3)",
                  letterSpacing: "-0.005em",
                  padding: "6px 0",
                }}
              >
                or{" "}
                <span style={{ textDecoration: "underline", textUnderlineOffset: 3, color: "var(--ink-2)" }}>
                  {mode === "signin" ? "log in with email" : "sign up with email"}
                </span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleEmailSubmit}
              className="auth-email-reveal"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />

              {mode === "signin" && (
                <div style={{ textAlign: "center", marginTop: -2 }}>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--sans)",
                      fontSize: 12,
                      color: "var(--ink-3)",
                      letterSpacing: "-0.005em",
                      padding: "2px 0",
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                  >
                    forgot password?
                  </button>
                </div>
              )}

              {resetSent && (
                <p
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    color: "var(--ink-2)",
                    margin: "4px 0 0",
                    letterSpacing: "-0.005em",
                  }}
                >
                  If an account exists for that email, a reset link is on its way.
                  Check your inbox (and spam).
                </p>
              )}

              {mode === "signup" && (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={subscribeNewsletter}
                  onClick={() => setSubscribeNewsletter((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "2px 0",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      border: `1px solid ${
                        subscribeNewsletter ? "var(--ink)" : "var(--hairline-strong)"
                      }`,
                      background: subscribeNewsletter ? "var(--ink)" : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 140ms ease, border-color 140ms ease",
                    }}
                  >
                    {subscribeNewsletter && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path
                          d="M2.5 6.2l2.2 2.2 4.8-4.8"
                          stroke="var(--white)"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      lineHeight: 1.45,
                      letterSpacing: "-0.005em",
                      color: "var(--ink-2)",
                    }}
                  >
                    subscribe to weekly newsletter
                  </span>
                </button>
              )}

              <button type="submit" style={submitButtonStyle} disabled={submitting}>
                {submitting ? "..." : mode === "signin" ? "sign in" : "create account"}
              </button>
            </form>
          )}
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--red)",
              margin: "12px 0 0",
              letterSpacing: "-0.005em",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        {/* Toggle mode */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--ink-3)",
              letterSpacing: "-0.005em",
            }}
          >
            {mode === "signin" ? (
              <>
                don&apos;t have an account?{" "}
                <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                  create one
                </span>
              </>
            ) : (
              <>
                already have an account?{" "}
                <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                  sign in
                </span>
              </>
            )}
          </button>
        </div>

        <ConsentNote
          lead="By continuing, you agree to our"
          style={{ marginTop: 36 }}
        />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ background: "var(--cream)", minHeight: "100vh" }} />}>
      <LoginContent />
    </Suspense>
  );
}
