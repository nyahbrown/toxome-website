"use client";

import Link from "next/link";

// Top nav shared by the two admin pages so you can click between the product
// pipeline (/admin) and the brand-traffic analytics (/admin/analytics).
const TABS = [
  { key: "products", label: "Products", href: "/admin" },
  { key: "content", label: "Content", href: "/admin/content" },
  { key: "analytics", label: "Brand traffic", href: "/admin/analytics" },
] as const;

export default function AdminTabs({
  active,
}: {
  active: "products" | "content" | "analytics";
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
