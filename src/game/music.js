// Nhạc nền lo-fi chill tự soạn, phát bằng Web Audio (không cần file nhạc).
// Vòng hợp âm Fmaj7 → Em7 → Dm7 → Cmaj7, phím đàn điện mềm, bass trầm,
// trống boom-bap nhẹ có swing và chút tiếng rè đĩa than.
import { ac } from './audio.js';

const PREF_KEY = 'penny-music';
const BPM = 78;
const STEP = 60 / BPM / 2; // mỗi bước = 1 móc đơn
const SWING = STEP * 0.18; // phách lẻ đánh trễ một chút cho "lười"

// Hợp âm mỗi ô nhịp: nốt bass + các nốt hợp âm (số MIDI)
const CHORDS = [
  [41, [57, 60, 64, 65]], // Fmaj7
  [40, [55, 59, 62, 64]], // Em7
  [38, [53, 57, 60, 62]], // Dm7
  [36, [52, 55, 59, 60]], // Cmaj7
];

// Giai điệu thưa, âm giai ngũ cung (null = nghỉ), 8 bước mỗi ô nhịp
const MELODY = [
  null, 76, null, 79, 81, null, 79, null,
  76, null, null, 74, null, 72, null, null,
  null, 74, 76, null, 81, null, 79, null,
  76, null, null, null, 72, null, null, null,
  null, 84, null, 81, 79, null, 76, null,
  79, null, 76, null, 74, null, null, null,
  null, 72, 74, 76, null, 79, null, 76,
  74, null, 72, null, null, null, null, null,
];

const freq = m => 440 * Math.pow(2, (m - 69) / 12);

let master = null, timer = null, nextTime = 0, step = 0, noiseBuf = null;
let enabled = (() => { try { return localStorage.getItem(PREF_KEY) !== 'off'; } catch (e) { return true; } })();

function tone(a, m, t, dur, type, vol, attack = 0.02) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq(m), t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// phím đàn điện: sine + chút triangle cao một quãng tám, hơi rung
function keys(a, m, t, dur, vol) {
  tone(a, m, t, dur, 'sine', vol, 0.03);
  tone(a, m + 12, t, dur * 0.5, 'triangle', vol * 0.18, 0.03);
}

function getNoise(a) {
  if (!noiseBuf) {
    const len = a.sampleRate;
    noiseBuf = a.createBuffer(1, len, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function noiseHit(a, t, dur, vol, type, fq) {
  const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  src.buffer = getNoise(a);
  f.type = type; f.frequency.value = fq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5, dur + 0.05);
}

function kick(a, t) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
  g.gain.setValueAtTime(0.28, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.4);
}

function scheduleStep(a, time) {
  const inBar = step % 8;
  const bar = Math.floor(step / 8);
  const t = time + (inBar % 2 === 1 ? SWING : 0);
  const [root, chord] = CHORDS[bar % 4];

  // hợp âm: đánh ở phách 1 và nhắc lại nhẹ ở "và" của phách 2
  if (inBar === 0) chord.forEach((c, k) => keys(a, c, t + k * 0.012, STEP * 5, 0.03));
  if (inBar === 3) chord.slice(1).forEach(c => keys(a, c, t, STEP * 3, 0.018));
  // bass
  if (inBar === 0) tone(a, root, t, STEP * 3.5, 'sine', 0.2, 0.02);
  if (inBar === 5) tone(a, root + 7, t, STEP * 2, 'sine', 0.14, 0.02);
  // giai điệu
  const m = MELODY[step % MELODY.length];
  if (m != null) keys(a, m, t, STEP * 2.6, 0.05);
  // trống boom-bap nhẹ
  if (inBar === 0 || inBar === 5) kick(a, t);
  if (inBar === 2 || inBar === 6) noiseHit(a, t, 0.16, 0.05, 'bandpass', 1800);
  noiseHit(a, t, 0.03, inBar % 2 ? 0.012 : 0.018, 'highpass', 7000);
  // tiếng rè đĩa than
  if (Math.random() < 0.35) noiseHit(a, t + Math.random() * STEP, 0.008, 0.02 + Math.random() * 0.02, 'highpass', 3000);

  step = (step + 1) % MELODY.length;
}

function tick() {
  const a = ac();
  while (nextTime < a.currentTime + 0.2) {
    scheduleStep(a, nextTime);
    nextTime += STEP;
  }
}

export const music = {
  isEnabled: () => enabled,

  start() {
    if (!enabled || timer) return;
    try {
      const a = ac();
      if (!master) {
        master = a.createGain();
        const lp = a.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 1700; lp.Q.value = 0.5; // tiếng ấm, mờ kiểu lo-fi
        master.connect(lp).connect(a.destination);
      }
      master.gain.cancelScheduledValues(a.currentTime);
      master.gain.setValueAtTime(0.0001, a.currentTime);
      master.gain.linearRampToValueAtTime(0.8, a.currentTime + 1.5); // vào nhạc từ từ
      nextTime = a.currentTime + 0.05;
      step = 0;
      timer = setInterval(tick, 25);
      tick();
    } catch (e) { /* không có âm thanh */ }
  },

  stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    try {
      const a = ac();
      master.gain.cancelScheduledValues(a.currentTime);
      master.gain.setValueAtTime(master.gain.value, a.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.4);
    } catch (e) { /* bỏ qua */ }
  },

  setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch (e) { /* bỏ qua */ }
    if (!on) this.stop();
  },
};
