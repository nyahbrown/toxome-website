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

function PhoneScreenshot() {
  const width = 320;
  const height = Math.round(width * (2436 / 1125));
  const radius = Math.round(width * 0.155);
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: "linear-gradient(160deg, #1a1d20 0%, #0c0e10 100%)",
      padding: Math.round(width * 0.025),
      boxShadow: "0 40px 90px rgba(59,60,58,.22), 0 12px 32px rgba(59,60,58,.10), 0 0 0 1px rgba(255,255,255,.06) inset",
      position: "relative",
      flexShrink: 0,
    }}>
      <div style={{
        width: "100%", height: "100%",
        borderRadius: radius - Math.round(width * 0.025),
        overflow: "hidden",
        position: "relative",
        background: "#0c0e10",
      }}>
        <Image
          src="/app-screenshot.png"
          alt="Toxome hazard analysis: composition breakdown and per-axis health impact"
          fill
          style={{ objectFit: "cover", objectPosition: "top" }}
        />
        {/* Dynamic Island */}
        <div style={{
          position: "absolute",
          top: Math.round(width * 0.038),
          left: "50%",
          transform: "translateX(-50%)",
          width: Math.round(width * 0.30),
          height: Math.round(width * 0.085),
          background: "#0c0e10",
          borderRadius: 999,
          zIndex: 10,
        }} />
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section style={{ paddingBottom: 80 }}>
      <div className="shell" style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        gap: 80,
        alignItems: "center",
        paddingTop: 80,
      }}>
        {/* Copy */}
        <div>
          <div className="eyebrow reveal" data-reveal-delay="0">
            Toxome · A scanner for what you wear
          </div>
          <h1 className="reveal" data-reveal-delay="200" style={{
            fontFamily: "var(--sans)",
            fontWeight: 600,
            fontSize: "clamp(44px, 5.5vw, 68px)",
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            margin: "24px 0 28px",
          }}>
            Know what&apos;s in<br /><em style={{ fontStyle: "italic", fontWeight: 500, color: "var(--ink-2)" }}>your clothes.</em>
          </h1>
          <p className="reveal" data-reveal-delay="400" style={{
            fontSize: 19, lineHeight: 1.45, color: "var(--ink-2)",
            maxWidth: 540, margin: "0 0 36px", letterSpacing: "-0.011em",
          }}>
            Photograph the composition tag on any garment. Toxome reads the fibers and
            tells you exactly what they do to your body — and to the world.
          </p>

          <div className="reveal" data-reveal-delay="600">
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="pill-cta">
                <AppleGlyph />
                <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.05 }}>
                  <span style={{ fontSize: 10.5, opacity: .8, letterSpacing: ".04em", textTransform: "uppercase" }}>Download on the</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>App Store</span>
                </span>
              </a>
              <a href="#how" className="pill-cta ghost" style={{ textDecoration: "none" }}>
                <span>See how it works</span>
                <Arrow />
              </a>
            </div>
            <div style={{
              marginTop: 14, fontFamily: "var(--mono)", fontSize: 11.5,
              letterSpacing: "0.08em", color: "var(--ink-3)", textTransform: "uppercase",
            }}>LIVE ON IOS</div>
          </div>
        </div>

        {/* Phone */}
        <div className="reveal" data-reveal-delay="300" style={{
          display: "flex", justifyContent: "center", alignItems: "center", position: "relative",
        }}>
          {/* Pedestal shadow */}
          <div aria-hidden="true" style={{
            position: "absolute", bottom: -28, left: "50%", transform: "translateX(-50%)",
            width: 380, height: 80, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(59,60,58,.12) 0%, rgba(59,60,58,0) 70%)",
            filter: "blur(10px)",
          }} />
          <PhoneScreenshot />
        </div>
      </div>

      {/* Mobile stacked layout */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-phone { display: none !important; }
        }
      `}</style>
    </section>
  );
}
