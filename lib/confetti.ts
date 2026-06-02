// Tiny dependency-free confetti burst. Drops a fixed canvas over the viewport,
// fires particles, then removes itself. Colors pulled from the brand palette.
const COLORS = ["#A8BDD3", "#EDE9E0", "#ADC89C", "#E6A638", "#C9CDDA", "#3B3C3A"];

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
};

export function burstConfetti(opts: { count?: number; originX?: number; originY?: number } = {}) {
  if (typeof window === "undefined") return;
  const count = opts.count ?? 120;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const ox = opts.originX ?? window.innerWidth / 2;
  const oy = opts.originY ?? window.innerHeight / 2.4;

  const particles: P[] = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      size: 5 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  });

  let frame = 0;
  const maxFrames = 140;

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    frame++;
    for (const p of particles) {
      p.vy += 0.32; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = Math.max(0, 1 - frame / maxFrames);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(tick);
}
