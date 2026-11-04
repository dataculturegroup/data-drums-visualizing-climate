import { tracks } from './tutorial-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway, GLOW_MS } from '../lib/highway.js';
import { addRings } from '../lib/rings.js';
import { bindControls } from '../lib/controls.js';

const motions = document.querySelectorAll('.cue-motion');
const engine = createEngine({ tracks, onTrackChange });
// Follows the queued step so the motion changes as soon as you press the arrow.
function onTrackChange() {
  for (const el of motions) el.textContent = tracks[engine.pendingTrack()].motion;
}
// Each big circle pulses the instant a dot reaches the target on its highway.
const blobs = { you: document.querySelector('.blob-you'), me: document.querySelector('.blob-me') };
const pulse = (lane) =>
  blobs[lane].animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], {
    duration: GLOW_MS,
    easing: 'ease-out',
  });

createHighway(document.getElementById('highway-you'), engine, { lanes: ['you'], colors: { you: 'red' }, onHit: pulse });
createHighway(document.getElementById('highway-me'), engine, { lanes: ['me'], colors: { me: 'lightbrown' }, targetColor: 'lightbrown', lightBarLines: true, onHit: pulse });
// → past the last step stops and returns to the home screen.
bindControls(engine, tracks, { bpm: 110, onPastEnd: () => location.assign('../current-emissions/') });
onTrackChange();

// Spinning rings on the start screen only; they go away with it once playing starts.
addRings(document.getElementById('overlay'));
