"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up for a single number. Starts at 0 and ticks to `value` the
 * first time it scrolls into view, then stops. Honors prefers-reduced-motion by
 * rendering the final value immediately. Formats with thousands separators and
 * an optional fixed number of decimals, with optional prefix/suffix.
 *
 * Non-numeric stats (a biodegradable "Yes", a microplastics "No") do not use
 * this component; the caller renders those as plain text.
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const done = useRef(false);

  const format = (n: number) =>
    prefix +
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDisplay(value);
      done.current = true;
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || done.current) return;
          done.current = true;
          io.unobserve(e.target);

          const start = performance.now();
          // Ease-out cubic: fast start, gentle settle.
          const ease = (t: number) => 1 - Math.pow(1 - t, 3);
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            setDisplay(value * ease(p));
            if (p < 1) requestAnimationFrame(tick);
            else setDisplay(value);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
