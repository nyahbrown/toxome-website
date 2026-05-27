const FACTORS = [
  { title: "Endocrine disruption", body: "Phthalates, BPA in elastane, PFAS in waterproofing. Chemicals that mimic or block hormones — implicated in metabolic and reproductive health.", weight: "High weight" },
  { title: "Microplastic shedding", body: "Synthetic fibers shed in every wash and every wear. We estimate per-garment lifetime shed in grams.", weight: "High weight" },
  { title: "Skin barrier", body: "Direct-contact irritants, formaldehyde finishes, dye sensitizers. What your largest organ meets all day.", weight: "Moderate weight" },
  { title: "Breathability", body: "Moisture wicking, thermal regulation, sweat-trapping. Fiber-level data, not marketing copy.", weight: "Moderate weight" },
  { title: "Biodegradability", body: "How the garment ends. Months for wool and linen; centuries for polyester. Drives end-of-life carbon math.", weight: "Moderate weight" },
  { title: "Climate impact", body: "Cradle-to-grave CO₂e per garment, normalized by lifespan. Accounts for fiber, finish, geography, and durability.", weight: "Moderate weight" },
];

export default function WhatWeCheck() {
  return (
    <section id="what" style={{ padding: "120px 0", background: "var(--tan)" }}>
      <div className="shell">
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <div className="eyebrow">What we look for</div>
          <h2 style={{
            fontFamily: "var(--serif)", fontWeight: 400,
            fontSize: "clamp(36px, 4.5vw, 56px)",
            lineHeight: 1.06, letterSpacing: "-0.02em",
            margin: "20px 0 24px",
          } as React.CSSProperties}>
            Six axes, weighted for the body{" "}
            <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>over a lifetime.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.5, color: "var(--ink-2)", margin: 0 }}>
            We separate the things that touch your endocrine system today from the things that strain the planet for a century.
            Both matter — but they&apos;re not the same axis. Toxome scores them separately and shows the work.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--hairline-strong)" }}>
          {FACTORS.map((f, i) => (
            <div key={f.title} style={{
              background: "var(--bg)", padding: "36px 32px 40px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              minHeight: 240,
            }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 16 }}>0{i + 1}</div>
                <h3 style={{
                  fontFamily: "var(--serif)", fontWeight: 400, fontSize: 28,
                  lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 14px",
                }}>{f.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-2)", margin: 0 }}>
                  {f.body}
                </p>
              </div>
              <div style={{
                marginTop: 28, fontFamily: "var(--mono)", fontSize: 11,
                letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)",
              }}>
                {f.weight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
