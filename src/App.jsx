import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import Hud from './components/Hud.jsx';
import { StartScreen, PauseScreen, DayEndScreen } from './components/Screens.jsx';
import { createGame } from './game/engine.js';
import { goalFor, UPGRADES } from './game/data.js';
import { loadSave, writeSave, freshSave } from './game/save.js';
import { sfx, SFX } from './game/audio.js';

export default function App() {
  // save được engine sửa trực tiếp (ví tiền), nên giữ trong ref và refresh() khi cần vẽ lại
  const saveRef = useRef(null);
  if (!saveRef.current) saveRef.current = loadSave();
  const save = saveRef.current;
  const gameRef = useRef(null);
  const [, refresh] = useReducer(x => x + 1, 0);

  const [screen, setScreen] = useState('start'); // start | play | paused | dayEnd
  const [hud, setHud] = useState(null);
  const [result, setResult] = useState(null);

  const startDay = () => {
    sfx(660, 0.1);
    gameRef.current = createGame(save);
    setResult(null);
    setScreen('play');
  };

  const toMenu = () => {
    gameRef.current = null;
    setHud(null);
    setScreen('start');
  };

  const resetAll = () => {
    if (!confirm('Xoá toàn bộ tiến trình và chơi lại từ ngày 1?')) return;
    saveRef.current = freshSave();
    writeSave(saveRef.current);
    refresh();
  };

  const handleHud = useCallback(next => {
    setHud(prev => (prev && Object.keys(next).every(k => prev[k] === next[k]) ? prev : next));
  }, []);

  const handleDayEnd = useCallback(() => {
    const G = gameRef.current;
    const s = saveRef.current;
    const ok = G.earned >= G.goal;
    const ratio = G.earned / G.goal;
    const stars = ok ? (ratio >= 1.8 ? 3 : ratio >= 1.35 ? 2 : 1) : 0;
    const playedDay = G.day;
    if (ok) s.day++;
    writeSave(s);
    ok ? SFX.ding() : SFX.angry();
    setResult({ ok, stars, playedDay, earned: G.earned, goal: G.goal, served: G.served, lost: G.lost });
    setScreen('dayEnd');
  }, []);

  const buy = id => {
    const u = UPGRADES.find(x => x.id === id);
    const cost = u.costs[save.up[id]];
    if (cost == null || save.wallet < cost) return;
    save.wallet -= cost;
    save.up[id]++;
    writeSave(save);
    SFX.coin();
    refresh();
  };

  const togglePause = useCallback(() => {
    setScreen(s => (s === 'play' ? 'paused' : s === 'paused' ? 'play' : s));
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' || e.key === 'p') togglePause(); };
    const onBlur = () => setScreen(s => (s === 'play' ? 'paused' : s));
    const onVisibility = () => { if (document.hidden) onBlur(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [togglePause]);

  const hudData = gameRef.current && hud
    ? { ...hud, wallet: save.wallet }
    : { day: save.day, earned: 0, goal: goalFor(save.day), left: '-', wallet: save.wallet };

  return (
    <main id="wrap">
      <div className="rotate-hint">📱↻ Xoay ngang điện thoại để chơi dễ hơn</div>
      <Hud {...hudData} onPause={togglePause} canPause={screen === 'play' || screen === 'paused'} />
      <div id="stage">
        <GameCanvas gameRef={gameRef} running={screen === 'play'} onHud={handleHud} onDayEnd={handleDayEnd} />
        {screen === 'start' && <StartScreen day={save.day} onPlay={startDay} onReset={resetAll} />}
        {screen === 'paused' && <PauseScreen onResume={togglePause} onQuit={toMenu} />}
        {screen === 'dayEnd' && result && (
          <DayEndScreen result={result} save={save} onBuy={buy} onNext={startDay} onMenu={toMenu} />
        )}
      </div>
    </main>
  );
}
