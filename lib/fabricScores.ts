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
  wool: 15,
  merino: 15,
  alpaca: 12,
  cashmere: 14,
  silk: 12,
  // Lenzing-branded cellulosics (TENCEL™ Lyocell/Modal, LENZING™ ECOVERO™
  // viscose) are the certified, closed-loop, traceable versions — healthy.
  // Generic/unverified `viscose` and `rayon` stay moderate.
  ecovero: 18,
  lenzing_viscose: 18,
  lenzing_ecovero: 18,
  tencel_lyocell: 18,
  tencel_modal: 18,
  // Generic / unverified cellulosics — same viscose process, moderate concern.
  modal: 40,
  bamboo: 40,
  viscose: 40,
  rayon: 40,
  recycled_polyester: 45,
  spandex: 55,
  elastane: 55,
  fleece: 60,
  // Virgin plastics — high concern.
  microfiber: 70,
  nylon: 70,
  polyester: 72,
  acrylic: 78,
};

export function fiberKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

export function fiberScore(name: string): number {
  const key = fiberKey(name);
  if (key in FABRIC_SCORES) return FABRIC_SCORES[key];
  // Lenzing / Ecovero / Tencel branded fibers are the verified healthy versions,
  // even when the name also contains "viscose" (e.g. "lenzing ecovero viscose").
  // Check this BEFORE the generic keyword match so it doesn't fall back to viscose.
  if (/lenzing|ecovero|tencel/.test(key)) return 18;
  // Otherwise: the longest known fiber word contained in the name wins, so
  // "european_linen" -> linen, "organic_cotton_blend" -> organic_cotton.
  let best: number | null = null;
  let bestLen = 0;
  for (const known of Object.keys(FABRIC_SCORES)) {
    if (key.includes(known) && known.length > bestLen) {
      best = FABRIC_SCORES[known];
      bestLen = known.length;
    }
  }
  return best ?? 50;
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
  tencel_lyocell: "Tencel Lyocell",
  tencel_modal: "Tencel Modal",
  ecovero: "LENZING ECOVERO™",
  lenzing_viscose: "LENZING™ Viscose",
  lenzing_ecovero: "LENZING ECOVERO™",
  modal: "Modal",
  bamboo: "Bamboo",
  wool: "Wool",
  merino: "Merino wool",
  alpaca: "Alpaca",
  cashmere: "Cashmere",
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
