import type { Metadata } from "next";

// Internal render surfaces (carousel slide export, etc.). Not part of the
// public site, keep it out of search indexes even though it ships publicly.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
