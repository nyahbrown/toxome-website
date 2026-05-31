import Link from "next/link";

// End-of-article engagement card. The essay closes on the reader; this is the
// visually separate "next step" that follows. Soft and editorial, never salesy.
// Pick a variant per article via frontmatter `cta:` (defaults to "app").
export type CtaVariant = "app" | "shop" | "guide";

const APP_STORE = "https://apps.apple.com/us/app/toxome/id6748622034";

type Copy = {
  eyebrow: string;
  headline: string;
  body: string;
  button: string;
  href: string;
  external?: boolean;
};

const VARIANTS: Record<CtaVariant, Copy> = {
  app: {
    eyebrow: "Try it yourself",
    headline: "Know what's in your own closet.",
    body: "Toxome reads the label on any garment and scores what it does to your body. Scan your first piece in seconds.",
    button: "Get the app",
    href: APP_STORE,
    external: true,
  },
  shop: {
    eyebrow: "Shop cleaner",
    headline: "Find pieces that love you back.",
    body: "Browse clothing the way you read an ingredient list, filtered by what it's actually made of.",
    button: "Explore the edit",
    href: "/shop",
  },
  guide: {
    eyebrow: "Go deeper",
    headline: "Look up any fiber.",
    body: "The plain-English guide to what each fabric is, and what it does to your body.",
    button: "Read the fiber guide",
    href: "/guide",
  },
};

export default function ArticleCta({ variant = "app" }: { variant?: CtaVariant }) {
  const c = VARIANTS[variant] ?? VARIANTS.app;
  const linkProps = c.external
    ? { href: c.href, target: "_blank", rel: "noopener noreferrer" }
    : { href: c.href };

  return (
    <aside className="article-cta">
      <p className="article-cta__eyebrow">{c.eyebrow}</p>
      <p className="article-cta__headline">{c.headline}</p>
      <p className="article-cta__body">{c.body}</p>
      {c.external ? (
        <a className="pill-cta" {...linkProps}>
          {c.button}
          <ArrowIcon />
        </a>
      ) : (
        <Link className="pill-cta" href={c.href}>
          {c.button}
          <ArrowIcon />
        </Link>
      )}
    </aside>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
