"use client";

import { useEffect } from "react";

// Videos embedded in a Journal article body are injected via
// dangerouslySetInnerHTML (marked output), so the browser never runs the media
// resource-selection / autoplay algorithm for them the way it does for a
// React-rendered <video> — they sit at readyState 0, paused, and never start.
// Nudge each one: force muted + inline (required for autoplay to be allowed),
// call load(), and play it when it scrolls into view (pause on the way out to
// save power). Transform/opacity only elsewhere; this touches media, not layout.
export default function InlineMediaPlay() {
  useEffect(() => {
    const vids = Array.from(
      document.querySelectorAll<HTMLVideoElement>(".j-prose video")
    );
    if (vids.length === 0) return;

    for (const v of vids) {
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      try {
        v.load();
      } catch {
        // ignore — play() below still forces a load
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            void v.play().catch(() => {
              // autoplay blocked (e.g. data saver) — the poster stays visible
            });
          } else {
            v.pause();
          }
        }
      },
      { threshold: 0.2 }
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, []);

  return null;
}
