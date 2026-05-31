// Editorial fabric-guide content for /guide. The hazard SCORE for each fiber is
// NOT stored here. It is derived at render time from the canonical, app-mirrored
// data (lib/fiber-scores.json via fiberScore) so the guide can never drift from
// the app or the shop. This file holds only the freshly-researched prose and
// sources. Voice: second person, no hedging, *italics* (asterisks) for emphasis,
// never em dashes. Sources are real and shown in fine print on each fiber page.

import { fiberScore, scoreToRiskLevel, hazardColor } from "./fabricScores";

export type FiberSource = { title: string; publisher: string; url: string };

export type FiberGuideEntry = {
  slug: string; // also the canonical score key in fiber-scores.json
  name: string;
  natural: boolean;
  whatItIs: string;
  healthStory: string;
  whatToLookFor: string;
  environment: string;
  /**
   * Value passed to /shop?fiber= when this fiber is something Toxome actually
   * curates. null means we do not stock it as a primary fiber, so the page
   * shows a "browse cleaner fibers" link instead of an empty filtered shop.
   */
  shopFilter: string | null;
  sources: FiberSource[];
};

export const FIBER_GUIDE: FiberGuideEntry[] = [
  // ---- Plant fibers (cleanest) ----
  {
    slug: "hemp",
    name: "Hemp",
    natural: true,
    whatItIs:
      "Hemp is a bast fiber from the stalk of the *Cannabis sativa* plant, and the cleanest versions are separated mechanically, meaning the fiber is physically combed out without the harsh solvents or chlorine bleaching that conventional textile processing relies on.",
    healthStory:
      "The fiber itself sits well against skin. It is breathable and does not trap the chemical residues that irritate sensitive skin. Your real exposure comes later, from what gets added: azo dyes, which can release *aromatic amines* (cancer-linked breakdown chemicals) and trigger contact dermatitis, and formaldehyde-based resins used for wrinkle resistance, a known carcinogen that causes rashes on direct skin contact. The fiber being natural does not protect you. The finish does the damage, so a cheaply dyed hemp piece can carry the same load as any conventional fabric.",
    whatToLookFor:
      "Look for OEKO-TEX STANDARD 100 certification, which caps formaldehyde at 75 ppm for direct-skin-contact garments and screens for restricted azo dyes, and favor mechanically processed, low-impact or natural-dyed hemp.",
    environment:
      "Hemp grows with little water and few pesticides and the undyed fiber biodegrades.",
    shopFilter: "hemp",
    sources: [
      { title: "What chemicals are in Textiles and the Health Implications", publisher: "Allergy Standards", url: "https://www.allergystandards.com/news_events/chemicals-in-textiles-and-the-health-implications/" },
      { title: "Is Formaldehyde in Clothing Dangerous?", publisher: "Kherkher Garcia", url: "https://www.kherkhergarcia.com/formaldehyde-in-clothing-dangerous/" },
      { title: "OEKO-TEX STANDARD 100 Factsheet", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/fileadmin/user_upload/Marketing_Materialien/STANDARD_100/Factsheet/STANDARD_100/OEKO-TEX_STANDARD_100_Factsheet_EN.pdf" },
    ],
  },
  {
    slug: "linen",
    name: "Linen",
    natural: true,
    whatItIs:
      "Linen is a bast fiber spun from the stalk of the flax plant, and the traditional retting and mechanical processing that separate the fiber introduce little in the way of residual chemistry.",
    healthStory:
      "Linen is one of the kindest fibers you can put against skin. It is highly breathable and moisture-wicking, pulling sweat away so you give bacteria less to feed on, which is why it reads as naturally antimicrobial and tends to suit sensitive and reactive skin. Cell-level *cytotoxicity* testing (whether a material kills or harms living cells) has found flax fiber non-toxic. The catch is marketing. Words like *wrinkle-free*, *easy-care*, and *anti-static* often signal a formaldehyde-based finish, a known carcinogen and skin irritant, layered onto a fiber that never needed it. You are paying for convenience with chemistry.",
    whatToLookFor:
      "Choose OEKO-TEX STANDARD 100 or GOTS-certified linen, skip the wrinkle-free and easy-care finishes, and treat European Flax sourcing as a quality signal rather than a health guarantee.",
    environment:
      "Flax needs minimal irrigation and pesticides, and undyed linen biodegrades.",
    shopFilter: "linen",
    sources: [
      { title: "Is Linen Fabric Toxic? The Science Behind This Natural Textile", publisher: "Dal The Label", url: "https://dalthelabel.com/blogs/fashion-101/is-linen-fabric-toxic-the-science-behind-this-natural-textile" },
      { title: "What Does Oeko-Tex Certified Mean?", publisher: "George Street Linen", url: "https://www.georgestreetlinen.com/global/journal/what-does-oeko-tex-certified-mean" },
      { title: "OEKO-TEX STANDARD 100 Factsheet", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/fileadmin/user_upload/Marketing_Materialien/STANDARD_100/Factsheet/STANDARD_100/OEKO-TEX_STANDARD_100_Factsheet_EN.pdf" },
    ],
  },
  {
    slug: "organic_cotton",
    name: "Organic Cotton",
    natural: true,
    whatItIs:
      "Organic cotton is the same seed-hair fiber as conventional cotton, grown without synthetic pesticides, and the difference that matters for your skin is the processing rules that follow it from field to finished garment.",
    healthStory:
      "Conventional cotton is not the innocent default you have been sold. Lab analysis of conventional cotton textiles has found pesticide residues including malathion, deltamethrin, and endosulfan, some of which survive repeated washing and sit against your skin. Conventional finishing also routinely adds formaldehyde, a known carcinogen linked to skin irritation and allergic reactions. The GOTS standard is the lever here: it bans formaldehyde, azo dyes, heavy-metal dyes, and flame retardants across the whole supply chain, not just the fiber. So *organic* on a hangtag without certification can still hide a conventionally dyed, resin-finished garment.",
    whatToLookFor:
      "Look for GOTS certification, which governs chemistry from fiber to finished piece, and use OEKO-TEX STANDARD 100 as a backstop confirming the final garment was screened for harmful residues.",
    environment:
      "Organic cotton avoids synthetic pesticides, though cotton remains a thirsty crop.",
    shopFilter: "organic cotton",
    sources: [
      { title: "Why GOTS-Certified Organic Cotton Bedding Matters", publisher: "The Honest Label", url: "https://thehonestlabel.com/blogs/honestlabel/tired-of-toxins-in-your-bedding-gots-certified-organic-cotton" },
      { title: "Is Cotton Toxic? Chemicals, Dyes, and Pesticides", publisher: "ScienceInsights", url: "https://scienceinsights.org/is-cotton-toxic-chemicals-dyes-and-pesticides/" },
      { title: "OEKO-TEX vs GOTS: Which Certification Keeps You Safe?", publisher: "Orbasics", url: "https://orbasics.com/blogs/stories/oeko-tex-vs-gots" },
    ],
  },
  {
    slug: "ramie",
    name: "Ramie",
    natural: true,
    whatItIs:
      "Ramie is a bast fiber from the stalk of a nettle-family plant, and turning it into fabric requires *degumming*, removing the natural pectins and resins that bind the fiber, traditionally done with concentrated caustic alkali and acid baths.",
    healthStory:
      "The fiber breathes well, dries fast, and resists bacteria and mildew, so its wearer profile is genuinely good. The honest issues are two. First, *prickle*: ramie is stiff and coarse, and its rigid surface hairs stimulate nerve endings just under your skin, a measured discomfort one study cut by nearly 44 percent only after multi-enzyme softening. Second, processing residue: harsh chemical degumming leaves alkali and acid that must be fully washed out, and impurities left on the fiber can irritate skin. Done right, the fiber rinses clean. Done cheaply, you feel it.",
    whatToLookFor:
      "Favor OEKO-TEX STANDARD 100 ramie and enzyme- or bio-degummed, softened fabric, and trust your hands: genuinely smooth ramie has been properly processed, while stiff and scratchy has not.",
    environment:
      "Ramie is high-yielding, but conventional chemical degumming produces heavily polluted, high-pH wastewater.",
    shopFilter: "ramie",
    sources: [
      { title: "Synergistic Multi-Enzyme Modification of Ramie Fabric", publisher: "Textiles (MDPI)", url: "https://doi.org/10.3390/textiles5040060" },
      { title: "An Effective Degumming Enzyme from Bacillus sp. Y1", publisher: "NCBI / PMC", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3613079/" },
      { title: "Define Ramie: Properties, Uses & Natural Fiber Guide", publisher: "Szoneier Fabrics", url: "https://szoneierfabrics.com/define-ramie/" },
    ],
  },

  // ---- Regenerated cellulosics ----
  {
    slug: "tencel_lyocell",
    name: "Tencel Lyocell",
    natural: false,
    whatItIs:
      "Tencel Lyocell is a regenerated cellulosic fiber, meaning wood pulp dissolved and re-spun into fiber, but it uses a non-toxic amine oxide solvent (NMMO) in a closed-loop system that recovers over 99 percent of the solvent for reuse, so it skips the *carbon disulfide* that defines older viscose.",
    healthStory:
      "This is about as clean as a man-made fiber gets next to your skin. The NMMO solvent is captured rather than emitted, and the finished fiber is washed so it carries virtually no residual processing chemicals. It is highly moisture-absorbent and wicks dampness off your skin, which keeps the surface drier and gives bacteria less to feed on, a real help if you run hot or have reactive skin. The smooth fiber surface tends to irritate less than rougher fibers. Your real risk is not the fiber but what gets added later: reactive dyes, anti-wrinkle or anti-shrink finishes that can leave residual formaldehyde, so the certification on the finished garment matters more than the fiber name.",
    whatToLookFor:
      "Look for the branded *TENCEL* Lyocell name, which guarantees Lenzing's closed-loop process, and an OEKO-TEX STANDARD 100 label confirming the finished, dyed garment was tested against formaldehyde, azo dyes, and other harmful substances.",
    environment:
      "The closed-loop solvent recovery and certified wood sourcing also make it far lower-impact than conventional viscose.",
    shopFilter: "tencel",
    sources: [
      { title: "Recovery of N-Methylmorpholine N-Oxide (NMMO) in Lyocell Fibre Manufacturing", publisher: "Fibers (MDPI)", url: "https://www.mdpi.com/2079-6439/13/1/3" },
      { title: "What are TENCEL Lyocell and Modal Fibers", publisher: "Lenzing / TENCEL", url: "https://www.tencel.com/fibers" },
      { title: "OEKO-TEX STANDARD 100", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100" },
    ],
  },
  {
    slug: "saxcell",
    name: "SaXcell",
    natural: false,
    whatItIs:
      "SaXcell is a regenerated cellulosic fiber made from chemically recycled cotton textile waste rather than virgin wood, with the pulp re-spun using *lyocell* wet spinning, the same non-toxic amine-oxide, closed-loop chemistry as Tencel rather than the carbon-disulfide viscose route.",
    healthStory:
      "Because it is spun by the lyocell method, SaXcell inherits lyocell's clean profile against your skin: a smooth, absorbent cellulose fiber with no residual carbon disulfide and water and process chemicals recycled in a closed loop. It breathes and handles moisture like other cellulosics, so it sits comfortably on reactive or overheated skin. One honest caveat for recycled-content fiber: the feedstock is post-consumer cotton that may have carried its own dyes and finishes, so the de-coloring and purification steps, and the dyes and finishes applied to the final cloth, are what determine whether the garment is genuinely low-residue. The fiber chemistry is reassuring; the finishing still needs verifying.",
    whatToLookFor:
      "Look for the *SaXcell* name to confirm closed-loop lyocell spinning of recycled cotton, and an OEKO-TEX STANDARD 100 label on the finished garment to confirm it was tested for harmful residues.",
    environment:
      "It uses roughly 10 liters of water per kilogram versus thousands for conventional cotton, and diverts textile waste from landfill.",
    shopFilter: "saxcell",
    sources: [
      { title: "SaXcell - Sustainable Lyocell Fibres from Textile Waste", publisher: "SaXcell", url: "https://saxcell.com/" },
      { title: "SaXcell: regenerated cellulose from domestic cotton waste", publisher: "Circle Economy Foundation Knowledge Hub", url: "https://knowledge-hub.circle-economy.com/wctd/article/9353" },
    ],
  },
  {
    slug: "ecovero",
    name: "LENZING ECOVERO",
    natural: false,
    whatItIs:
      "LENZING ECOVERO is a *branded viscose*, still made by the traditional viscose route that uses carbon disulfide, but manufactured under Lenzing's tighter controls with chemicals recovered rather than dumped, and it is the first viscose to earn the EU Ecolabel.",
    healthStory:
      "Be precise here, because the marketing blurs it: this is viscose, not lyocell, so the process does involve *carbon disulfide*, a solvent that is a documented hazard to factory workers when emissions are not controlled. The wearer-health point is different from the worker-health point. By the time the washed, finished fiber reaches your skin it carries essentially no carbon disulfide, and ECOVERO is certified to OEKO-TEX STANDARD 100 and is highly breathable and absorbent, so it feels soft and cool against skin. What you are paying for is controlled, lower-emission, traceable production and verified low residual chemistry, versus anonymous viscose where neither the worker exposure nor the finishing residues are accountable.",
    whatToLookFor:
      "Look for the branded *LENZING ECOVERO* name plus EU Ecolabel and OEKO-TEX STANDARD 100; generic unbranded viscose or rayon gives you no assurance about how it was made or what residues remain.",
    environment:
      "It uses at least 50 percent less water and generates about half the carbon emissions of generic viscose.",
    shopFilter: null,
    sources: [
      { title: "LENZING ECOVERO Viscose", publisher: "Lenzing", url: "https://www.lenzing.com/products/textile-fibers/lenzingtm-ecoverotm/" },
      { title: "The Ongoing History of Harm Caused by the Viscose Rayon Industry", publisher: "PMC (peer-reviewed)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6137800/" },
      { title: "OEKO-TEX STANDARD 100", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100" },
    ],
  },
  {
    slug: "modal",
    name: "Modal",
    natural: false,
    whatItIs:
      "Modal is a second-generation regenerated cellulosic, usually spun from beech wood by a *modified viscose process* that, like all viscose, still relies on carbon disulfide, though branded TENCEL Modal recovers 99 percent or more of its solvents and water in a closed loop.",
    healthStory:
      "Modal feels silky and is prized for softness against skin, with strong moisture absorption and breathability that help it stay comfortable in heat. The health distinction is entirely about *who made it*. Generic modal runs the carbon-disulfide viscose process, a known worker hazard, and gives you no guarantee about residual solvents or the dyes and easy-care finishes applied afterward, some of which can release formaldehyde. Branded TENCEL Modal recovers its chemicals in a closed loop, audits its beech sourcing, and certifies the finished fiber as safe for skin contact. The fiber against your skin is comfortable either way; the certainty about residues and finishes is what separates the two.",
    whatToLookFor:
      "Look for the branded *TENCEL Modal* name to confirm closed-loop production and skin-safety certification, plus OEKO-TEX STANDARD 100 on the finished garment; treat unbranded modal as ordinary viscose.",
    environment:
      "TENCEL Modal generates roughly 50 percent lower carbon emissions than conventional modal and uses audited, regrowing beech sourcing.",
    shopFilter: "modal",
    sources: [
      { title: "What are TENCEL Lyocell and Modal Fibers", publisher: "Lenzing / TENCEL", url: "https://www.tencel.com/fibers" },
      { title: "A review of health effects of carbon disulfide in the viscose industry", publisher: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/11210016/" },
      { title: "OEKO-TEX STANDARD 100", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100" },
    ],
  },
  {
    slug: "cupro",
    name: "Cupro",
    natural: false,
    whatItIs:
      "Cupro, also sold as Bemberg, is a regenerated cellulosic made from cotton linter waste dissolved in *Schweizer's reagent*, a copper-and-ammonia solution, then re-spun and regenerated in acid baths that strip out the copper and ammonia.",
    healthStory:
      "On the body, cupro is genuinely kind. Its fibers have an almost perfectly round cross-section, so it sits smoothly and tends to irritate less, and it is often described as hypoallergenic. It is highly breathable, more so than silk, cotton, acetate, nylon, or polyester, and its crystalline structure pulls moisture off your skin and releases it, holding a lot of dampness before it ever feels wet. The processing concern is upstream, not on your skin: the copper-ammonia method requires careful capture of copper and ammonia, which is a manufacturing and discharge issue rather than something that lingers in a washed, finished garment. As always, the dyes and finishes on the final cloth are the residue question, so finished-garment certification still matters.",
    whatToLookFor:
      "Look for *Bemberg* (made by Asahi Kasei) as the established, controlled-process cupro, and an OEKO-TEX STANDARD 100 label confirming the finished fabric was tested for harmful substances.",
    environment:
      "It is made from cotton-processing waste, though the copper-ammonia chemistry demands strict effluent control at the mill.",
    shopFilter: null,
    sources: [
      { title: "Cuprammonium rayon", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Cuprammonium_rayon" },
      { title: "What is Bemberg? And Why It's The Best Lining Fabric", publisher: "The Modest Man", url: "https://www.themodestman.com/what-is-bemberg/" },
    ],
  },
  {
    slug: "acetate",
    name: "Acetate",
    natural: false,
    whatItIs:
      "Acetate is a chemically modified cellulosic: wood pulp is reacted with *acetic acid and acetic anhydride* to form cellulose acetate, dissolved in acetone, then spun as the acetone evaporates, so unlike viscose it skips carbon disulfide but it is more chemically altered than lyocell.",
    healthStory:
      "Acetate is smooth and silk-like and is generally considered skin-friendly, but the acetylation makes it more *hydrophobic*, meaning water-repelling, than other cellulosics. Standard acetate absorbs moisture poorly and does not wick sweat off your skin well, so it can feel clammy in heat or humidity, the opposite of how breathable lyocell or cupro behave. Newer branded acetate, Eastman's Naia, is engineered to wick moisture, dry fast, and breathe without applied finishes, and is marketed as hypoallergenic, so the wearer experience depends heavily on which acetate you have. Either way the fiber itself carries no carbon disulfide; your residue questions are again the dyes and any finishes on the finished garment.",
    whatToLookFor:
      "Prefer branded *Naia* by Eastman for genuine moisture management and finish-free comfort, and look for OEKO-TEX STANDARD 100 on the finished garment; with plain acetate, expect lower breathability.",
    environment:
      "It is made from wood-pulp cellulose, and branded versions such as Naia use responsibly sourced and traceable pulp.",
    shopFilter: null,
    sources: [
      { title: "Cellulose acetate", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Cellulose_acetate" },
      { title: "Naia: Not Your Run-Of-The-Mill Cellulose Acetate", publisher: "Textile World", url: "https://www.textileworld.com/textile-world/quality-fabric-of-the-month/2017/11/naia-not-your-run-of-the-mill-cellulose-acetate/" },
      { title: "Naia from Eastman | Cellulosic Yarn | Sustainable Fiber", publisher: "Eastman", url: "https://www.eastman.com/en/products/brands/naia" },
    ],
  },

  // ---- Animal fibers ----
  {
    slug: "silk",
    name: "Silk",
    natural: true,
    whatItIs:
      "Silk is a continuous protein filament reeled from the cocoon of the *Bombyx mori* silkworm, made of fibroin (the core fiber, roughly 75 to 80 percent) wrapped in sericin, a gummy coating. Most sericin is stripped off in a hot-water or enzyme step called *degumming*, which is where finishing chemicals and dyes also enter the picture.",
    healthStory:
      "Properly degummed silk is one of the most skin-friendly fibers you can wear. Its smooth filament structure and ability to manage moisture and temperature mean it breathes, wicks, and regulates heat against your skin, which lowers irritation and supports your skin barrier. The catch is residue: low-quality silk that keeps too much sericin can be read by your immune system as foreign and trigger histamine release and contact allergy, and the dyes and finishing agents layered on during manufacturing are a more common cause of allergic contact dermatitis than the fiber itself. If silk irritates you, suspect the *finish*, not the protein.",
    whatToLookFor:
      "Choose fully degummed silk and look for OEKO-TEX STANDARD 100 certification, which tests for 350-plus harmful substances including dye and finishing residues. Higher-grade silk with thorough degumming is the most hypoallergenic option.",
    environment:
      "Conventional sericulture is land-light but energy- and water-intensive, since cocoons are typically boiled to reel the filament.",
    shopFilter: "silk",
    sources: [
      { title: "Silk for Sensitive Skin: Hypoallergenic Properties & Evidence", publisher: "Selvane", url: "https://www.selvane.co/blogs/knowledge/silk-for-sensitive-skin-hypoallergenic-properties-evidence" },
      { title: "What Is Degummed Silk? Processing & What It's Used For", publisher: "Mayfairsilk", url: "https://mayfairsilk.com/blogs/general/what-is-degummed-silk-processing-what-its-used-for" },
      { title: "Safety Assessment of Silk Proteins as Used in Cosmetics", publisher: "Cosmetic Ingredient Review (CIR)", url: "http://www.cir-safety.org/sites/default/files/slkprt062015rep.pdf" },
    ],
  },
  {
    slug: "alpaca",
    name: "Alpaca",
    natural: true,
    whatItIs:
      "Alpaca fiber is shorn from the alpaca, a camelid raised mainly in the Andes, then scoured and, for finer grades, *dehaired* to pull out coarse guard hairs. It typically runs 18 to 27 microns, with premium grades reaching cashmere-fine 18 to 22 microns and some as low as 14.5.",
    healthStory:
      "Alpaca is often easier on reactive skin than sheep wool for two physical reasons. First, it contains *no lanolin*, the waxy grease that drives most genuine wool-grease sensitivities, so if lanolin is your trigger, alpaca sidesteps it. Second, its fiber surface is smoother and more cylindrical, with flatter scales than sheep wool, so it produces less mechanical *prickle* against your skin. It also absorbs less moisture than wool (around 11 percent versus wool's 30), which keeps the fiber drier against you. Remember that comfort still tracks with fineness: a coarse, poorly dehaired alpaca with guard hairs left in can still poke and itch regardless of the lanolin-free claim.",
    whatToLookFor:
      "Look for dehaired baby or royal alpaca around 18 to 22 microns for next-to-skin comfort, and OEKO-TEX STANDARD 100 certification to limit dye and processing residues.",
    environment:
      "Alpacas are padded-foot grazers that are gentler on Andean pasture than hooved livestock, and as camelids they produce less methane per head than sheep.",
    shopFilter: "alpaca",
    sources: [
      { title: "Is Alpaca Wool Hypoallergenic or Lanolin-Free?", publisher: "Yanantin Alpaca", url: "https://shop.yanantin-alpaca.com/blogs/qualities-of-alpaca-wool/is-alpaca-wool-hypoallergenic-lanolin-free" },
      { title: "Alpaca vs Wool: Which Is Better for Sensitive Skin?", publisher: "Suri Performance Alpaca Socks", url: "https://surisocks.com/blogs/news/alpaca-vs-wool-which-is-better-for-sensitive-skin" },
      { title: "Is Alpaca Wool Itchy? Why It's Softer Than Sheep's Wool", publisher: "Loom & Fiber", url: "https://loomandfiber.com/blog/is-alpaca-wool-itchy/" },
    ],
  },
  {
    slug: "cashmere",
    name: "Cashmere",
    natural: true,
    whatItIs:
      "Cashmere is the soft downy undercoat combed or shorn from cashmere goats, then *dehaired*, a critical mechanical step that separates the fine down (19 microns or less, top grades 14 to 15.5) from coarse guard hairs that run 50 to 100 microns. Only about 30 to 50 percent of the raw fiber survives dehairing as usable cashmere.",
    healthStory:
      "With cashmere, your comfort is decided almost entirely by *processing quality*, not the species. Fine cashmere down is well below the roughly 30-to-32-micron threshold at which fibers stiff enough to mechanically jab your skin's nerve endings cause *prickle*, the itch that most people mistake for an allergy. But it takes only a few overlooked guard hairs to make luxuriously soft cashmere scratch and irritate, the so-called prickle factor, and two cashmeres with identical average microns can feel completely different depending on how well those coarse hairs were removed. Cheap cashmere is usually cheap because it skipped thorough dehairing. As with all goat and sheep fibers, an itch reaction is a physical, non-immune *irritant contact dermatitis*, not a true allergy.",
    whatToLookFor:
      "Buy on fineness and dehairing quality, not just the word cashmere: look for fiber around 15 to 16 microns and OEKO-TEX STANDARD 100 certification for dye and finish safety.",
    environment:
      "Cashmere goats graze close and can degrade fragile grassland, and the very low yield per animal means each sweater represents many goats.",
    shopFilter: "cashmere",
    sources: [
      { title: "Dehairing and Cashmere Quality: A Guide", publisher: "Selvane", url: "https://www.selvane.co/blogs/knowledge/the-architecture-of-softness-dehairing-and-cashmere-quality" },
      { title: "What Good Cashmere Actually Is", publisher: "Wolf vs Goat", url: "https://www.wolfvsgoat.com/blogs/blog/what-good-cashmere-actually-is" },
      { title: "Facts About Cashmere - Quality, Care & Origins", publisher: "GOBI Cashmere", url: "https://us.gobicashmere.com/pages/facts-about-cashmere/" },
    ],
  },
  {
    slug: "merino_wool",
    name: "Merino Wool",
    natural: true,
    whatItIs:
      "Merino wool is shorn from merino sheep bred for exceptionally fine fleece (often 18 microns or finer), then scoured to strip grease and dirt. Much of it is also given a *superwash* finish: a chlorine bath that erodes the fiber scales followed by a Hercosett polymer resin coating, a treatment that introduces chlorinated residues.",
    healthStory:
      "Peer-reviewed dermatology directly debunks the myth that wool is a universal allergen. A 2017 review in *Acta Dermato-Venereologica* concluded that wool fiber is not a cutaneous allergen; the itch is non-immune *irritant contact dermatitis* caused by stiff fibers mechanically stimulating your skin's nerve endings. Because merino sits well under the roughly 30-to-32-micron prickle threshold, it is well tolerated and may even benefit eczema-prone skin. Two real concerns remain. First, the superwash chlorine-Hercosett process leaves a nylon-based resin film and chlorinated byproducts on the fiber that can bother sensitive skin. Second, residual lanolin is now extremely low in modern scoured wool (under 0.5 percent), usually below the level that triggers a reaction, so true lanolin sensitivity is rarer than blamed. Merino also breathes and thermoregulates well, wicking moisture to keep you dry.",
    whatToLookFor:
      "Choose fine merino around 17 to 18.5 microns, prefer untreated or non-superwash where possible, and look for OEKO-TEX STANDARD 100 plus Responsible Wool Standard (RWS) certification.",
    environment:
      "Merino welfare's biggest flag is *mulesing*, cutting skin from a lamb's hindquarters to prevent flystrike, often without pain relief; RWS-certified wool prohibits it.",
    shopFilter: "merino wool",
    sources: [
      { title: "Debunking the Myth of Wool Allergy", publisher: "Acta Dermato-Venereologica", url: "https://www.medicaljournals.se/acta/content/html/10.2340/00015555-2655" },
      { title: "Superwash wool - is it really that super?", publisher: "Bergstrand Insights", url: "https://insights.bergstrand.co/p/superwash-wool-is-it-really-that" },
      { title: "What Is the Responsible Wool Standard?", publisher: "Darn Tough", url: "https://darntough.com/blogs/the-alternate-stitch/exploring-responsible-wool-standard" },
    ],
  },
  {
    slug: "mohair",
    name: "Mohair",
    natural: true,
    whatItIs:
      "Mohair is shorn from the Angora goat and then scoured; it spans roughly 25 to 45 microns depending on the animal's age, with fine *kid mohair* (goats under one year) at about 20 to 24 microns and coarse adult fiber reaching 39 or more.",
    healthStory:
      "Mohair's reputation for being scratchy is mostly about *which* mohair and how it is spun, not an allergy. Its fiber scales lie flatter and smoother than sheep wool, so it creates less friction against your skin and less of the prickly sensation people associate with wool. But mohair's long staple and signature brushed *halo* leave many fiber ends sticking out, and once the fiber diameter climbs past the roughly 30-micron prickle threshold those ends mechanically poke your skin's nerve endings, producing irritant contact dermatitis rather than a true immune reaction. Kid mohair stays finer and silkier and is far less likely to irritate than coarse adult mohair. If a mohair piece feels pokey, that is fiber coarseness and construction, not your body rejecting the protein.",
    whatToLookFor:
      "Choose kid mohair around 20 to 24 microns for next-to-skin wear, favor smooth weaves over heavily brushed halos if you are sensitive, and look for OEKO-TEX STANDARD 100 certification.",
    environment:
      "Angora goats are pasture grazers and, like other ruminants, emit methane; overgrazing pressure is the main land concern.",
    shopFilter: null,
    sources: [
      { title: "The Touch of Mohair", publisher: "Churchmouse Yarns & Teas", url: "https://www.churchmouseyarns.com/blogs/journal/the-touch-of-mohair" },
      { title: "Is Mohair Itchy? Causes and Allergy Solutions", publisher: "Wyndly", url: "https://www.wyndly.com/blogs/learn/is-mohair-itchy" },
      { title: "Mohair", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mohair" },
    ],
  },
  {
    slug: "wool",
    name: "Wool",
    natural: true,
    whatItIs:
      "Generic wool is shorn from sheep, scoured to remove grease and dirt, and frequently given a *superwash* finish (a chlorine descaling bath plus a Hercosett polymer resin coat) and sometimes a *moth-proofing* insecticide treatment, both of which add chemicals to the fiber that touches your skin.",
    healthStory:
      "The belief that a wool allergy is universal is wrong. A 2017 *Acta Dermato-Venereologica* review found wool is not a true cutaneous allergen; the itch is non-immune *irritant contact dermatitis* from coarse fibers (roughly 30-to-32 microns and up) mechanically jabbing your skin's nerve endings. So broad-grade wool itches more than fine merino purely because of fiber diameter. The chemistry matters more than the protein: superwash leaves chlorinated residues and a nylon-based Hercosett resin film, and the superwash step generates toxic adsorbable organic halides (AOX). Many wools are also moth-proofed with the insecticide *permethrin*, which is locked inside the fiber and can be OEKO-TEX certified, though it remains a pesticide on a garment. Residual lanolin in modern scoured wool is very low (under 0.5 percent) and rarely the real culprit. Wool itself breathes and thermoregulates well.",
    whatToLookFor:
      "Prefer untreated, non-superwash, moth-proof-free wool, choose finer micron grades for comfort, and look for OEKO-TEX STANDARD 100 plus Responsible Wool Standard (RWS) certification.",
    environment:
      "Sheep are ruminants that emit methane and need grazing land; RWS certification also addresses welfare practices like mulesing.",
    shopFilter: "wool",
    sources: [
      { title: "Debunking the Myth of Wool Allergy", publisher: "Acta Dermato-Venereologica", url: "https://www.medicaljournals.se/acta/content/html/10.2340/00015555-2655" },
      { title: "Superwash - Woolpower", publisher: "Woolpower", url: "https://woolpower.se/en/our-supply-chain/superwash/" },
      { title: "OEKO-TEX STANDARD 100", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100" },
      { title: "Moth protection with the active substance permethrin", publisher: "Paulig", url: "https://www.paulig1750.com/media/19/f8/8f/1631545219/mottenschutz_pau_en_130921_brand.pdf" },
    ],
  },

  // ---- Conventional + carbon-disulfide cellulosics ----
  {
    slug: "viscose",
    name: "Viscose",
    natural: false,
    whatItIs:
      "Viscose is a semi-synthetic fiber made by chemically dissolving wood pulp cellulose in sodium hydroxide and carbon disulfide (CS2), then regenerating it into filament.",
    healthStory:
      "The heaviest health burden falls on factory workers, where carbon disulfide exposure is linked to peripheral neuropathy, ischemic heart disease, and excess mortality among spinners. For you as the wearer, the concern is residual processing chemicals: carbon disulfide byproducts and dye and finishing agents can remain in the fabric and trigger allergic contact dermatitis or skin irritation in sensitive people, and some viscose gets the same formaldehyde-based wrinkle finishes used on cotton. On the comfort side, viscose is plastic-free and breathable, letting air circulate against your skin better than petroleum synthetics.",
    whatToLookFor:
      "Favor closed-loop lyocell (such as TENCEL) as the cleaner regenerated-cellulose alternative, since it recovers its solvent and skips carbon disulfide, and look for OEKO-TEX STANDARD 100 on any viscose you buy. Wash new pieces before wearing.",
    environment:
      "Conventional viscose production releases hazardous air and water pollutants and is often tied to deforestation of ancient and endangered forests.",
    shopFilter: "viscose",
    sources: [
      { title: "HEALTH EFFECTS - Toxicological Profile for Carbon Disulfide", publisher: "NCBI Bookshelf (ATSDR)", url: "https://www.ncbi.nlm.nih.gov/books/NBK601225/" },
      { title: "Exposure to carbon disulphide and ischaemic heart disease in a viscose rayon factory", publisher: "PMC (Br J Ind Med)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1007812/" },
      { title: "Rayon Allergy: Identifying Symptoms and Effective Treatments", publisher: "Wyndly", url: "https://www.wyndly.com/blogs/learn/rayon-allergy" },
    ],
  },
  {
    slug: "rayon",
    name: "Rayon",
    natural: false,
    whatItIs:
      "Rayon is simply the generic name for regenerated cellulose fiber, and viscose is the most common type, so viscose and rayon describe the same material made by dissolving wood pulp in carbon disulfide.",
    healthStory:
      "Because rayon is viscose, it carries the same profile. The acute danger is to workers handling carbon disulfide, which causes nerve and cardiovascular damage at occupational doses. What reaches you is residue: the chemical substances used in production can remain in the fabric and provoke allergic reactions or contact dermatitis on skin contact, and formaldehyde-based finishing agents are sometimes added for wrinkle resistance, leaving residues that irritate sensitive skin. Rayon is breathable and absorbent, so it wears cool, but unbranded or uncertified pieces are the ones most likely to carry leftover finish.",
    whatToLookFor:
      "Treat rayon and viscose as identical when shopping, prefer closed-loop lyocell as the safer regenerated fiber, choose OEKO-TEX STANDARD 100 certified goods, and launder before first wear.",
    environment:
      "Standard rayon manufacturing emits toxic chemicals and contributes to deforestation pressure on endangered forests.",
    shopFilter: "rayon",
    sources: [
      { title: "FTC Warns 78 Retailers to Stop Advertising Rayon as Bamboo", publisher: "U.S. Federal Trade Commission", url: "https://www.ftc.gov/news-events/news/press-releases/2010/02/ftc-warns-78-retailers-including-wal-mart-target-kmart-stop-labeling-advertising-rayon-textile" },
      { title: "Cardiovascular effects in viscose rayon workers exposed to carbon disulfide", publisher: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/11210016/" },
      { title: "Is Viscose Safe? A Look at the Health Tradeoffs", publisher: "Greener Closet", url: "https://greenercloset.com/blog/is-viscose-eco-friendly" },
    ],
  },
  {
    slug: "bamboo",
    name: "Bamboo",
    natural: false,
    whatItIs:
      "Bamboo sold as soft clothing is almost never natural bamboo fiber; it is bamboo *viscose*, meaning bamboo pulp chemically dissolved in carbon disulfide and regenerated into rayon, the exact same process and chemistry as ordinary viscose.",
    healthStory:
      "Do not let the *eco* and *natural* marketing fool you. The FTC has fined retailers including Kohl's and Walmart, and warned dozens more, for labeling rayon as bamboo and claiming false environmental benefits, because the rayon process uses toxic chemicals and emits hazardous pollutants. By law it must be called *rayon (or viscose) made from bamboo*. For your health the story is identical to viscose: carbon disulfide is the worker hazard, and residual processing chemicals, dyes, and any formaldehyde finishes can leave residue that irritates skin or triggers contact dermatitis. The plant itself adds no special skin benefit once it is dissolved into rayon.",
    whatToLookFor:
      "Be skeptical of any *bamboo* claim and read the fiber content; if it says rayon or viscose, treat it as viscose, and choose closed-loop bamboo lyocell or OEKO-TEX STANDARD 100 certified fabric instead.",
    environment:
      "Bamboo grows fast with little input, but converting it to viscose chemically erases most of that environmental advantage.",
    shopFilter: null,
    sources: [
      { title: "Bamboo Textiles", publisher: "U.S. Federal Trade Commission", url: "https://www.ftc.gov/bamboo-textiles" },
      { title: "FTC doles out $1.3M in fines to retailers over bamboo rayon", publisher: "Retail Dive", url: "https://www.retaildive.com/news/ftc-doles-out-13m-in-fines-to-retailers-over-bamboo-rayon/410677/" },
      { title: "TENCEL Lyocell and Modal Fibers", publisher: "Lenzing TENCEL", url: "https://www.tencel.com/fibers" },
    ],
  },
  {
    slug: "cotton",
    name: "Cotton",
    natural: true,
    whatItIs:
      "Cotton is a natural plant fiber harvested from the cotton boll, but conventional cotton is one of the most pesticide-intensive crops grown, treated with glyphosate, organophosphates, and other agrochemicals in the field.",
    healthStory:
      "Most field pesticide residue degrades or washes out during processing, so it is the finishing chemistry on the finished garment you wear that matters most. Conventional cotton labeled *wrinkle-free*, *easy care*, or *no-iron* is frequently treated with formaldehyde-based durable-press resins, a recognized human carcinogen that off-gasses and is linked to contact dermatitis and skin irritation. Reactive and azo dyes can also leave residue that touches your skin all day. The upside: untreated cotton is genuinely breathable and lets air move against your skin, which is why it stays comfortable in heat.",
    whatToLookFor:
      "Choose GOTS-certified organic cotton, which bans formaldehyde, chlorine bleach, and carcinogenic azo dyes across the entire supply chain, or look for OEKO-TEX STANDARD 100, and always wash new cotton before the first wear to flush loose finish and dye.",
    environment:
      "Conventional cotton is water- and pesticide-heavy in cultivation, while organic systems sharply cut chemical inputs.",
    shopFilter: "cotton",
    sources: [
      { title: "FTC Seeks Largest-Ever Civil Penalty for Bogus Bamboo Marketing", publisher: "U.S. Federal Trade Commission", url: "https://www.ftc.gov/news-events/news/press-releases/2022/04/ftc-uses-penalty-offense-authority-seek-largest-ever-civil-penalty-bogus-bamboo-marketing-kohls" },
      { title: "What Is GOTS Certified Organic Cotton", publisher: "Q for Quinn", url: "https://www.qforquinn.com/blogs/news/what-is-gots-certified-organic-cotton-anyway-and-why-buy-into-it" },
      { title: "PUREPRESS: wrinkle-free and formaldehyde-free durable press", publisher: "Cotton Incorporated", url: "https://www.cottoninc.com/press-releases/smoothing-out-formaldehyde-wrinkle/" },
    ],
  },

  // ---- Synthetics + high-hazard ----
  {
    slug: "spandex",
    name: "Spandex",
    natural: false,
    whatItIs:
      "Spandex is a synthetic polyurethane-based elastic fiber spun from segmented polymer chains, built using reactive diisocyanates like TDI and MDI. The finished fiber is a stable polymer, but those diisocyanates are genuine skin and respiratory sensitizers in their unreacted state, and trace processing residues, dye chemicals, and softeners can remain in the yarn.",
    healthStory:
      "You almost never wear spandex alone; it is blended into leggings, sports bras, and shapewear that sit against your most absorbent skin while you sweat. That matters because spandex blends are where independent testing has repeatedly flagged *bisphenol A* (BPA), a known endocrine disruptor, with one watchdog study finding BPA in polyester-spandex athletic wear at up to 40 times California's safe limit. The same stretch garments are also where durable water-repellent *PFAS* finishes and residual manufacturing surfactants like *nonylphenol ethoxylates* show up, and the tight, occlusive fit traps heat and moisture against the skin, which increases both irritation and chemical migration. Spandex is not the worst offender on its own, but it is the fiber that keeps high-hazard chemistry pressed to your body.",
    whatToLookFor:
      "Choose OEKO-TEX STANDARD 100 certified stretch wear, which bans intentional PFAS and limits BPA and phthalates, and keep spandex to the smallest practical percentage by favoring natural-fiber pieces with only a few percent stretch rather than full synthetic blends.",
    environment:
      "Spandex is fossil-fuel derived, does not biodegrade, and makes blended garments nearly impossible to recycle.",
    shopFilter: null,
    sources: [
      { title: "Immune sensitization to MDI resulting from skin exposure", publisher: "NCBI / PMC", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3068988/" },
      { title: "Is Recycled Polyester Safe? BPA & Antimony Risks", publisher: "Estroni", url: "https://estroni.com.au/pages/is-recycled-polyester-safe-the-hidden-bpa-antimony-risk-in-eco-activewear" },
      { title: "OEKO-TEX General Ban on PFAS", publisher: "Hohenstein / OEKO-TEX", url: "https://www.hohenstein.us/en-us/oeko-tex/restrictions-and-testing/pfas" },
    ],
  },
  {
    slug: "elastane",
    name: "Elastane",
    natural: false,
    whatItIs:
      "Elastane is the same fiber as spandex; the names are interchangeable, and Lycra is simply a brand of it. It is a polyurethane-based elastic yarn made by reacting diisocyanates (TDI, MDI) with polyols, so the wearer-health questions come from residual processing chemicals and from what gets blended and finished onto it, not from the inert polymer itself.",
    healthStory:
      "Because elastane gives garments their stretch, it lives in exactly the clothes you wear closest and sweat into: leggings, swimwear, underwear, and base layers. Studies of artificial-sweat leaching and consumer testing on polyester-elastane activewear have found *bisphenol A* and *antimony* migrating into the moisture against your skin, and durable water-repellent *PFAS* finishes are linked to hormonal, reproductive, and immune harm. The fiber's defining trait, a tight occlusive fit, traps heat and sweat, which both irritates skin and accelerates how much of that chemistry transfers onto and into you. The polymer is largely inert, but the company it keeps on your body is not.",
    whatToLookFor:
      "Look for OEKO-TEX STANDARD 100 certification to screen out PFAS, phthalates, and excess heavy metals, and prefer pieces that use elastane only as a small stretch percentage in an otherwise natural fabric rather than head-to-toe synthetic blends.",
    environment:
      "Elastane is petroleum-based, non-biodegradable, and contaminates the recyclability of any natural fiber it is blended into.",
    shopFilter: null,
    sources: [
      { title: "Is Recycled Polyester Safe? BPA & Antimony Risks", publisher: "Estroni", url: "https://estroni.com.au/pages/is-recycled-polyester-safe-the-hidden-bpa-antimony-risk-in-eco-activewear" },
      { title: "OEKO-TEX General Ban on PFAS", publisher: "Hohenstein / OEKO-TEX", url: "https://www.hohenstein.us/en-us/oeko-tex/restrictions-and-testing/pfas" },
      { title: "Immune sensitization to MDI resulting from skin exposure", publisher: "NCBI / PMC", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3068988/" },
    ],
  },
  {
    slug: "leather",
    name: "Leather",
    natural: true,
    whatItIs:
      "Most commercial leather is animal hide preserved by chrome tanning, which uses chromium(III) salts; under heat, light, or aging that chromium can oxidize into *chromium(VI)*, the hexavalent form. Chromium VI is a potent skin sensitizer, which is why it sits at the center of leather's wearer-health story.",
    healthStory:
      "Chromium VI causes severe *allergic contact dermatitis* and can trigger it at very low concentrations, and chromium is the third most common metal allergy after nickel and cobalt, affecting roughly 1 to 3 percent of adults with a poor long-term prognosis. The hazard is real enough that the EU restricted chromium VI to under 3 mg/kg in skin-contact leather under REACH, a limit estimated to prevent about 80 percent of new chromium-related dermatitis cases. Studies have documented chromium VI releasing into artificial sweat from shoes in a real case of leather-induced dermatitis, so warm, sweaty contact, shoes, watch straps, waistbands, is where your exposure is highest.",
    whatToLookFor:
      "Choose *vegetable-tanned* leather, which uses plant tannins instead of chromium salts, or look for OEKO-TEX Leather Standard or Leather Working Group certification, both of which test and cap chromium VI and other harmful residues.",
    environment:
      "Chrome tanning generates chromium-laden wastewater, while vegetable tanning cuts that toxic effluent by up to roughly 80 percent.",
    shopFilter: null,
    sources: [
      { title: "High release of hexavalent chromium into artificial sweat from leather shoes", publisher: "Contact Dermatitis (Wiley)", url: "https://onlinelibrary.wiley.com/doi/10.1111/cod.13425" },
      { title: "Annex XV restriction report: chromium VI in leather articles", publisher: "ECHA", url: "https://echa.europa.eu/documents/10162/17233/restriction_report_cr_vi_en.pdf" },
      { title: "OEKO-TEX Leather Standard", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-leather-standard/" },
    ],
  },
  {
    slug: "nylon",
    name: "Nylon",
    natural: false,
    whatItIs:
      "Nylon is a synthetic polyamide made by polymerizing petroleum-derived monomers; in Nylon 6 the building block is *caprolactam*, and not every unit fully links during polymerization, so residual caprolactam monomer can remain in and migrate out of the fiber. Manufacturing and finishing chemicals, not the polymer backbone, drive most of its wearer-health concerns.",
    healthStory:
      "Nylon is dyed almost exclusively with *disperse dyes*, the leading cause of textile allergic contact dermatitis; these dyes do not bond to the fiber, so their small lipophilic molecules migrate onto your skin, with Disperse Blue and Disperse Orange dyes showing positive patch tests in roughly 5 to 7 percent of chronic-eczema patients, worse where clothing rubs and you sweat. Nylon is also one of the heaviest *microplastic* shedders of any fabric, releasing hundreds of thousands of fibers in a single wash and shedding directly onto your skin and into the air you breathe as you move. Those microfibers can carry dyes, plasticizers, and finishing additives that leach out on contact.",
    whatToLookFor:
      "Look for OEKO-TEX STANDARD 100 certification, which limits disperse-dye allergens and residual monomers, and prefer undyed or light-colored, tightly woven nylon over deeply dyed stretch pieces worn against the skin.",
    environment:
      "Nylon is fossil-derived, non-biodegradable, and a major source of microplastic fiber pollution in water and air.",
    shopFilter: null,
    sources: [
      { title: "Contact allergy from disperse dyes in textiles - a review", publisher: "Contact Dermatitis (Wiley)", url: "https://onlinelibrary.wiley.com/doi/10.1111/cod.12001" },
      { title: "Relationship between Textile Microplastics Shedding and Fabric Structure", publisher: "NCBI / PMC", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9740661/" },
      { title: "Textile contact dermatitis", publisher: "DermNet NZ", url: "https://dermnetnz.org/topics/textile-contact-dermatitis" },
    ],
  },
  {
    slug: "polyester",
    name: "Polyester",
    natural: false,
    whatItIs:
      "Polyester is PET plastic spun into fiber, and roughly 80 to 85 percent of virgin PET is made using *antimony trioxide* as a polymerization catalyst, leaving antimony residues of about 125 to 470 micrograms per gram in the finished fabric. It is then colored with disperse dyes that sit on, rather than bond to, the fiber.",
    healthStory:
      "When polyester contacts your sweat, a fraction of that *antimony* mobilizes into the moisture against your skin; antimony trioxide is classified by IARC as a *possible human carcinogen*, and exposure rises in tight, warm activewear. Polyester is also the workhorse of *disperse-dye* allergy, the most common cause of textile contact dermatitis, with the dye migrating onto skin worst where you sweat and rub. On top of that, polyester sheds *microplastics* onto your skin and into household air, and consumer testing has flagged *bisphenol A* (an endocrine disruptor) in polyester athletic wear at many times the safe limit. The dose from any one garment is small, but you wear it constantly and sweat into it.",
    whatToLookFor:
      "Choose OEKO-TEX STANDARD 100 certified polyester to cap antimony, BPA, formaldehyde, and disperse-dye allergens, and do not be reassured by *recycled* polyester, which is still plastic, still sheds microplastics, often more than virgin, and can carry higher BPA.",
    environment:
      "Polyester is fossil-fuel based, effectively non-biodegradable, and a primary driver of microplastic pollution.",
    shopFilter: null,
    sources: [
      { title: "Antimony release from polyester textiles by artificial sweat solutions", publisher: "Regulatory Toxicology and Pharmacology", url: "https://www.sciencedirect.com/science/article/pii/S0273230020302506" },
      { title: "Contact allergy from disperse dyes in textiles - a review", publisher: "Contact Dermatitis (Wiley)", url: "https://onlinelibrary.wiley.com/doi/10.1111/cod.12001" },
      { title: "Recycled polyester microplastic emissions and BPA", publisher: "Estroni", url: "https://estroni.com.au/pages/is-recycled-polyester-safe-the-hidden-bpa-antimony-risk-in-eco-activewear" },
    ],
  },
  {
    slug: "acrylic",
    name: "Acrylic",
    natural: false,
    whatItIs:
      "Acrylic is a synthetic fiber polymerized mostly from *acrylonitrile*, a petroleum-derived monomer; polymerization is never perfectly complete, so trace residual acrylonitrile remains in the fiber, historically estimated at under 1 part per million in acrylic and modacrylic.",
    healthStory:
      "The residual monomer is the concern: *acrylonitrile* is classified by IARC as Group 1, *carcinogenic to humans*, and the EPA treats it as a probable human carcinogen, with textile-plant workers showing raised lung and colon cancer risk after long exposure. Acrylonitrile can be absorbed through the skin, so warm, sweaty contact with a soft acrylic sweater or fleece is a real, if low-level, exposure route over time. Acrylic also sheds *microplastics* heavily, putting plastic fibers onto your skin and into the air at home, and like other synthetics it carries disperse dyes and finishing chemistry that can irritate sensitive skin.",
    whatToLookFor:
      "Look for OEKO-TEX STANDARD 100 certification, which sets strict limits on residual acrylonitrile and other monomers, and favor natural insulating fibers like wool or cotton for next-to-skin knitwear where possible.",
    environment:
      "Acrylic is fossil-derived, does not biodegrade, and is one of the worst microplastic-shedding fibers in the wash.",
    shopFilter: null,
    sources: [
      { title: "Acrylonitrile, 15th Report on Carcinogens", publisher: "NCBI Bookshelf (NTP)", url: "https://www.ncbi.nlm.nih.gov/books/NBK590811/" },
      { title: "Volume 136: Talc and acrylonitrile (Group 1 classification)", publisher: "IARC Monographs (WHO)", url: "https://monographs.iarc.who.int/news-events/volume-136-talc-and-acrylonitrile/" },
      { title: "Acrylonitrile Hazard Summary", publisher: "US EPA", url: "https://www.epa.gov/sites/default/files/2016-09/documents/acrylonitrile.pdf" },
    ],
  },
  {
    slug: "polyurethane",
    name: "Polyurethane",
    natural: false,
    whatItIs:
      "Polyurethane is a plastic coating or film, the material behind most so-called *vegan leather*, typically made by dissolving PU resin in the heavy solvent *DMF* (dimethylformamide) and softening it with plasticizers. DMF is a known liver toxin and reproductive hazard listed as a Substance of Very High Concern in Europe, and it can leave residual contamination on the finished product.",
    healthStory:
      "Here is the honest part the marketing skips: *vegan leather* is almost always polyurethane or PVC plastic, not a clean natural alternative, and it is the high-hazard end of the spectrum. The plasticizers that keep PU and PVC supple are commonly endocrine-disrupting *phthalates* that can be absorbed through the skin, and some phthalate plasticizers have been restricted over carcinogenicity and links to breast cancer. PVC versions add chlorine chemistry and dioxin concerns, and residual *DMF* solvent can linger in cheaper PU. Worn against warm, sweaty skin, a watchband, jacket, or bag lining, these are exactly the conditions that promote plasticizer migration.",
    whatToLookFor:
      "If you want a leather alternative, look for water-based PU (it eliminates the DMF solvent) and OEKO-TEX certification that caps phthalates and DMF, and treat any unlabeled *vegan leather* as plastic until proven otherwise.",
    environment:
      "Polyurethane and PVC are fossil-based plastics that do not biodegrade and shed plastic particles as they wear and flake.",
    shopFilter: null,
    sources: [
      { title: "Is Polyurethane Toxic?", publisher: "The Filtery", url: "https://thefiltery.com/is-polyurethane-toxic/" },
      { title: "PVC vs. PU Leather Sustainability: A Chemical Audit", publisher: "Hoplok Leather", url: "https://hoplokleather.com/pvc-vs-pu-leather-sustainability-guide/" },
      { title: "Material on Trial: PU Leather, aka 'The Vegan Leather'", publisher: "Vegan Fashion Repository", url: "https://veganfashionrepository.com/2025/03/05/material-on-trial-pu-leather-aka-the-vegan-leather/" },
    ],
  },
];

// ---- Derived helpers (scores come from the locked canonical data) ----

export type FiberBand = "low" | "moderate" | "high";

// Fiber families. "natural" = plant or animal fiber used close to its raw form
// (cotton, wool, silk, leather). "semi-synthetic" = regenerated from a natural
// polymer (usually wood/cotton cellulose) through heavy chemical processing
// (viscose, rayon, bamboo, modal, lyocell, cupro, acetate). "synthetic" = a
// fully petrochemical polymer spun from fossil feedstock (polyester, nylon,
// acrylic, spandex, elastane, polyurethane).
export type FiberKind = "natural" | "semi-synthetic" | "synthetic";

const SEMI_SYNTHETIC = new Set([
  "tencel_lyocell",
  "saxcell",
  "ecovero",
  "modal",
  "cupro",
  "acetate",
  "viscose",
  "rayon",
  "bamboo",
]);
const SYNTHETIC = new Set([
  "spandex",
  "elastane",
  "nylon",
  "polyester",
  "acrylic",
  "polyurethane",
]);

export function fiberKind(slug: string): FiberKind {
  if (SYNTHETIC.has(slug)) return "synthetic";
  if (SEMI_SYNTHETIC.has(slug)) return "semi-synthetic";
  return "natural";
}

export const KIND_LABEL: Record<FiberKind, string> = {
  natural: "Natural",
  "semi-synthetic": "Semi-synthetic",
  synthetic: "Synthetic",
};

export type GuideFiber = FiberGuideEntry & {
  score: number;
  band: FiberBand;
  color: string;
  kind: FiberKind;
};

/** Attach the canonical score, risk band, and hazard color to an entry. */
export function withScore(entry: FiberGuideEntry): GuideFiber {
  const score = fiberScore(entry.slug);
  return {
    ...entry,
    score,
    band: (scoreToRiskLevel(score) ?? "moderate") as FiberBand,
    color: hazardColor(score),
    kind: fiberKind(entry.slug),
  };
}

export function getFiber(slug: string): GuideFiber | null {
  const entry = FIBER_GUIDE.find((f) => f.slug === slug);
  return entry ? withScore(entry) : null;
}

export const BAND_META: Record<
  FiberBand,
  { label: string; blurb: string; rangeLabel: string }
> = {
  low: {
    label: "Safest choices",
    blurb:
      "Natural and clean regenerated fibers that sit well against skin. The fiber is rarely the problem here. The dyes and finishes are, so certification still matters.",
    rangeLabel: "0 to 36",
  },
  moderate: {
    label: "Wear with care",
    blurb:
      "Synthetic stretch fibers you almost never wear alone. They are not the worst offenders, but they keep high-hazard chemistry pressed against your skin while you sweat.",
    rangeLabel: "37 to 60",
  },
  high: {
    label: "Worth avoiding",
    blurb:
      "Plastics and chrome-tanned hide at the high-concern end. Residual monomers, endocrine disruptors, disperse-dye allergens, and microplastics define this group.",
    rangeLabel: "61 to 100",
  },
};

const BAND_ORDER: FiberBand[] = ["low", "moderate", "high"];

/** All fibers grouped by band, each band sorted by score ascending. */
export function fibersByBand(): { band: FiberBand; fibers: GuideFiber[] }[] {
  const all = FIBER_GUIDE.map(withScore);
  return BAND_ORDER.map((band) => ({
    band,
    fibers: all
      .filter((f) => f.band === band)
      .sort((a, b) => a.score - b.score),
  }));
}

export function allFiberSlugs(): string[] {
  return FIBER_GUIDE.map((f) => f.slug);
}
