import * as Tone from 'tone';

// Synthesized body-percussion sounds. Each voice returns trigger(time) for sample-accurate playback.

// Clap: three quick bandpassed noise bursts and a short tail, like several hands landing at once.
function clap() {
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
    Tone.getDestination(),
  );
  player.volume.value = 2;
  return (time) => player.start(time);
}

// Stomp: deep pitched thump with a little floorboard noise on top.
function stomp() {
  const body = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.05 },
  }).toDestination();
  body.volume.value = -3; // keeps the stomp's peak under full scale
  const thud = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
  }).chain(new Tone.Filter(400, 'lowpass'), Tone.getDestination());
  thud.volume.value = -4;
  return (time) => {
    body.triggerAttackRelease('C1', 0.2, time);
    thud.triggerAttackRelease(0.08, time);
  };
}

// Thigh slap: short, bright-ish noise slap with a hint of body, pitched well above the stomp.
function thigh() {
  const slap = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
  }).chain(new Tone.Filter(350, 'highpass'), new Tone.Filter(2600, 'lowpass'), Tone.getDestination());
  slap.volume.value = -2;
  const body = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
  }).toDestination();
  body.volume.value = -12;
  return (time) => {
    slap.triggerAttackRelease(0.05, time);
    body.triggerAttackRelease('E3', 0.05, time);
  };
}

export const voices = { clap, stomp, thigh };
