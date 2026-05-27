import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ScanPreview from "@/components/ScanPreview";
import WhatWeCheck from "@/components/WhatWeCheck";
import Faq from "@/components/Faq";
import ClosingCta from "@/components/ClosingCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main style={{ background: "var(--bg)" }}>
      <Nav />
      <Hero />
      <HowItWorks />
      <ScanPreview />
      <WhatWeCheck />
      <Faq />
      <ClosingCta />
      <Footer />
    </main>
  );
}
