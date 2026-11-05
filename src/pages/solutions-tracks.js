import { range } from '../lib/patterns.js';

// Three sectors, one highway each. Ticks are 32nds: beat = 8, eighth ("and") = 4, sixteenth = 2.
export const sectors = [
  // tipsKey: section of src/data/solutions-tips.json shown as pop-up tips on this highway.
  // reduction: replaces the subtitle under the sector's title once it moves to its 2040 beat.
  { lane: 'food', label: 'Food and Land', color: 'green', sound: 'stomp', tipsKey: 'food_and_land', reduction: '4x reduction' },
  { lane: 'moving', label: 'Getting Around', color: 'darkbrown', sound: 'thigh', tipsKey: 'getting_around_and_living', reduction: '5x reduction' },
  { lane: 'making', label: 'Making Things', color: 'red', sound: 'clap', tipsKey: 'making_things', reduction: '6x reduction' },
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
    // "One-and-two, three-and-four": beats 1 and 3 with their "and", then beats 2 and 4.
    making: [0, 4, 8, 16, 20, 24],
    // Every quarter note.
    food: range(0, 32, 8),
    // Beat 1, then all four sixteenths of beat 4.
    moving: [0, ...range(24, 32, 2)],
  },
};

// The narrative: start with empty highways, bring in all three sectors' "now" beats at once,
// then swap each one over to its future beat one at a time.
// stage: { lane: 'now' | '2040' } for the sectors playing in that step (others are silent).
// tips: which list of pop-up tips each sector shows (sectors left out show none).
const lanes = sectors.map((s) => s.lane);
// smoke: how much of Movement 2's worst smoke is left, as a fraction (see SMOKE below).
const step = (label, title, desc, stage, smoke, tips = stage) => ({
  label,
  smoke,
  title, // subtle heading over all three highways
  desc,
  tips,
  hits: Object.entries(stage).map(([lane, era]) => ({ lane, ticks: beats[era][lane] })),
});
// In the future steps only the sectors that have moved to 2040 show tips, so they're added one
// sector at a time along with the beats.
const only2040 = (stage) => Object.fromEntries(Object.entries(stage).filter(([, era]) => era === '2040'));
const stageOf = (nowCount, futureCount) =>
  Object.fromEntries(lanes.slice(0, nowCount).map((lane, i) => [lane, i < futureCount ? '2040' : 'now']));

// Smoke starts at Movement 2's worst, thins a little as today's efforts come in (15% of it), then
// a lot as each sector moves to 2040 (another 20%, 30%, then 35%, ending clear).
const SMOKE = { now: 0.85, 2040: [0.65, 0.35, 0] };

const phase1Titles = 'reductions over the last few years';
export const tracks = [
  step('Empty', phase1Titles, 'the three highways, no beats', {}, 1),
  step('Now', phase1Titles, 'all three sectors today', stageOf(lanes.length, 0), SMOKE.now),
  ...sectors.map((s, i) => {
    const stage = stageOf(lanes.length, i + 1);
    return step(`Future ${i + 1}`, '2040 and beyond: coming back down to 1.5°', `${s.label} moves to 2040`, stage, SMOKE[2040][i], only2040(stage));
  }),
];
