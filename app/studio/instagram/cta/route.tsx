import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { CREAM, INK, interFonts, publicImageDataUri } from "@/lib/slide-chrome";

// Closing CTA slide for an Instagram carousel. Unlike the product slides this
// one has no photograph and no score ring: cream ground, ink lockup, a phone
// screenshot of the shop, and the shop + scan CTA. Same role the newsletter
// slide plays in the magazine carousels.
//
//   ?shot=cta-intimates   file in assets/studio (no extension), defaults to this
//   ?headline=...         override the headline
//   ?sub=...              override the line under the phone
//   ?name=...             download file name (without .png)
//   ?size=square          1080×1080 (1:1), default is 1080×1350 (4:5)
//   ?download=1           save under a real file name

export const runtime = "nodejs";
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const W = 1080;
const PAD = 64;
const INK_2 = "#57636C";
const BEZEL = 13;

/** Inline a screenshot from assets/studio. Kept out of /public so these studio
 *  props never ship to the deployed site. */
function shotDataUri(name: string): string | null {
  const safe = name.replace(/[^a-z0-9-]/gi, "");
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "assets", "studio", `${safe}.png`));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const square = sp.get("size") === "square";
  const download = sp.get("download") === "1";
  const H = square ? 1080 : 1350;

  const shot = shotDataUri(sp.get("shot") || "cta-intimates");
  if (!shot) return new Response("Screenshot not found in assets/studio", { status: 404 });

  const headline = sp.get("headline") || "Every pair scored for toxicity";
  const sub =
    sp.get("sub") ||
    "Shop clean intimates at toxome.app. Scan what's already in your drawer with the app.";

  const logoUri = publicImageDataUri("/toxome-logo.png");

  // The phone shot is the hero. Height is whatever is left between the headline
  // block and the footer line; width follows the iPhone 1125×2436 ratio.
  const shotH = square ? 580 : 780;
  const shotW = Math.round(shotH * (1125 / 2436));

  const image = new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: CREAM,
        }}
      >
        {/* Lockup, centered — this slide has no photo to anchor it left. */}
        <div style={{ display: "flex", alignItems: "center", marginTop: PAD + 8 }}>
          {logoUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUri} alt="Toxome" width={52} height={34} style={{ objectFit: "contain", marginRight: 14 }} />
          ) : null}
          <span style={{ fontFamily: "Inter", fontSize: 43, fontWeight: 600, letterSpacing: "-0.01em", color: INK }}>
            Toxome
          </span>
        </div>

        <span
          style={{
            fontFamily: "Inter",
            fontSize: 50,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: INK,
            lineHeight: 1.15,
            textAlign: "center",
            marginTop: 34,
            maxWidth: W - PAD * 2,
          }}
        >
          {headline}
        </span>

        {/* Phone mockup: the bezel is padding on a rounded ink body, so the whole
            thing is one flex box. Satori has no real containing block, so do NOT
            rebuild this with an absolutely-positioned screen inside a wrapper. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: shotW + BEZEL * 2,
            height: shotH + BEZEL * 2,
            marginTop: 44,
            padding: BEZEL,
            borderRadius: Math.round(shotH * 0.075),
            background: INK,
            boxShadow: "0 34px 70px rgba(59,60,58,0.22)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shot}
            alt=""
            width={shotW}
            height={shotH}
            style={{ objectFit: "cover", borderRadius: Math.round(shotH * 0.058) }}
          />
        </div>

        <span
          style={{
            fontFamily: "Inter",
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: "-0.005em",
            color: INK_2,
            lineHeight: 1.4,
            textAlign: "center",
            marginTop: 36,
            maxWidth: 820,
          }}
        >
          {sub}
        </span>
      </div>
    ),
    { width: W, height: H, fonts: interFonts() }
  );

  if (!download) return image;
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${(sp.get("name") || "toxome-ig-cta").replace(/[^a-z0-9-]/gi, "")}.png"`,
    },
  });
}
