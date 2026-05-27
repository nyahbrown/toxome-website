# Toxome Website

Landing page for the Toxome iOS app. Next.js + Tailwind, deployed on Vercel.

**URL:** toxome.app | **Deploy:** Vercel (auto-deploys on push to main)

> Next.js APIs and conventions may differ from training data. Check `node_modules/next/dist/docs/` before writing any code. See AGENTS.md.

---

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Deployed on Vercel — `vercel deploy` or push to main

---

## Key files

```
app/
  page.tsx           — homepage (main landing page)
  layout.tsx         — root layout + metadata
  globals.css        — global styles
  blog/page.tsx      — blog index
components/
  Hero.tsx           — above-the-fold section
  Features.tsx       — feature list
  HowItWorks.tsx     — scan flow explanation
  ScanPreview.tsx    — scan result demo/preview
  Testimonials.tsx   — social proof
  CtaBanner.tsx      — mid-page CTA
  ClosingCta.tsx     — bottom CTA
  Nav.tsx            — navigation
  Footer.tsx         — footer
  Faq.tsx            — FAQ accordion
  AnimationProvider.tsx — scroll/entrance animations
public/
  app-screenshot.png — main app screenshot used in hero
  toxome-logo.png    — logo
```

---

## Current goal for this site

Convert TikTok traffic to App Store installs. The single job of every element:
**get them to tap "Download on iOS."**

- Hero must show a scan result screenshot (the "wow" moment), not just the logo
- Primary CTA: "Scan your clothes free — download on iOS"
- Bio link on TikTok points here (not App Store directly)
- Add spoken CTA context: "3 free scans, link in bio"

---

## App Store link

`https://apps.apple.com/us/app/toxome/id6748622034`

Use this for all CTA buttons — do not link to App Store root.
