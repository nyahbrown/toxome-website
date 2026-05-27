const features = [
  {
    n: "01",
    title: "Instant label scanner",
    description:
      "Photograph the composition tag on any garment. Toxome reads the fiber breakdown in under two seconds — no typing, no hunting for the brand online.",
  },
  {
    n: "02",
    title: "Six health & environmental axes",
    description:
      "Endocrine disruption, microplastic shedding, skin barrier, breathability, biodegradability, climate impact. Rated separately, weighted for the body over a lifetime.",
  },
  {
    n: "03",
    title: "Your closet, scored",
    description:
      "Every scan lives in your private closet. Filter by detox priority. Track your average hazard score as you make swaps. Watch it drop.",
  },
];

export default function Features() {
  return (
    <section style={{ padding: "120px 0", background: "var(--linen)" }}>
      <div className="shell">
        <div style={{ maxWidth: 560, marginBottom: 72 }}>
          <div className="eyebrow">What Toxome does</div>
          <h2 style={{
            fontFamily: "var(--serif)",
            fontWeight: 400,
            fontSize: "clamp(36px, 4.5vw, 52px)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            margin: "20px 0 0",
          }}>
            Fashion wellness,{" "}
            <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>made legible.</em>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--hairline-strong)" }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "var(--bg-2)",
              padding: "40px 36px 44px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}>
              <div style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}>{f.n}</div>
              <h3 style={{
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontSize: 26,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                margin: 0,
                color: "var(--ink)",
              }}>{f.title}</h3>
              <p style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                margin: 0,
              }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
