"use client";

import { useState } from "react";

// Circular certification badge. Resolves the logo in order:
//   1. a local file in /public/certs (passed as `logoSrc`) — best quality
//   2. the certifying body's logo from a remote URL (Clearbit, then Google)
//   3. a clean monogram fallback if every image fails
// Each cert maps to its issuing body's domain; the remote services return that
// brand's mark. Swapping the order or dropping a file in /public/certs overrides.

const DOMAIN: Record<string, string> = {
  "oeko-tex-standard-100": "oeko-tex.com",
  "oeko-tex-made-in-green": "oeko-tex.com",
  "oeko-tex-eco-passport": "oeko-tex.com",
  gots: "global-standard.org",
  "regenerative-organic-certified": "regenorganic.org",
  bluesign: "bluesign.com",
  "cradle-to-cradle": "c2ccertified.org",
  "eu-ecolabel": "environment.ec.europa.eu",
  grs: "textileexchange.org",
  ocs: "textileexchange.org",
  rws: "textileexchange.org",
  rds: "textileexchange.org",
  fsc: "fsc.org",
  pefc: "pefc.org",
  canopystyle: "canopyplanet.org",
  "leather-working-group": "leatherworkinggroup.com",
  "usda-organic": "usda.gov",
  zdhc: "roadmaptozero.com",
  "b-corp": "bcorporation.net",
  "fair-trade": "fairtrade.net",
  "one-percent-for-the-planet": "onepercentfortheplanet.org",
  "better-cotton": "bettercotton.org",
  "oeko-tex-leather-standard": "oeko-tex.com",
  "fair-wear-foundation": "fairwear.org",
  "climate-neutral-certified": "changeclimate.org",
};

function remoteCandidates(slug: string): string[] {
  const domain = DOMAIN[slug];
  if (!domain) return [];
  // Google's favicon service returns each certifying body's logo mark, loads
  // fast, and resolves for every real domain. Drop a file in /public/certs to
  // override any cert with a higher-resolution official logo.
  return [`https://www.google.com/s2/favicons?domain=${domain}&sz=128`];
}

// Short monogram per cert, shown only if every logo source fails.
const MARK: Record<string, string> = {
  "oeko-tex-standard-100": "100",
  "oeko-tex-made-in-green": "MIG",
  gots: "GOTS",
  "regenerative-organic-certified": "ROC",
  bluesign: "b",
  "cradle-to-cradle": "C2C",
  "eu-ecolabel": "EU",
  grs: "GRS",
  ocs: "OCS",
  rws: "RWS",
  rds: "RDS",
  fsc: "FSC",
  pefc: "PEFC",
  canopystyle: "Canopy",
  "leather-working-group": "LWG",
  "usda-organic": "USDA",
  "oeko-tex-eco-passport": "ECO",
  zdhc: "ZDHC",
  "b-corp": "B",
  "fair-trade": "FT",
  "one-percent-for-the-planet": "1%",
  rcs: "RCS",
  "responsible-mohair-standard": "RMS",
  "responsible-alpaca-standard": "RAS",
  "better-cotton": "BC",
  "oeko-tex-leather-standard": "LS",
  "fair-wear-foundation": "FWF",
  "climate-neutral-certified": "CN",
};

function markFor(slug: string, abbr: string | undefined, name: string): string {
  if (MARK[slug]) return MARK[slug];
  if (abbr) return abbr;
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function fontFor(len: number, size: number): number {
  const ratio = len <= 1 ? 0.46 : len === 2 ? 0.4 : len === 3 ? 0.3 : 0.235;
  return Math.round(size * ratio);
}

export default function CertBadge({
  slug,
  name,
  abbr,
  size = 56,
  logoSrc,
}: {
  slug: string;
  name: string;
  abbr?: string;
  size?: number;
  logoSrc?: string;
}) {
  const candidates = [logoSrc, ...remoteCandidates(slug)].filter(
    Boolean
  ) as string[];
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];
  const mark = markFor(slug, abbr, name);

  return (
    <span className="cert-badge" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="cert-badge__img"
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <span
          className="cert-badge__mark"
          style={{ fontSize: fontFor(mark.length, size) }}
        >
          {mark}
        </span>
      )}
    </span>
  );
}
