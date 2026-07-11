import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import RichText from "@/components/RichText";
import JsonLd from "@/components/JsonLd";
import AnimationProvider from "@/components/AnimationProvider";
import CountUp from "@/components/CountUp";
import MiniProductCard from "@/components/MiniProductCard";
import FaqAccordion from "@/app/verify/FaqAccordion";
import CertBadge from "@/components/CertBadge";
import { CERTIFICATIONS } from "@/lib/certifications";
import { availableLogos } from "@/lib/certLogos";
import {
  getShopTaxonomy,
  getPublishedProducts,
  getCleanerAlternatives,
} from "@/lib/supabase";
import { collectionSlugForFiber, hasFiber } from "@/lib/shopPages";
import type { Product } from "@/types/product";
import {
  getFiber,
  allFiberSlugs,
  FIBER_GUIDE,
  withScore,
  KIND_LABEL,
  type FiberBand,
  type GuideFiber,
} from "@/lib/fiberGuide";

export const revalidate = 86400;

const SITE = "https://toxome.app";
const APP_URL = "https://apps.apple.com/us/app/toxome/id6748622034";

// Strip the *emphasis* asterisks from editorial prose for plain-text schema.
const plain = (s: string) => s.replace(/\*/g, "").trim();

// Editorial verdict shown in the hero chip and sticky rail. Mirrors the score
// bands. Direction: higher score = cleaner = safer to wear.
const VERDICT: Record<FiberBand, string> = {
  low: "Safest to wear",
  moderate: "Wear with care",
  high: "Worth avoiding",
};

// Rail lead line. Falls back to a band-appropriate summary so all 28 fibers get
// a sensible sentence without per-fiber copy.
const RAIL_LEAD: Record<FiberBand, string> = {
  low: "About as gentle as fabric gets. The risk almost always comes from the finish, not the fiber.",
  moderate:
    "It breathes well, but you cannot see how clean the process was. A certified or closed-loop version scores much higher.",
  high: "A high-concern material. The chemistry sits close to your skin, so the label is what matters most.",
};

// Moderate and high-band fibers don't get a "shop this fiber" rail: you don't
// send someone to buy cleaner polyester. Instead they point at the clean fibers
// that serve the same use. `names` are the display labels (heading shows the
// first two, per the chosen "name the alternatives" style); `filters` are the
// shopFilter values used to pull real products. Some alternatives (cupro,
// vegetable-tanned leather, LENZING ECOVERO) have no product filter, so their
// rail tops up from getCleanerAlternatives.
// `slugs` are the alternative fibers' own guide pages (for contextual related
// links); `filters` are the shopFilter values used to pull real products. Some
// alternatives (cupro, vegetable-tanned leather, LENZING ECOVERO) have no
// product filter, so those rails top up from getCleanerAlternatives and use a
// generic heading rather than naming a piece we can't actually show.
const ALT_FIBERS: Record<
  string,
  { names: string[]; filters: string[]; slugs: string[] }
> = {
  // moderate
  acetate: { names: ["silk", "cupro"], filters: ["silk"], slugs: ["silk", "cupro"] },
  viscose: { names: ["LENZING™ ECOVERO™", "TENCEL lyocell"], filters: ["tencel"], slugs: ["ecovero", "tencel_lyocell"] },
  rayon: { names: ["LENZING™ ECOVERO™", "TENCEL lyocell"], filters: ["tencel"], slugs: ["ecovero", "tencel_lyocell"] },
  bamboo: { names: ["TENCEL lyocell", "organic cotton"], filters: ["tencel", "organic cotton"], slugs: ["tencel_lyocell", "organic_cotton"] },
  leather: { names: ["vegetable-tanned leather"], filters: [], slugs: [] },
  // high
  acrylic: { names: ["cashmere", "merino wool"], filters: ["cashmere", "merino wool"], slugs: ["cashmere", "merino_wool"] },
  polyester: { names: ["organic cotton", "TENCEL lyocell"], filters: ["organic cotton", "tencel", "linen"], slugs: ["organic_cotton", "tencel_lyocell", "linen"] },
  nylon: { names: ["merino wool", "organic cotton"], filters: ["merino wool", "organic cotton"], slugs: ["merino_wool", "organic_cotton"] },
  spandex: { names: ["organic cotton", "TENCEL lyocell"], filters: ["organic cotton", "tencel"], slugs: ["organic_cotton", "tencel_lyocell"] },
  elastane: { names: ["organic cotton", "TENCEL lyocell"], filters: ["organic cotton", "tencel"], slugs: ["organic_cotton", "tencel_lyocell"] },
  polyurethane: { names: ["vegetable-tanned leather"], filters: [], slugs: ["leather"] },
};

