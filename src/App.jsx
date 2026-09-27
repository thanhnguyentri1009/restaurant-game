import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import Hud from './components/Hud.jsx';
import PotionBar from './components/PotionBar.jsx';
import { StartScreen, PauseScreen, DayEndScreen, ShopScreen } from './components/Screens.jsx';
import { createGame, applyPotion } from './game/engine.js';
import { goalFor, UPGRADES, POTIONS } from './game/data.js';
import { loadSave, writeSave, freshSave } from './game/save.js';
import { sfx, SFX } from './game/audio.js';
import { music } from './game/music.js';

// Điện thoại cầm dọc thì dùng bố cục dọc, còn lại dùng bố cục ngang
const PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 820px)';
const currentLayout = () => (window.matchMedia(PORTRAIT_QUERY).matches ? 'portrait' : 'landscape');

function useLayout() {
  const [layout, setLayout] = useState(currentLayout);
  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT_QUERY);
    const onChange = () => setLayout(currentLayout());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return layout;
}

export default function App() {
  // save được engine sửa trực tiếp (ví tiền), nên giữ trong ref và refresh() khi cần vẽ lại
  const saveRef = useRef(null);
  if (!saveRef.current) saveRef.current = loadSave();
  const save = saveRef.current;
  const gameRef = useRef(null);
  const [, refresh] = useReducer(x => x + 1, 0);
  const layout = useLayout();

  const [screen, setScreen] = useState('start'); // start | shop | play | paused | dayEnd
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const [hud, setHud] = useState(null);
  const [musicOn, setMusicOn] = useState(music.isEnabled);
  const [unlocked, setUnlocked] = useState(false); // trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên
  const [hidden, setHidden] = useState(document.hidden);
  const [result, setResult] = useState(null);

  const startDay = () => {
    sfx(660, 0.1);
    gameRef.current = createGame(save, layout);
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

  const buyUpgrade = id => {
    const u = UPGRADES.find(x => x.id === id);
    const cost = u.costs[save.up[id]];
    if (cost == null || save.wallet < cost) return;
    save.wallet -= cost;
    save.up[id]++;
    writeSave(save);
    SFX.coin();
    refresh();
  };

  const buyPotion = id => {
    const p = POTIONS.find(x => x.id === id);
    if (save.wallet < p.cost) return;
    save.wallet -= p.cost;
    save.potions[id]++;
    writeSave(save);
    SFX.coin();
    refresh();
  };

  const drinkPotion = useCallback(id => {
    const G = gameRef.current;
    if (!G || screenRef.current !== 'play') return;
    if (applyPotion(G, id)) {
      writeSave(saveRef.current);
      refresh();
    }
  }, []);

  const togglePause = useCallback(() => {
    setScreen(s => (s === 'play' ? 'paused' : s === 'paused' ? 'play' : s));
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' || e.key === 'p') togglePause();
      const k = Number(e.key);
      if (k >= 1 && k <= POTIONS.length) drinkPotion(POTIONS[k - 1].id);
    };
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
  }, [togglePause, drinkPotion]);

  // Nhạc nền: phát khi đã chạm màn hình, đang bật, không tạm dừng và tab đang hiện
  useEffect(() => {
    if (unlocked) return;
    const unlock = () => setUnlocked(true);
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [unlocked]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (musicOn && unlocked && !hidden && screen !== 'paused') music.start();
    else music.stop();
  }, [musicOn, unlocked, hidden, screen]);

  const toggleMusic = () => {
    music.setEnabled(!musicOn);
    setMusicOn(!musicOn);
  };

  const hudData = gameRef.current && hud
    ? { ...hud, wallet: save.wallet }
    : { day: save.day, earned: 0, goal: goalFor(save.day), left: '-', wallet: save.wallet };

  return (
    <main id="wrap" className={(gameRef.current ? gameRef.current.L.name : layout) === 'portrait' ? 'portrait' : ''}>
      <Hud {...hudData} musicOn={musicOn} onToggleMusic={toggleMusic} onPause={togglePause} canPause={screen === 'play' || screen === 'paused'} />
      <div id="stage">
        <GameCanvas gameRef={gameRef} layout={layout} running={screen === 'play'} onHud={handleHud} onDayEnd={handleDayEnd} />
        {screen === 'start' && (
          <StartScreen day={save.day} onPlay={startDay} onReset={resetAll} onShop={() => setScreen('shop')} />
        )}
        {screen === 'shop' && (
          <ShopScreen save={save} onBuyUpgrade={buyUpgrade} onBuyPotion={buyPotion} onBack={() => setScreen('start')} />
        )}
        {screen === 'paused' && <PauseScreen onResume={togglePause} onQuit={toMenu} />}
        {screen === 'dayEnd' && result && (
          <DayEndScreen
            result={result} save={save}
            onBuyUpgrade={buyUpgrade} onBuyPotion={buyPotion}
            onNext={startDay} onMenu={toMenu}
          />
        )}
      </div>
      <PotionBar
        potions={save.potions}
        active={{ speed: hud?.speed || 0, cook: hud?.cook || 0 }}
        enabled={screen === 'play'}
        onUse={drinkPotion}
      />
    </main>
  );
}
