import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Certifications · Design Lab",
  robots: { index: false, follow: false },
};

export default function CertLabIndex() {
  redirect("/cert-lab/v1");
}
