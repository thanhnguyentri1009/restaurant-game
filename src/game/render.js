// Vẽ toàn bộ game lên canvas (không dùng file ảnh).
import { W, H, RAIL, TRAY_X0, TRAY_GAP, TRAY_Y, capacity, menuFor, dish } from './data.js';
import { actionSpot, isQueued } from './engine.js';

const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const FONT = '"Baloo 2","Segoe UI",system-ui,sans-serif';

// ctx và G được gán mỗi khung hình trong render()
let ctx = null;
let G = null;

function ellipse(x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function emoji(ch, x, y, size) {
  ctx.font = `${size}px ${EMOJI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, x, y);
}
function text(str, x, y, size, color, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawPenguin(x, y, s, o = {}) {
  const face = o.face || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(20,60,100,.18)';
  ellipse(0, 0, 22 * s, 6 * s);
  ctx.translate(0, -(o.bob || 0));
  ctx.scale(s, s);
  const body = o.chick ? '#7f8c9d' : '#1e2838';

  ctx.fillStyle = '#f39c12';
  ellipse(-9, -2, 8, 4);
  ellipse(9, -2, 8, 4);

  ctx.fillStyle = body;
  const flap = o.flap || 0;
  ellipse(-20, -32, 6, 17, 0.35 + flap);
  ellipse(20, -32, 6, 17, -0.35 - flap);
  ellipse(0, -34, 22, 32);

  ctx.fillStyle = o.chick ? '#e3e9f0' : '#fff';
  ellipse(0, -27, 15, 24);

  if (o.emperor) {
    ctx.fillStyle = '#f5c542';
    ellipse(-15, -50, 4, 7, 0.3);
    ellipse(15, -50, 4, 7, -0.3);
    ctx.fillStyle = 'rgba(245,197,66,.35)';
    ellipse(0, -36, 11, 6);
  }
  if (o.apron) {
    ctx.fillStyle = '#ff8fbd';
    rrect(-12, -30, 24, 24, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ellipse(0, -20, 5, 3);
  }

  // mắt
  ctx.fillStyle = '#fff';
  ellipse(-7, -52, 5, 5.5);
  ellipse(7, -52, 5, 5.5);
  ctx.fillStyle = '#111';
  if (o.happyEyes) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-7, -50, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(7, -50, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else {
    ellipse(-7 + face * 1.5, -51, 2.5, 3);
    ellipse(7 + face * 1.5, -51, 2.5, 3);
  }
  if (o.angry) {
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-12, -61); ctx.lineTo(-3, -57); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -61); ctx.lineTo(3, -57); ctx.stroke();
  }
  if (o.blush) {
    ctx.fillStyle = 'rgba(255,120,160,.6)';
    ellipse(-13, -44, 4, 3);
    ellipse(13, -44, 4, 3);
  }

  // mỏ
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.moveTo(face * 1.5 - 6, -46);
  ctx.lineTo(face * 1.5 + 6, -46);
  ctx.lineTo(face * 4, -39);
  ctx.closePath();
  ctx.fill();

  if (o.scarf) {
    ctx.fillStyle = o.scarf;
    rrect(-18, -38, 36, 6, 3); ctx.fill();
    rrect(-face * 12 - 3, -36, 7, 14, 3); ctx.fill();
  }
  if (o.bow) {
    ctx.fillStyle = '#ff5c9e';
    ellipse(-17, -64, 7, 5, -0.5);
    ellipse(-5, -68, 7, 5, -0.5);
    ctx.fillStyle = '#d63f7f';
    ellipse(-11, -66, 3, 3);
  }
  if (o.chefHat) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(-13, -76, 26, 12);
    ellipse(-9, -80, 9, 8);
    ellipse(0, -85, 10, 9);
    ellipse(9, -80, 9, 8);
    ctx.strokeStyle = '#dde5ec'; ctx.lineWidth = 1;
    ctx.strokeRect(-13, -70, 26, 6);
  }
  ctx.restore();
}

function memberStyle(m, extra = {}) {
  return {
    scarf: m.type.id === 'chick' ? null : m.scarf,
    chick: m.type.id === 'chick',
    emperor: m.type.id === 'emperor',
    ...extra,
  };
}

function drawBackground(t) {
  // sàn băng
  for (let j = 0; j * 40 + 150 < H; j++) {
    for (let i = 0; i * 40 < W; i++) {
      ctx.fillStyle = (i + j) % 2 ? '#d7f0fa' : '#c6e7f5';
      ctx.fillRect(i * 40, 150 + j * 40, 40, 40);
    }
  }
  // khu chờ
  ctx.fillStyle = '#f7d9e6';
  ctx.fillRect(0, 150, 150, H - 150);
  ctx.fillStyle = 'rgba(255,111,168,.25)';
  for (let y = 160; y < H; y += 28) ctx.fillRect(10, y, 130, 10);
  // dây ngăn
  ctx.strokeStyle = '#d63f7f'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(150, 190);
  ctx.quadraticCurveTo(158, 340, 150, 480);
  ctx.stroke();
  ctx.fillStyle = '#c9a227';
  for (const y of [190, 480]) { ctx.fillRect(144, y - 20, 12, 40); ellipse(150, y - 22, 8, 8); }

  // tường
  const grd = ctx.createLinearGradient(0, 0, 0, 150);
  grd.addColorStop(0, '#78b4d6'); grd.addColorStop(1, '#5b98c0');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, 150);
  // gạch bếp
  ctx.fillStyle = '#eaf4fa';
  ctx.fillRect(200, 0, W - 200, 118);
  ctx.strokeStyle = '#cfe0eb'; ctx.lineWidth = 1;
  for (let y = 0; y < 118; y += 20) {
    ctx.beginPath(); ctx.moveTo(200, y); ctx.lineTo(W, y); ctx.stroke();
    for (let x = 200 + ((y / 20) % 2) * 20; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 20); ctx.stroke();
    }
  }
  // cửa sổ tuyết
  ctx.fillStyle = '#fff';
  rrect(22, 18, 124, 92, 10); ctx.fill();
  ctx.fillStyle = '#1b3b63';
  rrect(30, 26, 108, 76, 6); ctx.fill();
  ctx.fillStyle = '#f5fbff';
  ctx.beginPath(); ctx.moveTo(30, 102); ctx.lineTo(60, 70); ctx.lineTo(85, 90); ctx.lineTo(110, 62); ctx.lineTo(138, 102); ctx.fill();
  for (let k = 0; k < 14; k++) {
    const sx = 30 + ((k * 37 + t * 12) % 108);
    const sy = 26 + ((k * 23 + t * (18 + k)) % 76);
    ctx.fillStyle = '#fff';
    ellipse(sx, sy, 1.6, 1.6);
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(82, 26, 4, 76);
  text('Nhà Hàng Penny', 84, 132, 17, '#fff', 800);

  // bảng thực đơn
  ctx.fillStyle = '#2d3e50';
  rrect(610, 8, 330, 66, 10); ctx.fill();
  ctx.strokeStyle = '#c98b55'; ctx.lineWidth = 4; ctx.stroke();
  text('THỰC ĐƠN', 775, 20, 13, '#f4d58d', 800);
  const menu = menuFor(G.day);
  const gap = Math.min(54, 300 / menu.length);
  menu.forEach((d, k) => {
    const x = 775 + (k - (menu.length - 1) / 2) * gap;
    emoji(d.emoji, x, 44, 20);
    text(d.price + '$', x, 64, 12, '#fff', 700);
  });

  // bếp
  ctx.fillStyle = '#95a5b3';
  rrect(340, 40, 170, 78, 8); ctx.fill();
  ctx.fillStyle = '#2c3e50';
  ellipse(385, 58, 20, 6); ellipse(465, 58, 20, 6);
  ctx.fillStyle = '#7f8c8d';
  rrect(362, 30, 46, 26, 6); ctx.fill();
  rrect(442, 34, 46, 22, 6); ctx.fill();
  ctx.fillStyle = '#34495e';
  rrect(350, 80, 150, 32, 6); ctx.fill();
  ctx.fillStyle = '#e67e22';
  ellipse(385, 96, 8, 5); ellipse(465, 96, 8, 5);

  // bảng đơn
  const hot = G.penny.tickets.length > 0;
  ctx.fillStyle = hot ? '#ffe28a' : '#c98b55';
  rrect(RAIL.x, RAIL.y, RAIL.w, 84, 8); ctx.fill();
  ctx.fillStyle = '#8e5b32';
  ctx.fillRect(RAIL.x + 8, RAIL.y + 10, RAIL.w - 16, 4);
  text('ĐƠN', RAIL.x + RAIL.w / 2, RAIL.y + 28, 16, '#4a2d14', 800);
  const pending = G.chef.queue.length + (G.chef.cooking ? 1 : 0);
  for (let k = 0; k < Math.min(pending, 4); k++) {
    ctx.fillStyle = '#fffbe6';
    ctx.fillRect(RAIL.x + 10 + k * 20, RAIL.y + 44, 16, 26);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(RAIL.x + 10 + k * 20, RAIL.y + 44, 16, 4);
  }
  if (hot) {
    const a = 0.5 + 0.5 * Math.sin(t * 8);
    ctx.strokeStyle = `rgba(255,111,168,${a})`; ctx.lineWidth = 4;
    rrect(RAIL.x - 3, RAIL.y - 3, RAIL.w + 6, 90, 10); ctx.stroke();
  }
}

function drawChef(t) {
  const c = G.chef;
  const busy = !!c.cooking;
  drawPenguin(430, 128, 0.85, {
    chefHat: true, face: busy ? (Math.sin(t * 6) > 0 ? 1 : -1) : 1,
    flap: busy ? Math.sin(t * 16) * 0.3 : 0, bob: busy ? Math.abs(Math.sin(t * 8)) * 2 : 0,
  });
  if (!busy) return;
  // hơi nước
  for (let k = 0; k < 3; k++) {
    const p = (t * 0.8 + k / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - p)})`;
    ellipse(385 + k * 40, 50 - p * 40, 6 + p * 8, 5 + p * 6);
  }
  ctx.fillStyle = '#fff';
  rrect(378, 2, 104, 26, 8); ctx.fill();
  ctx.fillStyle = '#dfe8ef';
  rrect(386, 18, 88, 6, 3); ctx.fill();
  ctx.fillStyle = '#2ecc71';
  rrect(386, 18, 88 * Math.min(1, c.t / c.dur), 6, 3); ctx.fill();
  c.dishes.forEach((d, k) => emoji(dish(d).emoji, 430 + (k - (c.dishes.length - 1) / 2) * 20, 10, 13));
}

