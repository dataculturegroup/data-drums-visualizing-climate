import { TICKS_PER_BAR } from './patterns.js';
import { COUNT_IN_BARS } from './engine.js';

const TIP_BARS = 1.5; // how long each tip stays up (6 beats; each highway gets a new one every 9)
const TIP_EVERY_TICKS = 24; // a new tip every 3 beats (32nd-note ticks)
// Tips pop in with a size overshoot (ease-out-back) while opacity rises linearly, and shrink
// away the same way in reverse.
const POP_IN_MS = 450;
const POP_OUT_MS = 300;
const EASE_OUT_BACK = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EASE_IN_BACK = 'cubic-bezier(0.36, 0, 0.66, -0.56)';

// Pop-up tips over a set of highways. Every 3 beats, the next highway in turn pops one tip from
// its list for the current track, so tips appear one at a time across the highways. Each highway
// cycles through its list, showing whichever tip has come up least so far; a highway with no
// tips skips its turn.
// sectors: [{ wrap: element to place tips in, color, tipsFor(trackIndex) -> string[] }]
// opts.groupOf(trackIndex): tips showing are cleared when a bar starts a different group.
// Returns { clear() } to take down any tips showing right away.
export function createTips(engine, sectors, { groupOf = () => null } = {}) {
  const timesShown = new Map(); // tip text -> how many times it's popped up
  const showing = new Set();
  let lastSlot = -1;
  let lastGroup;

  function show(sector, text) {
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.style.setProperty('--tip-color', `var(--color-${sector.color})`);
    tip.textContent = text;
    sector.wrap.append(tip);
    showing.add(tip);
    const ms = (TIP_BARS * 4 * 60 * 1000) / engine.bpm();
    const inAt = POP_IN_MS / ms;
    const outAt = 1 - POP_OUT_MS / ms;
    // Size and opacity run as separate animations so each gets its own easing.
    tip.animate(
      [
        { scale: 0.2, easing: EASE_OUT_BACK },
        { scale: 1, offset: inAt },
        { scale: 1, offset: outAt, easing: EASE_IN_BACK },
        { scale: 0.2 },
      ],
      { duration: ms },
    );
    tip
      .animate(
        [{ opacity: 0 }, { opacity: 1, offset: inAt }, { opacity: 1, offset: outAt }, { opacity: 0 }],
        { duration: ms, easing: 'linear' },
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
    const now = engine.nowTicks();
    const bar = Math.floor(now / TICKS_PER_BAR);
    const slot = Math.floor((now - COUNT_IN_BARS * TICKS_PER_BAR) / TIP_EVERY_TICKS);
    if (!engine.state.playing) {
      lastSlot = -1;
    } else if (slot !== lastSlot && bar >= COUNT_IN_BARS) {
      lastSlot = slot;
      const si = slot % sectors.length;
      const t = engine.trackForBar(bar);
      if (groupOf(t) !== lastGroup) clear();
      lastGroup = groupOf(t);
      const count = (s) => timesShown.get(s) ?? 0;
      const text = sectors[si].tipsFor(t).reduce((a, s) => (a === undefined || count(s) < count(a) ? s : a), undefined);
      if (text !== undefined) {
        timesShown.set(text, count(text) + 1);
        show(sectors[si], text);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { clear };
}
