// The field guide to clothing certifications.
//
// Honest-decoder framing: every label is a promise about ONE thing, and the gap
// between what it covers and what people *assume* it covers is the whole point.
// `verifies` = what the seal genuinely checks. `blindSpot` = the thing it quietly
// says nothing about (usually the thing a shopper most cares about). `take` = the
// Toxome read, reinforcing why a body-first score exists alongside the badges.

export type CertCategory = "textile" | "material" | "chemical";

export type Certification = {
  slug: string;
  name: string;
  abbr?: string;
  issuer: string;
  category: CertCategory;
  // One-line plain-English definition.
  summary: string;
  // What the certification genuinely verifies.
  verifies: string[];
  // The honest gap — what it does NOT cover.
  blindSpot: string;
  // The Toxome read.
  take: string;
  // 1-based rank among the few marks that do the most for what touches the
  // body. Set only on the "start here" leads; everything else stays undefined.
  healthRank?: number;
  // A short, plain line for the "start here" tier (why this one matters most).
  leadNote?: string;
};

export type CategoryMeta = {
  id: CertCategory;
  label: string;
  blurb: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "textile",
    label: "Whole-garment standards",
    blurb:
      "These look at the finished piece or the factory that made it: the broadest claims, and the ones most often misread as a clean bill of health.",
  },
  {
    id: "material",
    label: "Fiber & material standards",
    blurb:
      "These certify one material in the garment: the cotton, the wool, the down, the leather. They travel with the fiber, not the finished product.",
  },
  {
    id: "chemical",
    label: "Chemical & process standards",
    blurb:
      "These govern what happens inside the mill: the dyes, the inputs, the wastewater. Most never appear on a hangtag. They are promises made between manufacturers.",
  },
];

