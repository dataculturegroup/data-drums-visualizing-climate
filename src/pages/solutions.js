import { sectors, tracks } from './solutions-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway, pulse } from '../lib/highway.js';
import { addRings } from '../lib/rings.js';
import { bindControls } from '../lib/controls.js';
import { createTips } from '../lib/tips.js';
import { createSmoke, smokeRate } from '../lib/smoke.js';
import { tracks as emissionsTracks } from './current-emissions-tracks.js';
import emissions from '../data/global-co2.json';
import tips from '../data/solutions-tips.json';

const sounds = Object.fromEntries(sectors.map((s) => [s.lane, s.sound]));
const title = document.getElementById('solutions-title');
// Each sector's subtitle, and the description it shows until the sector reaches a target.
const subs = sectors.map(({ lane }) => {
  const el = document.getElementById(`sub-${lane}`);
  return { lane, el, desc: el.textContent };
});
// Smoke across the whole page, starting at Movement 2's worst (its last year) and thinning by
// step. Off by default (it lags the browser alongside three highways); S turns it on and off.
const worstGt = emissions.find((d) => d.year === emissionsTracks.at(-1).year).gt;
const smoke = createSmoke(document.getElementById('smoke'), { on: false });
window.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') smoke.toggle();
});
const engine = createEngine({ tracks, onTrackChange, sounds });
function onTrackChange() {
  // The title and subtitles follow the queued step so they change as soon as you press the arrow,
  // before its first dot reaches the target.
  const pending = tracks[engine.pendingTrack()];
  title.textContent = pending.title;
  smoke.setRate(smokeRate(worstGt) * pending.smoke);
  for (const { lane, el, desc } of subs) el.textContent = pending.subs[lane] ?? desc;
  showWall(!!pending.wall);
}

// The finale's wall: each highway and motion label hides and all of its sector's tips (every bucket)
// fill its column, spread top to bottom and free to overlap, popping in one after another. Hiding
// the motion labels (display: none) lets the column, and the wall with it, move up.
const WALL_STAGGER_MS = 90;
let tipsUi = null;
let walls = [];
function showWall(on) {
  if (on === walls.length > 0) return;
  for (const wall of walls) wall.remove();
  walls = [];
  for (const { lane } of sectors) {
    document.getElementById(`highway-${lane}`).style.visibility = on ? 'hidden' : '';
    document.getElementById(`motion-${lane}`).style.display = on ? 'none' : '';
  }
  if (!on) return;
  tipsUi?.clear();
  sectors.forEach(({ lane, color, tipsKey }, si) => {
    const wall = document.createElement('div');
    wall.className = 'tip-wall';
    const texts = Object.values(tips[tipsKey]).flat().map((tip) => tip.text);
    texts.forEach((text, i) => {
      const tip = document.createElement('div');
      tip.className = 'tip';
      tip.style.setProperty('--tip-color', `var(--color-${color})`);
      tip.style.top = `${3 + (i * 82) / Math.max(1, texts.length - 1)}%`;
      // Alternate left and right of center (with a little scatter) so neighbors overlap less.
      tip.style.left = `${50 + (i % 2 ? 1 : -1) * 14 + (Math.random() - 0.5) * 8}%`;
      tip.textContent = text;
      wall.append(tip);
      const delay = (si * texts.length + i) * WALL_STAGGER_MS / 3;
      tip.animate([{ scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1 }], {
        duration: 450, delay, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards',
      });
    });
    document.getElementById(`highway-${lane}`).parentElement.append(wall);
    walls.push(wall);
  });
}
// Each sector's motion ("stomp your feet" etc., always shown) pulses the instant a dot reaches the
// target on its highway.
for (const { lane, color } of sectors) {
  const motion = document.getElementById(`motion-${lane}`);
  createHighway(document.getElementById(`highway-${lane}`), engine, {
    lanes: [lane],
    colors: { [lane]: color },
    onHit: () => pulse(motion),
  });
}
bindControls(engine, tracks, { bpm: 105, onPastEnd: () => location.assign('../') });

tipsUi = createTips(
  engine,
  sectors.map(({ lane, color, tipsKey }) => ({
    wrap: document.getElementById(`highway-${lane}`).parentElement,
    color,
    // Each entry is { text, ipcc_option, source }; the tip shows the text.
    tipsFor: (t) => (tips[tipsKey]?.[tracks[t].tips[lane]] ?? []).map((tip) => tip.text),
  })),
  // Moving into a new step clears out the previous step's tips still on screen.
  { groupOf: (t) => tracks[t].title },
);
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