function drawPlate(x, y, dishes, s = 1) {
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ellipse(x, y + 4 * s, 30 * s, 9 * s);
  ctx.fillStyle = '#fff';
  ellipse(x, y, 30 * s, 10 * s);
  ctx.fillStyle = '#e6eef4';
  ellipse(x, y, 22 * s, 7 * s);
  dishes.forEach((d, k) => emoji(dish(d).emoji, x + (k - (dishes.length - 1) / 2) * 20 * s, y - 8 * s, 22 * s));
}

function drawCounter(t) {
  ctx.fillStyle = '#b87843';
  ctx.fillRect(200, 118, W - 200, 32);
  ctx.fillStyle = '#e0a96d';
  ctx.fillRect(196, 110, W - 196, 12);
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  for (let x = 220; x < W; x += 60) ctx.fillRect(x, 124, 3, 24);

  G.trays.forEach((tr, k) => {
    const x = TRAY_X0 + k * TRAY_GAP;
    const queued = isQueued(G, a => a.type === 'tray' && a.trayId === tr.id);
    if (queued || G.penny.carry.length < capacity(G.save)) {
      const a = 0.35 + 0.35 * Math.sin(t * 6);
      ctx.fillStyle = `rgba(255,230,120,${queued ? 0.6 : a})`;
      ellipse(x, TRAY_Y, 38, 14);
    }
    drawPlate(x, TRAY_Y, tr.dishes, 0.9);
    ctx.fillStyle = '#1d3557';
    ellipse(x + 26, TRAY_Y + 20, 10, 10);
    text(String(tr.tableNo), x + 26, TRAY_Y + 21, 13, '#fff', 800);
  });
}

