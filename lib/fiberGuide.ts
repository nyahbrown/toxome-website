// Editorial fabric-guide content for /guide. The hazard SCORE for each fiber is
// NOT stored here. It is derived at render time from the canonical, app-mirrored
// data (lib/fiber-scores.json via fiberScore) so the guide can never drift from
// the app or the shop. This file holds only the plain-language prose and the
// real sources. Voice: second person, no hedging, short sentences a smart
// 12-year-old can follow, *italics* (asterisks) for emphasis, never em dashes.
// Sources are real and shown in fine print on each fiber page.

import { fiberScore, scoreToRiskLevel, hazardColor } from "./fabricScores";
import { FIBER_RICH } from "./fiberGuideRich";

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

  // ---- Optional rich fields (LINEN flagship). Every consumer must treat these
  // as optional: a section renders only when its field is present, so the other
  // fibers keep a valid (lighter) page from the required fields above. ----
  /** Sentence-form name for inline headings. Defaults to name.toLowerCase();
   *  set for branded/trademarked names that should keep their form. */
  sentenceName?: string;
  /** Eyebrow for the made section (default "How it's made"). */
  madeEyebrow?: string;
  /** H2 for the made section (default `How {name} is made`). */
  madeTitle?: string;
  /** Hero one-liner under the fiber name. */
  dek?: string;
  /** Overrides whatItIs for the About section when present. */
  about?: string;
  /** The "a brief history" aside body. */
  history?: string;
  /** Paragraphs for "how it's cultivated & made". */
  madeStory?: string[];
  /** Image shown inside the made section. */
  madeImage?: { src: string; alt: string; caption?: string };
  /** The grades section: prose intro + provenance chips. */
  grades?: { intro: string; marks: string[] };
  /** Paragraphs for the health section lead (overrides healthStory when present). */
  healthImpacts?: string[];
  /** The "what it does for your skin" list. */
  benefits?: { title: string; body: string }[];
  /** Certification slugs to show as linked badges (must match CERTIFICATIONS
   *  in lib/certifications.ts). Rendered above the plain lookFor chips and
   *  linked to /guide/certifications#<slug>. */
  certs?: string[];
  /** Non-certification chips for what to look for (provenance, process, etc.).
   *  Falls back to whatToLookFor prose when neither certs nor lookFor exist. */
  lookFor?: string[];
  /** Chips for what to avoid. */
  avoid?: string[];
  /** The "how we scored it" aside body. */
  scoredNote?: string;
  /** The wash/dry/iron/store list. */
  care?: { k: string; v: string }[];
  /** Visible FAQ (else fall back to the auto-generated Q&As in the page). */
  faq?: { q: string; a: string }[];
  /** Hero image path (else default to /fibers/guide/${slug}.jpg). */
  heroImage?: string;

  // ---- Stats + ethics (fiber-guide expansion) ----
  /**
   * The one striking, hand-picked number for this fiber, shown as an animated
   * count-up. Editorial, not formulaic: lead with whatever is most compelling
   * (hemp -> its environmental superpower, polyester -> "60% of clothing is
   * now plastic", silk -> "30,000 years worn"). `value` is the number that
   * ticks up; `display` overrides the rendered figure when it is not a clean
   * number (e.g. "60%+", "#2"). `sub` is the caption line beneath it.
   */
  heroStat?: {
    value: number;
    display?: string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    unit?: string;
    label: string;
    sub?: string;
  };
  /**
   * The standardized comparable tiles shown in the Environmental impact
   * section. The same four metrics appear on every fiber so linen and
   * polyester line up: water, carbon, biodegradable, sheds microplastics.
   * Numeric `value`s tick up; string `value`s ("Yes", "No", "Near-neutral")
   * render as-is. `compare` holds the fixed villain baseline for this fiber
   * (conventional cotton for plants, virgin polyester for synthetics).
   */
  enviroStats?: {
    label: string;
    value: number | string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    unit?: string;
    compare?: string;
    note?: string;
  }[];
  /** Lead sentence(s) for the Environmental impact section prose. */
  enviroStory?: string[];
  /**
   * Ethics + fair-labor block. Only present on fibers with a real story
   * (cotton forced labor, viscose worker harm, leather tanneries, mulesing).
   * Absent = the section does not render, by design.
   */
  ethics?: {
    title?: string;
    body: string[];
    flags?: string[];
  };
};

