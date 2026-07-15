// Cert logo sources and monogram fallbacks, shared by the client-side
// CertBadge (shop grid, product page, guide) and the server-side TikTok slide
// renderer. Kept free of `fs` so a client component can import it — the
// filesystem lookup for /public/certs lives in lib/certLogos.ts.

// Each cert maps to its issuing body's domain; the favicon service returns that
// body's logo mark.
const DOMAIN: Record<string, string> = {
  "oeko-tex-standard-100": "oeko-tex.com",
  "oeko-tex-made-in-green": "oeko-tex.com",
  "oeko-tex-eco-passport": "oeko-tex.com",
  gots: "global-standard.org",
  greenguard: "ul.com",
  "made-safe": "madesafe.org",
  "nordic-swan": "svanen.se",
  gols: "global-standard.org",
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
  "european-flax": "europeanflax.com",
  "eco-institut": "eco-institut.de",
  "certified-vegan": "vegan.org",
};

/** Remote logo URLs to try for a cert, in order. Empty when the body is unknown. */
export function remoteCandidates(slug: string, size = 128): string[] {
  const domain = DOMAIN[slug];
  if (!domain) return [];
  // Google's favicon service returns each certifying body's logo mark, loads
  // fast, and resolves for every real domain. Drop a file in /public/certs to
  // override any cert with a higher-resolution official logo.
  return [`https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`];
}

// Short monogram per cert, shown only if every logo source fails.
const MARK: Record<string, string> = {
  "oeko-tex-standard-100": "100",
  "oeko-tex-made-in-green": "MIG",
  gots: "GOTS",
  greenguard: "GG",
  "made-safe": "MS",
  "nordic-swan": "NS",
  gols: "GOLS",
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
  "european-flax": "EF",
  "eco-institut": "eco",
  "certified-vegan": "V",
};

export function markFor(slug: string, abbr: string | undefined, name: string): string {
  if (MARK[slug]) return MARK[slug];
  if (abbr) return abbr;
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
