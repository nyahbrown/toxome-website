// CommonJS mirror of lib/categoryGuard.ts for the node sourcing scripts
// (agent.js etc.), which can't import TypeScript. KEEP IN SYNC with the .ts.
//
// Deterministic last-mile guard: the LLM importers pick a category from the
// product TITLE and get fooled by compound names (a rug filed as Tops, a
// "Jacket, Bodysuit & Pant 3 Piece Set" filed as Bodysuits & Onesies). This
// only overrides when the title carries an unambiguous signal.

const HOME_RE =
  /\b(rugs?|towels?|washcloths?|wash cloths?|duvets?|comforters?|coverlets?|quilts?|pillowcases?|pillow shams?|shams?|napkins?|tablecloths?|table runners?|curtains?|bath mats?|crib sheets?|crib skirts?|playard sheets?|playpen sheets?|fitted sheets?|sheet sets?)\b/;

// Home department subcategories (Bedding / Bath / Throws & Blankets / Rugs).
// Picks the subcategory from the noun so the nav never shows a flat "Home"
// bucket. Bed pillows fall to Bedding by design.
function homeSubcategory(name) {
  if (/\b(rugs?|curtains?)\b/.test(name)) return "Rugs";
  if (/\b(towels?|washcloths?|wash cloths?|bath mats?|robes?)\b/.test(name)) return "Bath";
  if (/\b(throws?|blankets?)\b/.test(name)) return "Throws & Blankets";
  return "Bedding";
}
const SET_RE = /\b(set|sets)\b/;
const PIECE_RE = /\bpiece\b/;
const BODYSUIT_RE = /\b(bodysuit|bodysuits|onesie|onesies|coverall|coveralls)\b/;

// Women's Intimates splits into Bras / Underwear on `subcategory`. Mirror of
// lib/intimates.ts — see it for why "balconette" is listed and "demi" is not.
const BRA_RE = /\b(bras?|bralettes?|balconettes?)\b/;
const UNDERWEAR_RE =
  /\b(thongs?|briefs?|bikinis?|boxers?|boyshorts?|boy shorts?|hipsters?|panty|panties|shorty|shorties|cheeky|knickers?)\b/;

function deriveIntimatesSubcategory(name) {
  if (BRA_RE.test(name)) return "Bras";
  if (UNDERWEAR_RE.test(name)) return "Underwear";
  return null;
}

// Lookalikes: a bra/underwear noun in the title does NOT mean Intimates. Six
// sports bras live in Activewear and three bikini pieces in Swimwear, and all
// would match the two regexes above. These only veto an Intimates proposal.
// "bikini" alone is absent on purpose — unqualified, it IS underwear here.
const SPORTS_BRA_RE = /\bsports?\s*bra(lette)?s?\b/;
const SWIM_PIECE_RE = /\bbikini\s+(top|bottom)s?\b|\bswimsuits?\b|\bswim\s/;

function intimatesLookalikeCategory(name) {
  if (SPORTS_BRA_RE.test(name)) return "Activewear";
  if (SWIM_PIECE_RE.test(name)) return "Swimwear";
  return null;
}

/**
 * @param {{item_name:string, category:string|null, gender:string|null, age_band?:string|null, subcategory?:string|null}} input
 * @returns {{category:string|null, gender:string|null, age_band:string|null, subcategory:string|null, changed:boolean, reason?:string}}
 */
function guardCategory(input) {
  const name = (input.item_name || "").toLowerCase();
  const category = input.category;
  const gender = input.gender;
  const age_band = input.age_band == null ? null : input.age_band;
  const subcategory = input.subcategory == null ? null : input.subcategory;

  if (HOME_RE.test(name)) {
    const sub = homeSubcategory(name);
    return {
      category: sub,
      gender: "Home",
      age_band: null,
      subcategory: null,
      changed:
        category !== sub ||
        gender !== "Home" ||
        age_band !== null ||
        subcategory !== null,
      reason: "home-good",
    };
  }

  if ((gender || "").toLowerCase() === "kids") {
    const isSet = SET_RE.test(name) || PIECE_RE.test(name);
    if (isSet) {
      return {
        category: "Rompers & Sets",
        gender,
        age_band,
        subcategory: null,
        changed: category !== "Rompers & Sets" || subcategory !== null,
        reason: "kids-set",
      };
    }
    if (BODYSUIT_RE.test(name)) {
      return {
        category: "Bodysuits & Onesies",
        gender,
        age_band,
        subcategory: null,
        changed: category !== "Bodysuits & Onesies" || subcategory !== null,
        reason: "kids-bodysuit",
      };
    }
  }

  // Women's Underwear folds into Intimates; the distinction moves to
  // subcategory. Kids keep their own Underwear category on purpose.
  if (
    (gender || "").toLowerCase() === "women" &&
    (category === "Intimates" || category === "Underwear")
  ) {
    // Only ever corrects an Intimates proposal, so a correctly-filed sports bra
    // or bikini is never dragged out of its own category.
    const lookalike = intimatesLookalikeCategory(name);
    if (lookalike) {
      return {
        category: lookalike,
        gender,
        age_band,
        subcategory: null,
        changed: category !== lookalike || subcategory !== null,
        reason: "intimates-lookalike",
      };
    }
    const sub = subcategory || deriveIntimatesSubcategory(name);
    return {
      category: "Intimates",
      gender,
      age_band,
      subcategory: sub,
      changed: category !== "Intimates" || subcategory !== sub,
      reason: "intimates-merge",
    };
  }

  return { category, gender, age_band, subcategory, changed: false };
}

module.exports = { guardCategory };
