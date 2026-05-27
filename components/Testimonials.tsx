const testimonials = [
  {
    quote: "This app is a game changer. Had no idea how toxic my closet was.",
    name: "Kendall B.",
  },
  {
    quote:
      "As someone with PCOS and endometriosis, I have to be hyperaware of potential endocrine disruptors. This app is saving me from all the stress of figuring it out myself.",
    name: "Nyah B.",
  },
  {
    quote:
      "After learning about how polyester affects fertility, I decided to swap all my underwear for organic cotton.",
    name: "Connor B.",
  },
  {
    quote:
      "We all know that chemicals are everywhere. But why and what can we do? Scan the labels.",
    name: "Katie H.",
  },
  {
    quote:
      "I've been eating organic food and using natural products for years. But I had no idea about how toxic clothing can be.",
    name: "Christina G.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: "120px 0", background: "var(--tan)" }}>
      <div className="shell">
        <div style={{ maxWidth: 560, marginBottom: 72 }}>
          <div className="eyebrow">What people are saying</div>
          <h2 style={{
            fontFamily: "var(--serif)",
            fontWeight: 400,
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "20px 0 0",
          }}>
            Once you know, you{" "}
            <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>can&apos;t unknow it.</em>
          </h2>
        </div>

        <div style={{ columns: "1", gap: 24 }} className="testimonials-cols">
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                breakInside: "avoid",
                background: "var(--cream)",
                border: "1px solid var(--hairline-strong)",
                borderRadius: 4,
                padding: "32px 28px",
                marginBottom: 24,
              }}
            >
              <p style={{
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontSize: 20,
                lineHeight: 1.45,
                color: "var(--ink)",
                margin: "0 0 20px",
                fontStyle: "italic",
              }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}>
                {t.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 640px)  { .testimonials-cols { columns: 2 !important; } }
        @media (min-width: 1024px) { .testimonials-cols { columns: 3 !important; } }
      `}</style>
    </section>
  );
}
