export type VerificationRung = "undisclosed" | "self_disclosed" | "verified" | "lab_verified";

// A health cert resolved to what the directory needs to render it: the display
// label, plus the CertBadge `slug` so it shows the real logo (same component and
// slugs the certifications page uses).
export type HealthCertBadge = { slug: string; label: string };

// The canonical health-cert registry. Only certs that verify WEARER chemical/dye
// safety belong here. Ethics/labor/provenance certs (B Corp, Fair Trade, GRS,
// FSC, RWS, PETA, fiber brands like TENCEL/European Flax) do NOT — counting them
// would overclaim.
//
// `matches` runs against the trimmed, lowercased cert string. Brands write the
// same cert a dozen ways ("OEKO-TEX", "OEKO-TEX Standard 100", "Oeko-Tex"), so
// matching collapses those spellings onto one slug. Everything downstream — the
// rung, the card badges, the shop filter — reads from this one list, so a cert
// can never be filterable but unscored, or vice versa.
export const HEALTH_CERTS: (HealthCertBadge & { matches: (c: string) => boolean })[] = [
  { slug: "oeko-tex-standard-100", label: "OEKO-TEX", matches: (c) => c.includes("oeko-tex") },
  { slug: "gots", label: "GOTS", matches: (c) => c === "gots" },
  { slug: "bluesign", label: "bluesign", matches: (c) => c === "bluesign" },
  { slug: "greenguard", label: "GREENGUARD", matches: (c) => c.includes("greenguard") },
  { slug: "made-safe", label: "MADE SAFE", matches: (c) => c === "made safe" },
  { slug: "nordic-swan", label: "Nordic Swan", matches: (c) => c.includes("nordic swan") },
  { slug: "eu-ecolabel", label: "EU Ecolabel", matches: (c) => c === "eu ecolabel" },
  { slug: "gols", label: "GOLS", matches: (c) => c === "gols" },
];

// Brands that verify through /verify send documents, not a public cert mark, so
// they carry no cert string at all. This pseudo-cert keeps them reachable from
// the shop's certification filter instead of silently unfilterable.
export const TOXOME_VERIFIED: HealthCertBadge = {
  slug: "toxome-verified",
  label: "Verified by Toxome",
};

function certFor(raw: string): HealthCertBadge | null {
  const c = raw.trim().toLowerCase();
  return HEALTH_CERTS.find((h) => h.matches(c)) ?? null;
}

export function hasHealthCert(certs?: string[] | null): boolean {
  return !!certs && certs.some((c) => certFor(c) !== null);
}

// Maps a raw cert string to its canonical badge (slug + label), or null if it
// isn't a health-relevant (verifying) cert.
export function healthCertBadge(raw: string): HealthCertBadge | null {
  const h = certFor(raw);
  return h ? { slug: h.slug, label: h.label } : null;
}

// Display label only (kept for non-visual callers).
export function healthCertLabel(raw: string): string | null {
  return healthCertBadge(raw)?.label ?? null;
}

// Every cert slug a product can be filtered by, deduped — a product listing both
// "OEKO-TEX" and "OEKO-TEX Standard 100" holds one cert, not two.
export function productCertSlugs(p: {
  certifications?: string[] | null;
  verification_rung?: VerificationRung | null;
}): string[] {
  const slugs = new Set<string>();
  for (const raw of p.certifications ?? []) {
    const h = certFor(raw);
    if (h) slugs.add(h.slug);
  }
  // Doc-verified with nothing to show for it: file under "Verified by Toxome".
  if (slugs.size === 0) {
    const rung = resolveRung(p);
    if (rung === "verified" || rung === "lab_verified") slugs.add(TOXOME_VERIFIED.slug);
  }
  return [...slugs];
}

// Resolves the rung from product data. An explicit `verification_rung` field
// (written later by the brand-disclosure intake or a lab test) always wins;
// otherwise we derive from health-relevant certs.
export function resolveRung(p: {
  certifications?: string[] | null;
  verification_rung?: VerificationRung | null;
}): VerificationRung {
  if (p.verification_rung) return p.verification_rung;
  if (hasHealthCert(p.certifications)) return "verified";
  return "undisclosed";
}

export const RUNG_META: Record<
  VerificationRung,
  { label: string; dotColor: string; title: string; body: string }
> = {
  undisclosed: {
    label: "Undisclosed",
    dotColor: "var(--ink-3)",
    title: "Estimated from materials",
    body: "We scored this from the fiber content on the label using conservative assumptions, because the brand hasn't shared its dye and finish details. This reflects category-baseline risk, not a penalty. Brands can verify for free by sending their own documents. No paid certification needed.",
  },
  self_disclosed: {
    label: "Self-disclosed",
    dotColor: "var(--orange)",
    title: "The brand told us",
    body: "This brand has shared details about its dyes and finishes (like PFAS-free or azo-free). We haven't independently checked the documents yet.",
  },
  verified: {
    label: "Verified",
    dotColor: "var(--risk-low)",
    title: "Documents checked",
    body: "We've confirmed this product's certifications against public records (like OEKO-TEX or GOTS). Verification can move a score up or down. It never buys points.",
  },
  lab_verified: {
    label: "Lab-verified",
    dotColor: "var(--blue)",
    title: "Lab-tested",
    body: "An independent lab tested the finished garment for harmful substances.",
  },
};

export const VERIFICATION_FIREWALL_LINE = "Verification improves accuracy, not your score.";
