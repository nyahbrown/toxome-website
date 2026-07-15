import { ImageResponse } from "next/og";
import { SLIDES, slideFileName } from "@/lib/social-slides";
import { bottomScrim, interFonts, slideChrome, topScrim } from "@/lib/slide-chrome";

// Instagram post slide. Same chrome as the TikTok slide (lockup, score ring,
// cert badge) plus a left-aligned overlay in the bottom-left corner: brand,
// composition as the tag writes it, price. Inter, white.
//
//   ?size=portrait  1080×1350 (4:5) — the default, the tallest feed post IG allows
//   ?size=square    1080×1080 (1:1)
//   ?download=1     save under a real file name

export const runtime = "nodejs";
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const W = 1080;
const PAD = 64;
const WHITE = "#FFFFFF";

export async function GET(req: Request, { params }: { params: Promise<{ i: string }> }) {
  const { i } = await params;
  const idx = Number(i);
  const slide = SLIDES[idx];
  if (!slide) return new Response("Not found", { status: 404 });

  const sp = new URL(req.url).searchParams;
  const square = sp.get("size") === "square";
  const download = sp.get("download") === "1";
  const H = square ? 1080 : 1350;

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
        {bottomScrim(W, Math.round(H * 0.42))}
        {chrome}

        {/* Brand / composition / price, bottom-left. */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            bottom: PAD,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: W - PAD * 2,
          }}
        >
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 52,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: WHITE,
              lineHeight: 1.1,
            }}
          >
            {slide.brand}
          </span>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 30,
              fontWeight: 400,
              letterSpacing: "-0.005em",
              color: WHITE,
              lineHeight: 1.35,
              marginTop: 14,
            }}
          >
            {slide.compositionLabel}
          </span>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: WHITE,
              marginTop: 14,
            }}
          >
            ${slide.price}
          </span>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: interFonts() }
  );

  if (!download) return image;
  const name = slideFileName(slide, idx, "ig").replace(".png", square ? "-square.png" : ".png");
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
