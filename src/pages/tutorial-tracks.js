import { TICKS_PER_BAR } from '../lib/patterns.js';

// Call and response: each step loops 2 bars. Bar 1 = ME (presenter's highway),
// bar 2 = YOU (audience's highway repeats the same pattern).

// Pattern ticks are for one bar (32nds: quarter = 8, eighth = 4, sixteenth = 2).
const callAndResponse = (label, desc, ticks) => ({
  label,
  desc,
  bars: 2,
  hits: [
    { lane: 'me', ticks },
    { lane: 'you', ticks: ticks.map((k) => k + TICKS_PER_BAR) },
  ],
});

export const tracks = [
  callAndResponse('Step 1', 'four quarter notes', [0, 8, 16, 24]),
  callAndResponse('Step 2', 'quarter, quarter, eighth, eighth, eighth', [0, 8, 16, 20, 24]),
  callAndResponse('Step 3', '3-2 clave', [0, 6, 12, 20, 24]),
  callAndResponse('Step 4', 'one beat of sixteenths, then three quarters', [0, 2, 4, 6, 8, 16, 24]),
];
