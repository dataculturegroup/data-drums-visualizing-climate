import { sectors, tracks } from './solutions-tracks.js';
import { createEngine } from '../lib/engine.js';
import { createHighway } from '../lib/highway.js';
import { bindControls } from '../lib/controls.js';
import { createTips } from '../lib/tips.js';
import tips from '../data/solutions-tips.json';

const sounds = Object.fromEntries(sectors.map((s) => [s.lane, s.sound]));
const engine = createEngine({ tracks, onTrackChange: () => {}, sounds });
for (const { lane, color } of sectors) {
  createHighway(document.getElementById(`highway-${lane}`), engine, { lanes: [lane], colors: { [lane]: color } });
}
bindControls(engine, tracks, { bpm: 90 });

createTips(
  engine,
  sectors.map(({ lane, color, tipsKey }) => ({
    wrap: document.getElementById(`highway-${lane}`).parentElement,
    color,
    // Each entry is { text, ipcc_option, source }; the tip shows the text.
    tipsFor: (t) => (tips[tipsKey]?.[tracks[t].tips] ?? []).map((tip) => tip.text),
  })),
);
