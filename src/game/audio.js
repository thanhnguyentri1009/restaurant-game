let audio = null;

export function sfx(freq, dur = 0.08, type = 'sine', vol = 0.08, slide = 0) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dur);
  } catch (e) { /* không có âm thanh */ }
}

export const SFX = {
  click: () => sfx(440, 0.04, 'sine', 0.04),
  seat:  () => sfx(520, 0.1, 'triangle', 0.08, 200),
  note:  () => sfx(700, 0.07, 'square', 0.04),
  ding:  () => { sfx(988, 0.15, 'sine', 0.08); setTimeout(() => sfx(1319, 0.2, 'sine', 0.07), 90); },
  serve: () => sfx(660, 0.12, 'triangle', 0.08, 120),
  coin:  () => { sfx(1200, 0.08, 'square', 0.04); setTimeout(() => sfx(1600, 0.12, 'square', 0.04), 70); },
  angry: () => sfx(220, 0.3, 'sawtooth', 0.05, -80),
};
