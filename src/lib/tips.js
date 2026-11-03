import { TICKS_PER_BAR } from './patterns.js';
import { COUNT_IN_BARS } from './engine.js';

const TIP_BARS = 2; // how long each tip stays up (it fades out at the end)

// Pop-up tips over a set of highways. Each bar, the next highway in turn pops one tip from
// its list for the current track, so tips appear one at a time across the highways. Each
// tip is shown only once per page load; a highway with none left skips its turn.
// sectors: [{ wrap: element to place tips in, color, tipsFor(trackIndex) -> string[] }]
// opts.groupOf(trackIndex): tips showing are cleared when a bar starts a different group.
export function createTips(engine, sectors, { groupOf = () => null } = {}) {
  const used = new Set(); // tip texts already shown
  const showing = new Set();
  let lastBar = -1;
  let lastGroup;

  function show(sector, text) {
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.style.setProperty('--tip-color', `var(--color-${sector.color})`);
    tip.textContent = text;
    sector.wrap.append(tip);
    showing.add(tip);
    const ms = (TIP_BARS * 4 * 60 * 1000) / engine.bpm();
    tip
      .animate(
        [
          { opacity: 0, transform: 'translateX(-50%) scale(0.6)' },
          { opacity: 1, transform: 'translateX(-50%) scale(1.05)', offset: 0.06 },
          { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.1 },
          { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.75 },
          { opacity: 0, transform: 'translateX(-50%) scale(1)' },
        ],
        { duration: ms, easing: 'ease-out' },
      )
      .finished.then(() => tip.remove(), () => {}) // rejected when clear() cancels it
      .finally(() => showing.delete(tip));
  }

  function clear() {
    for (const tip of showing) {
      tip.getAnimations().forEach((a) => a.cancel());
      tip.remove();
    }
    showing.clear();
  }

  function frame() {
    const bar = Math.floor(engine.nowTicks() / TICKS_PER_BAR);
    if (!engine.state.playing) {
      lastBar = -1;
    } else if (bar !== lastBar && bar >= COUNT_IN_BARS) {
      lastBar = bar;
      const si = (bar - COUNT_IN_BARS) % sectors.length;
      const t = engine.trackForBar(bar);
      if (groupOf(t) !== lastGroup) clear();
      lastGroup = groupOf(t);
      const text = sectors[si].tipsFor(t).find((s) => !used.has(s));
      if (text) {
        used.add(text);
        show(sectors[si], text);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
