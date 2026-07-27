/**
 * Indexable department + category pages: /shop/women/tops, /shop/home/bedding, …
 *
 * WHY THIS EXISTS. The shop's category filter is a query parameter
 * (/shop/women?category=Tops). Google does not treat query-param views as
 * separate pages, so every category the catalog carries was invisible to
 * search. These are real routes with their own <title>, H1, meta description,
 * server-rendered intro copy and FAQ schema, built on the same pattern as
 * lib/shopPages.ts (the /shop/collection/[slug] pages).
 *
 * NAMING (Nyah, 2026-07-27): Women / Men / Home lead with "natural fiber", the
 * headline term she wants to own. KIDS DELIBERATELY STAYS "non-toxic" — parents
 * search "non-toxic baby clothes", not "natural fiber baby clothes". Do not
 * "fix" the kids wording for consistency; the inconsistency is the point.
 *
 * The department word is always kept ("women's natural fiber tops", not
 * "natural fiber tops") so /shop/women/tops and /shop/men/tops don't render a
 * byte-identical H1 and compete with each other.
 *
 * WHAT IS DELIBERATELY ABSENT. A category only earns a page if it has enough
 * real stock to be worth landing on, and if it is not already covered by a
 * collection in lib/shopPages.ts:
 *   · Home > Mattresses  → /shop/collection/non-toxic-mattresses is the same
 *     product set exactly (Home has one gender), so a category page would be a
 *     true duplicate.
 *   · Women > Swimwear   → /shop/collection/non-toxic-swimwear already covers it.
 *   · Women > Footwear (4), Home > Rugs (5), Kids > Outerwear (4), Men >
 *     Swimwear (2) → too thin. A near-empty page is worse than no page.
 * Revisit as those categories fill; adding an entry here is all it takes.
 */
import type { Product } from "@/types/product";
import type { ShopSection } from "@/app/shop/ShopClient";
import type { CollectionFaq } from "@/lib/shopPages";

export type ShopCategoryPage = {
  // Department this lives under. Also the first URL segment: /shop/{section}/…
  section: Exclude<ShopSection, null>;
  // Second URL segment. Kebab-case, derived from `category` but stored
  // explicitly so "Throws & Blankets" can't silently produce a broken slug.
  slug: string;
  // The exact `products.category` value this page selects.
  category: string;
  // SEO <title>, keyword-first.
  title: string;
  // Page H1, rendered by ShopClient via its `heading` prop. Lowercase per the
  // site's case rule.
  heading: string;
  // Meta description.
  description: string;
  // Unique server-rendered intro. Carries the page's rankable text, since
  // ShopClient renders the grid client-side.
  intro: string;
  faqs: CollectionFaq[];
  // H1 override per `products.subcategory` value, for a category that splits
  // (Women > Intimates, Women > Activewear). Keyed by the exact subcategory
  // string the sub-filter emits. Absent = the category's own heading stands.
  subcategoryHeadings?: Record<string, string>;
};

// The one FAQ every page shares: what the score actually is. Repeated verbatim
// across pages is fine in an FAQ block; it is the answer to the question the
// page keeps prompting, and each page's other two FAQs are category-specific.
const SCORE_FAQ: CollectionFaq = {
  q: "How does Toxome score clothing?",
  a: "Toxome reads each garment's fiber composition and scores it on what that fiber does to your body, not on a brand's sustainability marketing. A higher score means a cleaner fiber. Composition is taken from what the brand publishes, so the score reflects the label, not our opinion of it.",
};

