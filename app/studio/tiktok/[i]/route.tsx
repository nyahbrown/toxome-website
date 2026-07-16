import { ImageResponse } from "next/og";
import { SLIDES, slideFileName } from "@/lib/social-slides";
import { interFonts, slideChrome, topScrim } from "@/lib/slide-chrome";

// TikTok slideshow slide (1080×1920, 9:16). The product-pin "full-bleed cover"
// design stripped to the chrome only: full-bleed product photo + Toxome lockup +
// score ring + cert badge. No brand eyebrow, no title, no CTA — on TikTok the
// caption carries those. `?download=1` saves it under a real file name.

export const runtime = "nodejs";
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const W = 1080;
const H = 1920;

export async function GET(req: Request, { params }: { params: Promise<{ i: string }> }) {
  const { i } = await params;
  const idx = Number(i);
  const slide = SLIDES[idx];
  if (!slide) return new Response("Not found", { status: 404 });

  const download = new URL(req.url).searchParams.get("download") === "1";
  const chrome = await slideChrome(slide, { width: W });

  const image = new ImageResponse(
    (
      <div style={{ position: "relative", width: W, height: H, display: "flex", background: "#EDE9E0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.photo}
          alt=""
          style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
        />
        {topScrim(W)}
        {chrome}
      </div>
    ),
    { width: W, height: H, fonts: interFonts() }
  );

  if (!download) return image;
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${slideFileName(slide, idx, "tiktok")}"`,
    },
  });
}
