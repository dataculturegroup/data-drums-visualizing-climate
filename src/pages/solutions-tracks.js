import { range } from '../lib/patterns.js';

// Three sectors, one highway each. Ticks are 32nds: beat = 8, eighth ("and") = 4, sixteenth = 2.
export const sectors = [
  // tipsKey: section of src/data/solutions-tips.json shown as pop-up tips on this highway.
  { lane: 'making', label: 'Making things', color: 'red', sound: 'clap', tipsKey: 'making_things' },
  { lane: 'food', label: 'Food and land', color: 'green', sound: 'stomp', tipsKey: 'food_and_land' },
  { lane: 'moving', label: 'Getting around', color: 'darkbrown', sound: 'thigh', tipsKey: 'getting_around_and_living' },
];

export const tracks = [
  {
    label: 'Step 1',
    tips: 'now', // which list of tips to show in each sector
    desc: 'one hit each, on beats 1, 2, 3',
    hits: [
      { lane: 'making', ticks: [0] },
      { lane: 'food', ticks: [8] },
      { lane: 'moving', ticks: [16] },
    ],
  },
  {
    label: 'Step 2',
    tips: '2040',
    desc: 'layered groove',
    hits: [
      // Beats 1 & 3: first and fourth sixteenths; beats 2 & 4: the "and".
      { lane: 'making', ticks: [0, 6, 12, 16, 22, 28] },
      // Every quarter note.
      { lane: 'food', ticks: range(0, 32, 8) },
      // Beat 1, then all four sixteenths of beat 4.
      { lane: 'moving', ticks: [0, ...range(24, 32, 2)] },
    ],
  },
];
