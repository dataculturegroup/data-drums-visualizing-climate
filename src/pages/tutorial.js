import { tracks } from './tutorial-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway, pulse } from '../lib/highway.js';
import { addRings } from '../lib/rings.js';
import { bindControls } from '../lib/controls.js';

const motions = document.querySelectorAll('.cue-motion');
// One empty bar between steps, so the room can reset before the next pattern.
const engine = createEngine({ tracks, onTrackChange, breakBars: 1 });
// Follows the queued step so the motion changes as soon as you press the arrow.
function onTrackChange() {
  for (const el of motions) el.textContent = tracks[engine.pendingTrack()].motion;
}
// Each big circle, and the motion over its highway, pulses the instant a dot reaches the target.
const pulsing = {
  you: [document.querySelector('.blob-you'), document.querySelector('.you-highway .cue-motion')],
  me: [document.querySelector('.blob-me'), document.querySelector('.me-highway .cue-motion')],
};
const onHit = (lane) => pulsing[lane].forEach(pulse);

createHighway(document.getElementById('highway-you'), engine, { lanes: ['you'], colors: { you: 'red' }, onHit });
createHighway(document.getElementById('highway-me'), engine, { lanes: ['me'], colors: { me: 'lightbrown' }, targetColor: 'lightbrown', lightBarLines: true, onHit });
// → past the last step stops and returns to the home screen.
bindControls(engine, tracks, { bpm: 110, onPastEnd: () => location.assign('../current-emissions/') });
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
