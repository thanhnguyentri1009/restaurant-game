// Logic game: trạng thái được giữ trong một object G có thể thay đổi (mutable),
// React chỉ đọc ra để hiển thị HUD và các màn hình.
import {
  LAYOUTS, TYPES, SCARVES, WAITING, POTIONS, SPEED_BOOST, COOK_BOOST,
  pennySpeed, cookMul, capacity, decorDrain, goalFor, menuFor, dish, dayInfo, unlocksFor,
} from './data.js';
import { sfx, SFX } from './audio.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

function moveToward(o, tx, ty, speed, dt) {
  const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
  if (Math.abs(dx) > 2) o.face = dx > 0 ? 1 : -1;
  if (d <= speed * dt || d < 0.5) { o.x = tx; o.y = ty; return true; }
  o.x += dx / d * speed * dt;
  o.y += dy / d * speed * dt;
  o.walk = (o.walk || 0) + dt * 14;
  return false;
}

export function createGame(save, layout = 'landscape') {
  const day = save.day;
  const L = LAYOUTS[layout];
  const info = dayInfo(day);
  const G = {
    save, L, day, time: 0, earned: 0, goal: goalFor(day),
    total: info.customers, spawned: 0, nextSpawn: 1.2,
    news: unlocksFor(day), effects: { speed: 0, cook: 0 },
    served: 0, lost: 0, finished: false,
    groups: [], tables: [], trays: [], fx: [],
    selected: null, dragging: false, downAt: null, pointer: { x: 0, y: 0 },
    penny: { x: L.penny.x, y: L.penny.y, face: 1, walk: 0, queue: [], current: null, carry: [], tickets: [] },
    chef: { queue: [], cooking: null, t: 0, dur: 0, dishes: [] },
    nextId: 1,
  };
  const n = Math.min(info.tables, L.tables.length);
  for (let i = 0; i < n; i++) G.tables.push({ i, x: L.tables[i][0], y: L.tables[i][1], group: null });
  return G;
}

// ---------------- Khách ----------------

export function queueGroups(G) {
  return G.groups.filter(g => g.state === 'arriving' || g.state === 'queue');
}

function spawnGroup(G) {
  const types = TYPES.filter(t => t.day <= G.day);
  const size = Math.random() < Math.min(0.75, 0.25 + G.day * 0.06) ? 2 : 1;
  const members = [];
  for (let k = 0; k < size; k++) members.push({ type: pick(types), scarf: pick(SCARVES) });
  const drain = members.reduce((s, m) => s + m.type.drain, 0) / size;
  const tip = members.reduce((s, m) => s + m.type.tip, 0) / size;
  G.groups.push({
    id: G.nextId++, members, size, drain, tip,
    state: 'arriving', patience: 100, timer: 0,
    x: G.L.entry.x, y: G.L.entry.y, face: 1, walk: 0,
    table: null, order: [], happy: true,
  });
  G.spawned++;
  SFX.enter();
}

function bump(g, amt) { g.patience = Math.min(100, g.patience + amt); }

function seatGroup(G, g, t) {
  t.group = g;
  g.table = t;
  g.state = 'toTable';
  bump(g, 8);
  SFX.seat();
}

function leaveGroup(G, g, happy) {
  if (g.table) { g.table.group = null; g.table = null; }
  const p = G.penny, c = G.chef;
  G.trays = G.trays.filter(t => t.groupId !== g.id);
  p.carry = p.carry.filter(t => t.groupId !== g.id);
  p.tickets = p.tickets.filter(id => id !== g.id);
  c.queue = c.queue.filter(id => id !== g.id);
  if (c.cooking === g.id) c.cooking = null;
  if (G.selected === g) G.selected = null;
  g.state = 'leaving';
  g.happy = happy;
  if (!happy) {
    G.lost++;
    addFx(G, g.x, g.y - 80, '💢 Bỏ về!', '#e74c3c', true);
    SFX.angry();
  }
}

