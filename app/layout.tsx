import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Toxome — Discover the hidden impacts of your clothes",
  description:
    "Detox your closet, one scan at a time. Scan clothing labels to uncover chemicals, toxins, and health impacts — backed by peer-reviewed research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className={`${inter.className} min-h-full`}>{children}</body>
    </html>
  );
}
