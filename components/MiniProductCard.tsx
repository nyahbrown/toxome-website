import Link from "next/link";
import type { Product } from "@/types/product";
import ScoreBadge from "@/components/ScoreBadge";
import CertBadge from "@/components/CertBadge";
import { healthCertBadge } from "@/lib/verification";

// Minimal product card, image card with info below (locked Flamingo style).
// Shared by the homepage Editor's Picks and the Journal "Shop the edit" rail so
// score/image/price/styling stay consistent. Pass `showScore` to surface the
// Toxome score as a pill on the image (used in the Journal rail), and
// `showCerts` for the certification logo circles (homepage Editor's Picks). The
// Journal rail cards are half-size, so certs stay opt-in rather than default.
export default function MiniProductCard({
  p,
  showScore = false,
  showCerts = false,
}: {
  p: Product;
  showScore?: boolean;
  showCerts?: boolean;
}) {
  // Health/verifying certs only (OEKO-TEX, GOTS, bluesign, …), deduped by slug
  // so multiple OEKO-TEX variants collapse into one logo. Same pipeline as the
  // shop cards, so the marks match across the site.
  const certBadges = (() => {
    const seen = new Set<string>();
    const out: { slug: string; label: string }[] = [];
    for (const raw of p.certifications ?? []) {
      const b = healthCertBadge(raw);
      if (b && !seen.has(b.slug)) {
        seen.add(b.slug);
        out.push(b);
      }
    }
    return out;
  })();
  const MAX_CERT_BADGES = 3;
  const shownCerts = showCerts ? certBadges.slice(0, MAX_CERT_BADGES) : [];
  const extraCerts = showCerts ? certBadges.length - shownCerts.length : 0;

  return (
    <Link
      href={`/shop/${p.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "125.56%",
          borderRadius: 10,
          overflow: "hidden",
          background: "var(--tan)",
        }}
      >
        {p.item_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.item_image}
            alt={p.item_name}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {showScore && (p.toxome_score != null || p.risk_level) && (
          <ScoreBadge
            score={p.toxome_score}
            level={p.risk_level}
            showScore
            overlay
          />
        )}
        {shownCerts.length > 0 && (
          // Certification logo circles down the right edge. Unlike the shop card
          // there's no wishlist heart to sit under, so the stack starts flush at
          // the top. The score pill is bottom-left, so they never collide.
          <div className="mini-cert-stack">
            {shownCerts.map((c) => (
              <span key={c.slug} title={c.label} style={{ display: "flex" }}>
                <CertBadge slug={c.slug} name={c.label} size={44} />
              </span>
            ))}
            {extraCerts > 0 && (
              <span className="mini-cert-stack__more">+{extraCerts}</span>
            )}
          </div>
        )}
      </div>
      <div style={{ paddingTop: 16 }}>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
          }}
        >
          {p.item_name}
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            color: "var(--ink-2)",
            marginTop: 5,
          }}
        >
          {p.brand}
          {p.item_price != null && <> · ${p.item_price.toLocaleString()}</>}
        </div>
      </div>
    </Link>
  );
}