function updateGroup(G, g, dt) {
  const scale = 1 + (G.day - 1) * 0.05;
  if (WAITING.includes(g.state)) {
    const base = (g.state === 'arriving' || g.state === 'queue') ? 1.7 : 2.4;
    g.patience -= base * g.drain * decorDrain(G.save) * scale * dt;
    if (g.patience <= 0) { g.patience = 0; leaveGroup(G, g, false); return; }
  }
  switch (g.state) {
    case 'arriving':
    case 'queue': {
      const k = queueGroups(G).indexOf(g);
      const slot = G.L.queueSlot(k);
      if (moveToward(g, slot.x, slot.y, 170, dt)) { g.state = 'queue'; g.face = 1; }
      break;
    }
    case 'toTable':
      if (moveToward(g, g.table.x, g.table.y + 20, 260, dt)) {
        g.state = 'menu';
        g.timer = rand(2.2, 3.8);
      }
      break;
    case 'menu':
      g.timer -= dt;
      if (g.timer <= 0) {
        const menu = menuFor(G.day);
        g.order = g.members.map(() => pick(menu).id);
        g.state = 'order';
        sfx(880, 0.06, 'sine', 0.05);
      }
      break;
    case 'eating':
      g.timer -= dt;
      if (g.timer <= 0) { g.state = 'pay'; bump(g, 10); }
      break;
    case 'leaving':
      if (moveToward(g, G.L.entry.x, G.L.entry.y, g.happy ? 220 : 280, dt)) g.state = 'gone';
      break;
  }
}

function payGroup(G, g) {
  const hearts = Math.ceil(g.patience / 20);
  const base = g.order.reduce((s, id) => s + dish(id).price, 0);
  const tip = Math.round(hearts * 1.2 * g.size * g.tip);
  const total = base + tip;
  G.earned += total;
  G.save.wallet += total;
  G.served++;
  const t = g.table;
  addFx(G, t.x, t.y - 60, `+${total}$`, '#f4b400', true);
  if (tip > 0) addFx(G, t.x, t.y - 30, `tip ${tip}$`, '#27ae60');
  SFX.cash();
  g.x = t.x; g.y = t.y + 20;
  leaveGroup(G, g, true);
}

// ---------------- Penny ----------------

export function actionSpot(G, a) {
  if (a.type === 'table') { const t = G.tables[a.idx]; return { x: t.x, y: t.y + 64 }; }
  if (a.type === 'kitchen') return G.L.kitchenSpot;
  if (a.type === 'tray') {
    const k = G.trays.findIndex(t => t.id === a.trayId);
    if (k < 0) return null;
    return { x: G.L.trayX0 + k * G.L.trayGap, y: G.L.pickupY };
  }
  return null;
}

export function isQueued(G, fn) {
  const p = G.penny;
  return (p.current && fn(p.current)) || p.queue.some(fn);
}

function enqueue(G, a) {
  const p = G.penny;
  const all = p.current ? [p.current, ...p.queue] : p.queue;
  const last = all[all.length - 1];
  if (last && last.type === a.type && last.idx === a.idx && last.trayId === a.trayId) return;
  if (p.queue.length >= 6) return;
  p.queue.push(a);
  SFX.click();
}

function perform(G, a) {
  const p = G.penny;
  if (a.type === 'table') {
    const g = G.tables[a.idx].group;
    if (!g) return;
    if (g.state === 'order') {
      g.state = 'waitFood';
      p.tickets.push(g.id);
      bump(g, 15);
      addFx(G, g.table.x, g.table.y - 60, '📝 Đã ghi món', '#1d3557');
      SFX.note();
    } else if (g.state === 'waitFood') {
      const k = p.carry.findIndex(t => t.groupId === g.id);
      if (k >= 0) {
        p.carry.splice(k, 1);
        g.state = 'eating';
        g.timer = rand(4.5, 6.5);
        bump(g, 15);
        SFX.serve();
      }
    } else if (g.state === 'pay') {
      payGroup(G, g);
    }
  } else if (a.type === 'kitchen') {
    if (p.tickets.length) {
      G.chef.queue.push(...p.tickets);
      p.tickets = [];
      SFX.note();
    }
  } else if (a.type === 'tray') {
    const k = G.trays.findIndex(t => t.id === a.trayId);
    if (k >= 0 && p.carry.length < capacity(G.save)) {
      p.carry.push(G.trays.splice(k, 1)[0]);
      sfx(600, 0.06, 'triangle', 0.05);
    } else if (k >= 0) {
      addFx(G, p.x, p.y - 90, 'Tay đầy rồi!', '#e74c3c');
    }
  }
}

