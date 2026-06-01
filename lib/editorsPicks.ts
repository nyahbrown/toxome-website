// Hand-selected Editor's Picks — single source of truth, matched by exact
// item_name. Used by:
//   - the homepage "Editor's Picks" section (app/page.tsx)
//   - the shop women's + Featured view (pinned to top + "Editor's Pick" badge)
//
// Distribution: these picks are featured in the newsletter once a month, and
// hand-picked pieces are emailed to brands to tell them they've been "selected".
// To change the lineup, edit this array (order here = display order).
export const EDITORS_PICKS: string[] = [
  "Erma Drop Waist Linen Dress",
  "Mai Cashmere Hoodie Pullover",
  "Niko Scoop Tank",
  "The Bateau: White Pointelle",
];

const EDITORS_PICKS_SET = new Set(EDITORS_PICKS.map((n) => n.toLowerCase()));

export function isEditorsPick(itemName?: string | null): boolean {
  return !!itemName && EDITORS_PICKS_SET.has(itemName.toLowerCase());
}
