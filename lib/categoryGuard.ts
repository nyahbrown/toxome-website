// Deterministic category/department guard for the sourcing pipeline.
//
// The LLM-based importers pick a category from the product TITLE and get fooled
// by compound names: a "Hand-loomed Large Rug" became Tops, a "Jacket, Bodysuit
// & Pant 3 Piece Set" became Bodysuits & Onesies, "Playpen Sheet" landed in Kids.
// This is a last-mile guard run at every insert point. It only OVERRIDES when the
// title carries an unambiguous signal; otherwise it passes the proposed values
// through untouched.
//
// NOTE: keep this in sync with scripts/categoryGuard.js (CommonJS mirror used by
// the node sourcing scripts, which can't import TypeScript).

import {
  deriveIntimatesSubcategory,
  intimatesLookalikeCategory,
} from "@/lib/intimates";

export type GuardInput = {
  item_name: string;
  category: string | null;
  gender: string | null;
  age_band?: string | null;
  subcategory?: string | null;
};

export type GuardResult = {
  category: string | null;
  gender: string | null;
  age_band: string | null;
  subcategory: string | null;
  changed: boolean;
  reason?: string;
};

// Standalone home/bedding nouns. Deliberately conservative — excludes ambiguous
// apparel-adjacent words like "blanket" (swaddle blankets) and "scarf".
const HOME_RE =
  /\b(rugs?|towels?|washcloths?|wash cloths?|duvets?|comforters?|coverlets?|quilts?|pillowcases?|pillow shams?|shams?|napkins?|tablecloths?|table runners?|curtains?|bath mats?|crib sheets?|crib skirts?|playard sheets?|playpen sheets?|fitted sheets?|sheet sets?)\b/;

// Home department has real subcategories (Bedding / Bath / Throws & Blankets /
// Rugs), mirroring apparel. This picks the subcategory from the noun so the nav
// never shows a flat "Home" bucket again. Order matters: check the specific
// buckets first, default the rest (sheets, duvets, shams, pillowcases, quilts,
// mattress pads, bed pillows) to Bedding. Bed pillows live in Bedding by design.
function homeSubcategory(name: string): string {
  if (/\b(rugs?|curtains?)\b/.test(name)) return "Rugs";
  if (/\b(towels?|washcloths?|wash cloths?|bath mats?|robes?)\b/.test(name)) return "Bath";
  if (/\b(throws?|blankets?)\b/.test(name)) return "Throws & Blankets";
  return "Bedding";
}

// Multi-piece signals (kids): a set is never a single garment category.
const SET_RE = /\b(set|sets)\b/;
const PIECE_RE = /\bpiece\b/;

// One-piece infant garments — unambiguous when present and not a set.
const BODYSUIT_RE = /\b(bodysuit|bodysuits|onesie|onesies|coverall|coveralls)\b/;

export function guardCategory(input: GuardInput): GuardResult {
  const name = (input.item_name || "").toLowerCase();
  const category = input.category;
  const gender = input.gender;
  const age_band = input.age_band ?? null;
  const subcategory = input.subcategory ?? null;

  // 1) Home goods mis-filed as apparel — force the Home department + its real
  //    subcategory, and clear any age band that an apparel mis-tag left behind.
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

  // Kids-only corrections (department is carried on `gender`).
  if ((gender || "").toLowerCase() === "kids") {
    const isSet = SET_RE.test(name) || PIECE_RE.test(name);
    // 2) Multi-piece sets → Rompers & Sets (checked before bodysuit so a
    //    "Jacket, Bodysuit & Pant Set" lands as a set, not a bodysuit).
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
    // 3) Single one-piece infant garments → Bodysuits & Onesies.
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

  // 4) Women's Underwear is folded into Intimates — they were one shopping
  //    intent split by nothing, so any importer still proposing Underwear gets
  //    normalized here rather than re-forking the category. The real bra-vs-
  //    underwear distinction moves onto `subcategory`.
  //
  //    Kids keep their own Underwear category on purpose: "Intimates" is the
  //    wrong word for a 4-year-old, and there are no kids' bras to split.
  //
  //    An explicit subcategory always wins — the title is only the default.
  if (
    (gender || "").toLowerCase() === "women" &&
    (category === "Intimates" || category === "Underwear")
  ) {
    // A sports bra is Activewear and a bikini top is Swimwear, however the
    // importer filed them. Vetoed here rather than earlier, so this only ever
    // corrects an Intimates proposal and never drags a correctly-filed garment
    // out of its own category.
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
