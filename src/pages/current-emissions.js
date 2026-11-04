import data from '../data/global-co2.json';
import { tracks } from './current-emissions-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway } from '../lib/highway.js';
import { createChart } from '../lib/chart.js';
import { addRings } from '../lib/rings.js';
import { bindControls } from '../lib/controls.js';

const highwayYear = document.getElementById('highway-year');
const motion = document.getElementById('highway-motion');
const chart = createChart(document.getElementById('chart'), data, tracks.map((t) => t.year), { connectTo: highwayYear });

const history = document.getElementById('history');
const engine = createEngine({ tracks, onTrackChange });
function onTrackChange() {
  const { year, history: text } = tracks[engine.state.current];
  highwayYear.textContent = year;
  chart.update(year);
  history.textContent = text;
  // Follows the queued track so it changes as soon as you press the arrow.
  motion.textContent = tracks[engine.pendingTrack()].motion;
}

createHighway(document.getElementById('highway'), engine, { colors: { thigh: 'red' } });
bindControls(engine, tracks, { bpm: 90, onPastEnd: () => location.assign('../solutions/') });
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
