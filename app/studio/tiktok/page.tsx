import { SLIDES, slideScore, slideRisk, slideFileName } from "@/lib/social-slides";

// Localhost preview of the TikTok slideshow slides. Not linked from anywhere,
// not meant to ship. Treatment is LOCKED: Toxome lockup top-left, score ring
// top-right, photo filling the 9:16 frame (crops). Each slide downloads as a
// 1080×1920 PNG named for its brand, ready to drop into a TikTok slideshow.

export const dynamic = "force-dynamic";

export default function TikTokStudio() {
  return (
    <main style={{ padding: "48px 40px 80px", background: "var(--cream)", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>tiktok slideshow</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 8 }}>
        1080×1920. product photo, toxome lockup, score ring. nothing else.
      </p>
      <p style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 4 }}>
        right-click any slide to save it, or use the download link under it.
      </p>

      <div style={{ display: "flex", gap: 28, marginTop: 36, flexWrap: "wrap" }}>
        {SLIDES.map((s, i) => {
          const score = slideScore(s);
          const risk = slideRisk(s);
          return (
            <div key={s.url} style={{ width: 270 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/studio/tiktok/${i}`}
                alt={s.name}
                width={270}
                height={480}
                style={{ width: 270, height: 480, objectFit: "contain", background: "var(--tan)" }}
              />
              <div style={{ marginTop: 12, fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{s.brand}</div>
              <div style={{ fontSize: 14, color: "var(--ink-2)" }}>{s.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
                {Object.entries(s.composition)
                  .map(([f, v]) => `${v}% ${f}`)
                  .join(", ")}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
                score {score} · {risk}
                {s.certifications.length ? ` · ${s.certifications.join(", ")}` : ""}
              </div>
              <a
                href={`/studio/tiktok/${i}?download=1`}
                download={slideFileName(s, i, "tiktok")}
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 14,
                  textDecoration: "none",
                  background: "var(--ink)",
                  color: "var(--cream)",
                }}
              >
                download png
              </a>
            </div>
          );
        })}
      </div>
    </main>
  );
}
