// One place that answers "does this section + category carry a second-level
// filter, and what are its options?". Both Intimates and Activewear split on the
// shared products.subcategory column; this registry keeps the shop UI and the
// admin editor from hardcoding either one. Add a new split here and every
// surface picks it up.

import { INTIMATES_SUBCATEGORIES, hasIntimatesSplit } from "./intimates";
import { ACTIVEWEAR_SUBCATEGORIES, hasActivewearSplit } from "./activewear";

export type SubfilterConfig = {
  // Pill / accordion / field label shown to the shopper. "Type" for both splits
  // today — the parent category already names what's being typed.
  label: string;
  options: readonly string[];
};

// The sub-filter config for a section + category, or null when the pairing has
// no split. `section` is the lowercase shop section ("women", "men", …); pass a
// lowercased gender when calling from the admin editor.
export function getSubfilter(
  section: string | null,
  category: string
): SubfilterConfig | null {
  if (hasIntimatesSplit(section, category))
    return { label: "Type", options: INTIMATES_SUBCATEGORIES };
  if (hasActivewearSplit(section, category))
    return { label: "Type", options: ACTIVEWEAR_SUBCATEGORIES };
  return null;
}

// Resolve a raw ?sub= value against the valid options for the current split,
// case-insensitively. Returns the canonical option casing, or null when there's
// no split or the value isn't one of its options — so a stale ?sub= link can't
// filter the grid down to nothing with a pill the shopper can't see to remove.
export function resolveSubcategory(
  section: string | null,
  category: string,
  raw: string | null | undefined
): string | null {
  const cfg = getSubfilter(section, category);
  if (!cfg || !raw) return null;
  return cfg.options.find((o) => o.toLowerCase() === raw.toLowerCase()) ?? null;
}
