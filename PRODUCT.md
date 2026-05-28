# Product

## Register

brand

> Split surface: editorial and commerce pages (`/`, `/journal`, `/shop`, `/newsletter`) are **brand** — design is the product. Account and scan-history pages are **product** — design serves the function. Brand is the default register; override to product for authenticated, functional surfaces.

## Users

Health-conscious women, primarily 25–40, who make intentional choices about food and skincare but haven't yet connected fashion to wellness. They shop at better brands, read labels on their food, and know something is off about fast fashion — but don't have a vocabulary for fabric health yet. They find Toxome through editorial content, social, or the iOS scanner app.

Secondary: women who already know about PFAS, endocrine disruptors, or microplastics. They arrive informed and want validation and depth, not an introduction.

**Context when visiting the site:** Not in a shopping session. Not in crisis. Curious, a little skeptical, willing to be persuaded by specifics.

## Product Purpose

Toxome coined the category "Fashion Wellness" — the idea that what you wear is a health decision, like what you eat or put on your skin. The website is the editorial authority and curated shop for this category: it surfaces research, examines labels, and sells verified clean alternatives.

**Success looks like:** a visitor leaves understanding something she didn't before, and trusts Toxome as the source she returns to. The site converts curiosity into conviction.

## Brand Personality

Intelligent, restrained, unsentimental. Three words: **rigorous, editorial, warm**.

Not "clean living" aspirational softness. Not scientific coldness. The intersection of a well-read friend and a fashion editor who reads MDPI papers for fun. She challenges without preaching, educates without lecturing.

Voice calibration:
- 70% serious, 30% dry wit — never silly
- 55% casual, 45% editorial — like a letter from a sharp friend
- 65% irreverent toward the fashion industry, 100% respectful of the reader
- Data and specificity over hype. Enthusiasm through fascination, not exclamation marks

Reference brands (aesthetic peers, not carbon copies): **goop** (editorial restraint, contextual commerce — not the pseudoscience credibility), **Flamingo Estate** (sensory product language, warm materiality), **Seed** (scientific beauty, micro/macro imagery, science as aesthetic), **The Row / Totême** (luxury restraint, confidence through absence).

## Anti-references

Sites and patterns Toxome must NOT look like:

- **SaaS startup homepages (Webflow, Vercel energy):** Gradient heroes, "everything you need to", bento grids, animated orbs, feature lists in perfect three-column rows. Toxome is a brand, not a tool.
- **Generic wellness apps (Headspace, Calm):** Soft illustrations, pastel palettes, friendly-rounded-everything, self-help positivity. Toxome is rigorous, not soothing.
- **H&M Conscious / greenwashing aesthetics:** Sustainability imagery as PR theater. Corporate nature photography. Green = good, no receipts needed. Toxome shows data, not vibes.
- **Goop-adjacent woo:** The aesthetic direction (goop, Flamingo Estate) is correct; the pseudoscience credibility feel is wrong. Science and specificity over crystal energy.

Banned UI patterns regardless of context:
- Bento-grid layouts
- Hero metric cards (big number + gradient accent + supporting stats)
- Gradient text (`background-clip: text`)
- Identical card grids (icon + heading + paragraph, repeated n times)
- "Powered by AI" framing anywhere
- Emoji as decoration (reserved only for risk severity in scan results)
- Side-stripe border accents on cards or list items

## Design Principles

1. **Show, don't claim.** Specific data beats benefit statements. "Your yoga pants are 82% polyester" beats "learn what's in your clothes." Facts earn trust; claims don't.
2. **Editorial authority through restraint.** Negative space, confident hierarchy, and deliberate pacing signal expertise. A crowded layout undermines credibility faster than any copy.
3. **Warmth without softness.** The palette (`#FCFBF7`, `#3B3C3A`) is warm, never cold — but the voice and layout structure are precise. Not a wellness app. Not a tech product. A brand with a point of view.
4. **The fabric is the story.** Macro fiber textures, close material photography, and composition data are the primary visual currency. Models and lifestyle imagery are secondary and contextual.
5. **Split register, one voice.** Brand surfaces (home, editorial, shop) are expressive and image-forward. Product surfaces (account, scan history) are functional and recede. The brand voice and color rules don't change; only the design density does.

## Accessibility & Inclusion

WCAG AA minimum on all pages:
- 4.5:1 contrast on body text; 3:1 on large text and UI components
- Keyboard-navigable nav, modals, and filter controls
- Screen reader labels on all icon-only buttons and non-decorative images
- All hero animations and scroll-driven transitions respect `prefers-reduced-motion`
- No color-only encoding — risk levels use color plus label, never color alone
