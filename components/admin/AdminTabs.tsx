"use client";

import Link from "next/link";

// Top nav shared by the admin pages so you can click between the product
// pipeline (/admin), brand-traffic analytics (/admin/analytics), geolocation
// (/admin/geolocation), the brands/closet dashboard (/admin/brands), and the
// closets analytics overview (/admin/closets).
//
// /admin/content is deliberately not in this list. The route still works and
// the newsletter-draft cron still links straight to it, it just doesn't earn a
// nav pill any more. "content" stays in the `active` union so that page keeps
// type-checking.
const TABS = [
  { key: "products", label: "Products", href: "/admin" },
  { key: "analytics", label: "Brand traffic", href: "/admin/analytics" },
  { key: "geolocation", label: "Geolocation", href: "/admin/geolocation" },
  { key: "brands", label: "Brands", href: "/admin/brands" },
  { key: "disclosures", label: "Disclosures", href: "/admin/disclosures" },
  { key: "closets", label: "Closets", href: "/admin/closets" },
] as const;

export default function AdminTabs({
  active,
}: {
  active:
    | "products"
    | "content"
    | "analytics"
    | "geolocation"
    | "brands"
    | "disclosures"
    | "closets";
}) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            style={{
              fontFamily: "var(--sans)",
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 999,
              border: `1px solid ${on ? "var(--ink)" : "var(--hairline-strong)"}`,
              background: on ? "var(--ink)" : "var(--white)",
              color: on ? "var(--white)" : "var(--ink-2)",
              textDecoration: "none",
              letterSpacing: "-0.005em",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
