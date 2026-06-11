// Shared smooth-scroll for the certifications page. Both the badge wall and the
// "start here" tier use this so a tap on either eases to the same detail card.

// Pixels left clear above the target so it doesn't tuck under the fixed nav.
export const SCROLL_OFFSET = 88;

// easeInOutCubic — gentle acceleration into the middle, soft landing.
function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Custom rAF tween rather than native scrollIntoView({behavior:"smooth"}):
// native smooth scroll is inconsistent across browsers and can't be tuned, and
// the site disables global scroll-behavior: smooth (it would animate Next.js's
// scroll-reset on every route change). This gives one controlled, eased motion.
function smoothScrollTo(targetY: number) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;
  // Scale duration to distance so short hops feel snappy and long ones glide.
  const duration = Math.min(900, Math.max(420, Math.abs(distance) * 0.32));
  let startTime: number | undefined;

  function step(now: number) {
    if (startTime === undefined) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Eases the page to a cert's detail card and pulses it. Returns nothing; falls
// back to the browser's native anchor jump if the target isn't on the page.
export function jumpToCert(e: React.MouseEvent, slug: string) {
  const el = document.getElementById(slug);
  if (!el) return; // let the browser handle the bare anchor as a fallback
  e.preventDefault();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const targetY =
    el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;

  if (reduce) {
    window.scrollTo(0, targetY);
  } else {
    smoothScrollTo(targetY);
  }
  // Update the hash without triggering another (instant) jump.
  history.replaceState(null, "", `#${slug}`);

  if (!reduce) {
    el.classList.remove("cl-target");
    void el.offsetWidth; // restart the animation if a badge is re-clicked
    el.classList.add("cl-target");
    window.setTimeout(() => el.classList.remove("cl-target"), 1400);
  }
}
