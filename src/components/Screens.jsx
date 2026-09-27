import { useEffect, useRef, useState } from 'react';
import { cloudEnabled, normalizeCode, onStatus } from '../game/cloud.js';
import { KINDS, POTIONS, UPGRADES, unlocksFor } from '../game/data.js';

export function Overlay({ children }) {
  return <div className="overlay">{children}</div>;
}

const STATUS_TEXT = {
  idle: '☁️ Đã kết nối',
  loading: '⏳ Đang tải…',
  saving: '⏳ Đang lưu…',
  saved: '✅ Đã lưu lên mây',
  error: '⚠️ Lỗi kết nối — vẫn lưu trên máy',
};

/** Ô nhập username (admin tạo sẵn trên Firestore): cùng username thì chơi tiếp được trên máy khác. */
function SyncPanel({ onLink, onUnlink }) {
  const [st, setSt] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => onStatus(setSt), []);
  if (!cloudEnabled || !st) return null;

  if (st.code) {
    return (
      <div className="sync">
        <span>👤 <b>{st.code}</b></span>
        <span className="sync-status">{STATUS_TEXT[st.state] || ''}</span>
        <button className="link" onClick={onUnlink}>Đổi username</button>
      </div>
    );
  }
  const code = normalizeCode(input);
  const submit = async e => {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    try {
      if (await onLink(code)) setInput('');
    } catch (err) {
      console.warn('Firestore:', err);
      alert(err?.code === 'permission-denied'
        ? 'Firestore từ chối truy cập — kiểm tra lại Rules.'
        : 'Không kết nối được máy chủ, thử lại sau nhé.');
    }
    setBusy(false);
  };
  return (
    <form className="sync" onSubmit={submit}>
      <span>☁️ Username:</span>
      <input
        value={input} onChange={e => setInput(e.target.value)}
        placeholder="nhập username" maxLength={32} autoCapitalize="none" autoCorrect="off" spellCheck={false}
      />
      <button className="btn small" disabled={!code || busy}>{busy ? '…' : 'Đồng bộ'}</button>
      <small>Nhập username để lưu tiến trình lên mây và chơi tiếp trên máy khác.</small>
    </form>
  );
}

export function StartScreen({ day, onPlay, onReset, onShop, onLinkCode, onUnlinkCode }) {
  const cont = day > 1;
  return (
    <Overlay>
      <div className="card">
        <h1>🐧 Nhà Hàng Penny</h1>
        <p>Giúp cô chim cánh cụt Penny điều hành nhà hàng giữa Nam Cực!</p>
        <ol>
          <li><b>Kéo khách</b> đang chờ ở thảm hồng vào <b>bàn trống</b>.</li>
          <li>Khi khách hiện <b>❗</b>, bấm vào bàn để <b>ghi món</b>.</li>
          <li>Bấm <b>bảng ĐƠN</b> để đưa đơn cho đầu bếp.</li>
          <li>Món nấu xong nằm trên quầy — bấm để <b>bưng</b> (2 tay bưng được 2 món), rồi bấm bàn có <b>số trùng</b>.</li>
          <li>Khách ăn xong hiện <b>💰</b> — bấm vào bàn để <b>tính tiền</b>.</li>
        </ol>
        <p>Càng lên ngày cao càng đông khách, thêm bàn và thêm món. Dùng thuốc ⚡🔥💖 ở thanh dưới màn hình khi quá bận!</p>
        <button className="btn" onClick={onPlay}>{cont ? `Tiếp tục ngày ${day}` : 'Bắt đầu!'}</button>
        <button className="btn secondary" onClick={onShop}>🛒 Shop</button>
        {cont && <button className="btn secondary" onClick={onReset}>Chơi lại từ đầu</button>}
        <SyncPanel onLink={onLinkCode} onUnlink={onUnlinkCode} />
      </div>
    </Overlay>
  );
}

export function PauseScreen({ onResume, onQuit }) {
  return (
    <Overlay>
      <div className="card">
        <h2>⏸ Tạm dừng</h2>
        <button className="btn" onClick={onResume}>Chơi tiếp</button>
        <button className="btn secondary" onClick={onQuit}>Bỏ ngày này</button>
      </div>
    </Overlay>
  );
}

// Hiệu ứng khi mua: số tiền bay lên, món đồ bay lên và tia lấp lánh toả ra
function BuyPop({ cost, icon }) {
  return (
    <div className="buy-pop" aria-hidden="true">
      <span className="buy-cost">-{cost}$</span>
      <span className="buy-icon">{icon}</span>
      {Array.from({ length: 8 }, (_, k) => (
        <span key={k} className="spark" style={{ '--a': `${k * 45}deg` }}>{k % 2 ? '✨' : '⭐'}</span>
      ))}
    </div>
  );
}

