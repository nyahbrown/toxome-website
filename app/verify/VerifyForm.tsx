"use client";

import { useRef, useState } from "react";

const CLAIMS = [
  "PFAS-free",
  "Azo-dye-free",
  "Formaldehyde-free",
  "Low-impact / OEKO-TEX-equivalent dyes",
  "Organic / GOTS-equivalent",
] as const;

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.doc,.docx";
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 8;

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--sans)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink)",
  marginBottom: 7,
  letterSpacing: "-0.005em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--sans)",
  fontSize: 15,
  color: "var(--ink)",
  background: "var(--white)",
  border: "1px solid var(--hairline-strong)",
  borderRadius: 12,
  padding: "11px 14px",
  outline: "none",
  boxSizing: "border-box",
};

const fieldGap: React.CSSProperties = { marginBottom: 22 };

function ext(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export default function VerifyForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [claims, setClaims] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleClaim(c: string) {
    setClaims((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;

    const next = [...files];
    for (const f of picked) {
      if (!ALLOWED_EXT.includes(ext(f.name))) {
        setError(`"${f.name}" is not an allowed file type.`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setError(`"${f.name}" is over the 10MB limit.`);
        continue;
      }
      if (!next.some((x) => x.name === f.name && x.size === f.size)) {
        next.push(f);
      }
    }
    if (next.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files.`);
      setFiles(next.slice(0, MAX_FILES));
    } else {
      setFiles(next);
    }
    // Reset the input so the same file can be re-picked if removed.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(name: string, size: number) {
    setFiles((prev) => prev.filter((f) => !(f.name === name && f.size === size)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const formEl = e.currentTarget;
      const fd = new FormData();
      const brand = (formEl.elements.namedItem("brand_name") as HTMLInputElement).value.trim();
      const email = (formEl.elements.namedItem("contact_email") as HTMLInputElement).value.trim();
      const productName = (formEl.elements.namedItem("product_name") as HTMLInputElement).value.trim();
      const productUrl = (formEl.elements.namedItem("product_url") as HTMLInputElement).value.trim();
      const message = (formEl.elements.namedItem("message") as HTMLTextAreaElement).value.trim();

      fd.set("brand_name", brand);
      fd.set("contact_email", email);
      fd.set("product_name", productName);
      fd.set("product_url", productUrl);
      fd.set("message", message);
      for (const c of claims) fd.append("claims", c);
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/brand-disclosures", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `Request failed (${res.status})`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        style={{
          border: "1px solid var(--hairline-strong)",
          borderRadius: 16,
          background: "var(--white)",
          padding: "28px 26px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 18,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.015em",
            margin: "0 0 8px",
          }}
        >
          Thanks. We got your documents.
        </p>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--ink-2)",
            margin: 0,
          }}
        >
          We will review them and update your score&apos;s verification. We may
          email you if we need anything else.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div style={fieldGap}>
        <label htmlFor="brand_name" style={labelStyle}>
          Brand name <span style={{ color: "var(--ink-3)" }}>(required)</span>
        </label>
        <input id="brand_name" name="brand_name" type="text" required style={inputStyle} />
      </div>

      <div style={fieldGap}>
        <label htmlFor="contact_email" style={labelStyle}>
          Contact email <span style={{ color: "var(--ink-3)" }}>(required)</span>
        </label>
        <input id="contact_email" name="contact_email" type="email" required style={inputStyle} />
      </div>

      <div style={fieldGap}>
        <label htmlFor="product_name" style={labelStyle}>
          Product name
        </label>
        <input id="product_name" name="product_name" type="text" style={inputStyle} />
      </div>

      <div style={fieldGap}>
        <label htmlFor="product_url" style={labelStyle}>
          Product URL
        </label>
        <input id="product_url" name="product_url" type="url" placeholder="https://" style={inputStyle} />
      </div>

      <div style={fieldGap}>
        <span style={labelStyle}>What does your documentation show?</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {CLAIMS.map((c) => {
            const on = claims.includes(c);
            return (
              <label
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "var(--sans)",
                  fontSize: 15,
                  color: "var(--ink-2)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleClaim(c)}
                  style={{ accentColor: "var(--ink)", width: 16, height: 16 }}
                />
                {c}
              </label>
            );
          })}
        </div>
      </div>

      <div style={fieldGap}>
        <label htmlFor="message" style={labelStyle}>
          Anything else
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      </div>

      <div style={fieldGap}>
        <span style={labelStyle}>Documents</span>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 13,
            color: "var(--ink-3)",
            margin: "0 0 10px",
          }}
        >
          PDF, JPG, PNG, or Word. Up to {MAX_FILES} files, 10MB each.
        </p>
        <input
          ref={fileInputRef}
          id="files"
          type="file"
          multiple
          accept={ACCEPT}
          onChange={onFilesPicked}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            padding: "10px 18px",
            borderRadius: 999,
            border: "1px solid var(--hairline-strong)",
            background: "var(--white)",
            color: "var(--ink)",
            cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >
          Choose files
        </button>

        {files.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              margin: "14px 0 0",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {files.map((f) => (
              <li
                key={`${f.name}-${f.size}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  color: "var(--ink-2)",
                  background: "var(--white)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 10,
                  padding: "9px 12px",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.name, f.size)}
                  aria-label={`Remove ${f.name}`}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-3)",
                    fontSize: 16,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            color: "var(--red)",
            margin: "0 0 16px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="pill-cta"
        style={{
          opacity: submitting ? 0.6 : 1,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
