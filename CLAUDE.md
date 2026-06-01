# Toxome Website

The brand destination for Toxome — a Fashion Wellness editorial + commerce site. Next.js + Tailwind, deployed on Vercel.

**URL:** toxome.app | **Deploy:** Vercel (auto-deploys on push to main)

> Next.js APIs and conventions may differ from training data. Check `node_modules/next/dist/docs/` before writing any code. See AGENTS.md.

---

## Brand context

Toxome is a **Fashion Wellness** brand — "the goop of what you wear." The website is the brand destination; the app is a product Toxome makes.

**Design system:** `/Users/nyahbrown/TOXOME/DESIGN.md`
**Brand kit:** `/Users/nyahbrown/TOXOME/brand-kit.md`
**Product brief:** `PRODUCT.md` (this repo) — register, users, principles, anti-references

**Design direction:** Editorial, not tech. Wellness, not startup. Magazine, not dashboard.

**Three locked rules every agent must know:**
1. Background is `#FCFBF7` everywhere — page, nav, footer, all sections. Never deviate.
2. No black — darkest allowed color is `--ink: #3B3C3A`. `#000000` and `#14181B` are retired.
3. Carousel arrows are never in a circle/pill/button — always a bare thin chevron SVG on each side of the scroller. Editorial media cards in horizontal rails are square-cornered. See DESIGN.md §4.5.

---

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Deployed on Vercel — `vercel deploy` or push to main

---

## Key files

```
app/
  page.tsx           — homepage shell (renders HomeClient)
  HomeClient.tsx     — editorial homepage: video hero + Browse by Fiber grid
  layout.tsx         — root layout + fonts (Cormorant + Inter)
  globals.css        — global styles + brand tokens
  blog/page.tsx      — blog index (placeholder)
  shop/page.tsx      — shop shell
  shop/ShopClient.tsx — shop client: fiber filter, dropdowns, product grid
components/
  Nav.tsx            — fixed nav, transparent over hero, opaque on scroll
  Footer.tsx         — matches page bg (var(--bg)), hairline top border
  AnimationProvider.tsx — scroll/entrance animations
  Hero.tsx           — LEGACY: original app-landing hero (not used on homepage)
  Features.tsx       — LEGACY: off-brand colors, not currently rendered
  HowItWorks.tsx     — LEGACY: off-brand colors, not currently rendered
  ScanPreview.tsx    — LEGACY: not currently rendered
  Testimonials.tsx   — LEGACY: off-brand colors, not currently rendered
  CtaBanner.tsx      — LEGACY: off-brand colors, not currently rendered
  ClosingCta.tsx     — LEGACY: not currently rendered
  Faq.tsx            — LEGACY: not currently rendered
public/
  toxome-logo.png    — LOCKED, 4311×2813px — no modifications ever
  hero-bg.png        — Figma hero background (node 671:528), used as video poster
  meditation.mp4     — ArtHouse Studio Pexels video (ID 7414973), hero loop
  fibers/            — cotton.jpg, silk.jpg, wool.jpg, hemp.jpg, linen.jpg (JPEG, 800px max)
```

---

## Website architecture (target)

```
/                    → Editorial homepage (magazine cover, not app landing page)
/journal             → Long-form editorial content (route: app/journal/)
/journal/[slug]      → Individual articles
/shop                → Curated clean clothing with fabric-type filtering
/app                 → App download page (current homepage moves here)
/newsletter          → Newsletter signup + archive
/verified            → Toxome Verified brand directory (B2B)
/about               → Brand story, mission
/faq                 → FAQ (moves from homepage)
```

---

## Typography

Two families only. No system monospace.

