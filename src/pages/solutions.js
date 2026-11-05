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
// Each sector's subtitle, and the description it shows until the sector moves to 2040.
const subs = sectors.map(({ lane, reduction }) => {
  const el = document.getElementById(`sub-${lane}`);
  return { lane, el, desc: el.textContent, reduction };
});
// "stomp your feet" etc. stay hidden until you advance into the step that brings that sector's beat
// in. These, the title and the subtitles follow the queued step so they change as soon as you press the arrow,
// before its first dot reaches the target.
const motions = sectors.map(({ lane }) => ({ lane, el: document.getElementById(`motion-${lane}`) }));
// Smoke across the whole page, starting at Movement 2's worst (its last year) and thinning by
// step. S turns it off and on (on by default); off stops its animation entirely.
const worstGt = emissions.find((d) => d.year === emissionsTracks.at(-1).year).gt;
const smoke = createSmoke(document.getElementById('smoke'));
window.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') smoke.toggle();
});
const engine = createEngine({ tracks, onTrackChange, sounds });
function onTrackChange() {
  const pending = tracks[engine.pendingTrack()];
  title.textContent = pending.title;
  smoke.setRate(smokeRate(worstGt) * pending.smoke);
  for (const { lane, el, desc, reduction } of subs) {
    el.textContent = pending.tips[lane] === '2040' ? reduction : desc;
  }
  for (const { lane, el } of motions) {
    el.style.visibility = pending.hits.some((h) => h.lane === lane) ? '' : 'hidden';
  }
}
// Each sector's motion pulses the instant a dot reaches the target on its highway.
const motionEl = Object.fromEntries(motions.map(({ lane, el }) => [lane, el]));
for (const { lane, color } of sectors) {
  createHighway(document.getElementById(`highway-${lane}`), engine, {
    lanes: [lane],
    colors: { [lane]: color },
    onHit: () => pulse(motionEl[lane]),
  });
}
bindControls(engine, tracks, { bpm: 95, onPastEnd: () => location.assign('../') });

createTips(
  engine,
  sectors.map(({ lane, color, tipsKey }) => ({
    wrap: document.getElementById(`highway-${lane}`).parentElement,
    color,
    // Each entry is { text, ipcc_option, source }; the tip shows the text.
    tipsFor: (t) => (tips[tipsKey]?.[tracks[t].tips[lane]] ?? []).map((tip) => tip.text),
  })),
  // Moving into the future steps clears out the "now" tips still on screen.
  { groupOf: (t) => tracks[t].title },
);
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
