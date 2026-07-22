"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnimationProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const delay = parseInt(
              e.target.getAttribute("data-reveal-delay") || "0",
              10
            );
            setTimeout(() => e.target.classList.add("in"), delay);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-40px 0px -40px 0px", threshold: 0.05 }
    );

    // Re-observing an element is a no-op, so this is safe to call repeatedly.
    const observeAll = () =>
      document
        .querySelectorAll(".reveal:not(.in)")
        .forEach((el) => io.observe(el));

    observeAll();

    // This component lives in the root layout, so it does not remount on a
    // client-side navigation. Without watching the DOM, .reveal elements on
    // the next page never get observed and the page renders blank below the
    // fold until a hard refresh. The same watch covers content mounted late
    // (lazy lists, data that lands after hydration).
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        observeAll();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
