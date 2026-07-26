"use client";

import { useState } from "react";
import LoadingImage from "@/components/LoadingImage";

/**
 * A self-hosted video that costs nothing until someone presses play.
 *
 * The file is served from our own /public, so the page makes no third-party
 * request and sets no third-party cookie, whatever the visitor has or hasn't
 * agreed to in the banner. Nothing about the video is loaded up front either:
 * until the click there is no <video> element at all, only a poster, so the
 * three megabytes stay on the CDN until someone asks for them.
 *
 * The poster goes through next/image, so it is served resized and in a modern
 * format rather than as the raw still.
 */

type Props = {
  src: string;
  /** Used as the accessible name on the play button. */
  title: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
  sizes?: string;
  /** Load the poster eagerly. Set when the video is above the fold. */
  priority?: boolean;
  borderRadius?: number;
};

export default function VideoEmbed({
  src,
  title,
  poster,
  posterWidth,
  posterHeight,
  sizes,
  priority,
  borderRadius = 10,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState(false);

  const frame: React.CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius,
    overflow: "hidden",
    background: "var(--tan)",
  };

  if (playing) {
    return (
      <div style={frame}>
        <video
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
          preload="auto"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={`Play video: ${title}`}
      style={{
        ...frame,
        display: "block",
        padding: 0,
        border: "none",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
      }}
    >
      <LoadingImage
        src={poster}
        alt=""
        width={posterWidth}
        height={posterHeight}
        sizes={sizes}
        priority={priority}
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        wrapperStyle={{ position: "absolute", inset: 0, borderRadius }}
      />

      {/* A hair of ink over the poster so the button holds contrast on a light
          frame. Kept low: the still is the sell, not the scrim. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: hover ? "rgba(59,60,58,0.16)" : "rgba(59,60,58,0.10)",
          transition: "background 150ms",
        }}
      />

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${hover ? 1.06 : 1})`,
          width: 78,
          height: 78,
          borderRadius: 999,
          background: "var(--cream)",
          border: "1px solid var(--hairline-strong)",
          boxShadow: "0 8px 30px rgba(59,60,58,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 150ms",
        }}
      >
        {/* Nudged right by 3px: a triangle's visual centre sits left of its
            bounding box, so a mathematically centred one reads off-centre. */}
        <svg width="26" height="30" viewBox="0 0 26 30" style={{ marginLeft: 3 }}>
          <path d="M0 0 L26 15 L0 30 Z" fill="var(--ink)" />
        </svg>
      </span>
    </button>
  );
}
