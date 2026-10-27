/* =========================================================
   Sound engine — child-friendly sound effects + soft background
   tune, all synthesized with Web Audio (no files needed).
   Recorded files in assets/audio/sfxs/ still take priority (see
   AUDIO_FILES in js/game.js).
   ========================================================= */

let _ctx = null;
let _master = null; // everything → master → compressor → speakers
let _sfxBus = null;
let _musicBus = null;
const MUSIC_VOL = 0.07;

function audioCtx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    _ctx = new AC();
    const comp = _ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    _master = _ctx.createGain();
    _master.connect(comp).connect(_ctx.destination);
    _sfxBus = _ctx.createGain();
    _sfxBus.gain.value = 0.9;
    _sfxBus.connect(_master);
    _musicBus = _ctx.createGain();
    _musicBus.gain.value = 0;
    _musicBus.connect(_master);
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/* ---------------- Instruments ---------------- */
function osc(type, freq, t, dur, vol, { to, attack = 0.005, out } = {}) {
  const ctx = _ctx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.9);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out || _sfxBus);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}

// Wooden marimba / xylophone note
function marimba(freq, t, vol = 0.3, out) {
  osc('sine', freq, t, 0.45, vol, { out });
  osc('sine', freq * 4, t, 0.08, vol * 0.35, { out });
  osc('triangle', freq * 2, t, 0.18, vol * 0.15, { out });
}

// Glockenspiel / bell
function bell(freq, t, vol = 0.18, dur = 1.1) {
  osc('sine', freq, t, dur, vol);
  osc('sine', freq * 2.76, t, dur * 0.5, vol * 0.4);
  osc('sine', freq * 5.4, t, dur * 0.25, vol * 0.2);
}

// Water bubble "bloop": quick upward pitch sweep
function bloop(t, f = 380, vol = 0.32) {
  osc('sine', f, t, 0.12, vol, { to: f * 2.6, attack: 0.004 });
}

function noise(t, dur, vol, { type = 'bandpass', from = 800, to, q = 1, out } = {}) {
  const ctx = _ctx;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out || _sfxBus);
  src.start(t);
}

// One hand clap = a few tiny noise bursts very close together
function clapAt(t, vol = 0.5) {
  for (let k = 0; k < 3; k++) {
    noise(t + k * 0.011, 0.05 + (k === 2 ? 0.07 : 0), vol, { from: 1000 + Math.random() * 900, q: 1.1 });
  }
}

const NOTE = { C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568 };
const PENTA = [NOTE.C5, NOTE.D5, NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6, NOTE.D6, NOTE.E6];
let _landStep = 0;

