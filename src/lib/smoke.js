// Smoke: soft grey puffs that rise from the bottom of a canvas on wandering paths, swelling and
// fading as they go. setRate(n) sets how many puffs start each second. opts.spawnWidth: the
// fraction of the canvas width (from the left) where puffs start; they can drift beyond it.
// toggle() turns it off (hidden, no animation, puffs cleared) or back on (puffs start fresh).

const LIFE_S = [5, 9]; // how long a puff lasts (seconds), min–max
const RISE = [0.1, 0.22]; // upward speed, in canvas heights per second
const SIZE = [0.03, 0.08]; // starting radius, in canvas heights; puffs swell to ~3x
const MAX_ALPHA = [0.12, 0.3]; // peak opacity, partway through a puff's life
const MAX_PUFFS = 800; // safety cap

const rand = ([a, b]) => a + Math.random() * (b - a);

// Puffs a second for an emissions level: thickens faster than emissions grow (Gt^1.25: 1 at 1 Gt,
// ~32 at 16 Gt, ~76 at 32 Gt) so the worst years are the most intense.
const SMOKE_POWER = 1.25;
export const smokeRate = (gt) => gt ** SMOKE_POWER;

export function createSmoke(canvas, { spawnWidth = 1 } = {}) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let rate = 0;
  let owed = 0; // fractional puffs carried between frames
  let last = performance.now();
  let raf = 0; // pending animation frame; 0 while off
  const puffs = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function spawn() {
    const shade = Math.round(rand([90, 170])); // darker and lighter greys mixed together
    puffs.push({
      x: Math.random() * spawnWidth, // as a fraction of the width
      y: 1.05, // just below the bottom edge, as a fraction of the height
      age: 0,
      life: rand(LIFE_S),
      rise: rand(RISE),
      r0: rand(SIZE),
      alpha: rand(MAX_ALPHA),
      rgb: `${shade}, ${shade}, ${shade}`,
      // Sideways wander: two sine waves at different speeds, so no two paths match.
      drift: rand([-0.03, 0.03]),
      waves: [0, 1].map(() => ({ amp: rand([0.01, 0.04]), freq: rand([0.2, 0.8]), phase: Math.random() * Math.PI * 2 })),
    });
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); // don't burst after a background tab
    last = now;
    owed += rate * dt;
    while (owed >= 1) {
      owed -= 1;
      if (puffs.length < MAX_PUFFS) spawn();
    }

    ctx.clearRect(0, 0, w, h);
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        puffs.splice(i, 1);
        continue;
      }
      p.y -= p.rise * dt;
      p.x += p.drift * dt + p.waves.reduce((s, wv) => s + wv.amp * wv.freq * Math.cos(wv.freq * p.age * 2 + wv.phase), 0) * dt;
      const r = p.r0 * h * (1 + 2 * k);
      // Fades in fast, out slowly.
      const a = p.alpha * Math.min(1, k * 6) * (1 - k);
      const cx = p.x * w;
      const cy = p.y * h;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${p.rgb}, ${a})`);
      g.addColorStop(0.6, `rgba(${p.rgb}, ${a * 0.6})`);
      g.addColorStop(1, `rgba(${p.rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setRate(perSecond) {
      rate = perSecond;
    },
    toggle() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        puffs.length = 0;
        owed = 0;
        ctx.clearRect(0, 0, w, h);
        canvas.hidden = true;
      } else {
        canvas.hidden = false;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    },
  };
}