export const CERTIFICATIONS: Certification[] = [
  // ── Whole-garment standards ──────────────────────────────────────────────
  {
    slug: "oeko-tex-standard-100",
    name: "OEKO-TEX Standard 100",
    issuer: "OEKO-TEX Association",
    category: "textile",
    summary:
      "Every component of the finished textile is lab-tested for hundreds of regulated harmful substances, against limits stricter than the law requires.",
    verifies: [
      "The fabric, thread, buttons and prints test below set limits for known harmful chemicals",
      "Formaldehyde, certain heavy metals, restricted dyes and a long list of residues",
      "Tested per skin-contact class, with stricter limits for baby and next-to-skin items",
    ],
    blindSpot:
      "It says nothing about what the fabric is made of. A garment that is 100% virgin polyester can carry Standard 100. It certifies chemical residue, not fiber, sustainability, or how the piece was made.",
    take: "The single most useful chemical label to look for. Read it as \"low tested residues,\" not \"natural\" or \"safe to live in.\"",
    healthRank: 1,
    leadNote:
      "The one chemical-safety mark to look for. The finished fabric is tested for hundreds of harmful substances, against limits stricter than the law.",
  },
  {
    slug: "oeko-tex-made-in-green",
    name: "OEKO-TEX Made in Green",
    issuer: "OEKO-TEX Association",
    category: "textile",
    summary:
      "A traceable label that combines Standard 100 chemical testing with proof the item was made in environmentally and socially responsible facilities.",
    verifies: [
      "The product is Standard 100 tested for harmful substances",
      "Manufacturing happened in audited, more sustainable facilities",
      "A unique ID lets you trace where the item was made",
    ],
    blindSpot:
      "Still not a fiber claim. The environmental promise is about the factory, not the material. A Made in Green piece can still be plastic-based.",
    take: "Standard 100 plus a factory conscience. Helpful for traceability; not a verdict on what you're putting against your skin.",
  },
  {
    slug: "gots",
    name: "Global Organic Textile Standard",
    abbr: "GOTS",
    issuer: "Global Standard gGmbH",
    category: "textile",
    summary:
      "The leading standard for organic-fiber textiles. It follows organic material from field to finished garment, adding environmental and labor rules at every step.",
    verifies: [
      "Organic fiber content (the \"organic\" grade is at least 95%; \"made with organic\" at least 70%)",
      "Restricted chemical inputs through dyeing and processing, with no chlorine bleach and no toxic finishes",
      "Social criteria: safe conditions and fair labor across the supply chain",
    ],
    blindSpot:
      "It only applies to natural fibers, so a synthetic garment can never be GOTS. And the 70% grade still leaves up to 30% conventional or synthetic material in the blend.",
    take: "The closest thing to a gold standard for natural clothing, because it covers the fiber and the chemistry. Always check whether it's the 95% or the 70% grade.",
    healthRank: 2,
    leadNote:
      "The gold standard for natural clothing. It covers both the fiber and the processing chemistry, from field to finished garment.",
  },
  {
    slug: "regenerative-organic-certified",
    name: "Regenerative Organic Certified",
    abbr: "ROC",
    issuer: "Regenerative Organic Alliance",
    category: "textile",
    summary:
      "The highest bar in cotton. It starts from certified organic and then stacks soil health, animal welfare, and farmer fairness on top.",
    verifies: [
      "Certified organic as the required baseline, so no synthetic pesticides, fertilizers, or GMO seed",
      "Soil health and land management that rebuilds the ground the fiber grows in",
      "Farmer and worker fairness, plus animal welfare where relevant (awarded at Bronze, Silver, and Gold levels)",
    ],
    blindSpot:
      "It is still rare, so few garments carry it yet. And the word \"regenerative\" on its own is not the same thing: without the \"organic certified\" part it still allows synthetic inputs.",
    take: "The cleanest cotton you can buy, because organic is the floor and regeneration is the ceiling. Look for the full \"Regenerative Organic Certified\" mark, not just the word regenerative.",
  },
  {
    slug: "bluesign",
    name: "bluesign",
    issuer: "bluesign technologies",
    category: "textile",
    summary:
      "A whole-system approach that screens chemical inputs before they ever enter the supply chain, aiming to keep harmful substances out from the start.",
    verifies: [
      "bluesign vets chemicals and raw materials at the input stage, not only at the end",
      "Worker safety, resource use and emissions at manufacturing sites",
      "A managed list of approved chemical formulations for mills",
    ],
    blindSpot:
      "\"bluesign APPROVED\" (a material or input) is not the same as a fully certified \"bluesign PRODUCT.\" The label often describes a process the brand follows, not a guarantee about the exact item in your hands.",
    take: "Strong upstream chemical control, common in technical and outdoor wear. Check whether the claim covers the product or only the brand's system.",
    healthRank: 3,
    leadNote:
      "Screens harmful chemicals out at the input stage, before they ever reach the fabric you wear.",
  },
  {
    slug: "cradle-to-cradle",
    name: "Cradle to Cradle Certified",
    abbr: "C2C",
    issuer: "Cradle to Cradle Products Innovation Institute",
    category: "textile",
    summary:
      "Rates a product on circular-design principles across five areas, from material health to water and social fairness, at Bronze through Platinum levels.",
    verifies: [
      "Material health, meaning ingredients assessed for human and environmental safety",
      "Product circularity, renewable energy, clean water and social fairness",
      "An overall level set by the lowest-scoring of the five categories",
    ],
    blindSpot:
      "It's a design philosophy, not a wardrobe-safety seal. A product can be certified at a low level while still scoring low on the material-health pillar you care about most.",
    take: "Ambitious and holistic. Read the level and the material-health score, since the headline badge can hide a weak link.",
  },
  {
    slug: "eu-ecolabel",
    name: "EU Ecolabel",
    issuer: "European Commission",
    category: "textile",
    summary:
      "The European Union's official environmental label, awarded to products that meet life-cycle criteria including limits on hazardous substances.",
    verifies: [
      "Reduced environmental impact across the product's life cycle",
      "Restrictions on hazardous chemicals and harmful dyes",
      "Durability and fitness-for-use testing",
    ],
    blindSpot:
      "It leans environmental rather than health-first, and adoption in fashion is thin. It barely appears on apparel, so its absence means little.",
    take: "A credible government-backed eco label where it appears. Treat it as an environmental signal, not a personal-exposure one.",
  },

  // ── Fiber & material standards ───────────────────────────────────────────
  {
    slug: "grs",
    name: "Global Recycled Standard",
    abbr: "GRS",
    issuer: "Textile Exchange",
    category: "material",
    summary:
      "Verifies recycled content in a product and tracks it through the supply chain, adding social, environmental and chemical requirements.",
    verifies: [
      "Recycled material content (the full label requires at least 50%; claims can start at 20%)",
      "Chain of custody, so the recycled input is traced, not only claimed",
      "Some restrictions on chemicals used in processing",
    ],
    blindSpot:
      "Recycled is not the same as non-toxic or natural. Recycled polyester is still plastic. It sheds microfibers and sits against your skin like any other synthetic.",
    take: "Good for keeping plastic in circulation, but a recycled-plastic shirt is still a plastic shirt. The badge is about the source, not the safety.",
  },
  {
    slug: "ocs",
    name: "Organic Content Standard",
    abbr: "OCS",
    issuer: "Textile Exchange",
    category: "material",
    summary:
      "Tracks the amount of organically grown material in a product and verifies it from farm to finished item.",
    verifies: [
      "The percentage of certified organic fiber in the product",
      "Chain of custody for that organic material",
    ],
    blindSpot:
      "Unlike GOTS, it only confirms the organic content claim. It sets no rules for the dyes, finishes or processing chemistry that come after the farm.",
    take: "Proof the organic fiber is real, nothing more. For the full picture on processing, GOTS is the stronger label.",
  },
  {
    slug: "rws",
    name: "Responsible Wool Standard",
    abbr: "RWS",
    issuer: "Textile Exchange",
    category: "material",
    summary:
      "An animal-welfare and land-management standard for wool, ensuring sheep are treated humanely and pastures are managed responsibly.",
    verifies: [
      "Animal welfare on the farm, including a ban on mulesing",
      "Responsible land and soil management",
      "Chain of custody from farm to final product",
    ],
    blindSpot:
      "It's about the farm, not the fabric's chemistry. RWS says nothing about how the wool is later scoured, dyed or finished.",
    take: "A meaningful ethics signal for wool. Pair it with a chemical label if residue is your concern.",
  },
  {
    slug: "rds",
    name: "Responsible Down Standard",
    abbr: "RDS",
    issuer: "Textile Exchange",
    category: "material",
    summary:
      "Certifies that the down and feathers in a product come from animals that were not live-plucked or force-fed.",
    verifies: [
      "No live-plucking and no force-feeding of the birds",
      "Welfare across the supply chain, audited at each stage",
      "Chain of custody for the down",
    ],
    blindSpot:
      "Purely an animal-welfare claim. It covers neither the shell fabric nor any chemical treatment on the finished jacket.",
    take: "The right label to look for on down. Just remember the outer fabric is a separate question entirely.",
  },
  {
    slug: "fsc",
    name: "Forest Stewardship Council",
    abbr: "FSC",
    issuer: "Forest Stewardship Council",
    category: "material",
    summary:
      "Certifies that wood-based materials come from responsibly managed forests, the feedstock behind plant-based fibers like viscose, modal and lyocell.",
    verifies: [
      "The wood pulp behind the fiber comes from responsibly managed forests",
      "Chain of custody from forest to product",
    ],
    blindSpot:
      "It certifies the forest, not the fiber. Turning pulp into viscose can still involve harsh solvents, and FSC says nothing about that chemistry or the finished fabric.",
    take: "Reassuring on sourcing for semi-synthetics. Look for closed-loop processing (as in lyocell) for the part FSC doesn't cover.",
  },
  {
    slug: "leather-working-group",
    name: "Leather Working Group",
    abbr: "LWG",
    issuer: "Leather Working Group",
    category: "material",
    summary:
      "Audits and rates leather tanneries on their environmental performance, scoring them Bronze, Silver or Gold.",
    verifies: [
      "A tannery's environmental management, covering water, energy, waste and chemical handling",
      "Traceability of hides through the audited facility",
      "A medal rating reflecting performance",
    ],
    blindSpot:
      "It rates the tannery, not animal welfare or the residue in the finished leather. And not all LWG-rated leather is Gold, since the bar varies by tier.",
    take: "The leading environmental audit for leather. Check the medal level, and know it isn't a welfare or chemical-safety guarantee.",
  },
  {
    slug: "usda-organic",
    name: "USDA Organic",
    issuer: "U.S. Department of Agriculture",
    category: "material",
    summary:
      "A farming certification for fibers like cotton, grown without synthetic pesticides or fertilizers under federal organic rules.",
    verifies: [
      "The raw fiber was grown to USDA organic farming standards",
      "No synthetic pesticides or prohibited fertilizers on the crop",
    ],
    blindSpot:
      "It stops at the farm gate. A USDA-organic-cotton shirt can still be bleached, dyed and finished with conventional chemistry. That processing is GOTS's territory, not USDA's.",
    take: "Confirms the cotton was grown clean. It doesn't promise the shirt was made clean.",
  },

  // ── Chemical & process standards ─────────────────────────────────────────
  {
    slug: "oeko-tex-eco-passport",
    name: "OEKO-TEX Eco Passport",
    issuer: "OEKO-TEX Association",
    category: "chemical",
    summary:
      "Certifies the dyes and chemical formulations a mill uses, screening each ingredient against safety and environmental criteria.",
    verifies: [
      "Individual chemical products and dye formulations meet safety thresholds",
      "Ingredients screened against restricted-substance and environmental lists",
    ],
    blindSpot:
      "It certifies the inputs, not the garment. A mill can hold Eco Passport chemicals and still make products that were never finished-textile tested.",
    take: "An upstream signal of cleaner chemistry. On its own it tells you about the dye, not the dress.",
  },
  {
    slug: "zdhc",
    name: "ZDHC Roadmap to Zero",
    abbr: "ZDHC",
    issuer: "ZDHC Foundation",
    category: "chemical",
    summary:
      "An industry-wide program to eliminate hazardous chemicals from textile manufacturing, built around a restricted-substances list and wastewater testing.",
    verifies: [
      "Manufacturers commit to a Manufacturing Restricted Substances List (MRSL)",
      "Wastewater and inputs are tested against hazardous-chemical limits",
    ],
    blindSpot:
      "There's no consumer-facing seal on the garment. It's a commitment made between brands and factories, meaningful but invisible at the rack.",
    take: "A strong sign a brand is serious about manufacturing chemistry. You'll see it in sustainability reports, not on a hangtag.",
  },
];

export function getCertsByCategory(category: CertCategory): Certification[] {
  return CERTIFICATIONS.filter((c) => c.category === category);
}

// The "start here" leads — the few marks that do the most for what touches the
// body, in rank order. Drives the featured tier above the full directory.
export function getHealthLeads(): Certification[] {
  return CERTIFICATIONS.filter((c) => c.healthRank).sort(
    (a, b) => (a.healthRank ?? 0) - (b.healthRank ?? 0)
  );
}