/* ---------------- Sound effects ---------------- */
const SYNTH = {
  // button tap: bubbly bloop
  click: () => { const t = _ctx.currentTime; bloop(t, 420, 0.28); },
  // speech bubble / card appears
  bubble: () => { const t = _ctx.currentTime; bloop(t, 300, 0.22); bloop(t + 0.07, 520, 0.16); },
  // pin pops / lock tap
  pop: () => {
    const t = _ctx.currentTime;
    osc('sine', 260, t, 0.16, 0.4, { to: 900 });
    noise(t, 0.05, 0.15, { from: 3000, q: 0.8 });
    bloop(t + 0.06, 700, 0.15);
  },
  // something lands in place — xylophone notes that climb each time
  land: () => {
    const t = _ctx.currentTime;
    marimba(PENTA[_landStep % PENTA.length], t, 0.3);
    _landStep++;
  },
  // child-friendly "wrong": a soft cartoon boing, not a buzzer
  wrong: () => {
    const t = _ctx.currentTime;
    const o = osc('triangle', 420, t, 0.5, 0.22, { to: 170 });
    const lfo = _ctx.createOscillator();
    const lg = _ctx.createGain();
    lfo.frequency.value = 14;
    lg.gain.value = 22;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + 0.55);
    osc('sine', 210, t, 0.5, 0.12, { to: 90 });
  },
  // underwater swoosh
  whoosh: () => {
    const t = _ctx.currentTime;
    noise(t, 1.0, 0.3, { type: 'lowpass', from: 300, to: 2400, q: 2 });
    [0.15, 0.32, 0.5, 0.66].forEach((d, i) => bloop(t + d, 300 + i * 90, 0.12));
  },
  // twinkly sparkles
  sparkle: () => {
    const t = _ctx.currentTime;
    [NOTE.E6, NOTE.G6, NOTE.D6, NOTE.G6 * 1.335].forEach((f, i) => bell(f, t + i * 0.07, 0.07, 0.6));
  },
  // correct answer: happy rising arpeggio
  correct: () => {
    const t = _ctx.currentTime;
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => marimba(f, t + i * 0.08, 0.28));
    bell(NOTE.E6, t + 0.34, 0.1, 0.9);
  },
  // shell-bulb lights / magic moment
  chime: () => {
    const t = _ctx.currentTime;
    [NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) => bell(f, t + i * 0.05, 0.1, 1.4));
  },
  // win-card stars: three dings going up
  star: () => {
    const t = _ctx.currentTime;
    bell(NOTE.G5 * Math.pow(1.26, _starStep++ % 3), t, 0.16, 0.9);
  },
  // lock clicks open
  unlock: () => {
    const t = _ctx.currentTime;
    noise(t, 0.04, 0.35, { from: 3800, q: 6 });
    noise(t + 0.09, 0.05, 0.4, { from: 2600, q: 6 });
    osc('square', 180, t + 0.09, 0.08, 0.06);
    bell(NOTE.G5, t + 0.16, 0.12, 0.8);
    bell(NOTE.C6, t + 0.26, 0.12, 1);
  },
  // big celebration fanfare
  win: () => {
    const t = _ctx.currentTime;
    const brass = (f, s, d, v = 0.09) => {
      const lp = _ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      lp.connect(_sfxBus);
      osc('sawtooth', f, t + s, d, v, { attack: 0.03, out: lp });
      osc('sawtooth', f * 1.005, t + s, d, v * 0.7, { attack: 0.03, out: lp });
    };
    brass(NOTE.G4, 0, 0.16); brass(NOTE.G4, 0.17, 0.16); brass(NOTE.G4, 0.34, 0.16);
    brass(NOTE.C5, 0.52, 0.9, 0.1); brass(NOTE.E5, 0.52, 0.9, 0.07); brass(NOTE.G5, 0.52, 0.9, 0.06);
    [NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) => bell(f, t + 0.55 + i * 0.06, 0.08, 1.2));
    noise(t + 0.52, 1.2, 0.12, { type: 'highpass', from: 6000, q: 0.5 }); // cymbal
  },
  // a round of applause
  clap: () => {
    const t = _ctx.currentTime;
    for (let p = 0; p < 4; p++) {          // four "people" clapping
      let s = Math.random() * 0.1;
      while (s < 2.4) {
        clapAt(t + s, 0.32 * (1 - s / 3));
        s += 0.16 + Math.random() * 0.08;
      }
    }
  },
  // paper page turning
  page: () => {
    const t = _ctx.currentTime;
    noise(t, 0.55, 0.28, { type: 'bandpass', from: 900, to: 4200, q: 0.7 });
    noise(t + 0.38, 0.18, 0.2, { type: 'highpass', from: 2500, q: 0.6 });
  },
  // story → game transitions: splash of bubbles
  splash: () => {
    const t = _ctx.currentTime;
    noise(t, 0.6, 0.3, { type: 'lowpass', from: 2400, to: 400, q: 1 });
    for (let i = 0; i < 9; i++) bloop(t + 0.05 + i * 0.06, 260 + Math.random() * 500, 0.12);
  },
  // character swims in
  swim: () => {
    const t = _ctx.currentTime;
    for (let i = 0; i < 6; i++) bloop(t + i * 0.22, 300 + (i % 3) * 120, 0.1);
  },
  // shell / card picked up
  // a pin popping loose: springy cork "pop" + little rising twang
  pinpop: () => {
    const t = _ctx.currentTime;
    noise(t, 0.03, 0.5, { from: 2800, q: 1.4 });
    osc('sine', 180, t, 0.09, 0.45, { to: 620, attack: 0.002 });
    osc('triangle', 520, t + 0.03, 0.28, 0.16, { to: 1400 });
    bloop(t + 0.1, 900, 0.1);
  },
  bulbon: () => SYNTH.chime(),
  pick: () => { const t = _ctx.currentTime; osc('sine', 600, t, 0.07, 0.15, { to: 900 }); },
};
let _starStep = 0;

