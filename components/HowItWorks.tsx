const steps = [
  {
    n: "01",
    title: "Scan the label",
    body: "Open the camera, frame the composition tag. Toxome reads it in under two seconds — no typing, no hunting for the brand online.",
    visual: "scan",
  },
  {
    n: "02",
    title: "See the hazards",
    body: "Six axes — endocrine, microplastics, breathability, skin, biodegradability, climate — rated Low, Moderate, or High in plain English.",
    visual: "analyze",
  },
  {
    n: "03",
    title: "Save to your closet",
    body: "Every scan lives in your private closet. Filter by detox priority. Plan replacements. Watch the average drop as you swap things out.",
    visual: "save",
  },
];

function ScanVisual() {
  return (
    <div style={{ fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.7, color: "var(--ink-2)" }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>Composition label</div>
      <div style={{
        padding: 18, background: "#EEEEEE", borderRadius: 10,
        border: "1px dashed var(--hairline-strong)", position: "relative",
      }}>
        <div style={{ fontWeight: 600 }}>FABRIC CONTENT</div>
        <div>72% TENCEL™ LYOCELL</div>
        <div>26% ORGANIC COTTON</div>
        <div>2% ELASTANE</div>
        {(["tl","tr","bl","br"] as const).map((p) => (
          <div key={p} style={{
            position: "absolute", width: 14, height: 14,
            borderTop: p[0] === "t" ? "1.5px solid var(--ink)" : "none",
            borderBottom: p[0] === "b" ? "1.5px solid var(--ink)" : "none",
            borderLeft: p[1] === "l" ? "1.5px solid var(--ink)" : "none",
            borderRight: p[1] === "r" ? "1.5px solid var(--ink)" : "none",
            ...(p[0] === "t" ? { top: -2 } : { bottom: -2 }),
            ...(p[1] === "l" ? { left: -2 } : { right: -2 }),
          }} />
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--ink-3)" }}>↳ OCR · fiber-name match · 1.4s</div>
    </div>
  );
}

function AnalyzeVisual() {
  const rows: [string, string, string][] = [
    ["Endocrine disruption", "Low", "#7B9B69"],
    ["Microplastic shedding", "Moderate", "#E6A638"],
    ["Breathability", "High", "#7B9B69"],
    ["Skin irritation", "Low", "#7B9B69"],
    ["Biodegradability", "High", "#7B9B69"],
    ["Climate impact", "Moderate", "#E6A638"],
  ];
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 16 }}>Six axes</div>
      {rows.map(([label, level, c]) => (
        <div key={label} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 0", fontSize: 13, color: "var(--ink-2)",
          borderBottom: "1px solid var(--hairline)",
        }}>
          <span>{label}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: c }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: c }} />
            {level}
          </span>
        </div>
      ))}
    </div>
  );
}

function SaveVisual() {
  const palette = ["var(--cream)", "var(--tan)", "var(--purple)", "var(--blue)", "var(--sage)"];
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 16 }}>Your closet · 47 items</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} style={{
            aspectRatio: "1 / 1.2", background: palette[i % palette.length],
            borderRadius: 4, border: "1px solid var(--hairline)", position: "relative",
          }}>
            <span style={{
              position: "absolute", top: 3, right: 3, width: 7, height: 7, borderRadius: 4,
              background: i % 5 === 0 ? "#C84242" : i % 4 === 0 ? "#E6A638" : "#7B9B69",
            }} />
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 16, display: "flex", justifyContent: "space-between",
        fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)",
      }}>
        <span>AVG. PRIORITY</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>Moderate ↓</span>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how" style={{ padding: "140px 0 120px" }}>
      <div className="shell">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 80 }}>
          <div>
            <div className="eyebrow">How it works</div>
            <h2 style={{
              fontFamily: "var(--serif)", fontWeight: 400, fontSize: "clamp(36px, 4.5vw, 52px)",
              lineHeight: 1.06, letterSpacing: "-0.02em", margin: "20px 0 0", textWrap: "balance",
            } as React.CSSProperties}>
              From a photograph to a{" "}
              <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>verdict,</em>{" "}
              in under two seconds.
            </h2>
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.5, color: "var(--ink-2)", margin: 0, maxWidth: 480, paddingTop: 36 }}>
            We built Toxome so the friction you feel is "should I keep this?" — never "how do I look this up?" Three steps, every time.
          </p>
        </div>

        <hr className="soft-divider" />

        {steps.map((step, i) => (
          <div key={step.n} style={{
            display: "grid", gridTemplateColumns: "120px 1fr 1.2fr", gap: 48,
            padding: "48px 0",
            borderBottom: i < steps.length - 1 ? "1px solid var(--hairline)" : "none",
            alignItems: "flex-start",
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, color: "var(--ink-3)", letterSpacing: ".06em" }}>
              {step.n} / 03
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 16px" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)", margin: 0, maxWidth: 380 }}>
                {step.body}
              </p>
            </div>
            <div style={{
              background: "var(--bg-2)", borderRadius: 16, padding: 28, minHeight: 200,
              boxShadow: "0 0 0 1px var(--hairline) inset",
            }}>
              {step.visual === "scan" && <ScanVisual />}
              {step.visual === "analyze" && <AnalyzeVisual />}
              {step.visual === "save" && <SaveVisual />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
