import * as Tone from 'tone';

// Synthesized body-percussion sounds. Each voice takes the node to play into and returns
// trigger(time) for sample-accurate playback.

// Clap: three quick bandpassed noise bursts and a short tail, like several hands landing at once.
function clap(out) {
  const sr = Tone.getContext().sampleRate;
  const data = new Float32Array(Math.round(sr * 0.25));
  for (let i = 0; i < data.length; i++) {
    const t = i / sr;
    const burst = [0, 0.011, 0.022].reduce((env, start) => (t >= start ? env + Math.exp(-(t - start) / 0.004) : env), 0);
    const tail = t >= 0.03 ? Math.exp(-(t - 0.03) / 0.06) * 0.6 : 0;
    data[i] = (Math.random() * 2 - 1) * Math.min(1, burst + tail);
  }
  const player = new Tone.Player(Tone.ToneAudioBuffer.fromArray(data)).chain(
    new Tone.Filter({ type: 'bandpass', frequency: 1400, Q: 0.9 }),
    out,
  );
  player.volume.value = 2;
  return (time) => player.start(time);
}

// Stomp: deep pitched thump with a little floorboard noise on top.
function stomp(out) {
  const body = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.05 },
  }).connect(out);
  body.volume.value = -3; // keeps the stomp's peak under full scale
  const thud = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
  }).chain(new Tone.Filter(400, 'lowpass'), out);
  thud.volume.value = -4;
  return (time) => {
    body.triggerAttackRelease('C1', 0.2, time);
    thud.triggerAttackRelease(0.08, time);
  };
}

// Thigh slap: short, bright-ish noise slap with a hint of body, pitched well above the stomp.
function thigh(out) {
  const slap = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
  }).chain(new Tone.Filter(350, 'highpass'), new Tone.Filter(2600, 'lowpass'), out);
  slap.volume.value = -2;
  const body = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
  }).connect(out);
  body.volume.value = -12;
  return (time) => {
    slap.triggerAttackRelease(0.05, time);
    body.triggerAttackRelease('E3', 0.05, time);
  };
}

// Metronome click: a very short, bright tick (a sine blip that dies in ~10ms) with a burst of
// high-passed noise for the snap, like a mechanical metronome. trigger(time, accent) is a little
// higher on the first beat of the bar.
export function metronome(out) {
  const blip = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0005, decay: 0.012, sustain: 0, release: 0.005 },
  }).connect(out);
  blip.volume.value = 0; // as loud as the body-percussion voices
  const snap = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.0005, decay: 0.006, sustain: 0 },
  }).chain(new Tone.Filter(4000, 'highpass'), out);
  snap.volume.value = -6;
  return (time, accent) => {
    blip.triggerAttackRelease(accent ? 3200 : 2400, 0.01, time);
    snap.triggerAttackRelease(0.006, time);
  };
}

export const voices = { clap, stomp, thigh };
