import data from '../data/global-co2.json';
import { tracks } from './current-emissions-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway } from '../lib/highway.js';
import { createChart } from '../lib/chart.js';
import { addRings } from '../lib/rings.js';
import { bindControls, renderTrackHeader } from '../lib/controls.js';

const chart = createChart(document.getElementById('chart'), data, tracks.map((t) => t.year));

const engine = createEngine({ tracks, onTrackChange });
function onTrackChange() {
  renderTrackHeader(engine, tracks);
  chart.update(tracks[engine.state.current].year);
}

createHighway(document.getElementById('highway'), engine, { colors: { thigh: 'green' } });
bindControls(engine, tracks, { bpm: 90 });
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
