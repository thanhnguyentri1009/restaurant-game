let audio = null;

function ac() {
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

export function sfx(freq, dur = 0.08, type = 'sine', vol = 0.08, slide = 0, delay = 0) {
  try {
    const a = ac();
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur);
  } catch (e) { /* không có âm thanh */ }
}

// tiếng "xoẹt" ngắn (ngăn kéo máy tính tiền)
function noise(dur = 0.12, vol = 0.08, delay = 0) {
  try {
    const a = ac();
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 2500;
    src.buffer = buf;
    g.gain.value = vol;
    src.connect(f).connect(g).connect(a.destination);
    src.start(a.currentTime + delay);
  } catch (e) { /* không có âm thanh */ }
}

export const SFX = {
  click: () => sfx(440, 0.04, 'sine', 0.04),
  seat:  () => sfx(520, 0.1, 'triangle', 0.08, 200),
  note:  () => sfx(700, 0.07, 'square', 0.04),
  // chuông cửa "ting-tong" khi khách bước vào
  enter: () => { sfx(1319, 0.35, 'triangle', 0.1); sfx(988, 0.5, 'triangle', 0.1, 0, 0.18); },
  // chuông bếp "ting ting ting" khi món nấu xong
  ready: () => { [1568, 1568, 2093].forEach((f, k) => sfx(f, 0.28, 'sine', 0.12, 0, k * 0.11)); },
  // máy tính tiền "ka-ching"
  cash:  () => {
    noise(0.1, 0.12);
    sfx(1200, 0.05, 'square', 0.05, 0, 0.02);
    sfx(2637, 0.35, 'sine', 0.1, 0, 0.1);
    sfx(3136, 0.45, 'sine', 0.08, 0, 0.16);
  },
  ding:  () => { sfx(988, 0.15, 'sine', 0.08); sfx(1319, 0.2, 'sine', 0.07, 0, 0.09); },
  serve: () => sfx(660, 0.12, 'triangle', 0.08, 120),
  coin:  () => { sfx(1200, 0.08, 'square', 0.04); sfx(1600, 0.12, 'square', 0.04, 0, 0.07); },
  angry: () => sfx(220, 0.3, 'sawtooth', 0.05, -80),
};