/** Cửa hàng: tab Thuốc (dùng trong ngày) và tab Nâng cấp (vĩnh viễn). */
export function Shop({ save, onBuyUpgrade, onBuyPotion }) {
  const [tab, setTab] = useState('potions');
  const [pops, setPops] = useState([]); // [{ key, id, cost, icon }]
  const nextKey = useRef(1);
  const buy = (e, fn, id, cost, icon) => {
    const card = e.currentTarget.closest('.item');
    if (!fn(id)) return;
    // thẻ món đồ nảy lên và loé sáng (animate() chạy lại được mỗi lần bấm)
    card?.animate?.([
      { transform: 'scale(1)', boxShadow: '0 0 0 rgba(244,180,0,0)' },
      { transform: 'scale(1.08)', boxShadow: '0 0 22px rgba(244,180,0,.9)', offset: 0.3 },
      { transform: 'scale(1)', boxShadow: '0 0 0 rgba(244,180,0,0)' },
    ], { duration: 450, easing: 'ease-out' });
    const key = nextKey.current++;
    setPops(ps => [...ps, { key, id, cost, icon }]);
    setTimeout(() => setPops(ps => ps.filter(p => p.key !== key)), 1000);
  };
  const popsFor = id => pops.filter(p => p.id === id);
  return (
    <div className="shop-wrap">
      <div className="tabs">
        <button className={tab === 'potions' ? 'on' : ''} onClick={() => setTab('potions')}>🧪 Thuốc</button>
        <button className={tab === 'upgrades' ? 'on' : ''} onClick={() => setTab('upgrades')}>⭐ Nâng cấp</button>
        <span className={`wallet${pops.length ? ' spent' : ''}`} key={pops.length ? pops[pops.length - 1].key : 0}>Ví: {save.wallet}$</span>
      </div>
      <div className="shop">
        {tab === 'potions' && POTIONS.map(p => (
          <div className="item" key={p.id}>
            <div className="name">{p.icon} {p.name}</div>
            <div className="desc">{p.desc}</div>
            <div className="lvl">Đang có: {save.potions[p.id]} lọ</div>
            <button disabled={save.wallet < p.cost} onClick={e => buy(e, onBuyPotion, p.id, p.cost, p.icon)}>Mua {p.cost}$</button>
            {popsFor(p.id).map(x => <BuyPop key={x.key} cost={x.cost} icon={x.icon} />)}
          </div>
        ))}
        {tab === 'upgrades' && UPGRADES.map(u => {
          const lvl = save.up[u.id], max = u.costs.length, cost = u.costs[lvl];
          const maxed = lvl >= max;
          return (
            <div className="item" key={u.id}>
              <div className="name">{u.icon} {u.name}</div>
              <div className="desc">{u.desc}</div>
              <div className="lvl">Cấp {lvl}/{max}</div>
              <button disabled={maxed || save.wallet < cost} onClick={e => buy(e, onBuyUpgrade, u.id, cost, u.icon)}>
                {maxed ? 'Đã tối đa' : `Mua ${cost}$`}
              </button>
              {popsFor(u.id).map(x => <BuyPop key={x.key} cost={x.cost} icon={x.icon} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ShopScreen({ save, onBuyUpgrade, onBuyPotion, onBack }) {
  return (
    <Overlay>
      <div className="card">
        <h2>🛒 Shop</h2>
        <Shop save={save} onBuyUpgrade={onBuyUpgrade} onBuyPotion={onBuyPotion} />
        <button className="btn" onClick={onBack}>Xong</button>
      </div>
    </Overlay>
  );
}

function NextDay({ day }) {
  const n = unlocksFor(day);
  return (
    <div className="next-day">
      <b>Ngày {day} có gì?</b>
      <div>🐧 {n.customers} lượt khách · 🪑 {n.tables} bàn{n.newTables > 0 && <b className="new"> (+{n.newTables} bàn mới)</b>}</div>
      {n.dishes.length > 0 && (
        <div>🆕 Món mới: {n.dishes.map(d => (
          <span key={d.id} className="dish">{d.emoji} <b>{d.name}</b> <small>({KINDS[d.kind]}, {d.price}$)</small></span>
        ))}</div>
      )}
      {n.decor.length > 0 && (
        <div>✨ Nhà hàng đẹp hơn: {n.decor.map(d => <b key={d.id} className="dish">{d.icon} {d.name}</b>)}</div>
      )}
    </div>
  );
}

export function DayEndScreen({ result, save, onBuyUpgrade, onBuyPotion, onNext, onMenu }) {
  const { ok, stars, playedDay, earned, goal, served, lost } = result;
  return (
    <Overlay>
      <div className="card">
        <h2>{ok ? `🎉 Hoàn thành ngày ${playedDay}!` : `😢 Chưa đạt chỉ tiêu ngày ${playedDay}`}</h2>
        <div className="stars">
          {[0, 1, 2].map(k => <span key={k} className={k < stars ? '' : 'off'}>⭐</span>)}
        </div>
        <p>Doanh thu: <b>{earned}$</b> / {goal}$ · Phục vụ {served} bàn · {lost} bàn bỏ về</p>
        {!ok && <p>Tiền đã kiếm vẫn được giữ lại — mua thuốc hoặc nâng cấp rồi thử lại nhé!</p>}
        <NextDay day={save.day} />
        <Shop save={save} onBuyUpgrade={onBuyUpgrade} onBuyPotion={onBuyPotion} />
        <button className="btn" onClick={onNext}>{ok ? `Sang ngày ${save.day} ➜` : `Thử lại ngày ${save.day}`}</button>
        <button className="btn secondary" onClick={onMenu}>Menu</button>
      </div>
    </Overlay>
  );
}
