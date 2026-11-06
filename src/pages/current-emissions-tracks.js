import { range } from '../lib/patterns.js';

// Hit density follows global CO2: one hit per billion tonnes, in the years closest to 1, 2, 4, 8, 16 and 32 Gt.
// motion: shown under the year, telling the room how to play the hits; sound: the matching voice.
// The first step shows 1883 with no hits yet; the last holds 2008 and stops playback (stop: true).
const steps = [
  { label: '1883', year: 1883, motion: 'stomp your feet', sound: 'stomp', desc: '1 hit on beat 1', hits: [{ lane: 'thigh', ticks: [0] }],
    history: 'Coal and steam power the Industrial Revolution.' },
  { label: '1901', year: 1901, motion: 'stomp your feet', sound: 'stomp', desc: 'beats 1 & 3', hits: [{ lane: 'thigh', ticks: [0, 16] }],
    history: 'Railways and steel mills spread, and coal powers fast-growing industry.' },
  { label: '1928', year: 1928, motion: 'clap your hands', sound: 'clap', desc: 'quarter notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 8) }],
    history: 'Oil arrives: mass-produced cars, electrified cities, and World War I factories.' },
  { label: '1956', year: 1956, motion: 'clap your hands', sound: 'clap', desc: 'eighth notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 4) }],
    history: 'World War II and postwar boom bring suburbs, highways, and more industrialization.' },
  { label: '1972', year: 1972, motion: 'tap your legs', sound: 'thigh', desc: 'sixteenth notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 2) }],
    history: 'Cheap oil, cars for millions, jet travel, plastics, and global rebuilding.' },
  { label: '2008', year: 2008, motion: 'tap your legs', sound: 'thigh', desc: 'all 32nd notes', hits: [{ lane: 'thigh', ticks: range(0, 32, 1) }],
    history: 'Oil shocks and efficiency slow growth in parallel to global coal booms.' },
];
export const tracks = [
  { ...steps[0], label: '1883 (no hits)', desc: 'no hits', hits: [] },
  ...steps,
  { ...steps.at(-1), label: 'Pause', desc: 'playback stops', hits: [], stop: true },
];