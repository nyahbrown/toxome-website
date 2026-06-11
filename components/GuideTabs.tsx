import Link from "next/link";

// Toggle between the two halves of the guide. Rendered on /guide (Fibers) and
// /guide/certifications (Certifications) in the same position so switching tabs
// feels like one view changing, not a navigation away.
const TABS = [
  { label: "fibers", href: "/guide" },
  { label: "certifications", href: "/guide/certifications" },
] as const;

export type GuideTab = (typeof TABS)[number]["label"];

export default function GuideTabs({ active }: { active: GuideTab }) {
  return (
    <nav className="guide-tabs" aria-label="Guide sections">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="guide-tab"
          data-active={tab.label === active}
          aria-current={tab.label === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
