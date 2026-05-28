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

**Two locked rules every agent must know:**
1. Background is `#FCFBF7` everywhere — page, nav, footer, all sections. Never deviate.
2. No black — darkest allowed color is `--ink: #3B3C3A`. `#000000` and `#14181B` are retired.

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
  layout.tsx         — root layout + fonts (Source Serif 4 + Inter)
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

- **Headlines / display:** Source Serif 4 (Google Fonts, `Source_Serif_4`) — replaced Instrument Serif. Regular 400, tight tracking (-0.02em to -0.04em).
- **Body / UI:** Inter — clean, legible. 14–18px, -0.011em tracking at body sizes.
- **Eyebrows / labels:** System monospace — `ui-monospace, "SF Mono", Menlo, monospace`. 11px, uppercase, 0.14em tracking. Never the display font.

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
| `--espresso` | `#2C2420` | Deep warm dark for editorial sections, hero overlays |
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