// Rail heading: name the first two alternatives when we can actually show them
// ("shop cashmere & merino wool instead"); fall back to a generic line when the
// alternative has no product filter, so the heading matches the pieces shown.
function altHeading(alt: { names: string[]; filters: string[] }): string {
  if (!alt.filters.length) return "shop cleaner pieces instead";
  return `shop ${alt.names.slice(0, 2).join(" & ")} instead`;
}

export function generateStaticParams() {
  return allFiberSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fiber = getFiber(slug);
  if (!fiber) return { title: "Toxome | Fabric Guide" };

  const { name, score } = fiber;
  // Answer-first, score-forward title. Trim to progressively shorter forms so
  // long fiber names keep the tag under ~60 characters.
  const candidates = [
    `Is ${name} Toxic or Safe? Health Score ${score}/100 | Toxome`,
    `Is ${name} Safe? Health Score ${score}/100 | Toxome`,
    `${name} Health Score ${score}/100 | Toxome`,
  ];
  const title = candidates.find((t) => t.length <= 60) ?? candidates[2];

  const lead = fiber.healthImpacts?.[0] ?? fiber.healthStory;
  const desc = plain(
    `${name} scores ${score}/100 for wearer health. ${lead}`
  ).slice(0, 158);

  return {
    title,
    description: desc,
    alternates: { canonical: `/guide/${slug}` },
    openGraph: { title, description: desc, url: `/guide/${slug}` },
  };
}

// The score ring geometry (r=46 → circumference ≈ 289.03). Offset draws the arc
// proportional to the score.
const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;

// Build the shop rail: real matches for this fiber (cleanest first), topped up
// with cleaner alternatives when the fiber has no filter, is high-hazard, or
// simply lacks four matching pieces.
async function shopRailProducts(f: GuideFiber): Promise<Product[]> {
  // Clean (low-band) fibers show their own pieces; moderate/high fibers show
  // their cleaner alternatives instead.
  const alt = ALT_FIBERS[f.slug];
  const filters = alt ? alt.filters : f.shopFilter ? [f.shopFilter] : [];
  let picks: Product[] = [];
  if (filters.length) {
    picks = (await getPublishedProducts())
      .filter((p) => !!p.item_image && filters.some((fl) => hasFiber(p, fl)))
      .sort((a, b) => (b.toxome_score ?? 0) - (a.toxome_score ?? 0))
      .slice(0, 4);
  }
  if (picks.length < 4) {
    const have = new Set(picks.map((p) => p.id));
    for (const p of await getCleanerAlternatives([], 4)) {
      if (picks.length >= 4) break;
      if (!have.has(p.id)) picks.push(p);
    }
  }
  return picks.slice(0, 4);
}