function drawDecor(t) {
  const lvl = G.save.up.decor;
  if (lvl >= 1) {
    for (const x of [200, 940]) {
      ctx.fillStyle = '#bfe9ff';
      rrect(x - 10, 540, 20, 40, 6); ctx.fill();
      ctx.fillStyle = `rgba(255,240,150,${0.6 + 0.3 * Math.sin(t * 3 + x)})`;
      ellipse(x, 556, 6, 9);
    }
  }
  if (lvl >= 2) {
    for (const x of [936, 210]) {
      ctx.fillStyle = '#8e5b32'; ctx.fillRect(x - 4, 205, 8, 16);
      ctx.fillStyle = '#2e8b57';
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x, 160 + k * 12);
        ctx.lineTo(x - 18 + k * 2, 190 + k * 10);
        ctx.lineTo(x + 18 - k * 2, 190 + k * 10);
        ctx.fill();
      }
      ctx.fillStyle = '#f4d03f'; ellipse(x, 158, 4, 4);
    }
  }
}

function drawTable(tb, t) {
  const g = tb.group;
  ctx.fillStyle = 'rgba(20,60,100,.15)';
  ellipse(tb.x, tb.y + 30, 50, 12);
  // ghế
  for (const dx of [-58, 58]) {
    ctx.fillStyle = '#6fa8dc';
    ellipse(tb.x + dx, tb.y + 22, 16, 7);
  }
  ctx.fillStyle = '#8e5b32';
  ctx.fillRect(tb.x - 4, tb.y, 8, 28);
  if (G.selected && !g) {
    const a = 0.5 + 0.4 * Math.sin(t * 7);
    ctx.fillStyle = `rgba(46,204,113,${a})`;
    ellipse(tb.x, tb.y, 54, 34);
  }
  ctx.fillStyle = '#fff';
  ellipse(tb.x, tb.y, 46, 26);
  ctx.fillStyle = '#ffd1e3';
  ellipse(tb.x, tb.y - 2, 38, 19);
  if (g && g.state === 'eating') drawPlate(tb.x, tb.y - 2, g.order, 0.75);
  ctx.fillStyle = '#1d3557';
  ellipse(tb.x, tb.y + 42, 10, 10);
  text(String(tb.i + 1), tb.x, tb.y + 43, 13, '#fff', 800);
}

