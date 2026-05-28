<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design Context

Before any UI or component work, load:

- **`PRODUCT.md`** (this repo) — register (brand primary / product for auth surfaces), target users, 5 design principles, anti-references, accessibility requirements
- **`/Users/nyahbrown/TOXOME/DESIGN.md`** — full design system: color tokens, typography ramp, imagery direction, component patterns, layout conventions

**Two rules that override everything else:**
1. Background is `#FCFBF7` sitewide — page, nav, footer, every section. No exceptions.
2. No black — darkest color is `--ink: #3B3C3A`. Retire `#000000` and `#14181B` on sight.

**Register:** Brand (editorial/commerce pages) is the default. Override to product for `/account`, `/scan-history`, and authenticated functional surfaces.

**Anti-references to refuse outright:** SaaS gradient heroes, bento-grid layouts, generic wellness app softness (Headspace/Calm energy), greenwashing sustainability aesthetics.

**Typography:** Source Serif 4 for all headlines (not Instrument Serif — that's retired). Inter for body and UI. System monospace for eyebrow labels only.
