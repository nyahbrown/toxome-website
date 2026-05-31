// Curated fiber-comparison pairs powering /compare/[a]-vs-[b]. Deliberately a
// hand-picked set (not every permutation) to target real search demand and
// avoid thin, no-demand pages. Each entry is [fiberSlugA, fiberSlugB] using the
// canonical slugs from lib/fiberGuide (which never contain a hyphen).
export const COMPARE_PAIRS: [string, string][] = [
  ["linen", "cotton"],
  ["polyester", "cotton"],
  ["polyester", "nylon"],
  ["linen", "hemp"],
  ["bamboo", "cotton"],
  ["modal", "viscose"],
  ["silk", "polyester"],
  ["cashmere", "merino_wool"],
  ["cotton", "hemp"],
  ["rayon", "cotton"],
  ["acrylic", "wool"],
  ["linen", "polyester"],
];

export const compareSlug = (a: string, b: string) => `${a}-vs-${b}`;

// Fiber slugs use underscores, never hyphens, so the "-vs-" separator is
// unambiguous.
export function parseCompareSlug(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}
