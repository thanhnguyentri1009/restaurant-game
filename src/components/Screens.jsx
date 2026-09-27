import { DISHES, KINDS, UPGRADES } from '../game/data.js';

export function Overlay({ children }) {
  return <div className="overlay">{children}</div>;
}

export function StartScreen({ day, onPlay, onReset }) {
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
          <li>Món nấu xong nằm trên quầy — bấm để <b>bưng</b>, rồi bấm bàn có <b>số trùng</b>.</li>
          <li>Khách ăn xong hiện <b>💰</b> — bấm vào bàn để <b>tính tiền</b>.</li>
        </ol>
        <p>Bạn có thể bấm nhiều chỗ liên tiếp, Penny sẽ làm theo thứ tự. Đừng để khách chờ lâu kẻo hết ♥!</p>
        <button className="btn" onClick={onPlay}>{cont ? `Tiếp tục ngày ${day}` : 'Bắt đầu!'}</button>
        {cont && <button className="btn secondary" onClick={onReset}>Chơi lại từ đầu</button>}
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

export function DayEndScreen({ result, save, onBuy, onNext, onMenu }) {
  const { ok, stars, playedDay, earned, goal, served, lost } = result;
  const newDishes = ok ? DISHES.filter(d => d.day === save.day) : [];
  return (
    <Overlay>
      <div className="card">
        <h2>{ok ? `🎉 Hoàn thành ngày ${playedDay}!` : `😢 Chưa đạt chỉ tiêu ngày ${playedDay}`}</h2>
        <div className="stars">
          {[0, 1, 2].map(k => <span key={k} className={k < stars ? '' : 'off'}>⭐</span>)}
        </div>
        <p>Doanh thu: <b>{earned}$</b> / {goal}$ · Phục vụ {served} bàn · {lost} bàn bỏ về</p>
        {newDishes.length > 0 && (
          <p>Món mới ngày mai: {newDishes.map(d => (
            <span key={d.id}>{d.emoji} <b>{d.name}</b> ({KINDS[d.kind]}, {d.price}$) </span>
          ))}</p>
        )}
        {!ok && <p>Tiền đã kiếm vẫn được giữ lại — nâng cấp rồi thử lại nhé!</p>}
        <div className="wallet">Ví: {save.wallet}$</div>
        <div className="shop">
          {UPGRADES.map(u => {
            const lvl = save.up[u.id], max = u.costs.length, cost = u.costs[lvl];
            const maxed = lvl >= max;
            return (
              <div className="item" key={u.id}>
                <div className="name">{u.icon} {u.name}</div>
                <div className="desc">{u.desc}</div>
                <div className="lvl">Cấp {lvl}/{max}</div>
                <button disabled={maxed || save.wallet < cost} onClick={() => onBuy(u.id)}>
                  {maxed ? 'Đã tối đa' : `Mua ${cost}$`}
                </button>
              </div>
            );
          })}
        </div>
        <button className="btn" onClick={onNext}>{ok ? `Sang ngày ${save.day} ➜` : `Thử lại ngày ${save.day}`}</button>
        <button className="btn secondary" onClick={onMenu}>Menu</button>
      </div>
    </Overlay>
  );
}
