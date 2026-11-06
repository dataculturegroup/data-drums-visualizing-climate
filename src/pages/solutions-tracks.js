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

// The narrative: empty highways for the last few years, then bring each sector in at its 2030
// beat one at a time, then clear the highways again and bring each one back at its 2035 beat one
// at a time.
// stage: { lane: 2030 | 2035 } for the sectors playing in that step (others are silent).
// Each playing sector's subtitle shows its target's reduction and its pop-up tips come from its
// target's bucket of src/data/solutions-tips.json; silent sectors keep their description and show
// no tips, except in the opening step where every sector shows the "now" tips.
// smoke: how much of Movement 2's worst smoke is left, as a fraction.
const lanes = sectors.map((s) => s.lane);
const TARGETS = {
  2030: { title: 'back to 1.5° or less: the next 5 years', sub: '18% reduction', tips: 'next_5' },
  2035: { title: 'back to 1.5° or less: the next 10 years', sub: '45% reduction', tips: 'next_10' },
};
const step = (label, title, stage, smoke, tips) => ({
  label,
  title,
  smoke,
  subs: Object.fromEntries(Object.entries(stage).map(([lane, target]) => [lane, TARGETS[target].sub])),
  tips: tips ?? Object.fromEntries(Object.entries(stage).map(([lane, target]) => [lane, TARGETS[target].tips])),
  hits: Object.entries(stage).map(([lane, target]) => ({ lane, ticks: beats[target][lane] })),
});
// The first n sectors at `target`; the others are silent.
const stageOf = (n, target) => Object.fromEntries(lanes.slice(0, n).map((lane) => [lane, target]));

// Smoke thins as each sector reaches its target: 18% gone once all three hit 2030, 45% by 2035.
const SMOKE = { 2030: [0.94, 0.88, 0.82], 2035: [0.73, 0.64, 0.55] };

export const tracks = [
  step('Last few years', 'back to 1.5° or less: the last few years', {}, 1,
    Object.fromEntries(lanes.map((lane) => [lane, 'now']))),
  ...sectors.map((s, i) => step(`2030: ${s.label}`, TARGETS[2030].title, stageOf(i + 1, 2030), SMOKE[2030][i])),
  ...sectors.map((s, i) => step(`2035: ${s.label}`, TARGETS[2035].title, stageOf(i + 1, 2035), SMOKE[2035][i])),
];
// Finale: playback stops, the highways hide, and every sector's tips fill its column (wall: true).
tracks.push({ ...tracks.at(-1), label: 'All the changes', hits: [], tips: {}, stop: true, wall: true });
