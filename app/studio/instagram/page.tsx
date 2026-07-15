import { SLIDES, slideScore, slideRisk, slideFileName } from "@/lib/social-slides";

// Localhost preview of the Instagram post slides. Not linked from anywhere, not
// meant to ship. 4:5 by default (the tallest feed post IG allows), 1:1 optional.

export const dynamic = "force-dynamic";

export default async function InstagramStudio({
  searchParams,
}: {
  searchParams: Promise<{ size?: string }>;
}) {
  const sp = await searchParams;
  const square = sp.size === "square";
  const qs = square ? "?size=square" : "";
  const w = 270;
  const h = square ? 270 : 338;

  const tab = (label: string, href: string, active: boolean) => (
    <a
      key={label}
      href={href}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        fontSize: 14,
        textDecoration: "none",
        border: "1px solid var(--hairline-strong)",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--cream)" : "var(--ink-2)",
      }}
    >
      {label}
    </a>
  );

  return (
    <main style={{ padding: "48px 40px 80px", background: "var(--cream)", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>instagram posts</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 8 }}>
        brand, composition, price. bottom left, inter, white.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 24 }}>
        {tab("4:5 (1080×1350)", "/studio/instagram", !square)}
        {tab("1:1 (1080×1080)", "/studio/instagram?size=square", square)}
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 36, flexWrap: "wrap" }}>
        {SLIDES.map((s, i) => (
          <div key={s.url} style={{ width: w }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/studio/instagram/${i}${qs}`}
              alt={s.name}
              width={w}
              height={h}
              style={{ width: w, height: h, objectFit: "contain", background: "var(--tan)" }}
            />
            <div style={{ marginTop: 12, fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{s.brand}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
              ${s.price} · score {slideScore(s)} · {slideRisk(s)}
            </div>
            <a
              href={`/studio/instagram/${i}?download=1${square ? "&size=square" : ""}`}
              download={slideFileName(s, i, "ig")}
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
        ))}
      </div>
    </main>
  );
}