- **Cormorant (serif) — PAGE HEADERS ONLY (LOCKED 2026-06-01):** Cormorant appears on exactly ONE element per page — that page's single top headline (homepage hero h1, page-title h1). NOTHING else uses it: not section headlines, not card titles, not deks. Loaded as a variable font via `--serif`/`--font-serif` (keep the import). Homepage hero runs Medium (500).
- **Inter — EVERYTHING else:** section headlines, card titles, body, deks, labels, buttons, nav, eyebrows. -0.011em tracking; Medium (500) for buttons/nav; SemiBold (600) for eyebrow labels.
- **Body size — 16px (LOCKED 2026-06-01):** Non-header body/supporting copy is **16px**; for emphasis use **bold weight, never a larger size**. EXEMPT (keep their own sizes): all headings (page H1 + section headlines + card-title headings), the homepage hero subtext, display stat numbers (e.g. account closet score), eyebrows/micro-labels, buttons/inputs, and the product grid (shop ProductCard + homepage MiniProductCard).
- **No divider lines (LOCKED 2026-06-01):** Never use hairline/divider rule lines — `borderTop`/`borderBottom` separators, `.soft-divider`, `<hr>`, section-dividing `--hairline`/`--line` rules. Separate sections with spacing, not lines. (Box outlines on cards/inputs/buttons/images are fine — those are not divider lines.)

**Eyebrow / label treatment (Inter 600):**
- `font-family: var(--mono)` → resolves to Inter via the `--mono: var(--sans)` token
- `font-size: 10–11px` | `font-weight: 600` | `letter-spacing: 0.13em` | `text-transform: uppercase`
- Color: `var(--ink-2)` (or `var(--ink-3)` for softer contexts)
- Used on: section labels, journal kickers, article-end CTAs, share labels
- White overrides (`color: rgba(255,255,255,0.5)`) are set as inline styles on individual elements and are not affected by the base eyebrow token

**Rule:** Cormorant carries emotion and authority. Inter carries everything functional — reading, acting, labeling. Never mix roles.

**Case rule:** Body text renders lowercase site-wide (`text-transform: lowercase` on `body`). Exceptions: (1) `.j-prose` (article reading body only) — `text-transform: none` restores natural sentence case so the author's capitalization is preserved; the article grid/index cards stay lowercase (intended). (2) **Eyebrows / section labels = ALL CAPS** — the `.eyebrow` class is `text-transform: uppercase` (weight 600, 0.13em tracking, 10–11px). Every section label renders in caps (A NEW CATEGORY, BROWSE BY FIBER, EDITOR'S PICKS, THE JOURNAL, THE FASHION WELLNESS LETTER, etc.). Do not revert eyebrows to lowercase.

---

## Color tokens (from globals.css)

Use CSS variables — **never** hardcode hex values in components.

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#FCFBF7` | **THE primary background. Everywhere. Never deviate.** |
| `--linen` | `#FCFBF7` | Alias for `--cream`. Same value. |
| `--white` | `#FFFFFF` | Card / product surface needing lift from background |
| `--ink` | `#3B3C3A` | **Primary text. Darkest allowed color. Warm charcoal, never true black.** |
| `--ink-2` | `#57636C` | Secondary text, nav links, body |
| `--ink-3` | `#8A9199` | Tertiary text, captions, metadata |
| `--tan` | `#EDE9E0` | Secondary warm surface, card backgrounds, placeholders |
| `--blue` | `#A8BDD3` | Slate blue — brand accent for CTAs, editorial highlights |
| `--purple` | `#C9CDDA` | Logo element accent |
| `--honey` | `#C9A96E` | Editorial premium accent — badges, newsletter highlights. Sparingly. |
| `--hairline` | `rgba(59,60,58,0.08)` | Subtle borders, section edges |
| `--hairline-strong` | `rgba(59,60,58,0.14)` | Stronger borders, dividers |
| `--line` | `#E0E3E7` | Dividers where a solid line is needed instead of hairline |
| `--red` | `#C84242` | High risk — scan results only |
| `--orange` | `#E6A638` | Moderate risk — scan results only |
| `--risk-low` | `#ADC89C` | Low risk — scan results only. **Not a brand color.** |

**Banned hex values (retired — replace immediately if found):**
`#000000`, `#14181B` (old ink), `#E7E6DE`, `#F5F3ED` (old cream/linen), `#D5D5CD` (old footer), `#2D3C47`, `#F4F5F6`, `#EAECED`, `#4A5A68`, `#5A6B78`, `#3D4F5E`, `#A9B6C7`, `#DDE3EA`

---

## Voice rules

- Second person, direct, no hedging
- Scientific terms alongside everyday explanation
- *Italic* for emphasis, not **bold**
- Emoji banned on the website (reserved for scan result severity in the app only)
- See brand kit for full vocabulary and examples

---

## App Store link

`https://apps.apple.com/us/app/toxome/id6748622034`

Use this for all CTA buttons — do not link to App Store root.
