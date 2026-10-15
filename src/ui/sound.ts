// Tiny WebAudio synth so the game has feedback without shipping audio files.
let ctx: AudioContext | null = null;
let enabled = true;
try {
  enabled = localStorage.getItem('polypacks.sound') !== 'off';
} catch {
  /* ignore */
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.08, slide = 0, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, gain = 0.05, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

export const sfx = {
  tap: () => tone(520, 0.06, 'triangle', 0.05),
  flip: () => {
    noise(0.12, 0.04);
    tone(300, 0.12, 'triangle', 0.04, 400);
  },
  deal: (i = 0) => noise(0.09, 0.03, i * 0.05),
  tear: () => {
    noise(0.35, 0.08);
    tone(140, 0.3, 'sawtooth', 0.03, -60);
  },
  pick: () => {
    tone(660, 0.1, 'triangle', 0.06);
    tone(990, 0.16, 'triangle', 0.05, 0, 0.08);
  },
  rare: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'sine', 0.06, 0, i * 0.07));
  },
  legendary: () => {
    [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.35, 'sine', 0.07, 0, i * 0.08));
    noise(0.5, 0.03, 0.2);
  },
  special: () => {
    tone(220, 0.6, 'sawtooth', 0.05, 660);
    [880, 1320, 1760].forEach((f, i) => tone(f, 0.3, 'sine', 0.05, 0, 0.3 + i * 0.1));
  },
  play: () => {
    tone(240, 0.12, 'square', 0.03, 120);
    noise(0.08, 0.03);
  },
  hit: () => {
    tone(160, 0.25, 'sawtooth', 0.06, -100);
    noise(0.2, 0.05);
  },
  boost: () => [440, 660].forEach((f, i) => tone(f, 0.15, 'triangle', 0.05, 0, i * 0.06)),
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.4, 'triangle', 0.07, 0, i * 0.1)),
  lose: () => [392, 349, 311, 262].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.04, 0, i * 0.14)),
  cash: () => [1046, 1318, 1568].forEach((f, i) => tone(f, 0.12, 'sine', 0.05, 0, i * 0.05)),
};

export function soundEnabled() {
  return enabled;
}
export function setSoundEnabled(v: boolean) {
  enabled = v;
  try {
    localStorage.setItem('polypacks.sound', v ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  if (v) sfx.tap();
}
