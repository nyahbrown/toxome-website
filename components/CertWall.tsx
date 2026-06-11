"use client";

import CertBadge from "@/components/CertBadge";
import { jumpToCert } from "@/lib/certScroll";

type WallItem = {
  slug: string;
  name: string;
  abbr?: string;
  logoSrc?: string;
};

// The badge wall. Clicking a badge eases the page to that cert's detail card.
export default function CertWall({ items }: { items: WallItem[] }) {
  return (
    <div className="cl-wall">
      {items.map((cert) => (
        <a
          key={cert.slug}
          href={`#${cert.slug}`}
          className="cl-wall-item"
          onClick={(e) => jumpToCert(e, cert.slug)}
        >
          <CertBadge
            slug={cert.slug}
            name={cert.name}
            abbr={cert.abbr}
            size={84}
            logoSrc={cert.logoSrc}
          />
          <span className="cl-wall-item__name">{cert.abbr ?? cert.name}</span>
        </a>
      ))}
    </div>
  );
}
