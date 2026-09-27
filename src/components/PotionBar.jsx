import { POTIONS } from '../game/data.js';

/** Thanh thuốc dưới khung game: bấm để dùng, hiện số lọ và thời gian còn hiệu lực. */
export default function PotionBar({ potions, active, enabled, onUse }) {
  return (
    <div className="potion-bar">
      {POTIONS.map((p, k) => {
        const left = active[p.id] || 0;
        const count = potions[p.id] || 0;
        return (
          <button
            key={p.id}
            className={`potion${left > 0 ? ' active' : ''}`}
            disabled={!enabled || count === 0}
            onClick={() => onUse(p.id)}
            title={`${p.name} (phím ${k + 1}) — ${p.desc}`}
          >
            <span className="icon">{p.icon}</span>
            <span className="label">{p.name.replace('Thuốc ', '')}</span>
            <span className="count">{left > 0 ? `${left}s` : `×${count}`}</span>
          </button>
        );
      })}
    </div>
  );
}
