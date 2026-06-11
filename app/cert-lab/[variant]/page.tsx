import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CertLab, { VARIANTS, isVariant } from "@/components/CertLab";
import { getShopTaxonomy } from "@/lib/supabase";

// Internal design exploration — keep it out of search.
export const metadata: Metadata = {
  title: "Certifications · Design Lab",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return VARIANTS.map((v) => ({ variant: v.id }));
}

export default async function CertLabVariantPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (!isVariant(variant)) notFound();
  const taxonomy = await getShopTaxonomy();
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <CertLab variant={variant} />
      <Footer />
    </>
  );
}
