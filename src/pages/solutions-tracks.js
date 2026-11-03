import { range } from '../lib/patterns.js';

// Three sectors, one highway each. Ticks are 32nds: beat = 8, eighth ("and") = 4, sixteenth = 2.
export const sectors = [
  // tipsKey: section of src/data/solutions-tips.json shown as pop-up tips on this highway.
  { lane: 'food', label: 'Food and Land', color: 'green', sound: 'stomp', tipsKey: 'food_and_land' },
  { lane: 'moving', label: 'Getting Around', color: 'darkbrown', sound: 'thigh', tipsKey: 'getting_around_and_living' },
  { lane: 'making', label: 'Making Things', color: 'red', sound: 'clap', tipsKey: 'making_things' },
];

// Each sector's beat today ('now') and in the future ('2040'); keys match the tips lists.
const beats = {
  now: {
    // One hit each, on beats 1, 2, 3.
    making: [0],
    food: [8],
    moving: [16],
  },
  2040: {
    // Beats 1 & 3: first and fourth sixteenths; beats 2 & 4: the "and".
    making: [0, 6, 12, 16, 22, 28],
    // Every quarter note.
    food: range(0, 32, 8),
    // Beat 1, then all four sixteenths of beat 4.
    moving: [0, ...range(24, 32, 2)],
  },
};

// The narrative: start with empty highways, bring in each sector's "now" beat one at a
// time, then swap each one over to its future beat one at a time.
// stage: { lane: 'now' | '2040' } for the sectors playing in that step (others are silent).
const lanes = sectors.map((s) => s.lane);
const step = (label, title, desc, stage) => ({
  label,
  title, // subtle heading over all three highways
  desc,
  tips: stage, // which list of tips to show in each sector
  hits: Object.entries(stage).map(([lane, era]) => ({ lane, ticks: beats[era][lane] })),
});
const stageOf = (nowCount, futureCount) =>
  Object.fromEntries(lanes.slice(0, nowCount).map((lane, i) => [lane, i < futureCount ? '2040' : 'now']));

export const tracks = [
  step('Empty', 'current emissions reductions', 'the three highways, no beats', {}),
  ...sectors.map((s, i) => step(`Now ${i + 1}`, 'current emissions reductions', `add ${s.label} today`, stageOf(i + 1, 0))),
  ...sectors.map((s, i) => step(`Future ${i + 1}`, 'coming back down to 1.5° by 2040', `${s.label} moves to 2040`, stageOf(lanes.length, i + 1))),
];
