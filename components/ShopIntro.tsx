// Short, unique server-rendered intro under a shop department's product grid.
// Gives each department page (women/men/kids/home/all) its own body copy so the
// pages stop reading as near-duplicates of one shared grid to search engines.
export default function ShopIntro({ intro }: { intro: string }) {
  return (
    <section style={{ background: "var(--bg)", padding: "8px 0 72px" }}>
      <div className="shell" style={{ padding: "0 21px" }}>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.65,
            color: "var(--ink-2)",
            margin: 0,
            maxWidth: "62ch",
          }}
        >
          {intro}
        </p>
      </div>
    </section>
  );
}