function drawSeated(g, t) {
  const tb = g.table;
  const eating = g.state === 'eating';
  const low = g.patience < 30;
  g.members.forEach((m, k) => {
    const left = k === 0;
    drawPenguin(tb.x + (left ? -58 : 58), tb.y + 22, m.type.scale, memberStyle(m, {
      face: left ? 1 : -1,
      bob: eating ? Math.abs(Math.sin(t * 8 + k)) * 3 : 0,
      happyEyes: eating || g.state === 'pay',
      angry: low && !eating,
      flap: eating ? Math.sin(t * 10 + k) * 0.2 : 0,
    }));
  });
}

function drawWalker(g, t) {
  const moving = g.state !== 'queue';
  const lifted = G.dragging && G.selected === g;
  g.members.forEach((m, k) => {
    const off = g.size === 2 ? (k === 0 ? -16 : 16) : 0;
    const x = lifted ? G.pointer.x + off : g.x + off;
    // trên cảm ứng nhấc khách lên trên ngón tay để không bị che
    const y = lifted ? G.pointer.y + (G.touch ? -8 : 30) : g.y + (k === 1 ? 4 : 0);
    drawPenguin(x, y, m.type.scale * (lifted ? 1.05 : 1), memberStyle(m, {
      face: g.face,
      bob: moving ? Math.abs(Math.sin(g.walk + k)) * 4 : 0,
      angry: g.state === 'leaving' ? !g.happy : g.patience < 30,
      happyEyes: g.state === 'leaving' && g.happy,
      flap: lifted ? Math.sin(t * 20) * 0.4 : 0,
    }));
  });
  if (G.selected === g && !lifted) {
    ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    rrect(g.x - 42, g.y - 76, 84, 84, 12); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPenny() {
  const p = G.penny;
  drawPenguin(p.x, p.y, 1, {
    face: p.face, bow: true, apron: true, blush: true,
    bob: p.current ? Math.abs(Math.sin(p.walk)) * 4 : 0,
    flap: p.carry.length ? -0.9 : 0,
  });
  p.carry.forEach((tr, k) => {
    const x = p.x + p.face * 6, y = p.y - 78 - k * 24;
    drawPlate(x, y, tr.dishes, 0.7);
    ctx.fillStyle = '#1d3557';
    ellipse(x + 22, y + 6, 8, 8);
    text(String(tr.tableNo), x + 22, y + 7, 11, '#fff', 800);
  });
  if (p.tickets.length) {
    const x = p.x - p.face * 26, y = p.y - 44;
    ctx.fillStyle = '#fffbe6';
    ctx.fillRect(x - 8, y - 12, 16, 22);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x - 8, y - 12, 16, 4);
    if (p.tickets.length > 1) text('×' + p.tickets.length, x + 14, y + 8, 12, '#1d3557', 800);
  }
}

function drawBubble(x, y, content, t, urgent) {
  const w = Math.max(40, content.length * 24 + 16), h = 36;
  ctx.save();
  ctx.translate(urgent ? Math.sin(t * 30) * 1.5 : 0, 0);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = urgent ? '#e74c3c' : '#1d3557';
  ctx.lineWidth = 2.5;
  rrect(x - w / 2, y - h / 2, w, h, 12);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 7, y + h / 2 - 1); ctx.lineTo(x, y + h / 2 + 9); ctx.lineTo(x + 7, y + h / 2 - 1);
  ctx.fill();
  content.forEach((c, k) => emoji(c, x + (k - (content.length - 1) / 2) * 24, y + 1, 20));
  ctx.restore();
}

