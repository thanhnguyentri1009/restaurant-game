import { useEffect, useState } from 'react';

const canFullscreen = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    return;
  }
  document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {});
}

export default function Hud({ day, earned, goal, left, wallet, onPause, canPause }) {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <header id="hud">
      <div className="stat">Ngày <b>{day}</b></div>
      <div className="stat goal">
        <span>💰 <b>{earned}</b> / <b>{goal}</b></span>
        <div className="bar">
          <div className="bar-fill" style={{ width: `${Math.min(100, (earned / goal) * 100)}%` }} />
        </div>
      </div>
      <div className="stat">🐧 <b>{left}</b></div>
      <div className="stat">Ví <b>{wallet}</b>$</div>
      {canFullscreen && (
        <button className="hud-btn" title="Toàn màn hình" onClick={toggleFullscreen}>{full ? '🗗' : '⛶'}</button>
      )}
      <button className="hud-btn" title="Tạm dừng (Esc)" onClick={onPause} disabled={!canPause}>⏸</button>
    </header>
  );
}
