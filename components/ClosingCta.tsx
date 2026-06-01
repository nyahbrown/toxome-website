import Image from "next/image";

const APP_STORE_URL = "https://apps.apple.com/us/app/toxome/id6748622034";

function AppleGlyph() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M13.2 9.4c0-2.4 2-3.6 2.1-3.6-1.2-1.7-3-2-3.6-2-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.3-.9C2.9 3.9 1 5 0 6.7c-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3 0 1.8-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-3 1.4-3-.1 0-2.7-1-2.7-4.1 0-2.6 2.1-3.8 2.2-3.9z" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ClosingCta() {
  return (
    <section style={{ padding: "140px 0 120px", background: "var(--bg)" }}>
      <div className="shell">
        <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
            <Image src="/toxome-logo.png" alt="" width={110} height={72} style={{ height: 72, width: "auto" }} />
          </div>
          <h2 style={{
            fontFamily: "var(--serif)", fontWeight: 300,
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1.06, letterSpacing: "-0.02em", margin: "0 0 24px",
          } as React.CSSProperties}>
            Start reading the{" "}
            <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>fine print.</em>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: "var(--ink-2)", maxWidth: 540, margin: "0 auto 40px" }}>
            Free to download. Free to scan. The closet you didn&apos;t know you had.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="pill-cta">
              <AppleGlyph />
              <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.05 }}>
                <span style={{ fontSize: 10.5, opacity: .8, letterSpacing: ".04em", textTransform: "uppercase" }}>Download on the</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>App Store</span>
              </span>
            </a>
            <a href="mailto:hello@toxome.app?subject=Android waitlist" className="pill-cta ghost">
              <span>Email me when Android lands</span>
              <Arrow />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
