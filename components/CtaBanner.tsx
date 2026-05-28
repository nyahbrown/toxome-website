const APP_STORE_URL = "https://apps.apple.com/us/app/toxome/id6748622034";

export default function CtaBanner() {
  return (
    <section style={{ padding: "120px 0", background: "var(--espresso)" }}>
      <div className="shell">
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,0.45)" }}>
            The scanner
          </div>
          <h2 style={{
            fontFamily: "var(--serif)",
            fontWeight: 400,
            fontSize: "clamp(36px, 5vw, 58px)",
            lineHeight: 1.06,
            letterSpacing: "-0.025em",
            color: "var(--cream)",
            margin: "20px 0 24px",
          }}>
            Your clothes are{" "}
            <em style={{ fontStyle: "italic", color: "var(--blue)" }}>
              the longest-running experiment on your body.
            </em>
          </h2>
          <p style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: "rgba(252,251,247,0.65)",
            maxWidth: 500,
            margin: "0 auto 40px",
          }}>
            Free to download. Scan any label. Know what you&apos;re wearing.
          </p>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 26px",
              height: 52,
              borderRadius: 999,
              background: "var(--cream)",
              color: "var(--ink)",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "var(--sans)",
              letterSpacing: "-0.005em",
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true">
              <path d="M11.55 8.37c0-2.13 1.77-3.18 1.85-3.22-1.01-1.48-2.58-1.68-3.14-1.71-1.35-.14-2.63.8-3.31.8-.69 0-1.76-.78-2.89-.76C2.51 3.5.87 4.45 0 5.97c-1.57 2.81-.4 7 1.12 9.29.75 1.1 1.65 2.33 2.82 2.28 1.13-.05 1.56-.73 2.93-.73 1.36 0 1.75.73 2.93.71 1.22-.02 2-1.12 2.75-2.23.87-1.28 1.22-2.52 1.24-2.58-.03-.01-2.24-.86-2.24-3.34zM9.3 2.17C10-.6 9.2 0 9.2 0c-.65.04-1.44.45-1.9 1.01-.42.5-.79 1.3-.69 2.06.74.06 1.49-.38 1.69-.9z"/>
            </svg>
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.05 }}>
              <span style={{ fontSize: 10, opacity: .75, letterSpacing: ".06em", textTransform: "uppercase" }}>Download on the</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>App Store</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
