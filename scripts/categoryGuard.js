// CommonJS mirror of lib/categoryGuard.ts for the node sourcing scripts
// (agent.js etc.), which can't import TypeScript. KEEP IN SYNC with the .ts.
//
// Deterministic last-mile guard: the LLM importers pick a category from the
// product TITLE and get fooled by compound names (a rug filed as Tops, a
// "Jacket, Bodysuit & Pant 3 Piece Set" filed as Bodysuits & Onesies). This
// only overrides when the title carries an unambiguous signal.

const HOME_RE =
  /\b(rugs?|towels?|washcloths?|wash cloths?|duvets?|comforters?|coverlets?|quilts?|pillowcases?|pillow shams?|shams?|napkins?|tablecloths?|table runners?|curtains?|bath mats?|crib sheets?|crib skirts?|playard sheets?|playpen sheets?|fitted sheets?|sheet sets?)\b/;
const SET_RE = /\b(set|sets)\b/;
const PIECE_RE = /\bpiece\b/;
const BODYSUIT_RE = /\b(bodysuit|bodysuits|onesie|onesies|coverall|coveralls)\b/;

/**
 * @param {{item_name:string, category:string|null, gender:string|null, age_band?:string|null}} input
 * @returns {{category:string|null, gender:string|null, age_band:string|null, changed:boolean, reason?:string}}
 */
function guardCategory(input) {
  const name = (input.item_name || "").toLowerCase();
  const category = input.category;
  const gender = input.gender;
  const age_band = input.age_band == null ? null : input.age_band;

  if (HOME_RE.test(name)) {
    return {
      category: "Home",
      gender: "Home",
      age_band: null,
      changed: category !== "Home" || gender !== "Home" || age_band !== null,
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
        changed: category !== "Rompers & Sets",
        reason: "kids-set",
      };
    }
    if (BODYSUIT_RE.test(name)) {
      return {
        category: "Bodysuits & Onesies",
        gender,
        age_band,
        changed: category !== "Bodysuits & Onesies",
        reason: "kids-bodysuit",
      };
    }
  }

  return { category, gender, age_band, changed: false };
}

module.exports = { guardCategory };
