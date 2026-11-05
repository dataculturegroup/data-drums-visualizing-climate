import * as Tone from 'tone';
import { TICKS_PER_BAR, barsOf, buildHitSets, lanesOf } from './patterns.js';
import { voices, metronome } from './voices.js';

// Tone's Transport is the clock for the visuals; pages can optionally give lanes a sound.
// Bar 0 is a one-bar count-in (no notes); the pattern starts at bar 1.
export const COUNT_IN_BARS = 1;

// Draw this far ahead of the audio clock to cover display lag (rAF +
// compositor + projector) so dots land when the hit is heard. Calibrated earlier by ear.
const VISUAL_LEAD_MS = 70;

// sounds: optional { lane: 'clap' | 'stomp' | 'thigh' }. Lanes without a sound are silent.
// A track's optional `sound` overrides it for every lane while that track plays: a name, or
// (pos) => name to pick by 32nd-note position within the bar.
// breakBars: empty bars (no hits) played between one track and the next when switching while playing.
export function createEngine({ tracks, onTrackChange, sounds = {}, breakBars = 0 }) {
  const hitSets = buildHitSets(tracks);
  const lanes = lanesOf(tracks);
  const transport = Tone.getTransport();
  const draw = Tone.getDraw();
  const ppq32 = transport.PPQ / 8; // Tone ticks per 32nd note

  const state = {
    current: 0, // active track index
    queued: null, // track index waiting for the next bar line
    switchBar: Infinity, // first bar that uses the queued track
    breakStart: Infinity, // first empty bar before the queued track (= switchBar with no break)
    phraseStart: COUNT_IN_BARS, // bar where the current track's phrase loop began
    playing: false,
    metronome: true, // tick on every beat, count-in and breaks included
  };

  // One voice per sound name, shared by lanes and tracks that use it.
  const trackSounds = tracks.map((t) => t.sound).filter(Boolean);
  const names = trackSounds.some((s) => typeof s === 'function')
    ? Object.keys(voices) // can't tell which a function picks, so have them all ready
    : [...new Set([...Object.values(sounds), ...trackSounds])];
  // Drums and metronome play through separate outputs so each can be turned off on its own.
  const drumsOut = new Tone.Volume().toDestination();
  drumsOut.mute = true; // pages start with the drums off; D turns them on
  const voiceFor = Object.fromEntries(names.map((name) => [name, voices[name](drumsOut)]));
  const hasSound = names.length > 0;
  const click = metronome(new Tone.Volume().toDestination());

  // Which track governs a given bar (null during count-in and breaks).
  function trackForBar(bar) {
    if (bar < COUNT_IN_BARS) return null;
    if (state.queued !== null && bar >= state.breakStart && bar < state.switchBar) return null;
    return bar >= state.switchBar && state.queued !== null ? state.queued : state.current;
  }

  // Index of a bar within its track's looping phrase (null during count-in and breaks).
  function phraseBarAt(bar) {
    const t = trackForBar(bar);
    if (t === null) return null;
    const start = state.queued !== null && bar >= state.switchBar ? state.switchBar : state.phraseStart;
    const n = barsOf(tracks[t]);
    return (((bar - start) % n) + n) % n;
  }

  // { lane: Set of ticks 0–31 } for a bar, or null during count-in and breaks.
  function hitsForBar(bar) {
    const t = trackForBar(bar);
    return t === null ? null : hitSets[t][phraseBarAt(bar)];
  }

  function commitQueued() {
    state.phraseStart = state.switchBar === Infinity ? COUNT_IN_BARS : state.switchBar;
    state.current = state.queued;
    state.queued = null;
    state.switchBar = Infinity;
    state.breakStart = Infinity;
    onTrackChange(state.current);
  }

  // Every 32nd note: apply a queued track change on bar lines, and play any sounded hits.
  transport.scheduleRepeat((time) => {
    const tick = Math.round(transport.getTicksAtTime(time) / ppq32);
    const bar = Math.floor(tick / TICKS_PER_BAR);
    const pos = tick % TICKS_PER_BAR;
    if (pos === 0 && state.queued !== null && bar >= state.switchBar) draw.schedule(commitQueued, time);
    if (state.metronome && pos % 8 === 0) click(time, pos === 0);
    if (!hasSound || drumsOut.mute) return;
    const t = trackForBar(bar);
    if (t === null) return;
    const barHits = hitSets[t][phraseBarAt(bar)];
    for (const [lane, ticks] of Object.entries(barHits)) {
      const { sound } = tracks[t];
      const name = (typeof sound === 'function' ? sound(pos) : sound) ?? sounds[lane];
      if (name && ticks.has(pos)) voiceFor[name](time);
    }
  }, '32n', 0);

  // Current position in 32nd-note ticks, aligned to what's heard (the metronome or drums).
  function nowTicks() {
    if (transport.state !== 'started') return 0;
    const ctx = Tone.getContext();
    const t = ctx.immediate() - (ctx.rawContext.outputLatency || 0) + VISUAL_LEAD_MS / 1000;
    return transport.getTicksAtTime(Math.max(0, t)) / ppq32;
  }

  function setTrack(index) {
    if (index === (state.queued ?? state.current)) return;
    if (!state.playing) {
      state.current = index;
      state.queued = null;
      state.switchBar = Infinity;
      state.breakStart = Infinity;
      state.phraseStart = COUNT_IN_BARS;
      onTrackChange(index);
      return;
    }
    // Already in a break: keep it, just change which track follows.
    const bar = Math.floor(nowTicks() / TICKS_PER_BAR);
    if (state.queued !== null && bar >= state.breakStart) {
      state.queued = index;
      onTrackChange(state.current);
      return;
    }
    // Switch at the start of the current track's next phrase loop, after any break.
    const n = barsOf(tracks[state.current]);
    let next = Math.max(bar + 1, COUNT_IN_BARS);
    while ((next - state.phraseStart) % n !== 0) next++;
    state.queued = index;
    state.breakStart = next;
    state.switchBar = next + breakBars;
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
    toggleMetronome() {
      state.metronome = !state.metronome;
    },
    // Turns the drum sounds off or on; the metronome, transport and visuals keep running.
    toggleDrums() {
      drumsOut.mute = !drumsOut.mute;
    },
    bpm: () => transport.bpm.value,
    setBpm(bpm) {
      transport.bpm.rampTo(bpm, 0.2);
    },
  };
}
