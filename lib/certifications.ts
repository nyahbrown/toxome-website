// The field guide to clothing certifications.
//
// Honest-decoder framing: every label is a promise about ONE thing, and the gap
// between what it covers and what people *assume* it covers is the whole point.
// `verifies` = what the seal genuinely checks. `blindSpot` = the thing it quietly
// says nothing about (usually the thing a shopper most cares about). `take` = the
// Toxome read, reinforcing why a body-first score exists alongside the badges.

export type CertCategory = "textile" | "material" | "chemical" | "ethics";

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
  {
    id: "ethics",
    label: "Brand sustainability & ethics",
    blurb:
      "These certify the company behind the clothes, not the clothes themselves: how it treats workers, what it gives back, how it runs as a business. They speak to a brand's values, not to what is in the garment against your skin.",
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
    slug: "rcs",
    name: "Recycled Claim Standard",
    abbr: "RCS",
    issuer: "Textile Exchange",
    category: "material",
    summary:
      "Verifies and traces recycled material through the supply chain, confirming that a recycled-content claim is real. The lighter sister to GRS.",
    verifies: [
      "Recycled content from as little as 5%, traced with a chain of custody",
      "The recycled claim on the label is independently checked",
    ],
    blindSpot:
      "Unlike GRS, it sets no social, environmental, or chemical rules at all. It confirms the recycled content and nothing else, and recycled polyester is still plastic against your skin.",
    take: "Proof the recycled claim is honest, full stop. For recycled content plus some guardrails, GRS is the stronger version.",
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
    slug: "better-cotton",
    name: "Better Cotton",
    issuer: "Better Cotton (BCI)",
    category: "material",
    summary:
      "A farm-training program for cotton grown with less water, fewer chemicals, and better working conditions. It is now the most widespread cotton standard in the world.",
    verifies: [
      "Enrolled farmers are trained in more responsible water, soil, and pesticide practices",
      "A brand has bought Better Cotton volumes equal to the cotton it uses",
      "Improved labor conditions on participating farms",
    ],
    blindSpot:
      "It runs on a mass-balance system, so the Better Cotton in your shirt is almost never the physical cotton from a better farm, just an equal amount sourced elsewhere. It is not organic, and it still allows GMO seed and synthetic pesticides.",
    take: "A real step up from conventional cotton at scale, but a long way from organic. Read it as better, not clean, and not traceable to your garment.",
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
    slug: "responsible-mohair-standard",
    name: "Responsible Mohair Standard",
    abbr: "RMS",
    issuer: "Textile Exchange",
    category: "material",
    summary:
      "An animal-welfare and land-management standard for mohair, the silky fiber from angora goats, covering humane treatment and how the land is managed.",
    verifies: [
      "Humane treatment of the goats throughout their lives",
      "Responsible land and soil management on the farm",
      "Chain of custody from farm to final product",
    ],
    blindSpot:
      "Like its wool and down siblings, it is a farm standard, not a fabric one. It says nothing about how the mohair is later scoured, dyed, or finished.",
    take: "The mark to look for on mohair ethics. Pair it with a chemical label if residue is your concern.",
  },
  {
    slug: "responsible-alpaca-standard",
    name: "Responsible Alpaca Standard",
    abbr: "RAS",
    issuer: "Textile Exchange",
    category: "material",
    summary:
      "The animal-welfare and land standard for alpaca fiber, covering humane treatment of the animals and responsible management of the land they graze.",
    verifies: [
      "Animal welfare for the alpacas, from handling through shearing",
      "Responsible grazing and land management",
      "Chain of custody from farm to final product",
    ],
    blindSpot:
      "It is about the farm, not the finished yarn. The standard does not reach the dyeing or finishing that comes later.",
    take: "A meaningful welfare signal for alpaca. As with wool, the chemistry of the finished piece is a separate question.",
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
    slug: "pefc",
    name: "Programme for the Endorsement of Forest Certification",
    abbr: "PEFC",
    issuer: "PEFC International",
    category: "material",
    summary:
      "The world's largest forest-certification system. Like FSC, it verifies that wood-based materials, including the pulp behind viscose and rayon, come from responsibly managed forests.",
    verifies: [
      "The wood pulp originates in forests managed to PEFC's sustainability standards",
      "Chain of custody from the forest through to the finished material",
      "A particular focus on smallholder and family-owned forests",
    ],
    blindSpot:
      "Like FSC, it certifies the forest, not the fabric. Turning that pulp into viscose still relies on harsh solvents that PEFC says nothing about.",
    take: "A credible forestry mark, often seen as the alternative to FSC. Reassuring on where the wood came from, silent on how the fiber was made.",
  },
  {
    slug: "canopystyle",
    name: "CanopyStyle",
    issuer: "Canopy",
    category: "material",
    summary:
      "A conservation initiative that audits the viscose and rayon supply chain to keep ancient and endangered forests out of your clothing, and ranks the biggest producers on their risk.",
    verifies: [
      "A producer's wood-pulp sourcing is audited for ties to ancient and endangered forests",
      "Brands and mills commit to cutting high-risk forest sources from their fabric",
      "An annual Hot Button ranking scores the largest viscose producers",
    ],
    blindSpot:
      "It is a forest-protection commitment, not a product seal. You will rarely see it on a hangtag, and it speaks to where the pulp came from, not the chemistry that turned it into fabric.",
    take: "The sharpest watchdog on viscose and rayon sourcing. Look for it in a brand's commitments, and pair it with closed-loop processing for the part it doesn't cover.",
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
    slug: "oeko-tex-leather-standard",
    name: "OEKO-TEX Leather Standard",
    issuer: "OEKO-TEX Association",
    category: "material",
    summary:
      "The leather counterpart to Standard 100. Every component of a leather item is lab-tested for harmful substances against limits stricter than the law.",
    verifies: [
      "Leather and its components test below limits for regulated harmful chemicals",
      "Restricted substances such as chromium VI, certain dyes, and residues",
      "Tested by intended use, with stricter limits for items in close skin contact",
    ],
    blindSpot:
      "It tests the leather for chemical residue, not how the animal was raised or how the tannery performed. That is the territory of welfare claims and Leather Working Group audits.",
    take: "The chemical-safety mark to look for on leather. Read it as low tested residues, not a welfare or environmental verdict.",
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

  // ── Brand & ethics standards ─────────────────────────────────────────────
  {
    slug: "b-corp",
    name: "Certified B Corporation",
    abbr: "B Corp",
    issuer: "B Lab",
    category: "ethics",
    summary:
      "A company-wide certification that scores a whole business on its social and environmental performance, from how it treats workers to its environmental footprint to how it is governed.",
    verifies: [
      "The entire company clears a verified bar across workers, community, environment, customers and governance",
      "A legal commitment to weigh all stakeholders, not only shareholders",
      "Recertification every three years against an updated assessment",
    ],
    blindSpot:
      "It rates the business, not the garment. A certified company can still sell virgin-polyester clothing finished with conventional chemistry. B Corp tells you about the boardroom, not the fabric against your skin.",
    take: "A real signal that a brand takes ethics and the environment seriously as a business. It says nothing about what any single piece is made of.",
  },
  {
    slug: "fair-trade",
    name: "Fairtrade",
    issuer: "Fairtrade International",
    category: "ethics",
    summary:
      "Certifies that the people who made the product worked under safe conditions for fair pay, with extra money flowing back to their community. (Fair Trade Certified, by Fair Trade USA, is the close US equivalent.)",
    verifies: [
      "Safe working conditions, fair wages, and a ban on forced and child labor",
      "A community premium paid back to the workers and farmers",
      "Audited supply chains for the certified factories or farms",
    ],
    blindSpot:
      "It is a people standard, not a materials one. Fairtrade speaks to how workers were treated, not to the fiber, the dyes, or the chemistry of the finished clothing.",
    take: "The label to look for on labor ethics. Pair it with a fiber or chemical mark if what the garment is made of is your concern.",
  },
  {
    slug: "fair-wear-foundation",
    name: "Fair Wear Foundation",
    abbr: "FWF",
    issuer: "Fair Wear Foundation",
    category: "ethics",
    summary:
      "A nonprofit that works with apparel brands to improve conditions in the factories that sew their clothes, auditing each brand on real progress rather than a one-time pass.",
    verifies: [
      "Member brands are checked against a code covering fair pay, safe conditions, and no forced or child labor",
      "A focus on the sewing stage, where most garment labor happens",
      "Annual public performance reviews of each member brand",
    ],
    blindSpot:
      "It grades the brand's labor practices, not the garment. It tells you nothing about the fiber, the chemistry, or what the piece is made of.",
    take: "One of the more credible labor commitments in clothing. A sign a brand takes its workers seriously, not a claim about the fabric.",
  },
  {
    slug: "one-percent-for-the-planet",
    name: "1% for the Planet",
    issuer: "1% for the Planet",
    category: "ethics",
    summary:
      "A membership commitment in which a business gives at least 1% of its annual sales, not its profit, to environmental nonprofits, certified every year.",
    verifies: [
      "The company donates at least 1% of yearly revenue to approved environmental causes",
      "Giving is verified annually with proof of the contributions",
    ],
    blindSpot:
      "It measures generosity, not the product. A member brand funds environmental work, but the donation says nothing about whether the clothing itself is clean, natural, or low-impact.",
    take: "Proof a brand puts real money toward the planet. Read it as a giving pledge, not a verdict on the garment in your hands.",
  },
  {
    slug: "climate-neutral-certified",
    name: "Climate Neutral Certified",
    issuer: "Change Climate Project",
    category: "ethics",
    summary:
      "Certifies that a brand measured its entire carbon footprint, offset it for the current year, and committed to cutting emissions going forward.",
    verifies: [
      "The company measured its cradle-to-customer carbon emissions",
      "Those emissions were offset through verified carbon credits",
      "A public commitment to reduce emissions over time",
    ],
    blindSpot:
      "Offsetting is not the same as not emitting, and the badge covers the company's carbon math, not the materials in any product. A carbon-neutral brand can still sell plastic clothing.",
    take: "A sign a brand is accounting for its climate impact. Read it as carbon bookkeeping, not a verdict on what the garment is made of.",
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
