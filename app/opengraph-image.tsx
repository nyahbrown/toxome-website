import { ImageResponse } from "next/og";

// Branded social share card, applied site-wide via the Next.js file
// convention (also used for twitter:image when no twitter-image is present).
export const alt = "Toxome — know what's in your clothes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens (see CLAUDE.md). Cream background, warm-charcoal ink, never
// true black.
const CREAM = "#FCFBF7";
const INK = "#3B3C3A";
const INK_2 = "#57636C";
const HONEY = "#C9A96E";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: INK_2,
            fontWeight: 600,
          }}
        >
          Toxome
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            lineHeight: 1.05,
            color: INK,
            maxWidth: 980,
            letterSpacing: "-0.02em",
          }}
        >
          Know what&apos;s in your clothes.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 30,
            color: INK_2,
          }}
        >
          <div style={{ width: 40, height: 4, background: HONEY }} />
          Every fiber, scored for your body and the planet.
        </div>
      </div>
    ),
    { ...size }
  );
}