export const FIBER_GUIDE: FiberGuideEntry[] = [
  // ---- Plant fibers (cleanest) ----
  {
    slug: "hemp",
    name: "Hemp",
    natural: true,
    whatItIs:
      "Hemp is a strong fiber that comes from the stalk of the hemp plant. The cleanest hemp is combed out by machines. That means the fiber is pulled apart in a physical way, without the harsh chemicals or bleach that most fabric-making uses.",
    healthStory:
      "The fiber itself feels good on your skin. It lets air through and does not hold onto the chemicals that bother sensitive skin. Your real risk comes from what gets added later. One is azo dyes, which can break down into chemicals linked to cancer and can cause itchy rashes. Another is formaldehyde, a chemical used to keep fabric from wrinkling that can cause cancer and rashes where it touches skin. A fiber being natural does not protect you. The finish is what does the harm. So a cheaply dyed hemp piece can carry just as much as any other fabric.",
    whatToLookFor:
      "Look for the OEKO-TEX STANDARD 100 label. It limits how much formaldehyde is allowed in clothes that touch your skin, and it checks for the risky azo dyes. Then pick hemp that was made by machine and dyed with low-impact or natural dyes.",
    environment:
      "Hemp grows with little water and few bug sprays, and the undyed fiber breaks down naturally.",
    shopFilter: "hemp",
    dek: "One of the most efficient fibers on earth. It grows fast, drinks little, and leaves the soil better than it found it.",
    history:
      "Hemp is one of the oldest fibers humans have farmed, and ancient China is where its record runs deepest. Archers strung their bows with it, and the *Father of Chinese Medicine*, Shen-Nung, recorded cannabis as medicine around 2700 BC. A poem from about 900 BC describes a building used to *ret* hemp, the soaking step that frees the fiber, and the *Shu Ching*, the earliest Chinese history, praised hemp as a fiber crop grown in what are now Hunan and Anhui. By the time the *Er Ya*, China's first dictionary, was compiled under the Qin and Han dynasties, growers already told male hemp from female, and described the fiber as strong and soft, fit to spin into cloth, with seeds you could eat.",
    heroStat: {
      value: 15,
      unit: "tonnes",
      label: "of CO₂ an acre of hemp pulls from the air as it grows",
      sub: "A fast-growing hemp crop absorbs carbon at a rate on par with young woodland, before a single thread is spun.",
    },
    enviroStory: [
      "Hemp earns its “miracle plant” reputation in the field. It reaches harvest in about 100 days, needs little irrigation because its deep roots reach water most crops cannot, and grows densely enough to shade out weeds without heavy herbicide use. The same acre yields far more usable fiber than cotton.",
      "The honest caveat is processing. Turning the stalk into a soft fiber can be done mechanically, which keeps it clean, or with chemical softening, which does not. And like any fabric, an undyed hemp with a low-impact finish is far gentler on the planet than a heavily dyed one.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: 2300,
        unit: "L/kg",
        compare: "conventional cotton: ~10,000 L/kg",
        note: "Mostly rain-fed. Hemp’s deep roots pull moisture from soil cotton cannot reach.",
      },
      {
        label: "Carbon",
        value: "Near-neutral",
        compare: "conventional cotton: a net emitter",
        note: "The growing plant absorbs roughly 1.6 tonnes of CO₂ per tonne of fiber, offsetting most of what processing emits.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no, sheds for centuries",
        note: "Undyed hemp breaks down in soil. Dyes and coatings are what slow it down.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes, with every wash",
        note: "Hemp is a plant fiber, so it does not shed plastic into water or air.",
      },
    ],
    sources: [
      { title: "What chemicals are in Textiles and the Health Implications", publisher: "Allergy Standards", url: "https://www.allergystandards.com/news_events/chemicals-in-textiles-and-the-health-implications/" },
      { title: "Is Formaldehyde in Clothing Dangerous?", publisher: "Kherkher Garcia", url: "https://www.kherkhergarcia.com/formaldehyde-in-clothing-dangerous/" },
      { title: "OEKO-TEX STANDARD 100 Factsheet", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/fileadmin/user_upload/Marketing_Materialien/STANDARD_100/Factsheet/STANDARD_100/OEKO-TEX_STANDARD_100_Factsheet_EN.pdf" },
      { title: "A comparative life cycle assessment of textile fiber production processes: Hemp versus cotton", publisher: "Sustainable Manufacturing and Service Economics (ScienceDirect)", url: "https://www.sciencedirect.com/science/article/pii/S2772912525000752" },
      { title: "Comparative study of water requirements and water footprints of fibre crops hemp and cotton", publisher: "ResearchGate", url: "https://www.researchgate.net/publication/373573092_Comparative_study_of_water_requirements_and_water_footprints_of_fibre_crops_hemp_Cannabis_sativa_and_cotton_Gossypium_hirsutum_L" },
      { title: "Industrial Hemp: A review of economic potential, carbon sequestration and bioremediation", publisher: "Portland State University", url: "https://www.pdx.edu/sustainability/sites/sustainability.web.wdt.pdx.edu/files/2022-09/Industrial%20Hemp%20-%20A%20review%20of%20economic%20potential%20carbon%20sequetration%20and%20bioremediation%20ver16%20August18%202022.pdf" },
    ],
  },
  {
    slug: "linen",
    name: "Linen",
    natural: true,
    whatItIs:
      "Linen is a fiber spun from the stalk of the flax plant. The old-fashioned way of soaking and combing out the fiber leaves very little leftover chemistry behind.",
    healthStory:
      "Linen is one of the gentlest fibers you can wear. It lets air through and pulls sweat away from your skin, so germs have less to feed on. That is why it feels naturally clean and tends to suit sensitive skin. Lab tests that check if a material harms living cells found flax to be safe. The catch is the marketing. Words like *wrinkle-free*, *easy-care*, and *anti-static* often mean a formaldehyde finish was added. Formaldehyde is a chemical that can cause cancer and irritate skin, and it sits on a fiber that never needed it. You are paying for convenience with chemicals.",
    whatToLookFor:
      "Choose linen with the OEKO-TEX STANDARD 100 or GOTS label. Skip the wrinkle-free and easy-care finishes. And treat European Flax sourcing as a sign of quality, not a promise about your health.",
    environment:
      "Flax needs little watering and few bug sprays, and undyed linen breaks down naturally.",
    shopFilter: "linen",
    heroStat: {
      value: 34000,
      unit: "years",
      label: "the oldest fiber humans are known to have worn",
      sub: "Wild flax, found spun and dyed in a Georgian cave, was worked into thread during the Ice Age.",
    },
    enviroStory: [
      "Linen's environmental case is quiet but real. Most of it is European flax grown on rainfall alone, so a kilo of fiber takes a small fraction of the water cotton demands, and the plant needs few pesticides.",
      "Its weak spot is carbon, and the honest answer is that the number swings widely. Studies land anywhere from about half a kilo to well over two per kilo of fiber, driven mostly by how heavily the field is fertilized. Undyed linen then breaks down in soil in weeks to months.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: "300–1,000",
        unit: "L/kg",
        compare: "conventional cotton: ~3,000–10,000 L/kg",
        note: "Mostly rain-fed European flax, grown with no irrigation.",
      },
      {
        label: "Carbon",
        value: "0.5–2.5",
        unit: "kg CO₂e/kg",
        compare: "conventional cotton: ~2–6",
        note: "The number swings mainly with how much fertilizer the farm uses.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no, sits for centuries",
        note: "Undyed linen breaks down in weeks to months.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes, every wash",
        note: "A plant fiber, so it sheds no plastic.",
      },
    ],
    sources: [
      { title: "Is Linen Fabric Toxic? The Science Behind This Natural Textile", publisher: "Dal The Label", url: "https://dalthelabel.com/blogs/fashion-101/is-linen-fabric-toxic-the-science-behind-this-natural-textile" },
      { title: "What Does Oeko-Tex Certified Mean?", publisher: "George Street Linen", url: "https://www.georgestreetlinen.com/global/journal/what-does-oeko-tex-certified-mean" },
      { title: "OEKO-TEX STANDARD 100 Factsheet", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/fileadmin/user_upload/Marketing_Materialien/STANDARD_100/Factsheet/STANDARD_100/OEKO-TEX_STANDARD_100_Factsheet_EN.pdf" },
      { title: "Bacterial adhesion and biofilm formation on linen fabrics", publisher: "Industrial Crops and Products", url: "https://www.sciencedirect.com/science/article/pii/S0926669025018412" },
      { title: "Evaluation of Antibacterial Activity of Flax Fibers Against Staphylococcus aureus", publisher: "Fibres & Textiles in Eastern Europe", url: "https://www.researchgate.net/publication/297406900_Evaluation_of_Antibacterial_Activity_of_Flax_Fibers_Against_the_Staphylococcus_aureus_Bacteria_Strain" },
      { title: "Best Fabrics for Sensitive Skin", publisher: "Healthline", url: "https://www.healthline.com/health/best-fabric-for-sensitive-skin" },
      { title: "Oldest-known fibers discovered", publisher: "Harvard Gazette", url: "https://news.harvard.edu/gazette/story/2009/09/oldest-known-fibers-discovered/" },
      { title: "European Flax certification and cultivation", publisher: "Alliance for European Flax-Linen and Hemp", url: "https://allianceflaxlinenhemp.eu/en" },
    ],
    dek: "The fiber your skin has always gotten along with, until the finish gets involved.",
    madeEyebrow: "How it’s cultivated & made",
    madeTitle: "From a field of flowers to thread",
    heroImage: "/fibers/linen/linen-field.jpg",
    about:
      "Linen is spun from the *stalk* of the flax plant, not a fluffy boll like cotton. The Romans called it *linum usitatissimum*, most useful flax, and people have worn it for something like 30,000 years. It is one of the oldest, and one of the cleanest, fabrics we know how to make.",
    history:
      "Flax was spun into thread before the wheel existed. The Egyptians wrapped pharaohs in it and treated the finest linen as a luxury. The best of it still comes from European flax and, historically, the Nile.",
    madeStory: [
      "Flax grows in cool, damp weather in about 100 days, on little water and few pesticides. The plant is *pulled up by the roots*, not cut, to keep the fibers long, because the longer the fiber, the finer the cloth. That is why raw linen is one of the cleanest things you can put on your skin.",
      "The best linen is still hand-harvested. Getting the fiber out is slow and mostly mechanical: *retting* lets dew and bacteria rot away the glue that binds the fiber to the woody stalk, and dew-retting out in a field is the cleanest, least polluting way to do it. Then the stalks are broken, scutched, and combed until only the long, lustrous fibers are left, then spun and woven.",
      "No chemical bath required, and undyed linen breaks down in soil in a few weeks. *Whatever risk linen carries is added later*, at the finishing stage.",
    ],
    madeImage: {
      src: "/fibers/linen/flax-closeup.jpg",
      alt: "Blue flax flowers in bloom in a field",
      caption: "Flax in bloom, before it becomes thread.",
    },
    grades: {
      intro:
        "Linen on a label covers a wide range, and the grade of the fiber is what separates the good from the forgettable. The long, combed fibers, called *line*, make smooth, fine cloth. The short leftovers, *tow*, make the coarser, cheaper stuff. The longest, finest flax comes from a handful of places, and a provenance mark is a quality signal, not a health promise.",
      marks: ["European Flax", "Belgian", "Irish", "Egyptian"],
    },
    healthImpacts: [
      "The flax fiber itself is biologically inert. It is plant cellulose, and lab tests that check whether a material harms living cells find flax safe against skin. What linen does for your body comes down to moisture and heat, not any special chemistry: its pectin structure pulls sweat off your skin and lets it evaporate fast, so you skip the damp cling that irritates skin and gives bacteria something to grow on.",
      "The health question with a linen garment is the finish, not the fiber. Words like *wrinkle-free*, *easy-care*, and *anti-static* usually mean a formaldehyde treatment was added, a chemical that can cause cancer and irritate skin, sitting on a fiber that never needed it.",
    ],
    benefits: [
      {
        title: "Breathes and wicks.",
        body: "Flax's pectin structure pulls sweat off your skin and lets it evaporate fast, so you skip the damp cling that irritates skin and feeds bacteria.",
      },
      {
        title: "Runs cool.",
        body: "Thermoregulating, so less heat and sweat sit trapped against your body.",
      },
      {
        title: "Softer with every wash.",
        body: "Smooth and low-lint once broken in. Coarse, brand-new linen can feel stiff, so wash it before wearing on sensitive skin.",
      },
      {
        title: "A cleaner surface against skin.",
        body: "Flax resists dust mites and mold, and dries too fast for much bacteria or odor to build up. Its *antibacterial* reputation is mostly that; the direct evidence is modest.",
      },
    ],
    certs: ["oeko-tex-standard-100", "gots"],
    lookFor: ["European Flax"],
    avoid: ["Wrinkle-free", "Easy-care", "Anti-static finishes"],
    scoredNote:
      "Linen starts from a clean plant fiber, so its hazard base is low. From there we subtract for the finishes and dyes we can detect. A certified, undyed linen sits near the very top of the scale, which is how it lands at 94.",
    care: [
      {
        k: "Wash",
        v: "Cool (30°C or below), gentle cycle, mild detergent, inside out. No bleach, and *no fabric softener*, it coats the fiber and kills the breathability that makes linen linen.",
      },
      {
        k: "Dry",
        v: "Air dry in the shade, or tumble on low for 5 to 10 minutes then hang. High heat is what shrinks it.",
      },
      {
        k: "Iron",
        v: "Press while still damp on medium, inside out to avoid shine, or steam it. Or lean into the relaxed wrinkle, it is part of the charm.",
      },
      {
        k: "Store",
        v: "Put it away clean in a breathable cotton bag, never plastic, so it does not yellow or draw moths.",
      },
    ],
    faq: [
      {
        q: "Is linen toxic?",
        a: "Pure linen is not. The flax fiber itself is safe against skin. The risk comes from what gets added later: wrinkle-free and easy-care finishes (often formaldehyde) and cheap azo dyes. Choose OEKO-TEX Standard 100 or GOTS certified linen and you avoid almost all of it.",
      },
      {
        q: "Is linen hypoallergenic?",
        a: "Mostly, yes. Linen is smooth, low-lint, and breathable, which tends to suit sensitive skin and eczema. An undyed, certified linen with no performance finish is about as gentle as fabric gets.",
      },
      {
        q: "Does linen shrink?",
        a: "A little on the first wash if it was not pre-shrunk. Wash cool (30°C or below) and air dry, and it holds its shape. High heat in the dryer is what shrinks it.",
      },
      {
        q: "Is linen better than cotton?",
        a: "For wearer health and longevity, usually. Linen scores 94 to conventional cotton's 84, uses far less water, and lasts for decades. Cotton is softer on day one; linen gets softer with every wash.",
      },
    ],
  },
  {
    slug: "organic_cotton",
    name: "Organic Cotton",
    natural: true,
    whatItIs:
      "Organic cotton is the same fiber as regular cotton, but it is grown without man-made bug sprays. The part that matters for your skin is the cleaner rules that follow it from the field all the way to the finished clothes.",
    healthStory:
      "Regular cotton is not the harmless choice you have been told it is. Lab tests on regular cotton fabric have found leftover bug spray, and some of it stays put even after many washes and sits against your skin. Regular finishing also often adds formaldehyde, a chemical linked to cancer, skin irritation, and allergic reactions. The GOTS label is the real fix. It bans formaldehyde, azo dyes, heavy-metal dyes, and flame retardants across the whole supply chain, not just the fiber. So the word *organic* on a tag, without that label, can still hide clothes that were dyed and finished the regular way.",
    whatToLookFor:
      "Look for the GOTS label, which controls the chemistry from the fiber to the finished piece. Use the OEKO-TEX STANDARD 100 label as a backup that confirms the final garment was checked for harmful leftovers.",
    environment:
      "Organic cotton skips the man-made bug sprays, but cotton is still a thirsty crop.",
    shopFilter: "organic cotton",
    heroStat: {
      value: 2.4,
      suffix: "%",
      label: "of the world's cropland grows cotton, yet it uses 6 to 16% of all pesticides. Organic cotton uses none.",
    },
    enviroStory: [
      "Organic cotton's real win is chemistry, not water. It is grown with no synthetic pesticides or fertilizer, and that is the certain, verifiable difference from conventional cotton.",
      "The often-quoted figures of 91% less water and 46% less carbon come from a single 2014 industry study and are debated. Part of the water saving is simply that organic cotton is often grown in rain-fed regions, not a property of organic farming itself. Treat the water saving as modest and the pesticide saving as the point.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: "Similar",
        compare: "conventional cotton",
        note: "Uses far less irrigation water, but largely because it is grown in rain-fed regions. Total water is close to conventional cotton.",
      },
      {
        label: "Carbon",
        value: "3–3.5",
        unit: "kg CO₂e/kg",
        compare: "conventional cotton: ~2–6",
        note: "Around 46% lower than conventional in one 2014 study, though that figure is debated. The certain part is no synthetic pesticides or fertilizer.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no",
        note: "The same natural cellulose as regular cotton.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes",
        note: "A plant fiber, not plastic.",
      },
    ],
    sources: [
      { title: "Why GOTS-Certified Organic Cotton Bedding Matters", publisher: "The Honest Label", url: "https://thehonestlabel.com/blogs/honestlabel/tired-of-toxins-in-your-bedding-gots-certified-organic-cotton" },
      { title: "Is Cotton Toxic? Chemicals, Dyes, and Pesticides", publisher: "ScienceInsights", url: "https://scienceinsights.org/is-cotton-toxic-chemicals-dyes-and-pesticides/" },
      { title: "OEKO-TEX vs GOTS: Which Certification Keeps You Safe?", publisher: "Orbasics", url: "https://orbasics.com/blogs/stories/oeko-tex-vs-gots" },
      { title: "The Deadly Chemicals in Cotton", publisher: "Environmental Justice Foundation", url: "https://ejfoundation.org/resources/downloads/the_deadly_chemicals_in_cotton.pdf" },
      { title: "The Life Cycle Assessment of Organic Cotton Fiber", publisher: "Textile Exchange", url: "https://textileexchange.org/knowledge-center/reports/cotton-life-cycle-assessment/" },
    ],
  },
  {
    slug: "regenerative_organic_cotton",
    name: "Regenerative Organic Cotton",
    natural: true,
    whatItIs:
      "Regenerative organic cotton is organic cotton grown on farms that also rebuild the soil. It starts from the organic rules, so no man-made bug sprays or fertilizers, then goes further by farming in a way that stores carbon and brings the land back to life.",
    healthStory:
      "For your skin, the part that counts is the *organic* part. Because the fiber starts certified organic, it carries the same low-residue, no-synthetic-pesticide story as organic cotton, which is the cleanest base a cotton can have. The label to trust is *Regenerative Organic Certified* (ROC): it requires organic first, then adds soil, animal, and farmer standards on top. One trap to know: the word *regenerative* on its own is not a promise. Without the organic part, regenerative farming is allowed to phase synthetic chemicals out slowly rather than ban them, so a plain *regenerative* tag can still mean sprayed cotton.",
    whatToLookFor:
      "Look for the full *Regenerative Organic Certified* mark, or a GOTS label next to the regenerative claim. Treat the word *regenerative* by itself, with no organic certification, as a marketing word rather than a health promise.",
    environment:
      "This is cotton at its most repairing. It skips the synthetic chemicals and farms to store carbon and rebuild soil instead of stripping it.",
    shopFilter: "regenerative organic cotton",
    sources: [
      { title: "What is Regenerative Organic Certified and how is it different from USDA Certified Organic?", publisher: "Patagonia", url: "https://help.patagonia.com/s/article/What-is-Regenerative-Organic-Certified-and-how-is-it-different-from-USDA-Certified-Organic" },
      { title: "Regenerative Organic Certified", publisher: "CCOF", url: "https://www.ccof.org/organic-certification-services/regenerative-organic-certified/" },
      { title: "Regenerative Cotton vs Organic Cotton: Key Differences for Brands", publisher: "Regenerative Cotton Standard", url: "https://regenerative-cotton.org/media-room/regenerative-cotton-vs-organic-cotton-key-differences-for-brands" },
    ],
  },
  {
    slug: "ramie",
    name: "Ramie",
    natural: true,
    whatItIs:
      "Ramie is a strong fiber from the stalk of a plant in the nettle family. To turn it into fabric, you have to strip out the natural gums and sap that hold the fiber together. The old way uses strong, harsh chemical baths to do this.",
    healthStory:
      "The fiber breathes well, dries fast, and fights germs and mildew, so it is genuinely nice to wear. There are two honest problems. First is *prickle*. Ramie is stiff and rough, and its hard little surface hairs poke the nerve endings just under your skin. One study cut that discomfort by almost 44 percent, but only after the fiber was softened with enzymes. Second is leftover chemicals. The harsh cleaning leaves strong residue that has to be fully washed out, and anything left behind can irritate your skin. Done right, the fiber rinses clean. Done cheaply, you feel it.",
    whatToLookFor:
      "Pick ramie with the OEKO-TEX STANDARD 100 label, and look for fabric softened with enzymes or a gentler natural process. And trust your hands. Truly smooth ramie was made well, while stiff and scratchy ramie was not.",
    environment:
      "Ramie gives a big harvest, but the regular harsh cleaning makes dirty, strongly alkaline wastewater.",
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
      "TENCEL Lyocell starts as wood. The wood pulp gets dissolved into a thick goo, then squeezed back out into thread. What makes it special is the liquid used to dissolve it. It is non-toxic, and the factory runs a *closed-loop* system, which just means it captures over 99 percent of that liquid and reuses it instead of dumping it. So it skips the smelly, harsh chemical called *carbon disulfide* that older fabrics like viscose rely on.",
    healthStory:
      "This is about as clean as a man-made fiber gets against your skin. The liquid used to make it gets captured, not released, and the finished thread is washed so it carries almost no leftover chemicals. It soaks up moisture and pulls dampness off your skin, so the surface stays drier and bacteria have less to feed on. That helps a lot if you run hot or have easily irritated skin. The fiber is smooth, so it tends to bother skin less than rougher ones. Your real risk is not the fiber. It is what gets added later: dyes and wrinkle-proof or shrink-proof coatings that can leave behind *formaldehyde*, a chemical that can irritate skin. So the label on the finished piece matters more than the fiber name.",
    whatToLookFor:
      "Look for the brand name *TENCEL* Lyocell. That guarantees the clean closed-loop process. Also look for an OEKO-TEX STANDARD 100 label, which means the finished, dyed piece was tested for formaldehyde, harmful dyes, and other bad stuff.",
    environment:
      "Reusing the dissolving liquid and sourcing the wood responsibly make it far easier on the planet than regular viscose.",
    shopFilter: "tencel",
    heroStat: {
      value: 99,
      suffix: "%",
      label: "of the solvent and water is captured and reused in the closed loop, instead of dumped",
      sub: "The documented recovery rate is technically above 99 percent.",
    },
    enviroStory: [
      "Lyocell's advantage is the closed loop. The solvent that dissolves the wood pulp is non-toxic, and the factory recaptures over 99 percent of it along with the process water, instead of discharging it the way open-loop viscose does.",
      "The absolute water and carbon numbers come mostly from Lenzing and industry data, so treat them as directional. The clearer claim is the relative one: the process recovers what it uses, and the fiber biodegrades.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: "300–800",
        unit: "L/kg",
        compare: "conventional viscose: often higher, and discharged rather than recovered",
        note: "The closed loop recaptures the process water (Lenzing/industry data).",
      },
      {
        label: "Carbon",
        value: "≈50% less",
        compare: "conventional viscose",
        note: "About half the emissions of generic lyocell in Lenzing/Higg data. A clean independent absolute figure is not published.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no",
        note: "TÜV Austria certified to break down in soil and seawater.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes",
        note: "Regenerated cellulose, not plastic. Its microfibers biodegrade.",
      },
    ],
    sources: [
      { title: "Recovery of N-Methylmorpholine N-Oxide (NMMO) in Lyocell Fibre Manufacturing", publisher: "Fibers (MDPI)", url: "https://www.mdpi.com/2079-6439/13/1/3" },
      { title: "What are TENCEL Lyocell and Modal Fibers", publisher: "Lenzing / TENCEL", url: "https://www.tencel.com/fibers" },
      { title: "OEKO-TEX STANDARD 100", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100" },
      { title: "Hot Button Report: viscose producer ranking", publisher: "Canopy", url: "https://canopyplanet.org/tools-and-resources/hot-button-report" },
      { title: "TENCEL fibers and closed-loop production", publisher: "Lenzing", url: "https://www.lenzing.com/sustainability" },
    ],
  },
  {
    slug: "saxcell",
    name: "SaXcell",
    natural: false,
    whatItIs:
      "SaXcell is made from old cotton clothing instead of fresh wood. The cotton waste is broken down into pulp, then spun back into thread using the *lyocell* method. That is the same non-toxic, reuse-the-chemicals, *closed-loop* process as TENCEL, not the harsher carbon-disulfide route used for plain viscose. Closed-loop just means the factory captures its chemicals and uses them again.",
    healthStory:
      "Because it is spun the lyocell way, SaXcell gets that same clean feel against your skin: a smooth, absorbent thread with no leftover carbon disulfide, made with water and chemicals reused in a closed loop. It breathes and handles moisture like other wood-and-plant fibers, so it sits comfortably on hot or easily irritated skin. One honest catch with recycled fiber: the old cotton it starts from may have carried its own dyes and coatings. So the cleaning steps, plus whatever dyes and coatings get added to the final cloth, decide whether the piece is truly low on leftovers. The fiber itself is reassuring. The finishing still needs checking.",
    whatToLookFor:
      "Look for the *SaXcell* name to confirm it is recycled cotton spun the clean closed-loop way. Then look for an OEKO-TEX STANDARD 100 label on the finished piece to confirm it was tested for harmful leftovers.",
    environment:
      "It uses roughly 10 liters of water per kilogram, versus thousands for regular cotton, and it keeps old textiles out of the landfill.",
    shopFilter: "saxcell",
    sources: [
      { title: "SaXcell - Sustainable Lyocell Fibres from Textile Waste", publisher: "SaXcell", url: "https://saxcell.com/" },
      { title: "SaXcell: regenerated cellulose from domestic cotton waste", publisher: "Circle Economy Foundation Knowledge Hub", url: "https://knowledge-hub.circle-economy.com/wctd/article/9353" },
    ],
  },
  {
    slug: "ecovero",
    name: "LENZING™ ECOVERO™",
    sentenceName: "LENZING™ ECOVERO™",
    natural: false,
    whatItIs:
      "LENZING ECOVERO is a *brand-name viscose*. It is still made the traditional viscose way, which uses *carbon disulfide*, a harsh chemical. But Lenzing makes it under tighter rules and captures those chemicals instead of dumping them. It was the first viscose to earn the EU Ecolabel, an official seal for lower-impact products.",
    healthStory:
      "Be clear here, because the marketing blurs it: this is viscose, not lyocell, so making it really does use *carbon disulfide*, a chemical that is proven to harm factory workers when the fumes are not controlled. But worker safety and your safety are two different things. By the time the washed, finished fiber reaches your skin, it carries basically no carbon disulfide. ECOVERO is also OEKO-TEX STANDARD 100 certified, and it breathes well and soaks up moisture, so it feels soft and cool on your skin. What you pay for is cleaner, traceable production and tested, low-leftover fiber, instead of anonymous viscose where no one answers for worker safety or leftover chemicals.",
    whatToLookFor:
      "Look for the brand name *LENZING ECOVERO* plus the EU Ecolabel and OEKO-TEX STANDARD 100. Plain unbranded viscose or rayon tells you nothing about how it was made or what is left in it.",
    environment:
      "It uses at least 50 percent less water and creates about half the carbon emissions of regular viscose.",
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
      "Modal is a softer wood-based fiber, usually made from beech wood by a *tweaked viscose process*. Like all viscose, it still uses *carbon disulfide*, a harsh chemical. But the brand-name version, TENCEL Modal, captures and reuses 99 percent or more of its chemicals and water in a *closed-loop* system, meaning the factory recycles them instead of dumping them.",
    healthStory:
      "Modal feels silky and is loved for being soft on skin. It soaks up moisture and breathes well, so it stays comfortable in heat. The health difference is all about *who made it*. Plain modal runs the carbon-disulfide process, which is risky for workers, and gives you no promise about leftover chemicals or the dyes and easy-care coatings added later, some of which can release *formaldehyde*, a skin irritant. TENCEL Modal recycles its chemicals in a closed loop, checks where its beech wood comes from, and tests the finished fiber as safe to touch. Either kind feels comfortable on your skin. The certainty about leftovers and coatings is what sets the two apart.",
    whatToLookFor:
      "Look for the brand name *TENCEL Modal* to confirm the closed-loop process and skin-safety testing, plus OEKO-TEX STANDARD 100 on the finished piece. Treat unbranded modal as ordinary viscose.",
    environment:
      "TENCEL Modal makes roughly 50 percent less carbon emissions than regular modal and uses checked, regrowing beech wood.",
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
      "Cupro, also sold as Bemberg, is made from the fuzzy bits left over after cotton is processed. That waste is dissolved in a copper-and-ammonia liquid called *Schweizer's reagent*, then spun back into thread and rinsed in acid baths that pull the copper and ammonia back out.",
    healthStory:
      "On the body, cupro is genuinely kind. Its threads are almost perfectly round, so they sit smoothly and tend to bother skin less, and it is often called hypoallergenic, meaning less likely to cause a reaction. It breathes better than silk, cotton, nylon, or polyester, and it pulls dampness off your skin and lets it go, holding a lot of moisture before it ever feels wet. The chemical concern is back at the factory, not on your skin: the copper-and-ammonia method has to be carefully captured, which is a factory and waste issue, not something that sticks around in a washed, finished piece. As always, the dyes and coatings on the final cloth are the real leftover question, so testing on the finished piece still matters.",
    whatToLookFor:
      "Look for *Bemberg* (made by Asahi Kasei) as the well-controlled, established kind of cupro. And look for an OEKO-TEX STANDARD 100 label confirming the finished fabric was tested for harmful stuff.",
    environment:
      "It is made from cotton scraps, though the copper-and-ammonia chemistry means the factory has to control its waste carefully.",
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
      "Acetate is wood pulp that has been changed more deeply: it is reacted with *acetic acid and acetic anhydride* (the stuff that gives vinegar its tang, in stronger form), dissolved in acetone, then spun as the acetone dries off. So unlike viscose, it skips carbon disulfide, but it is more chemically changed than lyocell.",
    healthStory:
      "Acetate is smooth and silk-like and is generally considered easy on skin. But the way it is made leaves it *water-repelling*, more so than other wood-based fibers. Plain acetate soaks up moisture poorly and does not pull sweat off your skin well, so it can feel clammy in heat, the opposite of breezy fibers like lyocell or cupro. A newer brand-name acetate, Eastman's Naia, is built to pull moisture away, dry fast, and breathe without added coatings, and is sold as hypoallergenic, meaning less likely to cause a reaction. So how it feels depends a lot on which acetate you have. Either way, the fiber itself carries no carbon disulfide. Your leftover questions are again the dyes and coatings on the finished piece.",
    whatToLookFor:
      "Pick brand-name *Naia* by Eastman for real moisture control and comfort without added coatings, and look for OEKO-TEX STANDARD 100 on the finished piece. With plain acetate, expect it to breathe less.",
    environment:
      "It is made from wood-pulp, and brand-name versions like Naia use responsibly sourced, traceable pulp.",
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
      "Silk is a long, thin thread spun by silkworms to build their cocoons. The thread is mostly a protein called fibroin, wrapped in a sticky coating called sericin. Most of that sticky coating is washed off in hot water, a step called *degumming*. This is also where dyes and finishing chemicals get added.",
    healthStory:
      "Clean, well-washed silk is one of the kindest fibers you can wear. It is smooth, it breathes, and it moves moisture and heat away from your skin. That keeps you comfortable and helps your skin stay calm. The catch is leftovers. Cheap silk that still holds too much of that sticky coating can confuse your immune system and cause a real reaction. But the dyes and finishing chemicals added during manufacturing cause skin trouble more often than the silk itself does. If silk bothers you, blame the *finish*, not the fiber.",
    whatToLookFor:
      "Pick fully washed silk and look for OEKO-TEX STANDARD 100 on the label. That stamp means it was tested for 350-plus harmful substances, including leftover dyes and chemicals. Higher-grade, well-washed silk is the gentlest choice.",
    environment:
      "Raising silkworms does not use much land, but it uses a lot of energy and water, because the cocoons are usually boiled to unwind the thread.",
    shopFilter: "silk",
    heroStat: {
      value: 8500,
      unit: "years",
      label: "humans have spun silk, one of the oldest fibers we still wear",
    },
    enviroStory: [
      "Silk has the thinnest data in this whole guide. The often-quoted \"worst fiber for water\" figure traces back to a single small study, and its carbon estimates swing thirty-fold between studies, so no clean number is honest here.",
      "What is clear is that silk is a protein fiber, so it biodegrades and sheds no plastic. Its real costs are energy and water in production, plus the ethics of how it is harvested.",
    ],
    enviroStats: [
      {
        label: "Carbon",
        value: "2.4–81",
        unit: "kg CO₂e/kg",
        compare: "polyester satin: ~3.1",
        note: "The data is thin and single-study, so the range is huge. Treat it as illustrative, not precise.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no",
        note: "A protein fiber that breaks down enzymatically.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes",
        note: "Natural protein, not plastic.",
      },
    ],
    ethics: {
      title: "How silk is made",
      flags: ["Silkworms killed in harvest", "Historic child labor"],
      body: [
        "Conventional silk boils or steams the cocoons with the pupae still inside, to keep the filament in one unbroken thread. Peace silk, also called ahimsa silk, lets the moth emerge first and accepts the shorter, broken fibers that result.",
        "A 2003 Human Rights Watch report documented hundreds of thousands of bonded children working in India's silk industry. That report is now over two decades old and conditions have reportedly improved, but current prevalence is not well documented, so read it as history, not a live statistic.",
      ],
    },
    sources: [
      { title: "Silk for Sensitive Skin: Hypoallergenic Properties & Evidence", publisher: "Selvane", url: "https://www.selvane.co/blogs/knowledge/silk-for-sensitive-skin-hypoallergenic-properties-evidence" },
      { title: "What Is Degummed Silk? Processing & What It's Used For", publisher: "Mayfairsilk", url: "https://mayfairsilk.com/blogs/general/what-is-degummed-silk-processing-what-its-used-for" },
      { title: "Safety Assessment of Silk Proteins as Used in Cosmetics", publisher: "Cosmetic Ingredient Review (CIR)", url: "http://www.cir-safety.org/sites/default/files/slkprt062015rep.pdf" },
      { title: "Biomarkers Reveal 8,500-Year-Old Silk in Prehistoric Tombs at Jiahu", publisher: "PLOS ONE", url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0168042" },
      { title: "Small Change: Bonded Child Labor in India's Silk Industry", publisher: "Human Rights Watch", url: "https://www.hrw.org/report/2003/01/22/small-change/bonded-child-labor-indias-silk-industry" },
    ],
  },
  {
    slug: "alpaca",
    name: "Alpaca",
    natural: true,
    whatItIs:
      "Alpaca fiber comes from the alpaca, a relative of the camel raised mostly in the Andes mountains. After shearing, it is cleaned, and the softer grades are *dehaired* to pull out the thick, coarse hairs. The fiber width runs from 18 to 27 microns (a micron is one millionth of a meter, so thinner means softer), and the best grades are as fine as 14.5.",
    healthStory:
      "Alpaca is often easier on touchy skin than sheep wool, for two reasons you can feel. First, it has *no lanolin*, the waxy grease in sheep wool that causes most real wool-grease reactions. If lanolin is your problem, alpaca skips it. Second, its surface is smoother and rounder, so it pokes your skin less. Most so-called wool allergy is really just stiff, thick fibers physically poking you, a feeling called *prickle*. Alpaca also stays drier against you than wool. Still, comfort comes down to thinness: a coarse alpaca with thick hairs left in can poke and itch no matter what.",
    whatToLookFor:
      "Look for dehaired baby or royal alpaca around 18 to 22 microns for wearing right against your skin, plus OEKO-TEX STANDARD 100 to limit leftover dyes and chemicals.",
    environment:
      "Alpacas have soft, padded feet that are gentler on Andean grass than hooved animals. As camel relatives, they also burp up less methane than sheep.",
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
      "Cashmere is the soft, fluffy under-layer combed or shorn from cashmere goats. It is then *dehaired*, an important step that separates the fine fluff (19 microns or less, the best at 14 to 15.5) from the thick guard hairs, which are much wider at 50 to 100. Only about 30 to 50 percent of the raw fiber survives this step as usable cashmere.",
    healthStory:
      "With cashmere, how comfortable it feels comes down to *how well it was made*, not the goat. Fine cashmere fluff is far thinner than the point where fibers get stiff enough to poke the tiny nerves in your skin. That poking, called *prickle*, is the itch most people mistake for an allergy. But it takes only a few missed guard hairs to make soft cashmere scratch. Two sweaters with the same average thinness can feel totally different depending on how well those thick hairs were pulled out. Cheap cashmere is usually cheap because that step was rushed. Like all goat and sheep fibers, the itch is physical poking, not a true allergy.",
    whatToLookFor:
      "Buy on thinness and how well it was dehaired, not just the word cashmere. Look for fiber around 15 to 16 microns and OEKO-TEX STANDARD 100 for safe dyes and finishes.",
    environment:
      "Cashmere goats graze very close to the ground and can wear out fragile grassland. Because each goat gives so little fiber, one sweater takes many goats.",
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
      "Merino wool comes from merino sheep, bred to grow especially fine fleece (often 18 microns or thinner). It is washed to strip out grease and dirt. Much of it also gets a *superwash* finish: a chlorine bath that wears down the fiber's surface scales, then a thin plastic resin coating. This treatment leaves chlorine-based traces behind.",
    healthStory:
      "Skin doctors have studied this and shown that the idea of wool being an allergen for everyone is a myth. A 2017 review in *Acta Dermato-Venereologica* found wool is not an allergen at all. The itch is just stiff fibers physically poking the tiny nerves in your skin, a feeling called *prickle*. Because merino is so thin, it is well tolerated and may even be good for eczema-prone skin. Two real worries remain. First, the *superwash* chlorine-and-plastic-coating process leaves a thin plastic film and chlorine traces that can bother sensitive skin. Second, leftover grease (lanolin) in modern washed wool is now very low, usually too little to cause a reaction, so true lanolin trouble is rarer than people think. Merino also breathes well and keeps you dry.",
    whatToLookFor:
      "Choose fine merino around 17 to 18.5 microns, pick untreated or non-superwash when you can, and look for OEKO-TEX STANDARD 100 plus the Responsible Wool Standard (RWS).",
    environment:
      "The biggest welfare worry with merino is *mulesing*, cutting skin from a lamb's backside to stop flies, often with no pain relief. RWS-certified wool bans it.",
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
      "Mohair comes from the Angora goat. After shearing, it is washed. Its width runs from about 25 to 45 microns depending on the goat's age. Fine *kid mohair* (from goats under one year old) is about 20 to 24 microns, while coarse fiber from older goats reaches 39 or more.",
    healthStory:
      "Mohair's scratchy reputation is mostly about *which* mohair and how it was made, not an allergy. Its surface scales lie flatter and smoother than sheep wool, so it rubs less and feels less prickly. But mohair has long fibers and that signature fuzzy *halo*, which leaves lots of fiber ends sticking out. Once the fiber gets thick enough, past the prickle point, those ends physically poke the tiny nerves in your skin. That is irritation, not your body fighting the fiber. Kid mohair stays thinner and silkier, so it is far less likely to bother you than coarse mohair from older goats. If a mohair piece feels pokey, that is thickness and how it was made, not an allergy.",
    whatToLookFor:
      "Choose kid mohair around 20 to 24 microns for wearing against your skin. If you are sensitive, pick smooth weaves over heavily brushed, fuzzy ones, and look for OEKO-TEX STANDARD 100.",
    environment:
      "Angora goats graze on pasture and, like cows and sheep, burp up methane. Overgrazing is the main land worry.",
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
      "Plain wool comes from sheep. It is washed to remove grease and dirt, and often gets a *superwash* finish (a chlorine bath that wears down the surface scales, plus a thin plastic resin coating). Sometimes it also gets a *moth-proofing* bug treatment. Both add chemicals to the fiber that touches your skin.",
    healthStory:
      "The belief that everyone is allergic to wool is wrong. A 2017 *Acta Dermato-Venereologica* review found wool is not a true allergen. The itch is just stiff, thick fibers physically poking the tiny nerves in your skin, a feeling called *prickle*. That is why plain wool itches more than fine merino: its fibers are simply thicker. The chemistry matters more than the fiber. *Superwash* leaves chlorine traces and a thin plastic film, and that step also creates toxic chlorine-based byproducts called AOX. Many wools are also moth-proofed with a bug killer called *permethrin*, which is locked inside the fiber and can still pass OEKO-TEX, though it is a pesticide on your clothes. Leftover grease (lanolin) in modern washed wool is very low and rarely the real problem. Wool itself breathes well and keeps you comfortable.",
    whatToLookFor:
      "Pick untreated wool: non-superwash and not moth-proofed. Choose thinner grades for comfort, and look for OEKO-TEX STANDARD 100 plus the Responsible Wool Standard (RWS).",
    environment:
      "Sheep burp up methane and need grazing land. RWS certification also covers welfare practices like mulesing.",
    shopFilter: "wool",
    heroStat: {
      value: 95,
      suffix: "%",
      label: "of a wool garment breaks down in soil within about 15 weeks, feeding the ground as it goes",
    },
    enviroStory: [
      "Wool's best environmental story is the end of its life. In soil, a wool garment breaks down roughly 95 percent within about 15 weeks, returning nitrogen and sulfur to the ground instead of sitting in a landfill.",
      "Its carbon figure is high and genuinely contested. Around three-quarters of it is methane from the sheep, and how methane should be counted is under active scientific debate, so read the range as a range.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: "Mostly rainfall",
        compare: "acrylic: fossil-derived, no water story",
        note: "There is no clean per-kg figure. Over 95% of wool's water is rain on grazing land, not scarce freshwater.",
      },
      {
        label: "Carbon",
        value: "10–30",
        unit: "kg CO₂e/kg",
        compare: "acrylic: ~21–36",
        note: "High and contested. About 75% is sheep methane, and how methane is counted is actively debated.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "acrylic: no",
        note: "A protein fiber. Returns nitrogen and sulfur to the soil.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "acrylic: yes, heavily",
        note: "Natural keratin, not plastic.",
      },
    ],
    ethics: {
      title: "Animal welfare in wool",
      flags: ["Mulesing"],
      body: [
        "Mulesing removes strips of skin from a lamb's hindquarters to prevent flystrike, a practice concentrated in Australia and often carried out without pain relief. New Zealand banned it in 2018. The Responsible Wool Standard prohibits it, but RWS-certified wool is only about 4 percent of the global clip, so most wool gives you no such guarantee.",
      ],
    },
    sources: [
      { title: "Debunking the Myth of Wool Allergy", publisher: "Acta Dermato-Venereologica", url: "https://www.medicaljournals.se/acta/content/html/10.2340/00015555-2655" },
      { title: "Superwash - Woolpower", publisher: "Woolpower", url: "https://woolpower.se/en/our-supply-chain/superwash/" },
      { title: "OEKO-TEX STANDARD 100", publisher: "OEKO-TEX", url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100" },
      { title: "Moth protection with the active substance permethrin", publisher: "Paulig", url: "https://www.paulig1750.com/media/19/f8/8f/1631545219/mottenschutz_pau_en_130921_brand.pdf" },
      { title: "Wool is biodegradable", publisher: "International Wool Textile Organisation", url: "https://iwto.org/sustainability/wool-biodegradability/" },
      { title: "Responsible Wool Standard", publisher: "Textile Exchange", url: "https://textileexchange.org/responsible-wool-standard/" },
    ],
  },

  // ---- Conventional + carbon-disulfide cellulosics ----
  {
    slug: "viscose",
    name: "Viscose",
    natural: false,
    whatItIs:
      "Viscose is a part-natural, part-made fiber. It starts as wood, which gets dissolved into mush using strong chemicals, including one called carbon disulfide, then squeezed back out into thread.",
    healthStory:
      "The biggest harm lands on the factory workers. Carbon disulfide is linked to nerve damage, heart disease, and more early deaths among the people who spin it. For you, the wearer, the worry is leftovers: bits of those chemicals, plus dyes and finishes, can stay in the cloth and make sensitive skin itch or break out. Some viscose even gets the same formaldehyde wrinkle-fighting treatment as cotton. On the comfy side, viscose has no plastic in it and breathes better against your skin than fibers made from oil.",
    whatToLookFor:
      "Pick closed-loop lyocell (like TENCEL) when you can. It is the cleaner version, because it reuses its chemicals and skips the carbon disulfide. Look for OEKO-TEX STANDARD 100 on any viscose you buy, and wash new pieces before wearing.",
    environment:
      "Making regular viscose puts harmful stuff into the air and water, and is often linked to cutting down old, rare forests.",
    shopFilter: "viscose",
    heroStat: {
      value: 150,
      suffix: "+",
      unit: "years",
      label: "of documented nerve and heart damage to the workers who make it, from one solvent: carbon disulfide",
    },
    enviroStory: [
      "Viscose is not one production standard. It is thousands of mills running the same chemistry at very different levels of control, which is why its water use spans from a few hundred litres per kilo to several thousand, and its carbon from about 2 to 11.",
      "The fiber itself is cellulose, so it biodegrades and sheds no plastic. The damage sits in production, in the solvent and the wastewater, not in the finished cloth against your skin.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: "300–3,000+",
        unit: "L/kg",
        compare: "virgin polyester: low",
        note: "Huge mill-to-mill range. Viscose is not one production standard.",
      },
      {
        label: "Carbon",
        value: "2–11",
        unit: "kg CO₂e/kg",
        compare: "virgin polyester: ~3.1",
        note: "Varies widely by region and method.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no",
        note: "Cellulose-based, though finishes and sealed landfills slow it.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes",
        note: "Cellulosic, not plastic.",
      },
    ],
    ethics: {
      title: "Who makes viscose",
      flags: ["Carbon disulfide worker harm", "River pollution"],
      body: [
        "Carbon disulfide, the core solvent, poisons the people who spin viscose. It is linked to nerve, psychiatric, and cardiovascular damage, and it is one of the longest-documented occupational harms in the whole textile industry.",
        "Changing Markets' Dirty Fashion investigations documented untreated viscose wastewater contaminating rivers and drinking water, and roughly a third of viscose has historically been traced back to endangered forests. Some producers are improving, but the floor is low.",
      ],
    },
    sources: [
      { title: "HEALTH EFFECTS - Toxicological Profile for Carbon Disulfide", publisher: "NCBI Bookshelf (ATSDR)", url: "https://www.ncbi.nlm.nih.gov/books/NBK601225/" },
      { title: "Exposure to carbon disulphide and ischaemic heart disease in a viscose rayon factory", publisher: "PMC (Br J Ind Med)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1007812/" },
      { title: "Rayon Allergy: Identifying Symptoms and Effective Treatments", publisher: "Wyndly", url: "https://www.wyndly.com/blogs/learn/rayon-allergy" },
      { title: "Dirty Fashion: how pollution in the global textiles supply chain is making viscose toxic", publisher: "Changing Markets Foundation", url: "https://changingmarkets.org/portfolio/dirty-fashion/" },
      { title: "CanopyStyle and endangered forests in viscose", publisher: "Canopy", url: "https://canopyplanet.org/" },
    ],
  },
  {
    slug: "rayon",
    name: "Rayon",
    natural: false,
    whatItIs:
      "Rayon is just the all-purpose name for fiber made from wood that has been dissolved and re-formed. Viscose is the most common kind, so *rayon* and *viscose* really mean the same material.",
    healthStory:
      "Because rayon is viscose, the story is the same. The sharpest danger is to workers handling carbon disulfide, which damages nerves and the heart at the levels they breathe in. What reaches you is leftovers: the chemicals used to make it can stay in the cloth and irritate skin or cause a rash, and a formaldehyde finish is sometimes added to fight wrinkles, leaving bits that bother sensitive skin. Rayon breathes and soaks up moisture, so it feels cool, but the cheapest, uncertified pieces are the ones most likely to carry leftover finish.",
    whatToLookFor:
      "Treat rayon and viscose as the exact same thing when you shop. Choose closed-loop lyocell as the safer version, pick OEKO-TEX STANDARD 100 pieces, and wash before the first wear.",
    environment:
      "Making regular rayon releases harmful chemicals and adds to the pressure to cut down rare forests.",
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
      "Soft *bamboo* clothing is almost never real bamboo fiber. It is bamboo *viscose*: bamboo mashed into pulp, dissolved in carbon disulfide, and turned into rayon. It is the same process and the same chemicals as ordinary viscose.",
    healthStory:
      "Do not let the *eco* and *natural* labels fool you. The US government's FTC has fined stores, including Kohl's and Walmart, and warned many more, for calling rayon *bamboo* and making false green claims, because the rayon process uses toxic chemicals and gives off harmful pollution. By law it must be called *rayon (or viscose) made from bamboo*. For your skin, the story is the same as viscose: carbon disulfide is the worker danger, and leftover chemicals, dyes, or formaldehyde finishes can irritate skin or cause a rash. Once the plant is dissolved into rayon, it gives your skin no special bonus.",
    whatToLookFor:
      "Be doubtful of any *bamboo* claim and read the fiber label. If it says rayon or viscose, treat it as viscose. Choose closed-loop bamboo lyocell, or OEKO-TEX STANDARD 100 cloth, instead.",
    environment:
      "Bamboo grows fast and needs little to thrive, but turning it into viscose with chemicals wipes out most of that green advantage.",
    shopFilter: null,
    heroStat: {
      value: 1.5,
      prefix: "$",
      suffix: "M+",
      decimals: 1,
      label: "in US fines to retailers who sold ordinary rayon as \"bamboo\"",
    },
    enviroStory: [
      "The important thing to understand is that soft \"bamboo\" fabric is bamboo *viscose*, so its environmental numbers are viscose's numbers, not the raw plant's. The living bamboo grows fast on little water, but that advantage is spent in the chemical processing.",
      "A 2025 life-cycle study found that the *processing*, not the bamboo plant, is what drives the footprint. Bamboo viscose is not cleaner than wood viscose.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: "300–3,000+",
        unit: "L/kg",
        compare: "virgin polyester: low",
        note: "Bamboo fabric is bamboo *viscose*, so its numbers are viscose's, not the raw plant's.",
      },
      {
        label: "Carbon",
        value: "2–11",
        unit: "kg CO₂e/kg",
        compare: "virgin polyester: ~3.1",
        note: "A 2025 study found the *processing*, not the bamboo plant, drives the footprint.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no",
        note: "Cellulose-based, same as wood viscose.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes",
        note: "Cellulosic, not plastic.",
      },
    ],
    ethics: {
      title: "The bamboo label problem",
      flags: ["Carbon disulfide worker harm", "Mislabeling"],
      body: [
        "Because bamboo fabric is viscose, it carries the same carbon disulfide worker harm as any other viscose. It is the same process and the same solvent.",
        "The FTC has repeatedly fined major retailers for selling rayon as \"bamboo,\" because bamboo's eco reputation does not survive the chemical process. By law it must be labeled rayon or viscose.",
      ],
    },
    sources: [
      { title: "Bamboo Textiles", publisher: "U.S. Federal Trade Commission", url: "https://www.ftc.gov/bamboo-textiles" },
      { title: "FTC doles out $1.3M in fines to retailers over bamboo rayon", publisher: "Retail Dive", url: "https://www.retaildive.com/news/ftc-doles-out-13m-in-fines-to-retailers-over-bamboo-rayon/410677/" },
      { title: "TENCEL Lyocell and Modal Fibers", publisher: "Lenzing TENCEL", url: "https://www.tencel.com/fibers" },
      { title: "FTC Seeks Largest-Ever Civil Penalty for Bogus Bamboo Marketing", publisher: "U.S. Federal Trade Commission", url: "https://www.ftc.gov/news-events/news/press-releases/2022/04/ftc-uses-penalty-offense-authority-seek-largest-ever-civil-penalty-bogus-bamboo-marketing-kohls" },
      { title: "Dirty Fashion: viscose supply chain pollution", publisher: "Changing Markets Foundation", url: "https://changingmarkets.org/portfolio/dirty-fashion/" },
    ],
  },
  {
    slug: "cotton",
    name: "Cotton",
    natural: true,
    whatItIs:
      "Cotton is a soft fiber that grows on a plant, picked from a fluffy pod called a boll. But most regular cotton is sprayed with a lot of bug and weed killers while it grows, including a weed killer called glyphosate.",
    healthStory:
      "Most of those field sprays break down or wash off before the cloth reaches you, so the chemistry added at the *end*, to the finished clothing, matters more. Cotton labeled *wrinkle-free*, *easy care*, or *no-iron* is often treated with a resin made from formaldehyde, a chemical known to cause cancer. It slowly releases into the air and can leave your skin red and itchy. The dyes used can also leave bits behind that sit against your skin all day. The good news: plain, untreated cotton breathes well and lets air move against your skin, so it stays comfy when it is hot.",
    whatToLookFor:
      "Look for GOTS-certified organic cotton, which bans formaldehyde, chlorine bleach, and cancer-linked dyes all the way through. Or look for the OEKO-TEX STANDARD 100 label. And always wash new cotton before you wear it, to rinse away loose finish and dye.",
    environment:
      "Regular cotton uses a lot of water and chemicals to grow. Organic farming uses far fewer chemicals.",
    shopFilter: "cotton",
    heroStat: {
      value: 2700,
      unit: "litres",
      label: "of water to grow one cotton t-shirt, about what a person drinks in two and a half years",
    },
    enviroStory: [
      "Cotton's environmental problem is water. A single t-shirt can take around 2,700 litres to grow, and a kilo of fiber runs from roughly 3,000 litres under efficient US irrigation to well over 8,000 in thirstier regions.",
      "Its carbon is moderate and varies with irrigation and the local power grid. The upside is that undyed cotton is a plant fiber, so it biodegrades and sheds no plastic.",
    ],
    enviroStats: [
      {
        label: "Water use",
        value: "3,000–10,000",
        unit: "L/kg",
        compare: "virgin polyester: very low (cotton's harm is water, polyester's is elsewhere)",
        note: "Swings by country: efficient US irrigation near 2,250, thirstier regions near 8,600.",
      },
      {
        label: "Carbon",
        value: "2–6",
        unit: "kg CO₂e/kg",
        compare: "virgin polyester: ~3.1",
        note: "The Cotton Inc life-cycle study lands near 5.9; it varies with irrigation and the local power grid.",
      },
      {
        label: "Biodegradable",
        value: "Yes",
        compare: "polyester: no",
        note: "Undyed cotton is roughly 86% gone in 35 days in lab tests.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "No",
        compare: "polyester: yes",
        note: "A plant fiber, not plastic.",
      },
    ],
    ethics: {
      title: "Who grows cotton",
      flags: ["Xinjiang forced labor", "Farmworker pesticide exposure"],
      body: [
        "Around a fifth of the world's cotton comes from Xinjiang, China, where investigations have documented coercive labor moving Uyghur and other minority workers into the fields. That evidence is the basis of the US ban on Xinjiang cotton imports.",
        "Cotton also uses a hugely disproportionate share of the world's pesticides, and the heaviest exposure falls on farmworkers in places where safety rules are weakest.",
      ],
    },
    sources: [
      { title: "FTC Seeks Largest-Ever Civil Penalty for Bogus Bamboo Marketing", publisher: "U.S. Federal Trade Commission", url: "https://www.ftc.gov/news-events/news/press-releases/2022/04/ftc-uses-penalty-offense-authority-seek-largest-ever-civil-penalty-bogus-bamboo-marketing-kohls" },
      { title: "What Is GOTS Certified Organic Cotton", publisher: "Q for Quinn", url: "https://www.qforquinn.com/blogs/news/what-is-gots-certified-organic-cotton-anyway-and-why-buy-into-it" },
      { title: "PUREPRESS: wrinkle-free and formaldehyde-free durable press", publisher: "Cotton Incorporated", url: "https://www.cottoninc.com/press-releases/smoothing-out-formaldehyde-wrinkle/" },
      { title: "The Impact of a Cotton T-Shirt", publisher: "World Wildlife Fund", url: "https://www.worldwildlife.org/stories/the-impact-of-a-cotton-t-shirt" },
      { title: "The Uyghur Genocide: An Examination of China's Breaches of the 1948 Genocide Convention", publisher: "New Lines Institute", url: "https://newlinesinstitute.org/uyghurs/the-uyghur-genocide-an-examination-of-chinas-breaches-of-the-1948-genocide-convention/" },
      { title: "The Deadly Chemicals in Cotton", publisher: "Environmental Justice Foundation", url: "https://ejfoundation.org/resources/downloads/the_deadly_chemicals_in_cotton.pdf" },
    ],
  },

  // ---- Synthetics + high-hazard ----
  {
    slug: "elastane",
    name: "Elastane",
    natural: false,
    whatItIs:
      "Elastane is the exact same fiber as spandex. The names mean the same thing, and Lycra is just a brand of it. It is a stretchy plastic yarn made by reacting a few chemicals together. The fiber itself is mostly harmless once finished. The health questions come from leftover processing chemicals and from whatever gets blended and coated onto it.",
    healthStory:
      "Because elastane is what makes clothes stretchy, it lives in the things you wear closest and sweat into most: leggings, swimwear, underwear, and base layers. Tests using fake sweat have found *BPA* and *antimony* moving out of polyester-elastane activewear and into the moisture on your skin. BPA is an *endocrine disruptor*, meaning it can mess with your hormones, and antimony is a metal you do not want soaking in. Water-repellent *PFAS* coatings are also linked to hormone, reproductive, and immune harm. The whole point of elastane is a tight fit, and that fit traps heat and sweat, which irritates skin and speeds up how much chemistry moves onto you. The fiber is mostly harmless. The company it keeps on your body is not.",
    whatToLookFor:
      "Look for an OEKO-TEX STANDARD 100 label to screen out PFAS, *phthalates*, and extra heavy metals. And choose pieces that use only a little elastane for stretch in an otherwise natural fabric, rather than head-to-toe synthetic blends.",
    environment:
      "Elastane comes from petroleum, never breaks down in nature, and ruins the recyclability of any natural fiber it is blended into.",
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
      "Most leather you buy is animal hide preserved with chromium, a metal. This is called chrome tanning. The problem is that with heat, light, or age, that chromium can change into a more dangerous form called *chromium VI*. Chromium VI is hard on skin and triggers allergies easily, which is why it sits at the center of leather's health story.",
    healthStory:
      "Chromium VI causes a serious itchy, red skin rash called *allergic contact dermatitis*, and it can set off that rash even in tiny amounts. Chromium is the third most common metal allergy after nickel and cobalt, affecting about 1 to 3 percent of adults, and once you have it, it tends to stick around. The risk is real enough that Europe set a strict limit on chromium VI in leather that touches skin. Experts think that limit alone prevents about 80 percent of new chromium rash cases. In one real case, chromium VI was found leaking out of shoes into fake sweat. So warm, sweaty contact, like shoes, watch straps, and waistbands, is where your exposure is highest.",
    whatToLookFor:
      "Choose *vegetable-tanned* leather, which uses plant ingredients instead of chromium. Or look for an OEKO-TEX Leather Standard or Leather Working Group label. Both test for and cap chromium VI and other harmful leftovers.",
    environment:
      "Chrome tanning creates wastewater full of chromium, while vegetable tanning cuts that toxic runoff by up to about 80 percent.",
    shopFilter: null,
    madeStory: [
      "Leather starts as raw animal hide, mostly a byproduct of the meat industry. Left alone, a hide rots. Tanning is the step that stops it, turning skin into a material that lasts for decades. How a tannery does that decides most of leather's health story.",
      "Most leather today is *chrome-tanned*, soaked in chromium salts that tan a hide in about a day and give it that soft, even feel. It is fast and cheap, and it is where leather's chromium risk begins. The older way, *vegetable tanning*, draws tannins from tree bark and leaves. It takes weeks and skips the chromium entirely. Traditional open-air tanneries, like the ones in Fez, still work the hides in stone pits and dry them in the sun.",
    ],
    madeImage: {
      src: "/fibers/leather/tannery.jpg",
      alt: "A worker smoothing a dyed hide out to dry at an open-air tannery",
      caption: "Hides dyed and dried in the sun at a traditional tannery.",
    },
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
      "Nylon is a plastic fiber made from oil-based building blocks. When it is made, not every piece links up perfectly, so a little leftover building-block chemical can stay in the fiber and slowly seep out. Most of nylon's health concerns come from the chemicals used to make and finish it, not from the plastic itself.",
    healthStory:
      "Nylon is almost always colored with *disperse dyes*, the number one cause of clothing-related skin allergies. These dyes do not really bond to the fiber, so the small dye molecules can rub off onto your skin. Two of them, Disperse Blue and Disperse Orange, show up as a trigger in roughly 5 to 7 percent of people with long-term eczema, and it is worst where clothes rub and you sweat. Nylon is also one of the heaviest *microplastic* shedders of any fabric. Microplastics are tiny bits of plastic that flake off the fabric. A single wash can release hundreds of thousands of these fibers, and they land on your skin and float into the air you breathe as you move. Those bits can carry dyes and other additives that leak out on contact.",
    whatToLookFor:
      "Look for an OEKO-TEX STANDARD 100 label, which limits dye allergens and leftover building-block chemicals. And choose undyed or light-colored, tightly woven nylon over deeply dyed stretchy pieces worn against your skin.",
    environment:
      "Nylon comes from fossil fuels, never breaks down in nature, and is a major source of microplastic pollution in water and air.",
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
      "Polyester is plastic (the same kind used in water bottles) spun into thread. Most of it is made using a metal called *antimony* as a helper chemical, and some antimony stays behind in the finished fabric. The fabric is then colored with *disperse dyes*, which sit on top of the fiber instead of truly bonding to it.",
    healthStory:
      "When polyester meets your sweat, a little of that *antimony* moves into the moisture on your skin. Antimony has been flagged as a *possible cause of cancer*, and more of it comes out in tight, warm activewear. Polyester is also the biggest cause of *disperse dye* skin allergies, which show up worst where you sweat and rub. On top of that, polyester sheds *microplastics*, tiny bits of plastic, onto your skin and into the air at home. Testing has also found *BPA*, a hormone-messing chemical, in polyester workout clothes at many times the safe limit. The amount from any one piece is small. But you wear it constantly and sweat into it.",
    whatToLookFor:
      "Choose OEKO-TEX STANDARD 100 certified polyester, which caps antimony, BPA, formaldehyde, and dye allergens. And do not be fooled by *recycled* polyester. It is still plastic, still sheds microplastics, often more than new polyester, and can carry higher BPA.",
    environment:
      "Polyester comes from fossil fuels, basically never breaks down in nature, and is a main driver of microplastic pollution.",
    shopFilter: null,
    heroStat: {
      value: 59,
      suffix: "%",
      label: "of all fabric made in 2024 was polyester. Nearly 6 in 10 new garments are plastic",
    },
    enviroStory: [
      "Polyester is the most solid set of numbers in this guide, and the news is not good. It made up 59 percent of all fiber produced in 2024, nearly six of every ten new garments, and the vast majority is virgin, fossil-based plastic.",
      "It does not biodegrade. It persists for centuries, fragmenting into ever-smaller microplastic, and it sheds plastic fibers into your water and air with every wash.",
    ],
    enviroStats: [
      {
        label: "Carbon",
        value: 3.1,
        decimals: 1,
        unit: "kg CO₂e/kg",
        compare: "organic cotton: ~1–3",
        note: "Fossil-derived. Updated data now includes methane from crude extraction.",
      },
      {
        label: "Biodegradable",
        value: "No",
        compare: "organic cotton: yes",
        note: "Persists for centuries, fragmenting into microplastic.",
      },
      {
        label: "Sheds plastic microfibers",
        value: "Yes",
        compare: "organic cotton: no",
        note: "One 6kg wash sheds about 496,000 plastic microfibers (Napper and Thompson, Plymouth).",
      },
    ],
    ethics: {
      title: "The cost of cheap plastic clothing",
      flags: ["Fossil-fuel feedstock", "Garment-worker wages"],
      body: [
        "Polyester is made from oil. Synthetic fiber production burns through a notable share of the world's oil and emits hundreds of millions of tonnes of CO2 a year.",
        "Separately, most of the garment workers who sew fast-fashion polyester earn far below a living wage. These are two different facts about the same cheap product, not cause and effect.",
      ],
    },
    sources: [
      { title: "Antimony release from polyester textiles by artificial sweat solutions", publisher: "Regulatory Toxicology and Pharmacology", url: "https://www.sciencedirect.com/science/article/pii/S0273230020302506" },
      { title: "Contact allergy from disperse dyes in textiles - a review", publisher: "Contact Dermatitis (Wiley)", url: "https://onlinelibrary.wiley.com/doi/10.1111/cod.12001" },
      { title: "Recycled polyester microplastic emissions and BPA", publisher: "Estroni", url: "https://estroni.com.au/pages/is-recycled-polyester-safe-the-hidden-bpa-antimony-risk-in-eco-activewear" },
      { title: "Materials Market Report 2025", publisher: "Textile Exchange", url: "https://textileexchange.org/app/uploads/2025/09/Materials-Market-Report-2025.pdf" },
      { title: "Release of synthetic microplastic plastic fibres from domestic washing machines", publisher: "Marine Pollution Bulletin (Napper & Thompson)", url: "https://www.sciencedirect.com/science/article/abs/pii/S0025326X16307639" },
      { title: "Living Wage", publisher: "Clean Clothes Campaign", url: "https://cleanclothes.org/faq/pay-living-wages" },
    ],
  },
  {
    slug: "acrylic",
    name: "Acrylic",
    natural: false,
    whatItIs:
      "Acrylic is a plastic fiber made mostly from an oil-based chemical called *acrylonitrile*. When acrylic is made, the linking is never perfect, so a tiny bit of leftover acrylonitrile stays in the fiber, historically estimated at under one part per million.",
    healthStory:
      "That leftover chemical is the concern. *Acrylonitrile* is classified as *cancer-causing in humans*, and workers in textile plants who were exposed for a long time showed higher rates of lung and colon cancer. Acrylonitrile can soak in through the skin, so warm, sweaty contact with a soft acrylic sweater or fleece is a real, if small, exposure over time. Acrylic also sheds a lot of *microplastics*, tiny bits of plastic, onto your skin and into the air at home. And like other synthetics, it carries dyes and finishing chemicals that can bother sensitive skin.",
    whatToLookFor:
      "Look for an OEKO-TEX STANDARD 100 label, which sets strict limits on leftover acrylonitrile and similar chemicals. And when you can, choose natural warm fibers like wool or cotton for knitwear worn against your skin.",
    environment:
      "Acrylic comes from fossil fuels, never breaks down in nature, and is one of the worst microplastic shedders in the wash.",
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
      "Polyurethane is a plastic coating or film. It is the material behind most so-called *vegan leather*. It is usually made by dissolving plastic resin in a heavy solvent called *DMF* and softening it with other chemicals. DMF is known to harm the liver and reproduction, and Europe lists it as a chemical of very high concern. Some of it can be left behind on the finished product.",
    healthStory:
      "Here is the honest part the marketing skips: *vegan leather* is almost always plastic (polyurethane or PVC), not a clean natural option, and it sits at the high-concern end. The chemicals that keep this plastic soft and bendy are often *phthalates*, which are *endocrine disruptors* that can mess with your hormones and soak in through skin. Some of them have been restricted over cancer concerns, including links to breast cancer. PVC versions add chlorine chemistry and other pollution worries, and leftover *DMF* solvent can linger in cheaper plastic. Worn against warm, sweaty skin, like a watchband, jacket, or bag lining, these are exactly the conditions that help those softening chemicals move onto you.",
    whatToLookFor:
      "If you want a leather alternative, look for water-based PU, which skips the DMF solvent, plus an OEKO-TEX label that caps phthalates and DMF. And treat any unlabeled *vegan leather* as plastic until proven otherwise.",
    environment:
      "Polyurethane and PVC are fossil-fuel plastics that do not break down in nature and shed plastic bits as they wear and flake.",
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

/** Attach the canonical score, risk band, hazard color, and family to an entry. */
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
  if (!entry) return null;
  // Layer the generated rich content (the new detail sections) over the base
  // entry. Linen carries its rich fields inline, so it is absent from FIBER_RICH.
  const rich = FIBER_RICH[entry.slug];
  return withScore(rich ? { ...entry, ...rich } : entry);
}

