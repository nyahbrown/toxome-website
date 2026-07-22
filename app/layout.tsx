import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnimationProvider from "@/components/AnimationProvider";
import CookieBanner from "@/components/CookieBanner";
import AppInstallPrompt from "@/components/AppInstallPrompt";
import JsonLd from "@/components/JsonLd";
import Skimlinks from "@/components/Skimlinks";
import { AuthProvider } from "@/contexts/AuthContext";
import PageViewTracker from "@/components/PageViewTracker";
import PinterestTag from "@/components/PinterestTag";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Site-wide Organization schema, establishes Toxome as an entity and links
// the verified social profiles (helps with brand knowledge panels).
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Toxome",
  url: "https://toxome.app",
  logo: "https://toxome.app/icon.png",
  slogan: "know what's in your clothes.",
  description:
    "Toxome reads the fibers in your clothes and tells you what they do to your body and the planet. Toxome is the curated directory of non-toxic clothing and the company behind Fashion Wellness, the practice of choosing clothes by what they do to your body.",
  knowsAbout: [
    "Fashion Wellness",
    "non-toxic clothing",
    "endocrine disruptors in textiles",
    "PFAS in clothing",
    "microplastics in fabric",
    "synthetic fabric chemicals",
  ],
  sameAs: [
    "https://www.instagram.com/toxome_app/",
    "https://www.pinterest.com/toxomeApp/",
    "https://www.tiktok.com/@toxome",
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_DESCRIPTION =
  "Toxome is the curated directory of non-toxic fashion. Every piece scored for what it does to your body. Know what's in your clothes.";

export const metadata: Metadata = {
  // Resolves all relative canonical / OpenGraph URLs to absolute ones.
  metadataBase: new URL("https://toxome.app"),
  title: "Toxome: Know What's in Your Clothes | Non-Toxic Fashion, Scored",
  description:
    "Toxome is the curated directory of non-toxic clothing. Every piece scored for what it does to your body. Know what's in your clothes.",
  // Self-referencing canonical for the homepage. Every other route overrides
  // this with its own path.
  alternates: {
    canonical: "/",
  },
  // Site-wide social defaults. The og:image / twitter:image come automatically
  // from app/opengraph-image.png + app/twitter-image.png (Next.js file
  // convention) on every route without its own card.
  openGraph: {
    type: "website",
    siteName: "Toxome",
    url: "/",
    title: "Toxome | Know what's in your clothes",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toxome | Know what's in your clothes",
    description: SITE_DESCRIPTION,
  },
  verification: {
    google: "5V6smK6H9R1nC5Vu9Wop36OxW6P8jwV31KSePfSdWX8",
  },
  // Native iOS Safari "Smart App Banner", shown automatically at the top
  // of the page on iPhone/iPad. Links to the App Store listing for the
  // Toxome iOS app.
  other: {
    "apple-itunes-app": "app-id=6748622034",
    // Pinterest domain claim — verifies toxome.app for the Toxome | Fashion
    // Wellness business account (unlocks Rich Pins + catalog + attribution).
    "p:domain_verify": "8fafc09d263580931f4ed15c10197d03",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* .reveal starts at opacity 0 and is switched on by AnimationProvider.
            If JS never runs, the page would render blank below the fold. */}
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <JsonLd data={organizationSchema} />
        <AnimationProvider />
        <AuthProvider>
          <PageViewTracker />
          <PinterestTag />
          {children}
        </AuthProvider>
        <CookieBanner />
        <AppInstallPrompt />
        <Skimlinks />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
