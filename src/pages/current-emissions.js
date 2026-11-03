import data from '../data/global-co2.json';
import { tracks } from './current-emissions-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway } from '../lib/highway.js';
import { createChart } from '../lib/chart.js';
import { addRings } from '../lib/rings.js';
import { bindControls } from '../lib/controls.js';

const chart = createChart(document.getElementById('chart'), data, tracks.map((t) => t.year));

const highwayYear = document.getElementById('highway-year');
const engine = createEngine({ tracks, onTrackChange, sounds: { thigh: 'clap' } });
function onTrackChange() {
  const { year, history: text } = tracks[engine.state.current];
  chart.update(year, text);
  highwayYear.textContent = year;
}

createHighway(document.getElementById('highway'), engine, { colors: { thigh: 'red' } });
bindControls(engine, tracks, { bpm: 90 });
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