export const BAND_META: Record<
  FiberBand,
  { label: string; blurb: string; rangeLabel: string }
> = {
  low: {
    label: "Safest choices",
    blurb:
      "Natural and clean regenerated fibers that sit well against skin. The fiber is rarely the problem here. The dyes and finishes are, so certification still matters.",
    rangeLabel: "68 to 100",
  },
  moderate: {
    label: "Wear with care",
    blurb:
      "Chemically regenerated fibers like generic viscose, rayon, and bamboo. The fiber breathes well, but you cannot see how clean the process was, and it often carries heavy dye or wrinkle finishes. A closed-loop or certified version scores much higher.",
    rangeLabel: "40 to 67",
  },
  high: {
    label: "Worth avoiding",
    blurb:
      "Plastics and chrome-tanned hide at the high-concern end. Microplastic shedding, endocrine disruptors, disperse-dye allergens, and residual monomers define this group.",
    rangeLabel: "0 to 39",
  },
};

const BAND_ORDER: FiberBand[] = ["low", "moderate", "high"];

/** All fibers grouped by band, each band sorted by score descending (cleanest first). */
export function fibersByBand(): { band: FiberBand; fibers: GuideFiber[] }[] {
  const all = FIBER_GUIDE.map(withScore);
  return BAND_ORDER.map((band) => ({
    band,
    fibers: all
      .filter((f) => f.band === band)
      .sort((a, b) => b.score - a.score),
  }));
}

export function allFiberSlugs(): string[] {
  return FIBER_GUIDE.map((f) => f.slug);
}
