import { range } from '../lib/patterns.js';

// Three sectors, one highway each. Ticks are 32nds: beat = 8, eighth ("and") = 4, sixteenth = 2.
export const sectors = [
  // tipsKey: section of src/data/solutions-tips.json shown as pop-up tips on this highway.
  { lane: 'food', label: 'Food and Land', color: 'green', sound: 'stomp', tipsKey: 'food_and_land' },
  { lane: 'moving', label: 'Getting Around', color: 'darkbrown', sound: 'thigh', tipsKey: 'getting_around_and_living' },
  { lane: 'making', label: 'Making Things', color: 'red', sound: 'clap', tipsKey: 'making_things' },
];

// Each sector's beat at each target year.
const beats = {
  2030: {
    food: [0, 8, 16], // 1, 2, 3
    moving: [0, 24], // 4 and 1
    making: [0, 12, 20], // 1, the "and" of 2, the "and" of 3
  },
  2035: {
    food: [0, 8, 16, 20, 24, 28], // 1, 2, 3-and, 4-and
    moving: range(0, 16, 2), // eight sixteenths across beats 1 and 2
    making: [0, 6, 12, 20, 24], // 3-2 clave, squeezed into one bar like the warm up's
  },
};

// The narrative: empty highways for the last few years, then every sector at its 2030 beat, then
// at its 2035 beat.
// title: heading over all three highways.
// sub: replaces every sector's subtitle (null keeps the sector's description from the page).
// target: which beats every sector plays (null for none).
// tips: which list of src/data/solutions-tips.json pop-up tips each sector shows (null for none).
// smoke: how much of Movement 2's worst smoke is left, as a fraction.
const lanes = sectors.map((s) => s.lane);
const step = ({ label, title, sub = null, target = null, tips = null, smoke }) => ({
  label,
  title,
  sub,
  smoke,
  tips: Object.fromEntries(tips ? lanes.map((lane) => [lane, tips]) : []),
  hits: target ? lanes.map((lane) => ({ lane, ticks: beats[target][lane] })) : [],
});

export const tracks = [
  step({ label: 'Last few years', title: 'pathway to 1.5°: the last few years', smoke: 1 }),
  step({ label: '2030', title: 'pathway to 1.5°: 2030 target', sub: '18% reduction', target: 2030, tips: 'now', smoke: 0.82 }),
  step({ label: '2035', title: 'pathway to 1.5°: 2035 target', sub: '45% reduction', target: 2035, tips: '2040', smoke: 0.55 }),
];
