"use client";

import CertBadge from "@/components/CertBadge";
import { jumpToCert } from "@/lib/certScroll";

type LeadItem = {
  slug: string;
  name: string;
  abbr?: string;
  issuer: string;
  leadNote: string;
  logoSrc?: string;
};

// The "start here" tier: the few marks that do the most for what touches the
// body, lifted above the full directory. Each card eases to its detail below.
export default function CertLeads({ items }: { items: LeadItem[] }) {
  return (
    <div className="cert-leads">
      {items.map((cert, i) => (
        <a
          key={cert.slug}
          href={`#${cert.slug}`}
          className="cert-lead"
          onClick={(e) => jumpToCert(e, cert.slug)}
        >
          <span className="cert-lead__rank">{i + 1}</span>
          <CertBadge
            slug={cert.slug}
            name={cert.name}
            abbr={cert.abbr}
            size={62}
            logoSrc={cert.logoSrc}
          />
          <h3 className="cert-lead__name">
            {cert.name}
            {cert.abbr && <span className="cert-lead__abbr">{cert.abbr}</span>}
          </h3>
          <p className="cert-lead__note">{cert.leadNote}</p>
          <span className="cert-lead__cue">
            See the full read
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </a>
      ))}
    </div>
  );
}
