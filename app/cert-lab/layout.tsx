import type { Metadata } from "next";

// Internal design-lab surface for certification badge variations. Ships
// publicly but has no SEO value, keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CertLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
