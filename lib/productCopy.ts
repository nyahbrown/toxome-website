/**
 * Server-rendered copy for product pages.
 *
 * WHY. The product detail UI is a client component, so a crawler received the
 * title, the JSON-LD and almost nothing else: an audit on 2026-07-27 measured a
 * MEDIAN of 102 server-rendered words per product page against 426 on the
 * category pages. 825 pages were competing on a title alone. Everything here is
 * built from data the product already carries, so no product ships thin and no
 * two products ship the same paragraph.
 *
 * Nothing in here invents a fact. Percentages come from fabric_composition, the
 * fiber clauses come from FIBER_SUMMARY in lib/fiberGuide.ts, and certifications
 * are only named when the row actually has them.
 */
import type { Product } from "@/types/product";
import type { CollectionFaq } from "@/lib/shopPages";
import { fiberGuideHref, getFiber } from "@/lib/fiberGuide";
import { SHOP_CATEGORY_PAGES } from "@/lib/shopCategoryPages";
import { slugifyBrand } from "@/lib/brands";

export type FiberLine = {
  /** Display name, as the label reads it ("organic cotton"). */
  label: string;
  /** Percentage, or null for a fibers_present row with no breakdown. */
  pct: number | null;
  /** Guide page for this fiber, when one covers it. */
  href: string | null;
  /** One standalone clause about the fiber. Empty when the guide has none. */
  summary: string;
};

const clean = (k: string) => k.toLowerCase().replace(/_/g, " ").trim();

/** Composition as display lines, richest first, each tied to its guide page. */
export function fiberLines(p: Product): FiberLine[] {
  const entries: [string, number | null][] = p.fabric_composition
    ? Object.entries(p.fabric_composition).sort((a, b) => b[1] - a[1])
    : (p.fibers_present ?? []).map((f) => [f, null] as [string, null]);

  return entries.map(([raw, pct]) => {
    // Resolve the summary THROUGH the guide slug, not off the raw resolveFiber
    // key. The two vocabularies differ on purpose (FiberGuideEntry.scoreKey),
    // and reading FIBER_SUMMARY directly silently missed every aliased fiber:
    // lyocell, merino, flax, spandex, viscose, recycled polyester and more all
    // returned "". The visible symptom was a 59% lyocell jacket explaining
    // COTTON, because the top fiber had no clause and the next one did.
    const href = fiberGuideHref(raw);
    const slug = href ? href.replace("/guide/", "").split("#")[0] : null;
    return {
      label: clean(raw),
      pct,
      href,
      summary: (slug && getFiber(slug)?.summary) || "",
    };
  });
}

/** The category page this product belongs on, when one exists. */
export function productCategoryPage(p: Product): { href: string; heading: string } | null {
  const dept = (p.gender || "").toLowerCase();
  const section =
    dept === "women" ? "women" : dept === "men" ? "men" : dept === "kids" ? "kids" : dept === "home" ? "home" : null;
  if (!section || !p.category) return null;
  const page = SHOP_CATEGORY_PAGES.find((c) => c.section === section && c.category === p.category);
  return page ? { href: `/shop/${section}/${page.slug}`, heading: page.heading } : null;
}

export function productBrandHref(p: Product): string | null {
  return p.brand ? `/brand/${slugifyBrand(p.brand)}` : null;
}

/**
 * The "what this is actually made of" paragraph. Reads as prose rather than a
 * spec dump, because a spec dump is what the retailer already publishes and is
 * not a reason for this page to exist.
 */
export function compositionParagraph(p: Product): string {
  const lines = fiberLines(p);
  if (!lines.length) return "";
  const name = p.item_name;

  const listed = lines
    .map((f) => (f.pct == null ? f.label : `${Math.round(f.pct)}% ${f.label}`))
    .join(", ");

  // "The Barefoot Slides is made of wool" reads wrong, and plural garment names
  // are common here (Slides, Kicks, Pants, Shorts, Socks, Jeans). A single
  // trailing "s" means plural; a double "s" does not, which is what keeps
  // Dress singular.
  const verb = /[^s]s$/i.test(name.trim()) ? "are" : "is";

  const parts: string[] = [];
  parts.push(
    lines.length === 1 && lines[0].pct != null && Math.round(lines[0].pct) === 100
      ? `The ${name} ${verb} made entirely of ${lines[0].label}.`
      : `The ${name} ${verb} ${listed}.`,
  );

  // One clause per fiber, capped at two: past that it reads as filler rather
  // than as an explanation.
  for (const f of lines.slice(0, 2)) {
    if (f.summary) parts.push(`${f.label.charAt(0).toUpperCase()}${f.label.slice(1)} is ${f.summary}`);
  }

  if (typeof p.toxome_score === "number") {
    parts.push(
      `That composition is what Toxome scores, and it earns ${p.toxome_score} out of 100 on the fiber scale, where 100 is cleanest.`,
    );
  }
  if (p.certifications?.length) {
    parts.push(
      `This piece carries ${p.certifications.slice(0, 3).join(", ")}, which ${
        p.certifications.length > 1 ? "cover" : "covers"
      } how the fiber was grown and processed, not just what it is.`,
    );
  }
  return parts.join(" ");
}

/** Two or three questions per product, at least one specific to its fiber. */
export function productFaqs(p: Product): CollectionFaq[] {
  const faqs: CollectionFaq[] = [];
  const lines = fiberLines(p);
  const top = lines[0];

  if (top) {
    const pct = top.pct == null ? "" : ` ${Math.round(top.pct)}%`;
    // Same plural rule as compositionParagraph: "What is the Barefoot Slides
    // made of?" is the kind of sentence that reads as machine-written.
    const plural = /[^s]s$/i.test(p.item_name.trim());
    faqs.push({
      q: `What ${plural ? "are" : "is"} the ${p.item_name} made of?`,
      // Deliberately NO fiber clause here: the next FAQ is "is {fiber} safe to
      // wear?" and the composition paragraph above already carries it. Saying
      // it a third time is what makes generated copy read as generated.
      a: `${plural ? "They are" : "It is"}${pct} ${top.label}${
        lines.length > 1
          ? `, blended with ${lines.slice(1).map((f) => (f.pct == null ? f.label : `${Math.round(f.pct)}% ${f.label}`)).join(" and ")}`
          : ""
      }.`,
    });
    if (top.summary) {
      faqs.push({
        q: `Is ${top.label} safe to wear?`,
        a: `${top.label.charAt(0).toUpperCase()}${top.label.slice(1)} is ${top.summary} Toxome rates every fiber on what it does to the body of the person wearing it, and publishes the reasoning rather than a badge. The score covers the fiber, not the dyes and finishes a mill adds later.`,
      });
    }
  }

  faqs.push({
    q: "How does Toxome score clothing?",
    a: "Toxome reads each garment's fiber composition and scores it on what that fiber does to your body, not on a brand's sustainability marketing. A higher score means a cleaner fiber. Composition is taken from what the brand publishes, so the score reflects the label rather than our opinion of it.",
  });
  return faqs;
}