function updatePenny(G, dt) {
  const p = G.penny;
  if (!p.current && p.queue.length) p.current = p.queue.shift();
  if (!p.current) return;
  const spot = actionSpot(G, p.current);
  if (!spot) { p.current = null; return; }
  const boost = G.effects.speed > 0 ? SPEED_BOOST : 1;
  if (moveToward(p, spot.x, spot.y, pennySpeed(G.save) * boost, dt)) {
    perform(G, p.current);
    p.current = null;
  }
}

// ---------------- Bếp ----------------

function updateChef(G, dt) {
  const c = G.chef;
  if (!c.cooking && c.queue.length && G.trays.length < G.L.trayMax) {
    const id = c.queue.shift();
    const g = G.groups.find(x => x.id === id);
    if (g) {
      c.cooking = id;
      c.dishes = g.order.slice();
      c.dur = g.order.reduce((s, d) => s + dish(d).cook, 0) * cookMul(G.save);
      c.t = 0;
    }
  }
  if (c.cooking) {
    c.t += dt * (G.effects.cook > 0 ? COOK_BOOST : 1);
    if (c.t >= c.dur) {
      const g = G.groups.find(x => x.id === c.cooking);
      if (g && g.table) {
        G.trays.push({ id: G.nextId++, groupId: g.id, tableNo: g.table.i + 1, dishes: c.dishes });
        SFX.ready();
      }
      c.cooking = null;
    }
  }
}

// ---------------- Hiệu ứng ----------------

function addFx(G, x, y, str, color, big = false) {
  G.fx.push({ x, y, str, color, big, t: 0, life: 1.4 });
}

// ---------------- Vòng lặp ----------------

export function update(G, dt) {
  if (G.finished) return;
  G.time += dt;
  G.effects.speed = Math.max(0, G.effects.speed - dt);
  G.effects.cook = Math.max(0, G.effects.cook - dt);
  if (G.spawned < G.total) {
    G.nextSpawn -= dt;
    if (G.nextSpawn <= 0) {
      if (queueGroups(G).length < G.L.queueMax) {
        spawnGroup(G);
        const interval = Math.max(2.8, 10.5 - G.day * 0.75);
        G.nextSpawn = rand(interval * 0.7, interval * 1.25);
      } else {
        G.nextSpawn = 1;
      }
    }
  }
  for (const g of G.groups.slice()) updateGroup(G, g, dt);
  G.groups = G.groups.filter(g => g.state !== 'gone');
  updatePenny(G, dt);
  updateChef(G, dt);
  for (const f of G.fx) f.t += dt;
  G.fx = G.fx.filter(f => f.t < f.life);

  if (G.spawned >= G.total && G.groups.length === 0) G.finished = true;
}

export function hudSnapshot(G) {
  return {
    day: G.day,
    earned: G.earned,
    goal: G.goal,
    left: (G.total - G.spawned) + G.groups.filter(g => g.state !== 'leaving').length,
    wallet: G.save.wallet,
    speed: Math.ceil(G.effects.speed),
    cook: Math.ceil(G.effects.cook),
  };
}

// ---------------- Thuốc ----------------

