import type { Metadata } from "next";
import { Cormorant, Inter } from "next/font/google";
import "./globals.css";
import AnimationProvider from "@/components/AnimationProvider";
import CookieBanner from "@/components/CookieBanner";
import JsonLd from "@/components/JsonLd";
import Skimlinks from "@/components/Skimlinks";
import { AuthProvider } from "@/contexts/AuthContext";
import PageViewTracker from "@/components/PageViewTracker";
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
  description:
    "Toxome reads the fibers in your clothes and tells you what they do to your body and the planet.",
  sameAs: [
    "https://www.instagram.com/toxome_app/",
    "https://www.pinterest.com/toxomeApp/",
    "https://www.tiktok.com/@toxome",
  ],
};

// Cormorant, high-contrast editorial serif. Loaded as a variable font so the
// full 300–700 weight axis is available; headlines run Light (300). Replaced
// Source Serif 4.
const cormorant = Cormorant({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_DESCRIPTION =
  "Photograph the composition tag on any garment. Toxome reads the fibers and tells you exactly what they do to your body, and to the world.";

export const metadata: Metadata = {
  // Resolves all relative canonical / OpenGraph URLs to absolute ones.
  metadataBase: new URL("https://toxome.app"),
  title: "Toxic Fashion Detector: Scan Your Clothes for Toxins | Toxome",
  description:
    "Toxome is the toxic fashion detector for your closet. Scan any clothing tag to see the fibers and chemicals inside and find non-toxic clothing. Free to scan.",
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <JsonLd data={organizationSchema} />
        <AnimationProvider />
        <AuthProvider>
          <PageViewTracker />
          {children}
        </AuthProvider>
        <CookieBanner />
        <Skimlinks />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