function drawHearts(x, y, patience) {
  const n = Math.ceil(patience / 20);
  ctx.font = `800 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < 5; k++) {
    ctx.fillStyle = k < n ? (n <= 1 ? '#e74c3c' : '#ff5c8a') : 'rgba(29,53,87,.2)';
    ctx.fillText('♥', x + (k - 2) * 13, y);
  }
}

function drawGroupUi(g, t) {
  if (g.state === 'leaving' || g.state === 'toTable') return;
  if (G.dragging && G.selected === g) return;
  if (!g.table) { drawHearts(g.x, g.y - 80, g.patience); return; }
  const { x, y } = g.table;
  let content = null, urgent = g.patience < 25;
  if (g.state === 'menu') content = ['📖'];
  else if (g.state === 'order') content = ['❗'];
  else if (g.state === 'waitFood') content = g.order.map(d => dish(d).emoji);
  else if (g.state === 'pay') content = ['💰'];
  else if (g.state === 'eating') { content = ['😋']; urgent = false; }
  if (content) drawBubble(x, y - 78, content, t, urgent);
  if (g.state !== 'eating' && g.state !== 'menu') drawHearts(x, y - 108, g.patience);
}

function drawActionMarkers() {
  const p = G.penny;
  const list = p.current ? [p.current, ...p.queue] : p.queue;
  list.forEach((a, k) => {
    const s = actionSpot(G, a);
    if (!s) return;
    ctx.fillStyle = k === 0 ? '#ff6fa8' : 'rgba(255,111,168,.75)';
    ellipse(s.x, s.y + 4, 11, 11);
    text(String(k + 1), s.x, s.y + 5, 13, '#fff', 800);
  });
}

function drawFx() {
  for (const f of G.fx) {
    const p = f.t / f.life;
    ctx.globalAlpha = 1 - p * p;
    const y = f.y - p * 40;
    ctx.font = `800 ${f.big ? 24 : 16}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.strokeText(f.str, f.x, y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.str, f.x, y);
    ctx.globalAlpha = 1;
  }
}

