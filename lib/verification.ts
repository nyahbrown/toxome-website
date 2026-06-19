export type VerificationRung = "undisclosed" | "self_disclosed" | "verified" | "lab_verified";

// Only certs that verify WEARER chemical/dye safety grant the "verified" rung.
// Ethics/labor/provenance certs (B Corp, Fair Trade, GRS, FSC, RWS, PETA, fiber
// brands like TENCEL/European Flax) do NOT — counting them would overclaim.
function isHealthCert(raw: string): boolean {
  const c = raw.trim().toLowerCase();
  return (
    c.includes("oeko-tex") ||
    c === "gots" ||
    c === "bluesign" ||
    c.includes("greenguard") ||
    c === "made safe" ||
    c.includes("nordic swan") ||
    c === "eu ecolabel" ||
    c === "gols"
  );
}

export function hasHealthCert(certs?: string[] | null): boolean {
  return !!certs && certs.some(isHealthCert);
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
    body: "An independent lab tested the finished garment for harmful substances. Coming 2027.",
  },
};

export const VERIFICATION_FIREWALL_LINE = "Verification improves accuracy, not your score.";