/* ---------------- Background tune ----------------
   A gentle 8-bar marimba loop in C major pentatonic, rendered once
   and looped — no timers needed. */
let _musicSrc = null;
let _musicStarting = false;

async function renderMusic() {
  const bpm = 96;
  const beat = 60 / bpm;
  const bars = 8;
  const dur = bars * 4 * beat;
  const sr = 44100;
  const off = new OfflineAudioContext(2, Math.ceil(dur * sr), sr);
  const bus = off.createGain();
  bus.gain.value = 1;
  bus.connect(off.destination);

  const note = (type, f, t, d, v) => {
    const o = off.createOscillator();
    const g = off.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + d + 0.05);
  };
  const mar = (f, t, v) => { note('sine', f, t, 0.5, v); note('sine', f * 4, t, 0.06, v * 0.25); };

  // chord roots: C  Am  F  G  C  Am  F  G
  const roots = [130.8, 110, 87.3, 98, 130.8, 110, 87.3, 98];
  const melody = [
    [0, 'E5'], [1, 'G5'], [2, 'A5'], [3, 'G5'],
    [4, 'E5'], [5.5, 'D5'], [6, 'C5'],
    [8, 'C5'], [9, 'D5'], [10, 'E5'], [11, 'G5'],
    [12, 'A5'], [13.5, 'G5'], [14, 'E5'],
    [16, 'E5'], [17, 'G5'], [18, 'A5'], [19, 'C6'],
    [20, 'A5'], [21, 'G5'], [22, 'E5'],
    [24, 'D5'], [25, 'E5'], [26, 'G5'], [27, 'E5'],
    [28, 'D5'], [29, 'C5'],
  ];
  melody.forEach(([b, n]) => mar(NOTE[n], b * beat, 0.25));
  roots.forEach((r, bar) => {
    for (let k = 0; k < 4; k++) {
      const t = (bar * 4 + k) * beat;
      note('triangle', k % 2 ? r * 1.5 : r, t, beat * 0.9, 0.16);   // soft bass
      mar(r * 4 * (k % 2 ? 1.25 : 1.5), t + beat / 2, 0.06);         // off-beat sparkle
    }
  });
  return off.startRendering();
}

async function startMusic() {
  if (_musicSrc || _musicStarting || !audioCtx() || !window.OfflineAudioContext) return;
  _musicStarting = true;
  try {
    const buf = await renderMusic();
    _musicSrc = _ctx.createBufferSource();
    _musicSrc.buffer = buf;
    _musicSrc.loop = true;
    _musicSrc.connect(_musicBus);
    _musicSrc.start();
    setMusicOn(Sound.on);
  } catch (e) { /* music is optional */ }
  _musicStarting = false;
}

function setMusicOn(on) {
  if (!_musicBus) return;
  const t = _ctx.currentTime;
  _musicBus.gain.cancelScheduledValues(t);
  _musicBus.gain.setTargetAtTime(on ? MUSIC_VOL : 0, t, 0.3);
}

// Browsers only allow audio after the first tap
document.addEventListener('pointerdown', () => { audioCtx(); startMusic(); });
