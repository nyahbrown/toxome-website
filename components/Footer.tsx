import Image from "next/image";

type FooterLink = { label: string; href: string };
type FooterCol = { h: string; items: FooterLink[] };

// Social accounts. Update the href values with the real handles — the icons
// render in the footer's bottom-left corner.
type Social = { label: string; href: string; icon: React.ReactNode };

const socials: Social[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/toxome_app/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/toxomeApp/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M11.1 16.7c-.3 1.2-.7 2.4-1.4 3.3M11 8.8c-.3.6-.3 1.4-.1 2.1.5 1.9.9 3.6.9 3.6.4 1 1.4 1.4 2.4 1.1 1.6-.5 2.4-2.4 2-4.4-.4-2-2.2-3.4-4.2-3-1.7.3-2.9 1.7-2.9 3.3 0 .8.3 1.5.8 1.9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@toxome",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13.2 3.5v10.9a3.1 3.1 0 1 1-2.6-3.05"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.2 3.5c.4 2.4 1.9 4 4.3 4.3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const cols: FooterCol[] = [
  {
    h: "Explore",
    items: [
      { label: "Shop", href: "/shop" },
      { label: "Fabric guide", href: "/guide" },
      { label: "Journal", href: "/journal" },
      { label: "Get the app", href: "https://apps.apple.com/us/app/toxome/id6748622034" },
    ],
  },
  {
    h: "More",
    items: [
      { label: "Contact", href: "mailto:nyah@toxome.app" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--bg)", borderTop: "1px solid var(--hairline)", padding: "72px 0 36px" }}>
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
          paddingTop: 24, borderTop: "1px solid var(--hairline)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap",
          fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".06em",
          textTransform: "uppercase", color: "var(--ink-3)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="footer-social"
                style={{ display: "inline-flex", color: "var(--ink-3)" }}
              >
                {s.icon}
              </a>
            ))}
          </div>
          <span>© 2026 Toxome LLC</span>
        </div>
      </div>
    </footer>
  );
}
