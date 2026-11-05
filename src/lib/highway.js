import { TICKS_PER_BAR } from './patterns.js';
import { color, grey } from './theme.js';

const LOOKAHEAD_BARS = 2; // how much of the future is visible below the hit line
export const GLOW_MS = 250; // how long the target glows after a hit

// Quick swell-and-settle on an element, timed like the target's glow; use from opts.onHit.
export const pulse = (el) =>
  el.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: GLOW_MS, easing: 'ease-out' });
// Grey of the bar lines; also outlines the notes so stacked dots stay distinct.
const LINE_RGB = '110, 110, 110';
const BEAT_RGB = '165, 165, 165'; // lighter grey of the beat lines
const HIT_LEAD_MS = 80; // start the hit pulse this much before the dot is centered on the target

// All highways draw from one shared animation loop, reading the transport position once
// per frame, so every highway on a page shows exactly the same moment at the same tempo.
const highways = new Set();
let loopEngine = null;
function loop(ms) {
  const now = loopEngine.nowTicks();
  for (const draw of highways) draw(now, ms);
  requestAnimationFrame(loop);
}

// opts.lanes: which of the engine's lanes this highway shows (default: all).
// opts.colors: { lane: brand color name } for the notes and hit pulse (default: green).
// opts.onHit(lane): called the frame a note reaches the target, to sync other animations.
// opts.targetColor: brand color name for the target outline (default: dark grey).
// opts.lightBarLines: draw bar lines in the beat lines' lighter grey (still thicker), for dark backgrounds.
export function createHighway(canvas, engine, { lanes = engine.lanes, colors = {}, onHit, targetColor, lightBarLines } = {}) {
  const laneColor = (lane) => color(colors[lane] ?? 'green');
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let lastNow = 0;
  const lastHitAt = Object.fromEntries(lanes.map((l) => [l, -Infinity])); // performance.now() of last hit

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

  function frame(now, ms) {
    const hitY = h * 0.08; // leaves room for the expanding hit ring (1.8r)
    const pxPerTick = (h - hitY) / (LOOKAHEAD_BARS * TICKS_PER_BAR);
    const laneW = Math.min(w * 0.5, h * 0.4);
    const laneGap = laneW * 0.1;
    const totalW = lanes.length * laneW + (lanes.length - 1) * laneGap;
    const x0 = (w - totalW) / 2;
    const yAt = (tick) => hitY + (tick - now) * pxPerTick;

    ctx.clearRect(0, 0, w, h);

    // Beat / bar grid lines: grey in the middle, fading to transparent at both ends.
    const fadeLine = (rgb) => {
      const g = ctx.createLinearGradient(x0, 0, x0 + totalW, 0);
      g.addColorStop(0, `rgba(${rgb}, 0)`);
      g.addColorStop(0.5, `rgba(${rgb}, 1)`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      return g;
    };
    const barLine = fadeLine(lightBarLines ? BEAT_RGB : LINE_RGB);
    const beatLine = fadeLine(BEAT_RGB);
    const firstTick = Math.floor(now / 8) * 8;
    for (let t = firstTick; yAt(t) < h; t += 8) {
      const y = yAt(t);
      if (y < hitY) continue;
      ctx.strokeStyle = t % TICKS_PER_BAR === 0 ? barLine : beatLine;
      ctx.lineWidth = t % TICKS_PER_BAR === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + totalW, y);
      ctx.stroke();
    }

    const r = Math.min(laneW * 0.3, h * 0.04);
    const firstBar = Math.floor(now / TICKS_PER_BAR);
    if (now < lastNow) lastNow = now; // transport restarted
    const lead = (HIT_LEAD_MS / 1000) * (engine.bpm() / 60) * 8; // ms → 32nd-note ticks

    lanes.forEach((lane, li) => {
      const lx = x0 + li * (laneW + laneGap);
      const cx = lx + laneW / 2;

      // Upcoming notes; fire the hit pulse for any that came within HIT_LEAD_MS of the
      // target since the last frame (so the pulse peaks as the dot lands, not after).
      ctx.fillStyle = laneColor(lane);
      ctx.strokeStyle = `rgb(${LINE_RGB})`;
      ctx.lineWidth = Math.max(1.5, r * 0.08);
      for (let bar = firstBar; bar <= firstBar + LOOKAHEAD_BARS + 1; bar++) {
        const set = engine.hitsForBar(bar)?.[lane];
        if (!set) continue;
        for (const pos of set) {
          const tick = bar * TICKS_PER_BAR + pos;
          if (tick <= now + lead && tick > lastNow + lead && lastHitAt[lane] !== ms) {
            lastHitAt[lane] = ms;
            onHit?.(lane);
          }
          if (tick <= now) continue;
          const y = yAt(tick);
          if (y > h + r) continue;
          ctx.beginPath();
          ctx.arc(cx, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke(); // thin grey edge keeps stacked 16ths/32nds distinguishable
        }
      }

      // Target circle, glowing briefly after each hit.
      const a = Math.max(0, 1 - (ms - lastHitAt[lane]) / GLOW_MS);
      if (a > 0) {
        // Solid brand color throughout: the pulse fades by shrinking, not by opacity.
        ctx.fillStyle = laneColor(lane);
        ctx.beginPath();
        ctx.arc(cx, hitY, r * (1 + 0.15 * a), 0, Math.PI * 2);
        ctx.fill();
        // Expanding ring that thins out to nothing.
        ctx.strokeStyle = laneColor(lane);
        ctx.lineWidth = r * 0.35 * a;
        ctx.beginPath();
        ctx.arc(cx, hitY, r * (1 + 0.8 * (1 - a)), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = targetColor ? color(targetColor) : grey('dark');
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, hitY, r, 0, Math.PI * 2);
      ctx.stroke();

    });
    lastNow = now;
  }

  if (loopEngine && loopEngine !== engine) throw new Error('All highways on a page must share one engine');
  highways.add(frame);
  if (!loopEngine) {
    loopEngine = engine;
    requestAnimationFrame(loop);
  }
}
