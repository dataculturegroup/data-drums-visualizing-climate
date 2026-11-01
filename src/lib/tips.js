import { TICKS_PER_BAR } from './patterns.js';
import { COUNT_IN_BARS } from './engine.js';

const TIP_BARS = 2; // how long each tip stays up (it fades out at the end)

// Pop-up tips over a set of highways. Each bar, the next highway in turn pops one tip from
// its list for the current track, so tips appear one at a time across the highways.
// sectors: [{ wrap: element to place tips in, color, tipsFor(trackIndex) -> string[] }]
export function createTips(engine, sectors) {
  const next = sectors.map(() => new Map()); // per sector: trackIndex -> next tip index
  let side = 0;
  let lastBar = -1;

  function show(sector, text) {
    const tip = document.createElement('div');
    tip.className = `tip ${side++ % 2 ? 'tip-left' : 'tip-right'}`;
    tip.style.setProperty('--tip-color', `var(--color-${sector.color})`);
    tip.style.top = `${20 + Math.random() * 55}%`;
    tip.textContent = text;
    sector.wrap.append(tip);
    const ms = (TIP_BARS * 4 * 60 * 1000) / engine.bpm();
    tip
      .animate(
        [
          { opacity: 0, transform: 'translateY(-50%) scale(0.6)' },
          { opacity: 1, transform: 'translateY(-50%) scale(1.05)', offset: 0.06 },
          { opacity: 1, transform: 'translateY(-50%) scale(1)', offset: 0.1 },
          { opacity: 1, transform: 'translateY(-50%) scale(1)', offset: 0.75 },
          { opacity: 0, transform: 'translateY(-50%) scale(1)' },
        ],
        { duration: ms, easing: 'ease-out' },
      )
      .finished.then(() => tip.remove());
  }

  function frame() {
    const bar = Math.floor(engine.nowTicks() / TICKS_PER_BAR);
    if (!engine.state.playing) {
      lastBar = -1;
    } else if (bar !== lastBar && bar >= COUNT_IN_BARS) {
      lastBar = bar;
      const si = (bar - COUNT_IN_BARS) % sectors.length;
      const t = engine.trackForBar(bar);
      const list = sectors[si].tipsFor(t);
      if (list.length) {
        const i = next[si].get(t) ?? 0;
        next[si].set(t, (i + 1) % list.length);
        show(sectors[si], list[i]);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