/** Dùng một lọ thuốc; trả về true nếu dùng được. */
export function applyPotion(G, id) {
  const pot = POTIONS.find(p => p.id === id);
  if (!pot || G.finished || !(G.save.potions[id] > 0)) return false;
  G.save.potions[id]--;
  const p = G.penny;
  if (id === 'speed') {
    G.effects.speed += pot.duration;
    addFx(G, p.x, p.y - 90, '⚡ Chạy nhanh!', '#f39c12', true);
  } else if (id === 'cook') {
    G.effects.cook += pot.duration;
    const cx = G.L.stoveX + 90;
    addFx(G, cx, 60, '🔥 Nấu nhanh!', '#e74c3c', true);
  } else if (id === 'joy') {
    for (const g of G.groups) {
      if (g.state === 'leaving') continue;
      g.patience = 100;
      const a = g.table && g.state !== 'toTable' ? g.table : g;
      addFx(G, a.x, a.y - 70, '💖', '#ff5c8a', true);
    }
  }
  sfx(520, 0.25, 'sine', 0.08, 500);
  return true;
}

// ---------------- Điều khiển ----------------

// Trên cảm ứng ngón tay kém chính xác hơn chuột nên vùng bấm được nới rộng thêm
const slop = G => (G.touch ? 14 : 0);

function hitQueueGroup(G, x, y) {
  const s = slop(G);
  return queueGroups(G).find(g => g.state === 'queue' && Math.abs(x - g.x) < 44 + s && y > g.y - 80 && y < g.y + 10);
}
function hitTable(G, x, y) {
  const s = slop(G);
  return G.tables.find(tb => {
    const { rx, ry } = G.L.tableHit;
    const dx = (x - tb.x) / (rx + s / 2), dy = (y - (tb.y - 10)) / (ry + s);
    return dx * dx + dy * dy < 1;
  });
}
function hitRail(G, x, y) {
  const s = slop(G);
  const r = G.L.rail;
  return x > r.x - 10 - s && x < r.x + r.w + 18 + s && y > r.y - s && y < 190 + s;
}
function hitTray(G, x, y) {
  const s = slop(G) / 2;
  return G.trays.find((tr, k) => Math.abs(x - (G.L.trayX0 + k * G.L.trayGap)) < Math.min(36 + s, G.L.trayGap / 2) && y > 76 - s && y < 150 + s);
}

/** Trả về true nếu bắt đầu kéo khách (để canvas giữ con trỏ). */
export function pointerDown(G, x, y, touch = false) {
  G.touch = touch;
  G.pointer = { x, y };
  const g = hitQueueGroup(G, x, y);
  if (g) {
    G.selected = g;
    G.dragging = true;
    G.downAt = { x, y };
    return true;
  }
  const tb = hitTable(G, x, y);
  if (G.selected) {
    const sel = G.selected;
    G.selected = null;
    if (tb && !tb.group) { seatGroup(G, sel, tb); return false; }
  }
  if (tb) { enqueue(G, { type: 'table', idx: tb.i }); return false; }
  const tr = hitTray(G, x, y);
  if (tr) { enqueue(G, { type: 'tray', trayId: tr.id }); return false; }
  if (hitRail(G, x, y)) enqueue(G, { type: 'kitchen' });
  return false;
}

/** Trả về kiểu con trỏ chuột phù hợp. */
export function pointerMove(G, x, y) {
  G.pointer = { x, y };
  if (G.dragging) return 'grabbing';
  const over = hitQueueGroup(G, x, y) || hitTable(G, x, y) || hitTray(G, x, y) || hitRail(G, x, y);
  return over ? 'pointer' : 'default';
}

export function pointerUp(G, x, y) {
  if (!G.dragging) return;
  G.dragging = false;
  const sel = G.selected;
  if (!sel || sel.state !== 'queue') { G.selected = null; return; }
  const tb = hitTable(G, x, y);
  if (tb && !tb.group) { G.selected = null; seatGroup(G, sel, tb); return; }
  // thả ra ngoài thì huỷ, bấm nhẹ thì giữ chọn
  if (Math.hypot(x - G.downAt.x, y - G.downAt.y) > 20) G.selected = null;
}

