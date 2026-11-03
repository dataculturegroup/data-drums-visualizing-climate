import { range } from '../lib/patterns.js';

// Hit density follows global CO2: roughly one hit per billion tonnes.
export const tracks = [
  { label: '1880', year: 1880, desc: '1 hit on beat 1', hits: [{ lane: 'thigh', ticks: [0] }],
    history: 'Coal and steam power the Industrial Revolution.' },
  { label: '1900', year: 1900, desc: 'beats 1 & 3', hits: [{ lane: 'thigh', ticks: [0, 16] }],
    history: 'Railways and steel mills spread, and coal powers fast-growing industry.' },
  { label: '1928', year: 1928, desc: 'quarter notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 8) }],
    history: 'Oil arrives: mass-produced cars, electrified cities, and World War I factories.' },
  { label: '1956', year: 1956, desc: 'eighth notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 4) }],
    history: 'World War II and postwar boom bring suburbs, highways, and more industrialization.' },
  { label: '1972', year: 1972, desc: 'sixteenth notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 2) }],
    history: 'Cheap oil, cars for millions, jet travel, plastics, and global rebuilding.' },
  { label: '2010', year: 2010, desc: 'all 32nd notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 1) }],
    history: 'Oil shocks and efficiency slow growth in parallel to global coal booms.' },
];