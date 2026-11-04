import { sectors, tracks } from './solutions-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway } from '../lib/highway.js';
import { addRings } from '../lib/rings.js';
import { bindControls } from '../lib/controls.js';
import { createTips } from '../lib/tips.js';
import tips from '../data/solutions-tips.json';

const sounds = Object.fromEntries(sectors.map((s) => [s.lane, s.sound]));
const title = document.getElementById('solutions-title');
// Each sector's subtitle, and the description it shows until the sector moves to 2040.
const subs = sectors.map(({ lane, reduction }) => {
  const el = document.getElementById(`sub-${lane}`);
  return { lane, el, desc: el.textContent, reduction };
});
const engine = createEngine({ tracks, onTrackChange, sounds });
function onTrackChange() {
  const track = tracks[engine.state.current];
  title.textContent = track.title;
  for (const { lane, el, desc, reduction } of subs) {
    el.textContent = track.tips[lane] === '2040' ? reduction : desc;
  }
}
for (const { lane, color } of sectors) {
  createHighway(document.getElementById(`highway-${lane}`), engine, { lanes: [lane], colors: { [lane]: color } });
}
bindControls(engine, tracks, { bpm: 90, onPastEnd: () => location.assign('../') });

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
