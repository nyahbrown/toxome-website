import Image from "next/image";

// `spaced` adds a gap above the link (used to set off the featured collections
// from the departments inside Shop — spacing, never a divider line).
type FooterLink = { label: string; href: string; spaced?: boolean };
type FooterCol = { h: string; items: FooterLink[] };

// Social accounts. Real brand glyphs (Simple Icons paths), rendered in the
// brand column under the tagline. Update hrefs with the live handles.
type Social = { label: string; href: string; path: string };

const socials: Social[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/toxome_app/",
    path:
      "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/toxomeApp/",
    path:
      "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@toxome",
    path:
      "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
];

const cols: FooterCol[] = [
  {
    h: "Shop",
    items: [
      { label: "Women", href: "/shop/women" },
      { label: "Men", href: "/shop/men" },
      { label: "Kids", href: "/shop/kids" },
      { label: "Home", href: "/shop/home" },
    ],
  },
  {
    h: "Explore",
    items: [
      { label: "Collections", href: "/shop/collections" },
      { label: "Fabric Guide", href: "/guide" },
      { label: "Certifications", href: "/guide/certifications" },
      { label: "How We Score", href: "/methodology" },
      { label: "Journal", href: "/journal" },
      { label: "Extension", href: "/extension" },
      { label: "Get the app", href: "/app" },
    ],
  },
  {
    h: "Company",
    items: [
      { label: "Get Verified", href: "/verify" },
      { label: "Partnerships", href: "/partnerships" },
      { label: "Contact", href: "mailto:nyah@toxome.app" },
    ],
  },
  {
    h: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--bg)", padding: "72px 0 36px", textTransform: "none" }}>
      <div className="shell" style={{ padding: "0 21px" }}>
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Image src="/toxome-logo.png" alt="" width={37} height={24} style={{ height: 24, width: "auto" }} />
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ink)" }}>Toxome</span>
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.45, color: "var(--ink-2)", margin: 0, maxWidth: 240 }}>
              know what&rsquo;s in your clothes.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 20 }}>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="footer-social"
                  style={{ display: "inline-flex", color: "var(--ink)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <div className="eyebrow" style={{ marginBottom: 16, color: "var(--ink)" }}>{c.h}</div>
              <ul className="footer-link-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {c.items.map((item) => (
                  <li key={item.label} style={item.spaced ? { marginTop: 8 } : undefined}>
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      style={{ fontSize: 13.5, color: "var(--ink-2)", textTransform: "lowercase" }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p style={{
          paddingTop: 28,
          fontSize: 11,
          lineHeight: 1.5,
          color: "var(--ink-3)",
          margin: 0,
          maxWidth: 640,
        }}>
          some links to brands are affiliate links. if you buy through them,
          toxome may earn a commission at no extra cost to you. it never changes
          a product&rsquo;s score or whether we feature it.
        </p>

        <div style={{
          paddingTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 11, letterSpacing: ".06em", color: "var(--ink-3)" }}>
            © 2026 Toxome LLC
          </span>
          <a
            href="https://apps.apple.com/us/app/toxome/id6748622034"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Toxome on the App Store"
            style={{ display: "inline-flex" }}
          >
            <Image
              src="/app-store-badge.svg"
              alt="Download on the App Store"
              width={120}
              height={40}
              style={{ display: "block", height: 40, width: "auto" }}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
