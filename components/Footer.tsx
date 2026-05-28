import Image from "next/image";

type FooterLink = { label: string; href: string };
type FooterCol = { h: string; items: FooterLink[] };

const cols: FooterCol[] = [
  {
    h: "Toxome",
    items: [
      { label: "Get the app", href: "https://apps.apple.com/us/app/toxome/id6748622034" },
      { label: "What's new", href: "#" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    h: "The science",
    items: [
      { label: "Methodology", href: "#" },
      { label: "Fiber dossier", href: "#" },
      { label: "Sources", href: "#" },
    ],
  },
  {
    h: "Company",
    items: [
      { label: "Mission", href: "#" },
      { label: "Press kit", href: "#" },
      { label: "Contact", href: "mailto:nyah@toxome.app" },
    ],
  },
  {
    h: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data deletion", href: "/privacy#your-rights" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--bg)", borderTop: "1px solid var(--hairline)", padding: "80px 0 40px" }}>
      <div className="shell">
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Image src="/toxome-logo.png" alt="" width={37} height={24} style={{ height: 24, width: "auto" }} />
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ink)" }}>Toxome</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0, maxWidth: 260, color: "var(--ink)" }}>
              A clothing scanner for people who want to know what&apos;s in their clothes.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <div className="eyebrow" style={{ marginBottom: 16, color: "var(--ink)" }}>{c.h}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {c.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      style={{ fontSize: 13.5, color: "var(--ink-2)" }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between",
          paddingTop: 24, borderTop: "1px solid var(--hairline)",
          fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".06em",
          textTransform: "uppercase", color: "var(--ink-3)",
        }}>
          <span>© 2026 Toxome LLC</span>
          <span>v0.6.2 · Indexed 4,212 fibers</span>
        </div>
      </div>
    </footer>
  );
}
