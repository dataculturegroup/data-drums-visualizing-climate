import { TICKS_PER_BAR } from '../lib/patterns.js';

// Call and response: each step loops 2 bars. Bar 1 = ME (presenter's highway),
// bar 2 = YOU (audience's highway repeats the same pattern).

// Pattern ticks are for one bar (32nds: quarter = 8, eighth = 4, sixteenth = 2).
// motion: shown under YOU and ME, telling the room how to play the hits; sound: the matching voice.
const callAndResponse = (label, desc, ticks, motion = 'clap your hands', sound = 'clap') => ({
  label,
  desc,
  motion,
  sound,
  bars: 2,
  hits: [
    { lane: 'me', ticks },
    { lane: 'you', ticks: ticks.map((k) => k + TICKS_PER_BAR) },
  ],
});

export const tracks = [
  callAndResponse('Step 1', 'four quarter notes', [0, 8, 16, 24]),
  // Same beat, stomping beats 1 and 2 and clapping 3 and 4.
  callAndResponse('Step 2', 'four quarter notes', [0, 8, 16, 24],
    'stomp your feet &\nclap your hands', (pos) => (pos < 16 ? 'stomp' : 'clap')),
  callAndResponse('Step 3', 'quarter, quarter, eighth, eighth, eighth', [0, 8, 16, 20, 24]),
  callAndResponse('Step 4', '3-2 clave', [0, 6, 12, 20, 24]),
  // Tap the sixteenths on beat 1 and the beat 2 quarter, clap beats 3 and 4.
  callAndResponse('Step 5', 'one beat of sixteenths, then three quarters', [0, 2, 4, 6, 8, 16, 24],
    'tap your legs &\nclap your hands', (pos) => (pos <= 8 ? 'thigh' : 'clap')),
];
