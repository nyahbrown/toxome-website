"use client";

import { useState } from "react";
import { localLogo, markFor, remoteCandidates } from "@/lib/certMarks";

// Circular certification badge. Resolves the logo in order:
//   1. a local file in /public/certs (passed as `logoSrc`) — best quality
//   2. the certifying body's logo from a remote URL (favicon service)
//   3. a clean monogram fallback if every image fails
// The domain and monogram maps live in lib/certMarks so the TikTok slide
// renderer resolves the same logo this badge does. Dropping a file in
// /public/certs overrides everything.

function fontFor(len: number, size: number): number {
  const ratio = len <= 1 ? 0.46 : len === 2 ? 0.4 : len === 3 ? 0.3 : 0.235;
  return Math.round(size * ratio);
}

export default function CertBadge({
  slug,
  name,
  abbr,
  size = 56,
  logoSrc,
}: {
  slug: string;
  name: string;
  abbr?: string;
  size?: number;
  logoSrc?: string;
}) {
  const candidates = [logoSrc, localLogo(slug), ...remoteCandidates(slug)].filter(
    Boolean
  ) as string[];
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];
  const mark = markFor(slug, abbr, name);

  return (
    <span className="cert-badge" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="cert-badge__img"
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <span
          className="cert-badge__mark"
          style={{ fontSize: fontFor(mark.length, size) }}
        >
          {mark}
        </span>
      )}
    </span>
  );
}
