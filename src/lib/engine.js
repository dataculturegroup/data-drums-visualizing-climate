import * as Tone from 'tone';
import { TICKS_PER_BAR, barsOf, buildHitSets, lanesOf } from './patterns.js';
import { voices } from './voices.js';

// Tone's Transport is the clock for the visuals; pages can optionally give lanes a sound.
// Bar 0 is a one-bar count-in (no notes); the pattern starts at bar 1.
export const COUNT_IN_BARS = 1;

// With sound on, draw this far ahead of the audio clock to cover display lag (rAF +
// compositor + projector) so dots land when the hit is heard. Calibrated earlier by ear.
const VISUAL_LEAD_MS = 130;

// sounds: optional { lane: 'clap' | 'stomp' | 'thigh' }. Lanes without a sound are silent.
export function createEngine({ tracks, onTrackChange, sounds = {} }) {
  const hitSets = buildHitSets(tracks);
  const lanes = lanesOf(tracks);
  const transport = Tone.getTransport();
  const draw = Tone.getDraw();
  const ppq32 = transport.PPQ / 8; // Tone ticks per 32nd note

  const state = {
    current: 0, // active track index
    queued: null, // track index waiting for the next bar line
    switchBar: Infinity, // first bar that uses the queued track
    phraseStart: COUNT_IN_BARS, // bar where the current track's phrase loop began
    playing: false,
  };

  const triggers = Object.fromEntries(Object.entries(sounds).map(([lane, name]) => [lane, voices[name]()]));
  const hasSound = Object.keys(triggers).length > 0;
  Tone.getDestination().mute = true; // pages start silent; M turns sound on

  // Which track governs a given bar (null during count-in).
  function trackForBar(bar) {
    if (bar < COUNT_IN_BARS) return null;
    return bar >= state.switchBar && state.queued !== null ? state.queued : state.current;
  }

  // Index of a bar within its track's looping phrase (null during count-in).
  function phraseBarAt(bar) {
    const t = trackForBar(bar);
    if (t === null) return null;
    const start = state.queued !== null && bar >= state.switchBar ? state.switchBar : state.phraseStart;
    const n = barsOf(tracks[t]);
    return (((bar - start) % n) + n) % n;
  }

  // { lane: Set of ticks 0–31 } for a bar, or null during count-in.
  function hitsForBar(bar) {
    const t = trackForBar(bar);
    return t === null ? null : hitSets[t][phraseBarAt(bar)];
  }

  function commitQueued() {
    state.phraseStart = state.switchBar === Infinity ? COUNT_IN_BARS : state.switchBar;
    state.current = state.queued;
    state.queued = null;
    state.switchBar = Infinity;
    onTrackChange(state.current);
  }

  // Every 32nd note: apply a queued track change on bar lines, and play any sounded hits.
  transport.scheduleRepeat((time) => {
    const tick = Math.round(transport.getTicksAtTime(time) / ppq32);
    const bar = Math.floor(tick / TICKS_PER_BAR);
    const pos = tick % TICKS_PER_BAR;
    if (pos === 0 && state.queued !== null && bar >= state.switchBar) draw.schedule(commitQueued, time);
    if (!hasSound) return;
    const barHits = hitsForBar(bar);
    if (!barHits) return;
    for (const [lane, trigger] of Object.entries(triggers)) {
      if (barHits[lane]?.has(pos)) trigger(time);
    }
  }, '32n', 0);

  // Current position in 32nd-note ticks (aligned to what's heard when there's sound).
  function nowTicks() {
    if (transport.state !== 'started') return 0;
    const ctx = Tone.getContext();
    const t = hasSound
      ? ctx.immediate() - (ctx.rawContext.outputLatency || 0) + VISUAL_LEAD_MS / 1000
      : ctx.immediate();
    return transport.getTicksAtTime(Math.max(0, t)) / ppq32;
  }

  function setTrack(index) {
    if (index === (state.queued ?? state.current)) return;
    if (!state.playing) {
      state.current = index;
      state.queued = null;
      state.switchBar = Infinity;
      state.phraseStart = COUNT_IN_BARS;
      onTrackChange(index);
      return;
    }
    // Switch at the start of the current track's next phrase loop.
    const n = barsOf(tracks[state.current]);
    let next = Math.max(Math.floor(nowTicks() / TICKS_PER_BAR) + 1, COUNT_IN_BARS);
    while ((next - state.phraseStart) % n !== 0) next++;
    state.queued = index;
    state.switchBar = next;
    onTrackChange(state.current);
  }

  return {
    state,
    lanes,
    trackForBar,
    phraseBarAt,
    hitsForBar,
    nowTicks,
    setTrack,
    pendingTrack: () => state.queued ?? state.current,
    async start() {
      await Tone.start();
      transport.stop();
      transport.position = 0;
      state.phraseStart = COUNT_IN_BARS;
      transport.start('+0.05');
      state.playing = true;
    },
    stop() {
      transport.stop();
      state.playing = false;
      if (state.queued !== null) commitQueued();
      state.phraseStart = COUNT_IN_BARS;
    },
    // Silences (or restores) all sound; the transport and visuals keep running.
    toggleMute() {
      const out = Tone.getDestination();
      out.mute = !out.mute;
    },
    bpm: () => transport.bpm.value,
    setBpm(bpm) {
      transport.bpm.rampTo(bpm, 0.2);
    },
  };
}
