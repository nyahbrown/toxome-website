import Image from "next/image";

const cols = [
  { h: "Toxome", items: ["Get the app", "What's new", "Pricing"] },
  { h: "The science", items: ["Methodology", "Fiber dossier", "Sources"] },
  { h: "Company", items: ["Mission", "Press kit", "Contact"] },
  { h: "Legal", items: ["Privacy", "Terms", "Data deletion"] },
];

export default function Footer() {
  return (
    <footer style={{ background: "#D5D5CD", padding: "80px 0 40px" }}>
      <div className="shell">
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", gap: 48, marginBottom: 80 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Image src="/toxome-logo.png" alt="" width={37} height={24} style={{ height: 24, width: "auto" }} />
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ink)" }}>Toxome</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0, maxWidth: 260, color: "var(--ink)" }}>
              A clothing scanner for people who want to know what their bodies are wearing.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <div className="eyebrow" style={{ marginBottom: 16, color: "var(--ink)" }}>{c.h}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {c.items.map((item) => (
                  <li key={item}>
                    <a href="#" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between",
          paddingTop: 24, borderTop: "1px solid rgba(20,24,27,0.12)",
          fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".06em",
          textTransform: "uppercase", color: "var(--ink-3)",
        }}>
          <span>© 2026 Toxome Labs</span>
          <span>v0.6.2 · Indexed 4,212 fibers</span>
        </div>
      </div>
    </footer>
  );
}
