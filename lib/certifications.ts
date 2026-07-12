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
  // Named sub-levels of the certification (e.g. ROC Bronze/Silver/Gold), each
  // with a short blurb and a small accent-dot color. Rendered as labeled rows.
  levels?: { name: string; blurb: string; accent: string }[];
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
      "Farmer and worker fairness, plus animal welfare where relevant",
    ],
    levels: [
      { name: "Bronze", accent: "#A97C50", blurb: "Starts at 10% of the farm's land or revenue, climbing to at least 50% by year five." },
      { name: "Silver", accent: "#9AA0A6", blurb: "50 to 75% of the farm certified." },
      { name: "Gold", accent: "#C0A02E", blurb: "The whole operation certified, the highest level." },
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
  {
    slug: "greenguard",
    name: "GREENGUARD Gold",
    issuer: "UL Solutions",
    category: "textile",
    summary:
      "Certifies that a finished product releases very low levels of chemical emissions into the air, tested against strict limits for hundreds of VOCs. The Gold tier is the stricter one, benchmarked for schools, healthcare, and sensitive people.",
    verifies: [
      "The finished product off-gasses below strict limits for hundreds of volatile organic compounds, including formaldehyde",
      "Gold applies tighter thresholds set for sensitive groups like children and the chronically ill",
      "Ongoing testing to keep the mark, not a one-time pass",
    ],
    blindSpot:
      "It measures what a product releases into the air of a room, not what touches your skin. This is an emissions test for furnishings like mattresses and furniture, not an apparel mark. It says nothing about the fiber, the farming, or how a garment was dyed.",
    take: "The mark to look for on a mattress or home piece, where off-gassing is the real concern. Read it as cleaner indoor air, not a verdict on the clothing against your skin.",
  },
  {
    slug: "eco-institut",
    name: "eco-INSTITUT",
    issuer: "eco-INSTITUT Germany",
    category: "textile",
    summary:
      "A rigorous German lab test that screens a finished product for both harmful-substance content and low chemical emissions, against some of the strictest limits in the industry. Most often seen on natural latex, mattresses, and bedding.",
    verifies: [
      "The product tests below strict limits for pollutants like formaldehyde, heavy metals, and pesticides",
      "Both what the material contains and what it off-gasses into the air (VOCs)",
      "Independent lab testing, most common on latex foam, mattresses, and textiles",
    ],
    blindSpot:
      "Like other emissions and residue tests, it certifies the chemistry of the finished piece, not the fiber's origin, the farming, or the labor behind it. And it is a furnishings-and-bedding mark far more than an apparel one.",
    take: "One of the stricter harmful-substance labels, and a strong signal on a latex pillow or mattress. Read it as low residue and low off-gassing, not a verdict on sourcing or ethics.",
  },
  {
    slug: "made-safe",
    name: "MADE SAFE",
    issuer: "MADE SAFE (Nontoxic Certified)",
    category: "textile",
    summary:
      "Screens a whole product against a long list of known harmful chemicals, from flame retardants and heavy metals to pesticides and endocrine disruptors, and certifies it only if none are used.",
    verifies: [
      "The finished product is made without a banned list of substances linked to human harm",
      "Ingredients and materials are vetted, not just the final fabric",
      "Applied across apparel, bedding, and personal care, with a focus on human health",
    ],
    blindSpot:
      "It is a chemical-safety screen, not a fiber or sourcing claim. A MADE SAFE product can still be synthetic, and the mark says nothing about farming, labor, or environmental impact.",
    take: "A genuinely health-first label, close to the body-first lens Toxome scores by. Read it as free of known-harmful chemicals, not as natural or sustainably made.",
  },
  {
    slug: "certified-vegan",
    name: "Certified Vegan",
    issuer: "Vegan Action",
    category: "textile",
    summary:
      "Certifies that a product contains no animal-derived materials and was not tested on animals. A values mark about animal welfare, not about chemistry or health.",
    verifies: [
      "No animal ingredients or materials (no leather, wool, silk, down, or animal-based glues)",
      "No animal testing on the product or its ingredients",
      "Reviewed sourcing to back the no-animal claim",
    ],
    blindSpot:
      "Vegan is not the same as clean. Removing animal materials often means replacing them with plastic: polyester, acrylic, or polyurethane \"vegan leather.\" The mark says nothing about the fiber's safety or what sits against your skin.",
    take: "A clear animal-welfare signal, and nothing more. Read it as no animal materials, not as natural, non-toxic, or better for your body.",
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
    slug: "the-good-cashmere-standard",
    name: "The Good Cashmere Standard",
    abbr: "GCS",
    issuer: "Aid by Trade Foundation",
    category: "material",
    summary:
      "An animal-welfare and livelihood standard built for cashmere, covering how the goats are treated, how herders are paid, and how the grazing land is managed.",
    verifies: [
      "Goat welfare, scored against the Five Domains model across 150-plus indicators",
      "Fair working conditions and better income for herding families",
      "Responsible grazing and land management, with chain of custody to the finished product",
    ],
    blindSpot:
      "It is a farm-and-fiber standard, not a chemistry one. It says nothing about the dyes or finishes on the finished sweater, and its audited supply centers on Inner Mongolia, not every origin.",
    take: "The leading welfare mark on cashmere, and the one to look for given the industry's overgrazing and handling record. Pair it with OEKO-TEX if residue is your concern.",
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
  {
    slug: "european-flax",
    name: "European Flax",
    issuer: "Alliance for European Flax-Linen",
    category: "material",
    summary:
      "Certifies that the flax behind a linen garment was grown in Western Europe under strict farming rules, and traces it from the field to the spun yarn.",
    verifies: [
      "The flax was grown in Western Europe (France, Belgium, the Netherlands), rain-fed with no irrigation and no GMO seed",
      "Zero-waste farming that uses the whole plant, with no defoliation",
      "Third-party traceability from the field through to the yarn",
    ],
    blindSpot:
      "It certifies where and how the flax was farmed, not what happens next. European Flax linen can still be bleached, dyed and finished with conventional chemistry, and the mark says nothing about labor beyond the farm.",
    take: "The mark to look for on linen's origin. Read it as clean, traceable European flax, not a verdict on how the finished fabric was dyed or finished.",
  },
  {
    slug: "gols",
    name: "Global Organic Latex Standard",
    abbr: "GOLS",
    issuer: "Global Standard gGmbH",
    category: "material",
    summary:
      "The organic standard for natural latex, the GOTS counterpart for rubber. It certifies that the latex in a mattress, pillow, or topper is organic and processed to strict chemical and social rules.",
    verifies: [
      "Certified organic latex content (the organic grade requires at least 95%)",
      "Limits on the chemicals and fillers added when the latex is processed",
      "Social and environmental criteria through manufacturing, like GOTS",
    ],
    blindSpot:
      "It covers the latex, not the cover fabric or anything else in the product. And it is a bedding-and-foam material standard, so you will see it on a mattress or pillow, not on clothing.",
    take: "The mark to look for on a natural-latex mattress or pillow. Read it as genuinely organic latex, not a verdict on the cotton cover or the rest of the build.",
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

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Free-form aliases → slug, for the shorthand a product feed tends to use. Only
// needed where a bare string is ambiguous or doesn't contain the cert's name.
const CERT_ALIASES: Record<string, string> = {
  oekotex: "oeko-tex-standard-100",
  oekotex100: "oeko-tex-standard-100",
  standard100: "oeko-tex-standard-100",
  madeingreen: "oeko-tex-made-in-green",
  ecopassport: "oeko-tex-eco-passport",
  globalorganictextilestandard: "gots",
  roc: "regenerative-organic-certified",
  c2c: "cradle-to-cradle",
  euecolabel: "eu-ecolabel",
  globalrecycledstandard: "grs",
  organiccontentstandard: "ocs",
  responsiblewoolstandard: "rws",
  responsibledownstandard: "rds",
  recycledclaimstandard: "rcs",
  fairtradecertified: "fair-trade",
  fairtrade: "fair-trade",
  bcorp: "b-corp",
  bcorporation: "b-corp",
  onepercentfortheplanet: "one-percent-for-the-planet",
  bettercottoninitiative: "better-cotton",
  fairwear: "fair-wear-foundation",
  climateneutral: "climate-neutral-certified",
  mastersoflinen: "european-flax",
  europeanflaxlinen: "european-flax",
  europeanlinen: "european-flax",
  certifiedvegan: "certified-vegan",
  certifiedveganveganaction: "certified-vegan",
  veganaction: "certified-vegan",
};

// Resolve a free-form certification string from a product feed (e.g. "GOTS",
// "OEKO-TEX Standard 100", "bluesign") to its entry in the field guide, so the
// shop can render the same badge the guide uses. null when nothing matches.
export function findCertification(query: string): Certification | null {
  const q = norm(query);
  if (!q) return null;

  if (CERT_ALIASES[q]) {
    const hit = CERTIFICATIONS.find((c) => c.slug === CERT_ALIASES[q]);
    if (hit) return hit;
  }

  // Exact match on slug, name, or abbr.
  for (const c of CERTIFICATIONS) {
    if (norm(c.slug) === q || norm(c.name) === q || (c.abbr && norm(c.abbr) === q)) {
      return c;
    }
  }

  // Looser match only when the product string is MORE specific than the cert
  // name — i.e. it spells out the full name (e.g. "GOTS certified" contains
  // "gots"). We never match the other direction: a generic fragment like
  // "organic" must not claim a specific paid mark like GOTS. Longest cert name
  // first so "OEKO-TEX Standard 100" wins over a bare "OEKO-TEX".
  const byLength = [...CERTIFICATIONS].sort(
    (a, b) => norm(b.name).length - norm(a.name).length
  );
  for (const c of byLength) {
    const n = norm(c.name);
    if (n.length >= 5 && q.includes(n)) return c;
  }

  return null;
}

// Text signatures for the certifications a brand routinely names in its product
// copy. Each returns a canonical string that findCertification resolves, so a
// detected cert renders the same badge as a feed-supplied one. Ordered so the
// most specific OEKO-TEX variant wins before the bare Standard 100 fallback.
const CERT_SIGNATURES: { re: RegExp; value: string }[] = [
  { re: /\bgots\b|global organic textile standard/, value: "GOTS" },
  { re: /oeko[\s-]?tex[\s-]?made in green|made in green/, value: "OEKO-TEX Made in Green" },
  { re: /eco[\s-]?passport/, value: "OEKO-TEX Eco Passport" },
  { re: /leather standard/, value: "OEKO-TEX Leather Standard" },
  { re: /oeko[\s-]?tex/, value: "OEKO-TEX Standard 100" },
  { re: /bluesign/, value: "bluesign" },
  { re: /regenerative organic/, value: "Regenerative Organic Certified" },
  { re: /global recycled standard|\bgrs\b/, value: "GRS" },
  { re: /responsible wool standard|\brws\b/, value: "RWS" },
  { re: /responsible down standard|\brds\b/, value: "RDS" },
  { re: /fair[\s-]?trade/, value: "Fair Trade" },
  { re: /\bb[\s-]?corp(oration)?\b/, value: "B Corp" },
  { re: /cradle to cradle/, value: "Cradle to Cradle" },
  { re: /european flax|masters of linen/, value: "European Flax" },
  { re: /greenguard/, value: "GREENGUARD Gold" },
  { re: /eco[\s-]?institut/, value: "eco-INSTITUT" },
  { re: /global organic latex standard|\bgols\b/, value: "GOLS" },
  { re: /certified vegan/, value: "Certified Vegan" },
];

// Scan free-form copy (description + materials text) for certifications the
// brand explicitly names. Deterministic backstop for the extractor, which
// otherwise depends on the model remembering to fill the structured array even
// when the cert only appears in prose. Skips the bare OEKO-TEX fallback once a
// more specific OEKO-TEX variant has matched.
export function detectCertifications(text: string): string[] {
  const t = text.toLowerCase();
  const found: string[] = [];
  let oekoMatched = false;
  for (const sig of CERT_SIGNATURES) {
    const isOeko = sig.value.startsWith("OEKO-TEX");
    if (isOeko && oekoMatched && sig.value === "OEKO-TEX Standard 100") continue;
    if (sig.re.test(t)) {
      found.push(sig.value);
      if (isOeko) oekoMatched = true;
    }
  }
  return dedupeCertifications(found);
}

// Collapse a list of cert strings to one per underlying mark, preferring the
// first (most specific) spelling. Unresolved strings (e.g. a mark not yet in the
// field guide) are kept verbatim, deduped case-insensitively.
export function dedupeCertifications(certs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of certs) {
    if (!c) continue;
    const cert = findCertification(c);
    const key = cert ? `slug:${cert.slug}` : `raw:${norm(c)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