function currentHint() {
  const p = G.penny;
  if (G.selected) return 'Bấm vào một bàn trống (sáng xanh) để xếp chỗ cho khách';
  if (G.groups.some(g => g.state === 'order')) return 'Bấm vào bàn có ❗ để ghi món';
  if (p.tickets.length) return 'Bấm vào bảng ĐƠN để đưa đơn cho đầu bếp';
  if (p.carry.length) return 'Bấm vào bàn có số trùng với khay để mang món ra';
  if (G.trays.length) return 'Bấm vào khay đồ ăn trên quầy để bưng';
  if (G.groups.some(g => g.state === 'pay')) return 'Bấm vào bàn có 💰 để tính tiền';
  if (G.tables.some(tb => !tb.group) && G.groups.some(g => g.state === 'queue')) {
    return 'Kéo (hoặc bấm) khách đang chờ rồi thả vào bàn trống';
  }
  return '';
}

function drawHint() {
  if (G.day > 2) return;
  const h = currentHint();
  if (!h) return;
  ctx.font = `700 16px ${FONT}`;
  const w = ctx.measureText(h).width + 28;
  ctx.fillStyle = 'rgba(29,53,87,.85)';
  rrect(W / 2 - w / 2 + 70, H - 38, w, 30, 15); ctx.fill();
  text('💡 ' + h, W / 2 + 70, H - 22, 16, '#fff', 700);
}

function drawTitleBackdrop(t) {
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#1b3b63'); grd.addColorStop(1, '#78b4d6');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f5fbff';
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(180, 430); ctx.lineTo(330, 520); ctx.lineTo(560, 380); ctx.lineTo(780, 500); ctx.lineTo(W, 420); ctx.lineTo(W, H); ctx.fill();
  for (let k = 0; k < 60; k++) {
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ellipse((k * 97 + t * 15) % W, (k * 53 + t * (20 + k % 20)) % H, 2, 2);
  }
  drawPenguin(820, 540, 1.6, { bow: true, apron: true, blush: true, face: -1, bob: Math.abs(Math.sin(t * 3)) * 5 });
  drawPenguin(130, 560, 1.2, { scarf: '#3498db', bob: Math.abs(Math.sin(t * 3 + 1)) * 4 });
}

export function render(context, game, t) {
  ctx = context;
  G = game;
  ctx.clearRect(0, 0, W, H);
  if (!G) { drawTitleBackdrop(t); return; }
  drawBackground(t);
  drawChef(t);
  drawCounter(t);
  drawDecor(t);

  const seatedState = g => !['toTable', 'leaving'].includes(g.state);
  const items = [];
  for (const tb of G.tables) {
    items.push({ y: tb.y + 22, draw: () => { drawTable(tb, t); if (tb.group && seatedState(tb.group)) drawSeated(tb.group, t); } });
  }
  for (const g of G.groups) {
    if (g.table && seatedState(g)) continue;
    if (G.dragging && G.selected === g) continue;
    items.push({ y: g.y, draw: () => drawWalker(g, t) });
  }
  items.push({ y: G.penny.y, draw: drawPenny });
  items.sort((a, b) => a.y - b.y).forEach(it => it.draw());

  drawActionMarkers();
  for (const g of G.groups) drawGroupUi(g, t);
  if (G.dragging && G.selected) drawWalker(G.selected, t);
  drawFx();
  drawHint();
}
