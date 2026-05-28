import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";
import AnimationProvider from "@/components/AnimationProvider";
import { AuthProvider } from "@/contexts/AuthContext";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Toxome — Know what's in your clothes",
  description:
    "Photograph the composition tag on any garment. Toxome reads the fibers and tells you exactly what they do to your body — and to the world.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body>
        <AnimationProvider />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