export const SHOP_CATEGORY_PAGES: ShopCategoryPage[] = [
  // ─────────────────────────────────────────────── Women
  {
    section: "women",
    slug: "tops",
    category: "Tops",
    title: "Women's Natural Fiber Tops: Organic Cotton, Linen & Silk | Toxome",
    heading: "women's natural fiber tops",
    description:
      "Women's tops in natural fibers, each scored by Toxome for its real fiber content. Organic cotton, linen, silk and hemp, no plastic blends.",
    intro:
      "a top spends more hours against your skin than almost anything else you own, which is why the fiber matters more here than in a coat. most of the tops sold today are polyester or a cotton-poly blend, because plastic is cheap and holds a print. every top on this page is a natural fiber, organic cotton, linen, silk, hemp or a clean blend of them, and carries a toxome score read off its actual composition.",
    faqs: [
      {
        q: "What are natural fiber tops made of?",
        a: "Natural fibers come from a plant or an animal rather than from petroleum. For tops that usually means cotton, organic cotton, linen, hemp, silk, or a wood-pulp fiber like TENCEL lyocell. Polyester, nylon, acrylic and elastane are plastics, and a top can be labeled cotton while still being half polyester.",
      },
      {
        q: "Are natural fiber tops better for sensitive skin?",
        a: "Natural fibers breathe and move moisture away from the skin, so they trap less sweat and heat than a plastic knit. That matters for anyone who overheats, gets contact irritation, or reacts to the finishes and dyes that synthetic fabrics need to hold color.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "women",
    slug: "dresses",
    category: "Dresses",
    title: "Women's Natural Fiber Dresses: Linen, Silk & Organic Cotton | Toxome",
    heading: "women's natural fiber dresses",
    description:
      "Natural fiber dresses for women, scored by fiber content. Linen, silk, organic cotton and clean blends, without the polyester.",
    intro:
      "a dress is a lot of fabric touching a lot of skin at once, and it is the category where polyester hides best, because a printed poly crepe photographs like silk and costs a fraction of it. these dresses are linen, silk, organic cotton and clean blends, each one scored on the composition the brand publishes. if a dress is 92% polyester, it does not appear here, no matter how it is marketed.",
    faqs: [
      {
        q: "Why are so many dresses made of polyester?",
        a: "Polyester is cheap, takes bright print well, resists wrinkling, and drapes in a way that mimics silk on a rack. That combination is why it dominates the dress category, and why a dress that looks and feels expensive is often almost entirely plastic.",
      },
      {
        q: "What is the best natural fiber for a summer dress?",
        a: "Linen and silk both move heat away from the body better than any synthetic. Linen is the more breathable of the two and gets softer with washing; silk is cooler against skin and drapes closer. Organic cotton voile and poplin sit between them.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "women",
    slug: "bottoms",
    category: "Bottoms",
    title: "Women's Natural Fiber Pants, Jeans & Skirts | Toxome",
    heading: "women's natural fiber bottoms",
    description:
      "Women's pants, jeans and skirts in natural fibers, scored by Toxome. Linen, organic cotton and hemp, with the synthetic stretch called out.",
    intro:
      "bottoms are where synthetic stretch creeps in quietly. a pair of jeans described as cotton is very often cotton with elastane, and the percentage is the part nobody prints large. these pants, jeans and skirts are linen, organic cotton and hemp, and where there is elastane the composition shows it, because the score is calculated on the real number rather than the headline fiber.",
    faqs: [
      {
        q: "Is elastane in jeans bad?",
        a: "Elastane, also sold as spandex or Lycra, is a synthetic polymer. A few percent is what makes stretch denim stretch, and it lowers a garment's score because it is plastic sitting against skin. It is a trade-off, not a disqualifier, which is why Toxome shows the percentage instead of hiding it.",
      },
      {
        q: "What are the best natural fiber pants for hot weather?",
        a: "Linen, by a wide margin. It is the most breathable common apparel fiber and it dries fast, which is why it has been worn in hot climates for thousands of years. Hemp behaves similarly and softens with wear.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "women",
    slug: "intimates",
    category: "Intimates",
    title: "Natural Fiber Bras & Underwear for Women, Scored | Toxome",
    heading: "women's natural fiber intimates",
    description:
      "Organic cotton bras and underwear scored by fiber content, including elastic-free and latex-free options for sensitive skin.",
    intro:
      "underwear is the highest-contact clothing you own: closest fit, longest wear, thinnest barrier, most sensitive skin. it is also almost entirely synthetic by default, because nylon and elastane are what make it stretch and hold shape. every piece here is a natural fiber base, mostly organic cotton, and includes the elastic-free and latex-free styles that exist for people who react to the usual construction.",
    // Intimates splits into two shopping intents, and they take DIFFERENT
    // terms (Nyah, 2026-07-27): bras go "non-toxic", matching the existing
    // /shop/collection/non-toxic-bras page and the way people search for them;
    // underwear goes "natural fiber" like the rest of the department.
    subcategoryHeadings: {
      Bras: "women's non-toxic bras",
      Underwear: "women's natural fiber underwear",
    },
    faqs: [
      {
        q: "Is organic cotton underwear worth it?",
        a: "Conventional cotton is one of the most pesticide-intensive crops grown, and underwear sits against mucous membranes and thin skin for most of the day. Organic cotton is the same fiber grown without those synthetic pesticides, which is a small change everywhere else and a meaningful one here.",
      },
      {
        q: "Can you get a bra with no synthetics at all?",
        a: "Yes, though the selection is small. Elastic-free and latex-free bras exist, built from 100% organic cotton with no elastane in the band, and they are the option people with latex sensitivity or contact irritation usually end up at. They fit differently from a stretch bra by design.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "women",
    slug: "sweaters",
    category: "Sweaters",
    title: "Women's Natural Fiber Sweaters: Wool, Cashmere & Alpaca | Toxome",
    heading: "women's natural fiber sweaters",
    description:
      "Wool, cashmere, alpaca and organic cotton sweaters for women, scored by Toxome so you can see the acrylic content before you buy.",
    intro:
      "the sweater aisle is where acrylic pretends to be wool. acrylic is a plastic knit that pills, holds odor and traps heat without moving moisture, and it is in an enormous share of what gets sold as a cozy winter sweater. these are wool, merino, cashmere, alpaca and organic cotton, scored on composition, so a 50% acrylic blend cannot pass itself off as the real thing.",
    faqs: [
      {
        q: "Is acrylic yarn bad to wear?",
        a: "Acrylic is a synthetic made from petroleum. It does not breathe or wick the way wool does, so it holds sweat and odor against the skin, and it sheds plastic microfibers in the wash. It is warm and cheap, which is why it is everywhere, but it behaves nothing like the fiber it imitates.",
      },
      {
        q: "Which is better, merino or regular wool?",
        a: "Merino has a finer fiber diameter, which is why it feels soft rather than scratchy and can be worn against bare skin. Both are wool and both breathe and regulate temperature. Merino is the one to reach for if coarse wool irritates you.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "women",
    slug: "pajamas",
    category: "Pajamas",
    title: "Women's Natural Fiber Pajamas & Sleepwear, Scored | Toxome",
    heading: "women's natural fiber pajamas",
    description:
      "Organic cotton, silk and linen pajamas for women, scored by fiber. What you sleep in touches your skin for a third of your life.",
    intro:
      "you wear sleepwear longer than any other outfit you own, roughly a third of your life, on skin that is warm and slightly damp the whole time. that is the argument for caring what it is made of. these pajamas and sleep sets are organic cotton, silk and linen, each scored on the composition the brand publishes rather than on the word cozy.",
    faqs: [
      {
        q: "What is the healthiest fabric to sleep in?",
        a: "A breathable natural fiber. Organic cotton is the everyday answer, silk is the coolest against skin and the best for anyone who overheats, and linen regulates temperature in both directions. The shared trait is that they move moisture instead of holding it.",
      },
      {
        q: "Why does polyester sleepwear feel hot?",
        a: "Polyester does not absorb moisture, so sweat has nowhere to go and stays as a warm damp layer against the skin. Natural fibers pull that moisture into the fiber itself and release it, which is why the same room temperature feels different in cotton than in poly.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "women",
    slug: "activewear",
    category: "Activewear",
    title: "Women's Natural Fiber Activewear: Merino & Organic Cotton | Toxome",
    heading: "women's natural fiber activewear",
    description:
      "Natural fiber activewear for women, scored by Toxome. Merino wool and organic cotton alternatives to the all-polyester default.",
    intro:
      "activewear is the hardest category to do without plastic, and it is worth being straight about why: stretch and recovery come from elastane, and moisture-wicking synthetics were engineered for exactly this job. so the natural fiber options here are genuinely fewer, and they are mostly merino, which regulates temperature and resists odor without any of the chemistry. what is on this page is what actually clears the fiber bar, not a padded list.",
    faqs: [
      {
        q: "Is there such a thing as non-plastic activewear?",
        a: "Almost none of it is fully plastic-free, because elastane is what makes a legging hold its shape. Merino wool base layers come closest, and organic cotton works for lower-intensity movement. Toxome shows the synthetic percentage rather than pretending the category is cleaner than it is.",
      },
      {
        q: "Why is merino used for workout clothes?",
        a: "Merino moves moisture, regulates temperature in heat and cold, and resists odor naturally because of how the fiber handles bacteria. It does the job polyester was engineered to do, without the plastic, which is why it dominates the natural fiber end of this category.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "women",
    slug: "outerwear",
    category: "Outerwear",
    title: "Women's Natural Fiber Coats & Jackets, Scored | Toxome",
    heading: "women's natural fiber outerwear",
    description:
      "Wool, organic cotton and linen coats and jackets for women, scored by Toxome. The hardest clean category, honestly stocked.",
    intro:
      "clean outerwear is the scarcest thing in this catalog, and the reason is structural: a coat needs a weather-resistant shell, and weather resistance is what synthetics are good at. so this page is smaller than the others on purpose. what is here is real wool, organic cotton and linen, scored on composition, rather than a longer list padded out with polyester shells.",
    faqs: [
      {
        q: "Why is it so hard to find a coat that is not polyester?",
        a: "Water resistance, wind resistance and structure all come easily to synthetics and expensively to natural fibers. A wool coat does the same job through density rather than a plastic membrane, which costs more to make. That economics is why the category is thin, not a lack of looking.",
      },
      {
        q: "Is a wool coat warm enough in real winter?",
        a: "Dense wool has insulated people through winters for centuries and keeps working when damp, which is where down fails. The trade-off is weight and rain performance, not warmth.",
      },
      SCORE_FAQ,
    ],
  },

  // ─────────────────────────────────────────────── Men
  {
    section: "men",
    slug: "tops",
    category: "Tops",
    title: "Men's Natural Fiber Shirts & Tees: Organic Cotton & Linen | Toxome",
    heading: "men's natural fiber tops",
    description:
      "Men's shirts and t-shirts in natural fibers, scored by Toxome for real fiber content. Organic cotton, linen and hemp, no plastic blends.",
    intro:
      "the standard men's t-shirt is a cotton-poly blend, and the standard performance shirt is entirely plastic. both spend the whole day against skin. these tops are organic cotton, linen and hemp, each scored on the composition the brand publishes, so a shirt marketed as cotton has to actually be cotton to appear here.",
    faqs: [
      {
        q: "What is a tri-blend t-shirt made of?",
        a: "Usually cotton, polyester and rayon, in roughly equal parts. It is sold on softness and drape, and it is around half plastic. A tri-blend tee will score well below a 100% cotton one for that reason.",
      },
      {
        q: "Is linen good for men's shirts?",
        a: "Linen is the most breathable common shirting fiber and it dries quickly, which is why it is the traditional hot-weather choice. It wrinkles, which is the trade-off, and it softens considerably after the first several washes.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "men",
    slug: "bottoms",
    category: "Bottoms",
    title: "Men's Natural Fiber Pants, Jeans & Shorts | Toxome",
    heading: "men's natural fiber bottoms",
    description:
      "Men's pants, jeans and shorts in natural fibers, scored by Toxome. Organic cotton, linen and hemp, with any synthetic stretch shown.",
    intro:
      "denim used to be pure cotton and mostly is not anymore. a few percent elastane goes into most modern jeans for comfort, and it goes in without much announcement. these pants, jeans and shorts are organic cotton, linen and hemp, and where there is a synthetic in the blend the composition shows the number, because that is what the score is calculated from.",
    faqs: [
      {
        q: "Are 100% cotton jeans still made?",
        a: "Yes, though they are now the minority. Rigid, non-stretch denim is the traditional construction, it breaks in to the wearer's shape over time, and it scores higher than stretch denim because there is no elastane in it.",
      },
      {
        q: "What are hemp pants like to wear?",
        a: "Hemp is strong, breathable, and starts stiffer than cotton before softening substantially with wear and washing. It resists odor well and lasts noticeably longer than cotton in the same weight.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "men",
    slug: "sweaters",
    category: "Sweaters",
    title: "Men's Natural Fiber Sweaters: Wool, Merino & Cashmere | Toxome",
    heading: "men's natural fiber sweaters",
    description:
      "Wool, merino, cashmere and organic cotton sweaters for men, scored by Toxome so acrylic content is visible before you buy.",
    intro:
      "acrylic is the default in men's knitwear at most price points, and it is a plastic that pills, holds odor and does not breathe. these sweaters are wool, merino, cashmere, alpaca and organic cotton, scored on their real composition, which is the only way to tell a wool-blend sweater that is mostly wool from one that is mostly acrylic.",
    faqs: [
      {
        q: "How can you tell wool from acrylic?",
        a: "Read the composition label, because they look nearly identical on a rack. Wool feels cooler and slightly heavier in the hand, and springs back when compressed. Acrylic feels warmer and squeakier. The label is the reliable test, which is why Toxome scores on it.",
      },
      {
        q: "Does a wool-blend sweater still count as wool?",
        a: "It depends entirely on the percentage, which is the point. A 90% wool blend behaves like wool; a 30% wool, 70% acrylic blend behaves like plastic and is still legally sold as a wool-blend sweater. The score is calculated on the actual split.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "men",
    slug: "outerwear",
    category: "Outerwear",
    title: "Men's Natural Fiber Jackets & Coats, Scored | Toxome",
    heading: "men's natural fiber outerwear",
    description:
      "Wool and organic cotton jackets and coats for men, scored by fiber content. A deliberately short list, because clean outerwear is rare.",
    intro:
      "outerwear is the category where synthetics are hardest to avoid, because weather resistance is exactly what plastic does well. this page is short for that reason rather than for lack of searching. what is on it is real wool and organic cotton, scored on composition, not a polyester shell with a natural-sounding name.",
    faqs: [
      {
        q: "Is waxed cotton a natural fiber option?",
        a: "The base cloth is cotton and the wax finish gives it water resistance without a plastic membrane, which is the traditional answer to the problem. It is heavier than a synthetic shell and needs re-waxing over time.",
      },
      {
        q: "What about recycled polyester jackets?",
        a: "Recycled polyester keeps bottles out of landfill, which is a real environmental gain, but it is still polyester against your skin and still sheds microfibers. Toxome scores on what the fiber does to your body, so it rates the same as virgin polyester.",
      },
      SCORE_FAQ,
    ],
  },
  {
    // Men's stock here is boxers, briefs and trunks with no bras in it, so
    // "Intimates" was the wrong word (Nyah, 2026-07-27). The 13 rows were moved
    // to category='Underwear' in Supabase, which is safe because the
    // Underwear→Intimates merge in lib/categoryGuard.ts is gender-gated to
    // women and both Intimates collections in lib/shopPages.ts are too.
    section: "men",
    slug: "underwear",
    category: "Underwear",
    title: "Men's Natural Fiber Underwear: Organic Cotton & Hemp | Toxome",
    heading: "men's natural fiber underwear",
    description:
      "Organic cotton and hemp underwear for men, scored by Toxome. The highest-contact garment you own, read by fiber.",
    intro:
      "underwear is the highest-contact, longest-wear clothing there is, and the default is a synthetic blend built for stretch. these are organic cotton and hemp, scored on composition, including the styles that keep the synthetic content to the waistband instead of the whole garment.",
    faqs: [
      {
        q: "Is hemp underwear comfortable?",
        a: "Hemp is naturally antibacterial and breathable, which makes it well suited to underwear specifically, and it softens with each wash. It starts firmer than cotton and ends up comparable.",
      },
      {
        q: "Can underwear be completely synthetic-free?",
        a: "The fabric can be. The elastic waistband usually is not, since that is what elastane is for. Elastic-free styles exist and score highest, and a garment that keeps the synthetic to the band scores well above one that is a synthetic blend throughout.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "men",
    slug: "activewear",
    category: "Activewear",
    title: "Men's Natural Fiber Activewear: Merino Wool & Cotton | Toxome",
    heading: "men's natural fiber activewear",
    description:
      "Merino wool and organic cotton activewear for men, scored by Toxome. The honest short list in a category built on polyester.",
    intro:
      "performance fabric is a synonym for plastic. that is not a criticism of how it performs, it is a description of what it is. the natural fiber alternative in this category is mostly merino, which handles moisture, temperature and odor without the chemistry, and it is a short list because that is how many pieces genuinely clear the bar.",
    faqs: [
      {
        q: "Does merino work as well as synthetic performance fabric?",
        a: "For temperature regulation and odor resistance, better. For extreme stretch and fast drying, synthetics still win. Merino is the natural fiber that competes on performance rather than only on comfort.",
      },
      {
        q: "Why does synthetic workout gear smell?",
        a: "Polyester does not absorb moisture, so sweat sits on the fiber surface where odor-causing bacteria feed on it. Wool draws moisture into the fiber and away from that surface, which is why the same amount of sweat produces far less smell.",
      },
      SCORE_FAQ,
    ],
  },

  // ─────────────────────────────────────────────── Kids (stays "non-toxic")
  {
    section: "kids",
    slug: "bodysuits-onesies",
    category: "Bodysuits & Onesies",
    title: "Non-Toxic Baby Bodysuits & Onesies, GOTS Organic Cotton | Toxome",
    heading: "non-toxic baby bodysuits & onesies",
    description:
      "GOTS organic cotton bodysuits and onesies for babies, scored by Toxome. Certified fiber on newborn skin, no plastic blends.",
    intro:
      "a bodysuit covers nearly all of a baby's skin, and newborn skin is thinner and more permeable than adult skin, so it absorbs more of what it touches. every onesie here is organic cotton, most of it GOTS certified, which covers the dyes and finishes as well as the fiber itself. no polyester, no flame-retardant treatments.",
    faqs: [
      {
        q: "Why does GOTS matter for baby clothes?",
        a: "GOTS certifies the whole chain, not only that the cotton was grown organically. It restricts the dyes, finishes and processing chemicals that can be used, which is the part an organic cotton claim on its own does not cover. On a garment worn against newborn skin all day, that difference is the whole point.",
      },
      {
        q: "Is polyester safe for babies?",
        a: "Polyester does not breathe, so it traps heat and moisture against skin that is already prone to rashes and overheating. It also carries the finishes needed to make plastic behave like fabric. Natural fibers are the safer default for anything worn next to the skin at this age.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "kids",
    slug: "tops",
    category: "Tops",
    title: "Non-Toxic Kids' Tops & T-Shirts, Organic Cotton | Toxome",
    heading: "non-toxic kids' tops",
    description:
      "Organic cotton tops and t-shirts for kids, scored by Toxome. Certified natural fiber without the plastic blends or printed coatings.",
    intro:
      "kids' t-shirts are where two problems meet: cheap cotton-poly blends, and plastisol prints, which are the thick rubbery graphics that sit on top of the fabric rather than in it. the tops here are organic cotton, scored on composition, and skew toward the plain and the printed-with-pigment rather than the plastic-coated.",
    faqs: [
      {
        q: "What is a plastisol print?",
        a: "It is the standard screen-print ink on graphic tees: a PVC-based plastic layer that sits on the fabric surface, which is why the graphic feels rubbery and sealed. It is a plastic sitting on a garment worn against skin, and it is why a 100% cotton tee is not automatically a clean one.",
      },
      {
        q: "Do kids need organic cotton specifically?",
        a: "Children have more skin surface relative to body weight than adults and their skin is more permeable, so anything that transfers from fabric transfers proportionally more. Organic cotton removes the pesticide load from the growing side, and a GOTS certification also restricts the dyes.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "kids",
    slug: "bottoms",
    category: "Bottoms",
    title: "Non-Toxic Kids' Pants, Leggings & Shorts | Toxome",
    heading: "non-toxic kids' bottoms",
    description:
      "Organic cotton pants, leggings and shorts for kids, scored by Toxome for real fiber content and certification.",
    intro:
      "kids' leggings and joggers are usually a cotton blend with elastane for stretch, and often a polyester fleece inside where you cannot see it. these bottoms are organic cotton, scored on their full composition, so a soft fleece lining cannot quietly be plastic.",
    faqs: [
      {
        q: "Is fleece bad for kids?",
        a: "Most fleece is polyester, which means it is a plastic knit that traps heat and sheds microfibers in every wash. Organic cotton fleece exists and behaves the same way to wear. Check the composition, because the word fleece describes the construction, not the fiber.",
      },
      {
        q: "How much elastane is acceptable in kids' clothes?",
        a: "A few percent is what makes leggings recover their shape, and it is a real trade-off rather than a disqualifier. Toxome shows the percentage so a garment that is 95% organic cotton reads differently from one that is 60% polyester with a stretch claim.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "kids",
    slug: "rompers-sets",
    category: "Rompers & Sets",
    title: "Non-Toxic Baby Rompers & Two-Piece Sets, Organic | Toxome",
    heading: "non-toxic kids' rompers & sets",
    description:
      "Organic cotton rompers and coordinated sets for babies and kids, scored by Toxome on certified natural fiber.",
    intro:
      "a romper is a bodysuit with more surface area, and a two-piece set is the same fiber question asked twice. these are organic cotton, largely GOTS certified, scored on the composition the brand publishes rather than on the softness of the marketing.",
    faqs: [
      {
        q: "What should a baby romper be made of?",
        a: "Organic cotton for most of the year, and organic cotton with wool for cold weather. Both breathe and move moisture, which matters because babies regulate temperature poorly and overheat easily. Avoid polyester next to skin.",
      },
      {
        q: "Are flame retardants used in baby clothes?",
        a: "In the US, sleepwear must either be flame-resistant or snug-fitting. Snug-fitting cotton sleepwear meets the standard through the fit rather than through a chemical treatment, which is why tight-fitting cotton pajamas exist as a category. Day clothes like rompers are not subject to the rule.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "kids",
    slug: "dresses",
    category: "Dresses",
    title: "Non-Toxic Girls' Dresses, Organic Cotton & Linen | Toxome",
    heading: "non-toxic kids' dresses",
    description:
      "Organic cotton and linen dresses for girls, scored by Toxome. Natural fiber instead of the polyester tulle and party-dress default.",
    intro:
      "children's party dresses are the most reliably synthetic garment in any kids' section: polyester tulle, polyester satin, polyester lining, all of it against skin for an entire afternoon. the dresses here are organic cotton and linen, scored on fiber, cut for actual wearing rather than for one photograph.",
    faqs: [
      {
        q: "Why is kids' occasion wear almost always polyester?",
        a: "Tulle, satin and taffeta all hold their structure and shine cheaply in polyester and expensively in silk or cotton. Since the garment is expected to be worn a handful of times, the market optimizes for how it looks in a photo, not for what it is against skin.",
      },
      {
        q: "What is a good natural fiber for a girls' summer dress?",
        a: "Cotton voile, poplin and linen. All three breathe, wash well, and hold up to being played in, which polyester lining and tulle do not do comfortably in heat.",
      },
      SCORE_FAQ,
    ],
  },

  // ─────────────────────────────────────────────── Home
  {
    section: "home",
    slug: "bedding",
    category: "Bedding",
    title: "Natural Fiber Bedding: Organic Cotton & Linen Sheets | Toxome",
    heading: "natural fiber bedding",
    description:
      "Organic cotton, linen and TENCEL bedding scored by Toxome. You spend a third of your life on these sheets.",
    intro:
      "you spend about a third of your life in direct contact with your sheets, more hours than with any garment you own, on skin that is warm and slightly damp for the whole stretch. that makes bedding the highest-exposure textile in the house and the easiest one to upgrade. these sheets, duvet covers and pillowcases are organic cotton, linen and TENCEL lyocell, scored on composition.",
    faqs: [
      {
        q: "What is the healthiest material for bed sheets?",
        a: "Organic cotton, linen and TENCEL lyocell all breathe and move moisture away from the body. Linen regulates temperature best across seasons, cotton is the softest everyday option, and lyocell sits coolest. Microfiber sheets are polyester and do none of this.",
      },
      {
        q: "Are microfiber sheets bad?",
        a: "Microfiber is finely woven polyester. It does not absorb moisture, so it traps body heat and sweat, and it sheds plastic microfibers with every wash. It is inexpensive and wrinkle-free, which is why it sells, but it is plastic you sleep on for eight hours a night.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "home",
    slug: "bath",
    category: "Bath",
    title: "Natural Fiber Towels & Bath Linens, Organic Cotton | Toxome",
    heading: "natural fiber bath",
    description:
      "GOTS organic cotton towels, bath sheets, mats and robes, scored by Toxome. Cotton that actually absorbs, without the finishes.",
    intro:
      "a towel meets clean, wet, open-pored skin, which is the most absorbent state it is in all day. it is also the one textile where a synthetic blend fails at the actual job, because polyester does not absorb water. these towels, bath sheets, mats and robes are organic cotton, much of it GOTS certified, scored on fiber.",
    faqs: [
      {
        q: "Why do some new towels not absorb water?",
        a: "Softener and silicone finishes are applied to make towels feel plush on the shelf, and they coat the fiber so it repels water instead of drawing it in. Washing a few times strips most of it. An untreated organic cotton towel absorbs correctly from the first use.",
      },
      {
        q: "What does GSM mean for towels?",
        a: "Grams per square metre, the weight of the fabric. Higher GSM means denser pile, so more absorbency and a longer drying time. Around 600 to 700 GSM is the plush end for a bath towel; 400 or below dries fast and feels thinner.",
      },
      SCORE_FAQ,
    ],
  },
  {
    section: "home",
    slug: "throws-blankets",
    category: "Throws & Blankets",
    title: "Natural Fiber Throws & Blankets: Wool, Alpaca & Cotton | Toxome",
    heading: "natural fiber throws & blankets",
    description:
      "Wool, alpaca, cotton and linen throws and blankets, scored by Toxome. The natural fiber answer to polyester fleece.",
    intro:
      "the throw on the sofa is almost always polyester fleece, which is a plastic knit that holds static, traps heat without moving moisture, and sheds microfibers in the wash. these throws and blankets are wool, alpaca, organic cotton and linen, scored on composition, warm because of the fiber rather than because of a coating.",
    faqs: [
      {
        q: "Is a wool blanket warmer than fleece?",
        a: "Wool insulates by trapping air in the fiber's natural crimp, and it keeps insulating when damp, which fleece and down do not. Fleece feels warmer instantly because it holds heat at the surface. Over a whole evening, wool holds a steadier temperature.",
      },
      {
        q: "Why is alpaca used for throws?",
        a: "Alpaca is hollow-cored, which makes it lighter and warmer than sheep's wool at the same weight, and it contains no lanolin, so people who find wool itchy or react to it usually do not react to alpaca.",
      },
      SCORE_FAQ,
    ],
  },
];

/** All routable {section, slug} pairs, for generateStaticParams + the sitemap. */
export function allCategoryPageParams(): { section: string; slug: string }[] {
  return SHOP_CATEGORY_PAGES.map((p) => ({ section: p.section, slug: p.slug }));
}

/** Slugs belonging to one department, in catalog order. */
export function categorySlugsForSection(section: string): ShopCategoryPage[] {
  return SHOP_CATEGORY_PAGES.filter((p) => p.section === section);
}

export function getCategoryPage(
  section: string,
  slug: string,
): ShopCategoryPage | null {
  return (
    SHOP_CATEGORY_PAGES.find(
      (p) => p.section === section && p.slug === slug.toLowerCase(),
    ) ?? null
  );
}

/**
 * Server-side product predicate for a category page. Department lives on
 * `gender`, matching lib/supabase.ts getShopTaxonomy.
 */
export function matchCategoryPage(page: ShopCategoryPage) {
  const dept =
    page.section === "women" ? "women"
    : page.section === "men" ? "men"
    : page.section === "kids" ? "kids"
    : "home";
  return (p: Product) =>
    (p.gender || "").toLowerCase() === dept && p.category === page.category;
}
