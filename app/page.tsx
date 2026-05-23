import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import HowItWorks from "@/components/HowItWorks";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-white text-gray-900 font-sans">
      <Nav />
      <Hero />
      <Features />
      <Testimonials />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </main>
  );
}
