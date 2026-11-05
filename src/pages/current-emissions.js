import data from '../data/global-co2.json';
import { tracks } from './current-emissions-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway, pulse } from '../lib/highway.js';
import { createChart } from '../lib/chart.js';
import { addRings } from '../lib/rings.js';
import { createSmoke, smokeRate } from '../lib/smoke.js';
import { bindControls } from '../lib/controls.js';

const highwayYear = document.getElementById('highway-year');
const motion = document.getElementById('highway-motion');
const chart = createChart(document.getElementById('chart'), data, tracks.map((t) => t.year), { connectTo: highwayYear });

const history = document.getElementById('history');
// Smoke rising from the chart side (left 6 of 12 columns), free to drift over the rest.
const smoke = createSmoke(document.getElementById('smoke'), { spawnWidth: 0.5 });
// S turns the smoke off and on (on by default); off stops its animation entirely.
window.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') smoke.toggle();
});
const engine = createEngine({ tracks, onTrackChange });
function onTrackChange() {
  const { year, history: text } = tracks[engine.state.current];
  highwayYear.textContent = year;
  chart.update(year);
  history.textContent = text;
  smoke.setRate(smokeRate(data.find((d) => d.year === year).gt));
  // Follows the queued track so it changes as soon as you press the arrow.
  motion.textContent = tracks[engine.pendingTrack()].motion;
}

// The motion pulses the instant a dot reaches the target, like Movement 1's.
createHighway(document.getElementById('highway'), engine, { colors: { thigh: 'red' }, onHit: () => pulse(motion) });
bindControls(engine, tracks, { bpm: 90, onPastEnd: () => location.assign('../solutions/') });
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
