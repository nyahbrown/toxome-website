// Per-fiber hazard scores (0 = clean, 100 = high concern).
// Mirrors scripts/agent.js FABRIC_SCORES. If the agent's scores change,
// update both files in lockstep.
export const FABRIC_SCORES: Record<string, number> = {
  organic_cotton: 5,
  cotton: 20,
  linen: 8,
  hemp: 6,
  tencel: 18,
  lyocell: 18,
  modal: 22,
  bamboo: 25,
  wool: 15,
  merino: 15,
  silk: 12,
  recycled_polyester: 45,
  polyester: 65,
  nylon: 62,
  acrylic: 78,
  spandex: 55,
  elastane: 55,
  viscose: 40,
  rayon: 40,
  microfiber: 70,
  fleece: 60,
};

export function fiberKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "_");
}

export function fiberScore(name: string): number {
  return FABRIC_SCORES[fiberKey(name)] ?? 50;
}

// Same thresholds as the risk_level chip on the product detail page.
export function hazardColor(score: number): string {
  if (score <= 33) return "var(--risk-low)";
  if (score <= 66) return "var(--orange)";
  return "var(--red)";
}

export function fiberHazardColor(name: string): string {
  return hazardColor(fiberScore(name));
}

const FIBER_LABELS: Record<string, string> = {
  organic_cotton: "Organic cotton",
  cotton: "Cotton",
  linen: "Linen",
  hemp: "Hemp",
  tencel: "Tencel",
  lyocell: "Lyocell",
  modal: "Modal",
  bamboo: "Bamboo",
  wool: "Wool",
  merino: "Merino wool",
  silk: "Silk",
  recycled_polyester: "Recycled polyester",
  polyester: "Polyester",
  nylon: "Nylon",
  acrylic: "Acrylic",
  spandex: "Spandex",
  elastane: "Elastane",
  viscose: "Viscose",
  rayon: "Rayon",
  microfiber: "Microfiber",
  fleece: "Fleece",
};

export function prettyFiber(name: string): string {
  const key = fiberKey(name);
  if (FIBER_LABELS[key]) return FIBER_LABELS[key];
  return name
    .split(/[_\s-]+/)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}
