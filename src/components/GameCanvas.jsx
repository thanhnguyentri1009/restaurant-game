import { useEffect, useRef } from 'react';
import { LAYOUTS } from '../game/data.js';
import { update, hudSnapshot, pointerDown, pointerMove, pointerUp } from '../game/engine.js';
import { render } from '../game/render.js';

/**
 * Canvas chạy vòng lặp game bằng requestAnimationFrame.
 * Trạng thái game nằm trong gameRef (mutable) để không phải re-render React mỗi khung hình.
 * Kích thước canvas theo bố cục của ván đang chơi (hoặc bố cục hiện tại khi ở menu).
 */
export default function GameCanvas({ gameRef, layout, running, onHud, onDayEnd }) {
  const canvasRef = useRef(null);
  const runningRef = useRef(running);
  const layoutRef = useRef(layout);
  const callbacks = useRef({ onHud, onDayEnd });
  runningRef.current = running;
  layoutRef.current = layout;
  callbacks.current = { onHud, onDayEnd };

  const dims = () => (gameRef.current ? gameRef.current.L : LAYOUTS[layoutRef.current]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let size = '';
    const fit = force => {
      const { W, H } = dims();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const key = `${W}x${H}@${dpr}`;
      if (key === size && !force) return;
      size = key;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.aspectRatio = `${W} / ${H}`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onResize = () => fit(true);
    window.addEventListener('resize', onResize);

    let raf = 0, last = performance.now(), hudTimer = 0;
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      fit(false);
      const G = gameRef.current;
      if (G && runningRef.current) {
        update(G, dt);
        if (G.finished && !G.reported) {
          G.reported = true;
          callbacks.current.onDayEnd();
        }
      }
      render(ctx, G, now / 1000, layoutRef.current);
      hudTimer += dt;
      if (G && hudTimer > 0.1) {
        hudTimer = 0;
        callbacks.current.onHud(hudSnapshot(G));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [gameRef]);

  const toGame = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const { W, H } = dims();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  };
  const active = () => (runningRef.current ? gameRef.current : null);
  const release = e => {
    const G = active();
    if (!G) return;
    const { x, y } = toGame(e);
    pointerUp(G, x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      id="game"
      onPointerDown={e => {
        const G = active();
        if (!G) return;
        const { x, y } = toGame(e);
        if (pointerDown(G, x, y, e.pointerType !== 'mouse')) e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        const G = active();
        const { x, y } = toGame(e);
        e.currentTarget.style.cursor = G ? pointerMove(G, x, y) : 'default';
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={e => e.preventDefault()}
    />
  );
}
