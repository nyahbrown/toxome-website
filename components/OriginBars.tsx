"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Origin range bars for the fiber guide: one row per geographic origin, each a
 * micron range plotted on a shared axis. The fill grows in the first time the
 * chart scrolls into view, staggered row by row, and honors
 * prefers-reduced-motion by rendering the final widths instantly.
 *
 * `note` is passed pre-rendered from the server (RichText output) so italic
 * emphasis survives the client boundary.
 */
const TONES = ["#7E603C", "#A07A4C", "#B68F62", "#CDB794"];

type Item = {
  region: string;
  micron: string;
  lo: number;
  hi: number;
  note: ReactNode;
};

export default function OriginBars({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [instant, setInstant] = useState(false);

  const dMin = Math.floor(Math.min(...items.map((o) => o.lo)) / 2) * 2;
  const dMax = Math.ceil(Math.max(...items.map((o) => o.hi)) / 2) * 2;
  const pos = (m: number) => ((m - dMin) / (dMax - dMin)) * 100;
  const ticks: number[] = [];
  for (let t = dMin; t <= dMax; t += 2) ticks.push(t);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setInstant(true);
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="gp-origins" ref={ref}>
      <div className="gp-origin-axis" aria-hidden="true">
        {ticks.map((t, i) => (
          <span
            key={t}
            className="gp-origin-tick"
            style={{
              left: `${pos(t)}%`,
              transform:
                i === 0
                  ? "translateX(0)"
                  : i === ticks.length - 1
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
            }}
          >
            {t}µm
          </span>
        ))}
      </div>
      {items.map((o, i) => (
        <div className="gp-origin" key={o.region}>
          <div className="gp-origin-head">
            <span className="gp-origin-name">{o.region}</span>
            <span className="gp-origin-micron">{o.micron}</span>
          </div>
          <div className="gp-origin-track">
            <div
              className="gp-origin-fill"
              style={{
                left: `${pos(o.lo)}%`,
                width: shown ? `${pos(o.hi) - pos(o.lo)}%` : 0,
                background: TONES[i] ?? "#A07A4C",
                transition: instant
                  ? "none"
                  : `width 900ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
              }}
            />
          </div>
          <p className="gp-prose gp-origin-note">{o.note}</p>
        </div>
      ))}
    </div>
  );
}
