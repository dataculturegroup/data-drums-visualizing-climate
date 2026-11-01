// One 4/4 measure = 32 ticks (32nd notes).
export const TICKS_PER_BAR = 32;

export const range = (start, end, step) =>
  Array.from({ length: Math.ceil((end - start) / step) }, (_, i) => start + i * step);

// Lanes in first-seen order across all tracks, e.g. ['thigh', 'clap', 'stomp'].
export const lanesOf = (tracks) => [...new Set(tracks.flatMap((t) => t.hits.map((h) => h.lane)))];

// A track loops a phrase of `bars` measures (default 1); its ticks span the whole phrase.
export const barsOf = (track) => track.bars ?? 1;

// hitSets[trackIndex][phraseBar][lane] -> Set of ticks within that bar (0–31).
export const buildHitSets = (tracks) =>
  tracks.map((t) =>
    Array.from({ length: barsOf(t) }, (_, b) =>
      Object.fromEntries(
        t.hits.map((h) => [
          h.lane,
          new Set(
            h.ticks
              .filter((k) => Math.floor(k / TICKS_PER_BAR) === b)
              .map((k) => k % TICKS_PER_BAR)
          ),
        ])
      )
    )
  );
