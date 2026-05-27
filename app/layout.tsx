import type { Metadata } from "next";
import "./globals.css";
import AnimationProvider from "@/components/AnimationProvider";

export const metadata: Metadata = {
  title: "Toxome — Know what's in your clothes",
  description:
    "Photograph the composition tag on any garment. Toxome reads the fibers and tells you exactly what they do to your body — and to the world.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AnimationProvider />
        {children}
      </body>
    </html>
  );
}
