import { SLIDE_SETS, slideSet, slidesFor, slideScore, slideRisk, slideFileName } from "@/lib/social-slides";

// Localhost preview of the Instagram post slides. Not linked from anywhere, not
// meant to ship. 4:5 by default (the tallest feed post IG allows), 1:1 optional.

export const dynamic = "force-dynamic";

export default async function InstagramStudio({
  searchParams,
}: {
  searchParams: Promise<{ size?: string; set?: string }>;
}) {
  const sp = await searchParams;
  const square = sp.size === "square";
  const set = slideSet(sp.set);
  const slides = slidesFor(sp.set);
  // Both params have to survive every link on the page, or switching the size
  // silently throws you back to the apparel set.
  const link = (over: { size?: string; set?: string } = {}) => {
    const q = new URLSearchParams();
    const size = "size" in over ? over.size : square ? "square" : undefined;
    const s = "set" in over ? over.set : set === "apparel" ? undefined : set;
    if (size) q.set("size", size);
    if (s) q.set("set", s);
    const str = q.toString();
    return str ? `?${str}` : "";
  };
  const qs = link();
  const w = 270;
  const h = square ? 270 : 338;

  const tab = (label: string, href: string, active: boolean) => (
    <a
      key={label}
      href={href}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        fontSize: 14,
        textDecoration: "none",
        border: "1px solid var(--hairline-strong)",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--cream)" : "var(--ink-2)",
      }}
    >
      {label}
    </a>
  );

  return (
    <main style={{ padding: "48px 40px 80px", background: "var(--cream)", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>instagram posts</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 8 }}>
        brand, composition, price. bottom left, inter, white.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 24 }}>
        {(Object.keys(SLIDE_SETS) as Array<keyof typeof SLIDE_SETS>).map((k) =>
          tab(SLIDE_SETS[k].label, `/studio/instagram${link({ set: k === "apparel" ? undefined : k })}`, set === k)
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        {tab("4:5 (1080×1350)", `/studio/instagram${link({ size: undefined })}`, !square)}
        {tab("1:1 (1080×1080)", `/studio/instagram${link({ size: "square" })}`, square)}
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 36, flexWrap: "wrap" }}>
        {slides.map((s, i) => (
          <div key={s.url} style={{ width: w }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/studio/instagram/${i}${qs}`}
              alt={s.name}
              width={w}
              height={h}
              style={{ width: w, height: h, objectFit: "contain", background: "var(--tan)" }}
            />
            <div style={{ marginTop: 12, fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{s.brand}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
              {/* No score is a real state, not a missing value: the mattress set
                  has none on purpose, so say so rather than printing "score". */}
              ${s.price.toLocaleString()}
              {slideScore(s) === null ? " · no score, certifications only" : ` · score ${slideScore(s)} · ${slideRisk(s)}`}
            </div>
            <a
              href={`/studio/instagram/${i}${link()}${link() ? "&" : "?"}download=1`}
              download={slideFileName(s, i, "ig")}
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 14,
                textDecoration: "none",
                background: "var(--ink)",
                color: "var(--cream)",
              }}
            >
              download png
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