export default async function FiberGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fiber = getFiber(slug);
  if (!fiber) notFound();

  const f: GuideFiber = fiber;
  const [taxonomy, products] = await Promise.all([
    getShopTaxonomy(),
    shopRailProducts(f),
  ]);

  // Sentence-case form of the name for inline headings. Common fibers lowercase
  // ("is polyester safe to wear?"); branded/trademarked names keep their form
  // via sentenceName ("is LENZING™ ECOVERO™ safe to wear?").
  const lower = f.sentenceName ?? f.name.toLowerCase();

  // Certifications to surface as linked badges. Resolve each slug against the
  // shared CERTIFICATIONS catalog; unknown slugs are dropped so a typo can't
  // render an empty badge.
  const certLogos = availableLogos();
  const certList = (f.certs ?? [])
    .map((slug) => CERTIFICATIONS.find((c) => c.slug === slug))
    .filter((c): c is (typeof CERTIFICATIONS)[number] => Boolean(c));

  // Clean fibers shop themselves; moderate/high fibers redirect to alternatives.
  const alt = ALT_FIBERS[f.slug];
  // Heading + button copy for the shop rail.
  const shopHeading = alt ? altHeading(alt) : `shop ${lower}`;
  const shopNavLabel = alt ? "shop alternatives" : `shop ${lower}`;
  const shopAllLabel = alt ? "shop the clean edit" : `shop all ${lower}`;

  // Prefer the dedicated collection page over the generic ?fiber= filter. For
  // alternative fibers there's no single collection, so send them to the shop.
  const collectionSlug = collectionSlugForFiber(f.slug);
  const shopAllHref = alt
    ? "/shop"
    : collectionSlug
    ? `/shop/collection/${collectionSlug}`
    : f.shopFilter
    ? `/shop?fiber=${encodeURIComponent(f.shopFilter)}`
    : "/shop";

  // Contextual related fibers: lead with this fiber's own cleaner alternatives
  // (so acrylic points at cashmere and merino, not the same four every page),
  // then fill with the nearest-scoring fibers of the same kind.
  const allScored = FIBER_GUIDE.map(withScore);
  const bySlug = new Map(allScored.map((x) => [x.slug, x]));
  const relatedSlugs: string[] = [];
  const pushSlug = (slug: string) => {
    if (slug !== f.slug && bySlug.has(slug) && !relatedSlugs.includes(slug)) {
      relatedSlugs.push(slug);
    }
  };
  (alt?.slugs ?? []).forEach(pushSlug);
  allScored
    .filter((x) => x.kind === f.kind)
    .sort((a, b) => Math.abs(a.score - f.score) - Math.abs(b.score - f.score))
    .forEach((x) => pushSlug(x.slug));
  const related = relatedSlugs
    .slice(0, 4)
    .map((slug) => bySlug.get(slug)!)
    .filter(Boolean);

  // Which optional sections have data (drives both jump-nav and rendering).
  const hasMade = !!f.madeStory?.length;
  const hasGrades = !!f.grades;
  const hasCare = !!f.care?.length;
  const hasChips = !!f.lookFor?.length;
  const hasEnviro = !!f.enviroStats?.length;
  const hasEthics = !!f.ethics;

  // Visible FAQ = explicit list, else the auto-generated Q&As. The SAME array
  // feeds the accordion and the FAQPage schema so they can never drift. Answers
  // are stripped of emphasis asterisks for plain rendering.
  const faqItems = (
    f.faq ?? [
      { q: `Is ${lower} toxic to wear?`, a: f.healthStory },
      { q: `What should you look for when buying ${lower}?`, a: f.whatToLookFor },
      { q: `Is ${lower} better for the environment?`, a: f.environment },
    ]
  ).map((x) => ({ q: x.q, a: plain(x.a) }));

  const heroImage = f.heroImage ?? `/fibers/guide/${slug}.jpg`;
  const ringOffset = RING_C * (1 - f.score / 100);

  const pageUrl = `${SITE}/guide/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Fabric Guide", item: `${SITE}/guide` },
          { "@type": "ListItem", position: 3, name: f.name, item: pageUrl },
        ],
      },
      {
        "@type": "Article",
        headline: `${f.name}: fiber safety and health score`,
        description: plain(f.about ?? f.whatItIs).slice(0, 200),
        about: f.name,
        inLanguage: "en",
        mainEntityOfPage: pageUrl,
        author: { "@type": "Organization", name: "Toxome", url: SITE },
        publisher: {
          "@type": "Organization",
          name: "Toxome",
          url: SITE,
          logo: { "@type": "ImageObject", url: `${SITE}/icon.png` },
        },
        citation: f.sources.map((s) => ({
          "@type": "CreativeWork",
          name: s.title,
          url: s.url,
        })),
      },
      {
        // Synced to the visible FAQ (same faqItems array rendered below).
        "@type": "FAQPage",
        mainEntity: faqItems.map((x) => ({
          "@type": "Question",
          name: x.q,
          acceptedAnswer: { "@type": "Answer", text: x.a },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <Nav taxonomy={taxonomy} />
      <AnimationProvider />

      <div className="guide-page">
        {/* HERO — white text over the full-bleed image, no scrim (tight text
            shadows carry legibility). Not a .reveal target, to protect LCP. */}
        <header className="gp-hero">
          <div
            className="gp-hero-bg"
            role="img"
            aria-label={`${f.name} fiber, close up`}
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="gp-hero-inner">
            <span className="eyebrow">
              {KIND_LABEL[f.kind]} fiber · The fabric guide
            </span>
            <h1>{lower}</h1>
            {f.dek && <p className="gp-dek">{f.dek}</p>}
            <span className="gp-chip">
              <span className="gp-dot" style={{ background: f.color }} />
              {f.score} · {VERDICT[f.band]}
            </span>
          </div>
        </header>

        {/* HERO STAT — the one hand-picked, animated number that leads the
            page. Editorial per fiber (hemp: its environmental superpower). */}
        {f.heroStat && (
          <section className="gp-statband" aria-label="Key statistic">
            <div className="gp-statband-inner">
              <div className="gp-statband-num">
                {f.heroStat.display ? (
                  f.heroStat.display
                ) : (
                  <CountUp
                    value={f.heroStat.value}
                    decimals={f.heroStat.decimals}
                    prefix={f.heroStat.prefix}
                    suffix={f.heroStat.suffix}
                  />
                )}
                {f.heroStat.unit && (
                  <span className="gp-statband-unit">{f.heroStat.unit}</span>
                )}
              </div>
              <div className="gp-statband-copy">
                <div className="gp-statband-label">{f.heroStat.label}</div>
                {f.heroStat.sub && (
                  <p className="gp-statband-sub">{f.heroStat.sub}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* BODY — sticky split */}
        <div className="gp-body">
          <div className="gp-wrap">
            <div className="gp-split">
              {/* STICKY RAIL */}
              <aside className="gp-rail reveal">
                <span className="eyebrow">Health score</span>
                <div className="gp-ring">
                  <svg
                    width="104"
                    height="104"
                    viewBox="0 0 104 104"
                    style={{ transform: "rotate(-90deg)" }}
                    aria-hidden="true"
                  >
                    <circle
                      cx="52"
                      cy="52"
                      r={RING_R}
                      fill="none"
                      stroke="var(--hairline)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="52"
                      cy="52"
                      r={RING_R}
                      fill="none"
                      stroke={f.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={RING_C.toFixed(2)}
                      strokeDashoffset={ringOffset.toFixed(2)}
                    />
                    <text
                      x="52"
                      y="52"
                      transform="rotate(90 52 52)"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="var(--sans)"
                      fontSize="30"
                      fontWeight="700"
                      fill="var(--ink)"
                    >
                      {f.score}
                    </text>
                  </svg>
                </div>
                <div className="gp-verdict">{VERDICT[f.band]}</div>
                <div className="gp-cap">Health score of 100</div>
                <p className="gp-lead">{RAIL_LEAD[f.band]}</p>
                <div className="gp-cta">
                  <a className="gp-btn full" href="#shop">
                    {shopHeading}
                  </a>
                  <a
                    className="gp-btn ghost full"
                    href={APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    scan your closet
                  </a>
                </div>
                <nav className="gp-jump">
                  <a href="#about">about</a>
                  {hasMade && <a href="#made">how it&rsquo;s made</a>}
                  {hasGrades && <a href="#grades">grades</a>}
                  <a href="#health">health impacts</a>
                  {hasEnviro && <a href="#environment">environmental impact</a>}
                  {hasEthics && <a href="#ethics">ethics &amp; labor</a>}
                  {hasCare && <a href="#care">how to care for it</a>}
                  <a href="#shop">{shopNavLabel}</a>
                  <a href="#faq">questions</a>
                </nav>
              </aside>

              {/* RIGHT COLUMN */}
              <main>
                {/* ABOUT */}
                <section className="gp-sec reveal" id="about">
                  <div className="eyebrow gp-kick">About</div>
                  <h2>What is {lower}?</h2>
                  <p className="gp-prose">
                    <RichText text={f.about ?? f.whatItIs} />
                  </p>
                  {f.history && (
                    <div className="gp-aside">
                      <div className="gp-lbl">A brief history</div>
                      <p>
                        <RichText text={f.history} />
                      </p>
                    </div>
                  )}
                </section>

                {/* CULTIVATED & MADE */}
                {hasMade && (
                  <section className="gp-sec reveal" id="made">
                    <div className="eyebrow gp-kick">
                      {f.madeEyebrow ?? "How it’s made"}
                    </div>
                    <h2>{f.madeTitle ?? `How ${lower} is made`}</h2>
                    <p className="gp-prose">
                      <RichText text={f.madeStory![0]} />
                    </p>
                    {f.madeImage && (
                      <>
                        <div className="gp-figure">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.madeImage.src}
                            alt={f.madeImage.alt}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        {f.madeImage.caption && (
                          <div className="gp-figcap">{f.madeImage.caption}</div>
                        )}
                      </>
                    )}
                    {f.madeStory!.slice(1).map((para, i) => (
                      <p
                        className="gp-prose"
                        key={i}
                        style={i === 0 ? { marginTop: 22 } : undefined}
                      >
                        <RichText text={para} />
                      </p>
                    ))}
                  </section>
                )}

                {/* GRADES */}
                {hasGrades && (
                  <section className="gp-sec reveal" id="grades">
                    <div className="eyebrow gp-kick">Grades</div>
                    <h2>Not all {lower} is the same</h2>
                    <p className="gp-prose">
                      <RichText text={f.grades!.intro} />
                    </p>
                    <div className="gp-chipgroup">
                      {f.grades!.marks.map((m) => (
                        <span className="gp-pill" key={m}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* HEALTH IMPACTS */}
                <section className="gp-sec reveal" id="health">
                  <div className="eyebrow gp-kick">Health impacts</div>
                  <h2>Is {lower} safe to wear?</h2>
                  {(f.healthImpacts ?? [f.healthStory]).map((para, i) => (
                    <p className="gp-prose" key={i}>
                      <RichText text={para} />
                    </p>
                  ))}

                  {f.benefits?.length ? (
                    <>
                      <div className="gp-subh">What it does for your skin</div>
                      <ul className="gp-bene">
                        {f.benefits.map((b) => (
                          <li key={b.title}>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            <span>
                              <span className="gp-bt">{b.title}</span>{" "}
                              <RichText text={b.body} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  <div className="gp-subh">What to look for</div>
                  {certList.length > 0 && (
                    <>
                      <div className="gp-lbl">Certifications to look for</div>
                      <div className="gp-certs">
                        {certList.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/guide/certifications#${c.slug}`}
                            className="gp-cert"
                            aria-label={`${c.name}, open the certification guide`}
                          >
                            <CertBadge
                              slug={c.slug}
                              name={c.name}
                              abbr={c.abbr}
                              size={48}
                              logoSrc={certLogos.get(c.slug)}
                            />
                            <span className="gp-cert-name">{c.name}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                  {hasChips ? (
                    <>
                      <div className="gp-lbl">
                        {certList.length ? "Also look for" : "Look for"}
                      </div>
                      <div className="gp-chipgroup">
                        {f.lookFor!.map((m) => (
                          <span className="gp-pill" key={m}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : certList.length ? null : (
                    <p className="gp-prose">
                      <RichText text={f.whatToLookFor} />
                    </p>
                  )}

                  {f.scoredNote && (
                    <div className="gp-aside">
                      <div className="gp-lbl">How we scored it</div>
                      <p>
                        <RichText text={f.scoredNote} />
                      </p>
                    </div>
                  )}
                </section>

                {/* ENVIRONMENTAL IMPACT — standardized comparable tiles, each
                    number animated on scroll. Kept visually separate from the
                    wearer-health score above (different axis). */}
                {hasEnviro && (
                  <section className="gp-sec reveal" id="environment">
                    <div className="eyebrow gp-kick">Environmental impact</div>
                    <h2>How {lower} affects the planet</h2>
                    {(f.enviroStory ?? []).map((para, i) => (
                      <p className="gp-prose" key={i}>
                        <RichText text={para} />
                      </p>
                    ))}
                    <div className="gp-enviro">
                      {f.enviroStats!.map((s) => (
                        <div className="gp-envtile" key={s.label}>
                          <div className="gp-envlabel">{s.label}</div>
                          <div className="gp-envnum">
                            {typeof s.value === "number" ? (
                              <CountUp
                                value={s.value}
                                decimals={s.decimals}
                                prefix={s.prefix}
                                suffix={s.suffix}
                              />
                            ) : (
                              s.value
                            )}
                            {s.unit && (
                              <span className="gp-envunit">{s.unit}</span>
                            )}
                          </div>
                          {s.compare && (
                            <div className="gp-envcompare">vs {s.compare}</div>
                          )}
                          {s.note && <p className="gp-envnote">{s.note}</p>}
                        </div>
                      ))}
                    </div>
                    <p className="gp-envfine">
                      Environmental figures are separate from the health score
                      above, which reflects wearer health only. Numbers are
                      per kilogram of finished fiber and rounded; see sources.
                    </p>
                  </section>
                )}

                {/* ETHICS & LABOR — only rendered for fibers with a real story. */}
                {hasEthics && (
                  <section className="gp-sec reveal" id="ethics">
                    <div className="eyebrow gp-kick">Ethics &amp; labor</div>
                    <h2>{f.ethics!.title ?? `Who makes ${lower}`}</h2>
                    {f.ethics!.flags?.length ? (
                      <div className="gp-chipgroup">
                        {f.ethics!.flags.map((m) => (
                          <span className="gp-pill" key={m}>
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {f.ethics!.body.map((para, i) => (
                      <p
                        className="gp-prose"
                        key={i}
                        style={i === 0 && f.ethics!.flags?.length ? { marginTop: 18 } : undefined}
                      >
                        <RichText text={para} />
                      </p>
                    ))}
                  </section>
                )}

                {/* CARE */}
                {hasCare && (
                  <section className="gp-sec reveal" id="care">
                    <div className="eyebrow gp-kick">How to care for it</div>
                    <h2>How to care for {lower}</h2>
                    <div className="gp-care">
                      {f.care!.map((row) => (
                        <div className="gp-care-row" key={row.k}>
                          <div className="gp-care-k">{row.k}</div>
                          <div className="gp-care-v">
                            <RichText text={row.v} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* SHOP RAIL */}
                {products.length > 0 && (
                  <section className="gp-sec gp-shop reveal" id="shop">
                    <div className="gp-shop-head">
                      <div>
                        <h2>{shopHeading}</h2>
                        <div className="gp-shop-sub">
                          {alt
                            ? "Cleaner pieces that do the same job, scored for what touches your skin."
                            : "Real pieces in our directory, scored for what touches your skin."}
                        </div>
                      </div>
                      <Link className="gp-arrowlink" href={shopAllHref}>
                        {shopAllLabel}
                        <span className="gp-c">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </span>
                      </Link>
                    </div>
                    <div className="gp-pgrid">
                      {products.map((p) => (
                        <MiniProductCard key={p.id} p={p} showScore />
                      ))}
                    </div>
                  </section>
                )}

                {/* FAQ */}
                <section className="gp-sec reveal" id="faq">
                  <div className="eyebrow gp-kick">Questions</div>
                  <h2>{f.name}, answered</h2>
                  <FaqAccordion items={faqItems} />
                </section>

                {/* SOURCES */}
                <section className="gp-sec gp-fine reveal">
                  <div className="eyebrow gp-kick">Sources</div>
                  <ul className="gp-srclist">
                    {f.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.title}
                        </a>
                        <span> · {s.publisher}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="gp-disc">
                    The health score reflects wearer health only and mirrors the
                    Toxome app. This guide is educational and is not medical
                    advice.
                  </p>
                </section>

                {/* RELATED */}
                {related.length > 0 && (
                  <section className="gp-sec reveal">
                    <div className="eyebrow gp-kick">Related fibers</div>
                    <div className="gp-related">
                      {related.map((r) => (
                        <Link key={r.slug} href={`/guide/${r.slug}`}>
                          <span
                            className="gp-dot"
                            style={{ background: r.color }}
                          />
                          {r.name.toLowerCase()}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        /* Undo the site-wide lowercase transform: this page is written in
           natural sentence case. Eyebrows stay uppercase. */
        .guide-page { text-transform: none; }

        /* Smooth-scroll the jump-nav (about, health, environmental impact...)
           to its section instead of jumping. Scoped to guide pages, and
           disabled for reduced-motion users. scroll-margin-top on .gp-sec
           keeps the landing clear of the fixed nav. */
        html:has(.guide-page) { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          html:has(.guide-page) { scroll-behavior: auto; }
        }
        .guide-page .eyebrow {
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6B7178;
        }

        .guide-page .gp-wrap { max-width: 1160px; margin: 0 auto; padding: 0 32px; }
        .guide-page .gp-prose { font-size: 17px; line-height: 1.74; color: var(--ink-2); }
        .guide-page .gp-prose + .gp-prose { margin-top: 16px; }

        /* HERO */
        .guide-page .gp-hero {
          position: relative; min-height: 76vh; display: flex; align-items: center;
          justify-content: center; text-align: center; padding: 120px 24px; overflow: hidden;
        }
        .guide-page .gp-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background-position: center; background-size: cover; background-repeat: no-repeat;
        }
        .guide-page .gp-hero-inner {
          position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center;
        }
        .guide-page .gp-hero .eyebrow {
          color: #fff;
          text-shadow: 0 0 1px rgba(20,22,18,.65), 0 1px 2px rgba(20,22,18,.8), 0 1px 12px rgba(20,22,18,.45);
        }
        .guide-page .gp-hero h1 {
          font-family: var(--sans); font-weight: 600; font-size: clamp(56px, 10vw, 124px);
          line-height: .92; letter-spacing: -.04em; margin: 18px 0 20px; color: #fff;
          text-shadow: 0 1px 1px rgba(20,22,18,.4), 0 2px 14px rgba(20,22,18,.3);
        }
        .guide-page .gp-dek {
          color: #fff; font-size: 18px; font-weight: 500; max-width: 46ch;
          text-shadow: 0 0 1px rgba(20,22,18,.6), 0 1px 2px rgba(20,22,18,.8), 0 2px 14px rgba(20,22,18,.5);
        }
        .guide-page .gp-chip {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 24px;
          background: var(--white); border: 1px solid var(--hairline); border-radius: 999px;
          padding: 8px 16px; font-size: 14px; font-weight: 600; color: var(--ink);
          box-shadow: 0 1px 2px rgba(59,60,58,.04), 0 18px 40px -18px rgba(59,60,58,.14);
        }
        .guide-page .gp-dot { width: 9px; height: 9px; border-radius: 999px; flex: 0 0 auto; }

        /* BODY split */
        .guide-page .gp-body { padding: 0 0 40px; }
        .guide-page .gp-split {
          display: grid; grid-template-columns: 320px 1fr; gap: 72px; align-items: start; padding-top: 72px;
        }
        .guide-page .gp-rail { position: sticky; top: 96px; }
        .guide-page .gp-ring { margin-top: 18px; }
        .guide-page .gp-verdict { font-size: 16px; font-weight: 500; color: var(--ink); margin: 6px 0 2px; }
        .guide-page .gp-cap { font-size: 12px; color: #6B7178; letter-spacing: .04em; }
        .guide-page .gp-lead { font-size: 15px; color: var(--ink-2); line-height: 1.6; margin: 20px 0 22px; }
        .guide-page .gp-cta { display: flex; flex-direction: column; gap: 10px; max-width: 280px; }
        .guide-page .gp-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px;
          padding: 0 24px; border-radius: 999px; background: var(--ink); color: var(--cream);
          font-weight: 500; font-size: 15px;
          box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 6px 22px rgba(59,60,58,.10);
          transition: transform .16s var(--ease-out-strong);
        }
        .guide-page .gp-btn:active { transform: scale(.97); }
        .guide-page .gp-btn.ghost {
          background: transparent; color: var(--ink); border: 1px solid var(--hairline-strong); box-shadow: none;
        }
        .guide-page .gp-btn.full { width: 100%; }
        .guide-page .gp-jump { margin-top: 22px; display: flex; flex-direction: column; gap: 2px; }
        .guide-page .gp-jump a {
          font-size: 14px; color: var(--ink-2); display: inline-flex; align-items: center; min-height: 40px;
          transition: color .16s var(--ease-out-strong), transform .16s var(--ease-out-strong);
        }

        /* right-column sections */
        .guide-page .gp-sec { margin-bottom: 64px; scroll-margin-top: 96px; }
        .guide-page .gp-sec h2 {
          font-family: var(--sans); font-size: 22px; font-weight: 600; letter-spacing: -.01em;
          color: var(--ink); margin: 10px 0 16px; text-wrap: balance;
        }
        .guide-page .gp-kick { margin-bottom: 10px; }
        .guide-page .gp-figure {
          margin: 22px 0 4px; border-radius: 12px; overflow: hidden;
          box-shadow: 0 1px 2px rgba(59,60,58,.04), 0 18px 40px -18px rgba(59,60,58,.14);
        }
        .guide-page .gp-figure img { width: 100%; aspect-ratio: 16/10; object-fit: cover; }
        .guide-page .gp-figcap { font-size: 12px; color: #6B7178; margin-top: 10px; letter-spacing: .02em; }
        .guide-page .gp-aside { background: var(--tan); border-radius: 14px; padding: 18px 22px; margin: 24px 0; }
        .guide-page .gp-aside p { font-size: 14.5px; color: var(--ink-2); line-height: 1.62; }
        .guide-page .gp-subh { font-size: 14px; font-weight: 600; color: var(--ink); margin: 30px 0 12px; }

        /* HERO STAT band — the animated lead number, on cream below the image */
        .guide-page .gp-statband { padding: 56px 0 8px; }
        .guide-page .gp-statband-inner {
          max-width: 1160px; margin: 0 auto; padding: 0 32px;
          display: grid; grid-template-columns: auto 1fr; gap: 40px; align-items: center;
        }
        .guide-page .gp-statband-num {
          font-family: var(--sans); font-weight: 600; color: var(--ink);
          font-size: clamp(64px, 11vw, 132px); line-height: .9; letter-spacing: -.04em;
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }
        .guide-page .gp-statband-unit {
          font-size: .34em; font-weight: 600; color: var(--ink-2); margin-left: .18em; letter-spacing: -.01em;
        }
        .guide-page .gp-statband-copy { max-width: 44ch; }
        .guide-page .gp-statband-label {
          font-size: 20px; font-weight: 600; color: var(--ink); line-height: 1.35; letter-spacing: -.01em;
        }
        .guide-page .gp-statband-sub {
          font-size: 15px; color: var(--ink-2); line-height: 1.6; margin-top: 10px;
        }

        /* ENVIRONMENTAL impact tiles — neutral (no verdict color), animated nums */
        .guide-page .gp-enviro {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px; margin-top: 26px;
        }
        .guide-page .gp-envtile {
          background: var(--white); border: 1px solid var(--hairline-strong); border-radius: 14px;
          padding: 20px 18px 18px; display: flex; flex-direction: column;
          box-shadow: 0 1px 2px rgba(59,60,58,.04), 0 18px 40px -22px rgba(59,60,58,.12);
        }
        .guide-page .gp-envlabel {
          font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
          color: #6B7178; margin-bottom: 12px;
        }
        .guide-page .gp-envnum {
          font-family: var(--sans); font-weight: 600; color: var(--ink);
          font-size: 32px; line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums;
        }
        .guide-page .gp-envunit { font-size: .5em; font-weight: 600; color: var(--ink-2); margin-left: .16em; }
        .guide-page .gp-envcompare { font-size: 12.5px; color: #6B7178; margin-top: 8px; }
        .guide-page .gp-envnote { font-size: 13px; color: var(--ink-2); line-height: 1.55; margin-top: 12px; }
        .guide-page .gp-envfine { font-size: 12px; color: #6B7178; line-height: 1.6; margin-top: 16px; max-width: 70ch; }

        @media (max-width: 900px) {
          .guide-page .gp-statband-inner { grid-template-columns: 1fr; gap: 16px; }
          .guide-page .gp-enviro { grid-template-columns: repeat(2, 1fr); }
        }

        /* benefit list */
        .guide-page .gp-bene { list-style: none; display: grid; gap: 14px; margin: 6px 0 0; padding: 0; }
        .guide-page .gp-bene li { display: flex; gap: 12px; font-size: 16px; color: var(--ink-2); line-height: 1.55; }
        .guide-page .gp-bene .gp-bt { color: var(--ink); font-weight: 600; }
        .guide-page .gp-bene svg { flex: 0 0 auto; margin-top: 3px; color: var(--risk-low); }

        /* chips */
        .guide-page .gp-chipgroup { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 8px; }
        .guide-page .gp-pill {
          border: 1px solid var(--hairline-strong); border-radius: 999px; padding: 8px 14px;
          font-size: 13px; color: var(--ink-2);
        }
        .guide-page .gp-lbl {
          font-size: 11px; font-weight: 600; letter-spacing: .13em; text-transform: uppercase;
          color: #6B7178; margin: 18px 0 2px;
        }
        .guide-page .gp-aside .gp-lbl { margin: 0 0 6px; }

        /* certification badges (link out to the certification guide) */
        .guide-page .gp-certs {
          display: flex; flex-wrap: wrap; gap: 20px 26px; margin-top: 12px;
        }
        .guide-page .gp-cert {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          width: 88px; text-decoration: none; color: var(--ink-2);
          transition: transform .16s var(--ease-out-strong);
        }
        .guide-page .gp-cert .gp-cert-name {
          font-size: 12px; line-height: 1.3; text-align: center; letter-spacing: -.005em;
        }
        @media (hover: hover) and (pointer: fine) {
          .guide-page .gp-cert:hover { transform: translateY(-2px); }
          .guide-page .gp-cert:hover .gp-cert-name { color: var(--ink); }
        }

        /* care list */
        .guide-page .gp-care { display: grid; gap: 16px; margin-top: 6px; }
        .guide-page .gp-care-row { display: flex; gap: 14px; align-items: baseline; }
        .guide-page .gp-care-k { flex: 0 0 84px; font-weight: 600; color: var(--ink); font-size: 15px; }
        .guide-page .gp-care-v { font-size: 15.5px; color: var(--ink-2); line-height: 1.6; }

        /* shop rail */
        .guide-page .gp-shop-head {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 22px; flex-wrap: wrap; gap: 12px;
        }
        .guide-page .gp-shop-head h2 { font-size: 22px; font-weight: 600; color: var(--ink); margin: 0 0 4px; }
        .guide-page .gp-shop-sub { font-size: 14px; color: var(--ink-2); }
        .guide-page .gp-arrowlink {
          display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500;
          min-height: 40px; color: var(--ink);
        }
        .guide-page .gp-arrowlink .gp-c {
          width: 30px; height: 30px; border-radius: 999px; border: 1px solid var(--hairline-strong);
          display: flex; align-items: center; justify-content: center;
          transition: transform .16s var(--ease-out-strong);
        }
        .guide-page .gp-pgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

        /* sources / related */
        .guide-page .gp-fine { max-width: 760px; }
        .guide-page .gp-srclist { list-style: none; display: flex; flex-direction: column; gap: 7px; margin: 6px 0 0; padding: 0; }
        .guide-page .gp-srclist li { font-size: 12.5px; color: #6B7178; }
        .guide-page .gp-srclist a { color: var(--ink-2); text-decoration: underline; text-underline-offset: 2px; }
        .guide-page .gp-disc { font-size: 12px; color: #6B7178; line-height: 1.6; margin-top: 18px; max-width: 70ch; }
        .guide-page .gp-related { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
        .guide-page .gp-related a {
          display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px;
          border-radius: 999px; border: 1px solid var(--hairline-strong); font-size: 13px; color: var(--ink-2);
          transition: border-color .16s var(--ease-out-strong);
        }

        /* FAQ (copied from the verify page so it styles here too) */
        .guide-page .vf-faq {
          border: 1px solid var(--hairline-strong); border-radius: 14px; background: var(--white); overflow: hidden;
        }
        .guide-page .vf-faq__q {
          width: 100%; background: none; border: 0; text-align: left; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px;
          font-family: var(--sans); font-size: 16px; font-weight: 500; color: var(--ink);
          letter-spacing: -.01em; text-transform: none;
        }
        .guide-page .vf-faq__caret {
          flex-shrink: 0; color: var(--ink-3); transition: transform 280ms var(--ease-out-strong);
        }
        .guide-page .vf-faq[data-open="true"] .vf-faq__caret { transform: rotate(180deg); }
        .guide-page .vf-faq__panel {
          display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms var(--ease-out-strong);
        }
        .guide-page .vf-faq[data-open="true"] .vf-faq__panel { grid-template-rows: 1fr; }
        .guide-page .vf-faq__panelInner { overflow: hidden; }
        .guide-page .vf-faq__a {
          margin: 0; padding: 0 20px 18px; font-family: var(--sans); font-size: 15px; line-height: 1.6;
          color: var(--ink-2); max-width: 640px; text-transform: none;
        }

        @media (hover: hover) and (pointer: fine) {
          .guide-page .gp-jump a:hover { color: var(--ink); transform: translateX(4px); }
          .guide-page .gp-arrowlink:hover .gp-c { transform: translateX(3px); }
          .guide-page .gp-related a:hover { border-color: #6B7178; }
        }
        @media (max-width: 960px) {
          .guide-page .gp-split { grid-template-columns: 1fr; gap: 40px; }
          .guide-page .gp-rail { position: static; }
        }
        @media (max-width: 720px) {
          .guide-page .gp-pgrid { grid-template-columns: repeat(2, 1fr); }
          .guide-page .gp-wrap { padding: 0 20px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .guide-page .vf-faq__caret, .guide-page .vf-faq__panel { transition: none; }
        }
      `}</style>
    </>
  );
}
