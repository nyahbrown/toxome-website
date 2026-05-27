# Toxome Website

The brand destination for Toxome — a Fashion Wellness editorial + commerce site. Next.js + Tailwind, deployed on Vercel.

**URL:** toxome.app | **Deploy:** Vercel (auto-deploys on push to main)

> Next.js APIs and conventions may differ from training data. Check `node_modules/next/dist/docs/` before writing any code. See AGENTS.md.

---

## Brand context

Toxome is a **Fashion Wellness** brand — "the goop of what you wear." The website is the brand destination; the app is a product Toxome makes.

**Design system:** `/Users/nyahbrown/TOXOME/DESIGN.md`
**Brand kit:** `/Users/nyahbrown/TOXOME/brand-kit.md`
**Brand brief:** `/Users/nyahbrown/TOXOME/brand-brief.md`

**Design direction:** Editorial, not tech. Wellness, not startup. Magazine, not dashboard.

---

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Deployed on Vercel — `vercel deploy` or push to main

---

## Key files

```
app/
  page.tsx           — homepage (editorial front page — will replace current app landing page)
  layout.tsx         — root layout + metadata
  globals.css        — global styles + brand tokens
  blog/page.tsx      — blog index
  shop/page.tsx      — curated clean clothing shop
  shop/ShopClient.tsx — shop client component with filtering
components/
  Hero.tsx           — above-the-fold section
  Features.tsx       — feature list (NEEDS REWRITE — off-brand colors + copy)
  HowItWorks.tsx     — scan flow explanation
  ScanPreview.tsx    — scan result demo/preview
  Testimonials.tsx   — social proof (NEEDS REWRITE — off-brand colors)
  CtaBanner.tsx      — mid-page CTA (NEEDS REWRITE — off-brand colors + copy)
  ClosingCta.tsx     — bottom CTA
  Nav.tsx            — navigation
  Footer.tsx         — footer
  Faq.tsx            — FAQ accordion
  AnimationProvider.tsx — scroll/entrance animations
public/
  app-screenshot.png — main app screenshot used in hero
  toxome-logo.png    — logo (LOCKED — no modifications)
```

---

## Website architecture (target)

```
/                    → Editorial homepage (magazine cover, not app landing page)
/journal             → Long-form editorial content
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

- **Headlines:** Instrument Serif (Google Fonts) — editorial serif
- **Body:** Inter — clean, legible, app continuity
- **Eyebrows/Labels:** System monospace — uppercase, letter-spaced

---

## Color tokens (from globals.css)

Use CSS variables — **never** hardcode hex values in components.

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#E7E6DE` | Primary background |
| `--white` | `#FFFFFF` | Content surface |
| `--ink` | `#14181B` | Primary text |
| `--ink-2` | `#3B3C3A` | Secondary text |
| `--ink-3` | `#57636C` | Tertiary text |
| `--tan` | `#E1DCCC` | Secondary warm surface |
| `--blue` | `#A8BDD3` | Slate blue — signature accent |
| `--purple` | `#C9CDDA` | Logo accent |
| `--espresso` | `#2C2420` | Rich dark editorial bg |
| `--linen` | `#F5F3ED` | Light warm feature bg |
| `--honey` | `#C9A96E` | Editorial premium accent |
| `--red` | `#C84242` | High risk (scan results only) |
| `--orange` | `#E6A638` | Moderate risk (scan results only) |
| `--risk-low` | `#ADC89C` | Low risk (scan results only — NOT a brand color) |

**Banned hex values:** `#2D3C47`, `#F4F5F6`, `#EAECED`, `#4A5A68`, `#5A6B78`, `#3D4F5E`, `#A9B6C7`, `#DDE3EA`. These are off-brand and must not appear in any component.

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
