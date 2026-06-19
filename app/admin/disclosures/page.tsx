"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AdminTabs from "@/components/admin/AdminTabs";

const ADMIN_EMAIL = "nyah@toxome.app";

// ---- Types -----------------------------------------------------------

type DisclosureDoc = { name: string; url: string | null };

type Disclosure = {
  id: string;
  product_id: string | null;
  brand_name: string;
  product_name: string | null;
  product_url: string | null;
  contact_email: string;
  claims: string[] | null;
  message: string | null;
  status: string;
  resolved_rung: string | null;
  admin_notes: string | null;
  created_at: string;
  documents: DisclosureDoc[];
};

type Rung = "self_disclosed" | "verified";

// ---- Small shared helpers --------------------------------------------

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {children}
    </main>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: 10,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--ink-2)",
};

// ---- Main page -------------------------------------------------------

export default function AdminDisclosuresPage() {
  const { user, loading, signOut } = useAuth();
  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Per-row admin choices (rung + notes), keyed by disclosure id.
  const [rungChoice, setRungChoice] = useState<Record<string, Rung>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const token = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }, [user]);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setListLoading(true);
    setListError("");
    try {
      const t = await token();
      const res = await fetch("/api/admin/brand-disclosures", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `Request failed (${res.status})`);
      }
      const j = (await res.json()) as { disclosures: Disclosure[] };
      setDisclosures(j.disclosures ?? []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load disclosures");
    } finally {
      setListLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const decide = useCallback(
    async (d: Disclosure, action: "approve" | "reject") => {
      setBusyId(d.id);
      setListError("");
      try {
        const t = await token();
        const res = await fetch("/api/admin/brand-disclosures", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify({
            id: d.id,
            action,
            rung: action === "approve" ? rungChoice[d.id] ?? "verified" : undefined,
            admin_notes: notesDraft[d.id] ?? "",
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error || `Request failed (${res.status})`);
        }
        // Optimistically remove from the pending list.
        setDisclosures((prev) => prev.filter((x) => x.id !== d.id));
      } catch (e) {
        setListError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusyId(null);
      }
    },
    [token, rungChoice, notesDraft]
  );

  // ---- Gated states --------------------------------------------------

  if (loading) {
    return (
      <Centered>
        <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-3)" }}>
          Loading…
        </span>
      </Centered>
    );
  }

  if (!isAdmin) {
    return (
      <Centered>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ ...eyebrowStyle, marginBottom: 8 }}>Toxome Admin</div>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: 28,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            {user ? "Access denied" : "Sign in"}
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              color: "var(--ink-2)",
              margin: "0 0 20px",
            }}
          >
            {user
              ? `Signed in as ${user.email}. This dashboard is private.`
              : "Sign in on the Admin page to continue."}
          </p>
          {user ? (
            <button
              onClick={() => signOut()}
              style={{
                display: "inline-block",
                fontFamily: "var(--sans)",
                fontSize: 13,
                padding: "9px 18px",
                borderRadius: 999,
                border: "1px solid var(--hairline-strong)",
                background: "var(--white)",
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/admin"
              style={{
                display: "inline-block",
                fontFamily: "var(--sans)",
                fontSize: 13,
                padding: "9px 18px",
                borderRadius: 999,
                border: "1px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--white)",
                textDecoration: "none",
              }}
            >
              Go to Admin
            </Link>
          )}
        </div>
      </Centered>
    );
  }

  // ---- Dashboard -----------------------------------------------------

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", color: "var(--ink)" }}>
      {/* Top bar — matches /admin and /admin/brands */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          background: "var(--cream)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em" }}>
            Toxome
          </span>
          <span style={{ ...eyebrowStyle, color: "var(--ink-3)" }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
            {user.email}
          </span>
          <button
            onClick={() => signOut()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--ink-2)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px 80px" }}>
        <AdminTabs active="disclosures" />

        <section>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
            <h2
              style={{
                fontFamily: "var(--sans)",
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.018em",
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Brand disclosures
            </h2>
            {disclosures.length > 0 && (
              <span
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(230,166,56,0.16)",
                  color: "var(--orange)",
                  border: "1px solid var(--orange)",
                }}
              >
                {disclosures.length}
              </span>
            )}
          </div>

          {listError && (
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--red)",
                margin: "0 0 12px",
              }}
            >
              {listError}
            </p>
          )}

          {listLoading && (
            <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
              Loading…
            </p>
          )}

          {!listLoading && disclosures.length === 0 && (
            <div
              style={{
                border: "1px solid var(--hairline-strong)",
                borderRadius: 12,
                background: "var(--white)",
                padding: "44px 18px",
                textAlign: "center",
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--ink-3)",
              }}
            >
              No pending disclosures.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {disclosures.map((d) => {
              const busy = busyId === d.id;
              const chosen = rungChoice[d.id] ?? "verified";
              return (
                <div
                  key={d.id}
                  style={{
                    border: "1px solid var(--hairline-strong)",
                    borderRadius: 14,
                    background: "var(--white)",
                    padding: "20px 22px",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {/* Header: brand + email + date */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--sans)",
                          fontSize: 16,
                          fontWeight: 600,
                          color: "var(--ink)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {d.brand_name}
                      </div>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
                        {d.contact_email}
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" }}>
                      {d.created_at
                        ? new Date(d.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>

                  {/* Product */}
                  {(d.product_name || d.product_url) && (
                    <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-2)", marginTop: 10 }}>
                      {d.product_name && <span>{d.product_name}</span>}
                      {d.product_url && (
                        <>
                          {d.product_name ? " — " : ""}
                          <a
                            href={d.product_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "var(--blue)" }}
                          >
                            {d.product_url}
                          </a>
                        </>
                      )}
                    </div>
                  )}

                  {!d.product_id && (
                    <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--orange)", marginTop: 8 }}>
                      No product linked. Approving records the rung; apply it to a product manually.
                    </div>
                  )}

                  {/* Claims */}
                  {d.claims && d.claims.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {d.claims.map((c) => (
                        <span
                          key={c}
                          style={{
                            fontFamily: "var(--sans)",
                            fontSize: 12,
                            padding: "3px 10px",
                            borderRadius: 999,
                            border: "1px solid var(--hairline-strong)",
                            background: "var(--cream)",
                            color: "var(--ink-2)",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message */}
                  {d.message && (
                    <p
                      style={{
                        fontFamily: "var(--sans)",
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: "var(--ink-2)",
                        margin: "12px 0 0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {d.message}
                    </p>
                  )}

                  {/* Documents */}
                  {d.documents.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ ...eyebrowStyle, marginBottom: 8 }}>Documents</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {d.documents.map((doc, i) =>
                          doc.url ? (
                            <a
                              key={`${doc.name}-${i}`}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontFamily: "var(--sans)",
                                fontSize: 13,
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: "1px solid var(--hairline-strong)",
                                background: "var(--cream)",
                                color: "var(--ink)",
                                textDecoration: "none",
                              }}
                            >
                              {doc.name}
                            </a>
                          ) : (
                            <span
                              key={`${doc.name}-${i}`}
                              style={{
                                fontFamily: "var(--sans)",
                                fontSize: 13,
                                color: "var(--ink-3)",
                              }}
                            >
                              {doc.name} (unavailable)
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Decision controls */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 18,
                    }}
                  >
                    <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-2)" }}>
                      Grant rung:
                    </span>
                    {(["self_disclosed", "verified"] as const).map((r) => {
                      const on = chosen === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRungChoice((prev) => ({ ...prev, [d.id]: r }))}
                          style={{
                            fontFamily: "var(--sans)",
                            fontSize: 12,
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: `1px solid ${on ? "var(--ink)" : "var(--hairline-strong)"}`,
                            background: on ? "var(--ink)" : "var(--white)",
                            color: on ? "var(--white)" : "var(--ink-2)",
                            cursor: "pointer",
                            letterSpacing: "-0.005em",
                          }}
                        >
                          {r === "self_disclosed" ? "Self-disclosed" : "Verified"}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    placeholder="Admin notes (optional)"
                    value={notesDraft[d.id] ?? ""}
                    onChange={(e) =>
                      setNotesDraft((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                    rows={2}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: 12,
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      color: "var(--ink)",
                      background: "var(--cream)",
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: 10,
                      padding: "9px 12px",
                      outline: "none",
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                  />

                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <ActionButton tone="approve" disabled={busy} onClick={() => decide(d, "approve")}>
                      Approve
                    </ActionButton>
                    <ActionButton tone="danger" disabled={busy} onClick={() => decide(d, "reject")}>
                      Reject
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

// ---- Small components ------------------------------------------------

function ActionButton({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "approve" | "danger";
}) {
  const palette =
    tone === "approve"
      ? { bg: "rgba(173,200,156,0.25)", fg: "#4f6e3b", border: "var(--risk-low)" }
      : tone === "danger"
      ? { bg: "rgba(200,66,66,0.10)", fg: "var(--red)", border: "rgba(200,66,66,0.4)" }
      : { bg: "var(--white)", fg: "var(--ink-2)", border: "var(--hairline-strong)" };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--sans)",
        fontSize: 13,
        padding: "8px 16px",
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.fg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </button>
  );
}
