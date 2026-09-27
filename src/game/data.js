export const KINDS = { food: 'Món ăn', drink: 'Đồ uống', dessert: 'Tráng miệng' };

// `day` = ngày món được mở khoá (xem SCHEDULE bên dưới)
export const DISHES = [
  { id: 'fish',     kind: 'food',    name: 'Cá nướng',          emoji: '🐟', price: 8,  cook: 2.5, day: 1 },
  { id: 'sushi',    kind: 'food',    name: 'Sushi',             emoji: '🍣', price: 12, cook: 3.0, day: 1 },
  { id: 'tea',      kind: 'drink',   name: 'Trà sữa trân châu', emoji: '🧋', price: 6,  cook: 1.5, day: 1 },
  { id: 'ramen',    kind: 'food',    name: 'Mì ramen',          emoji: '🍜', price: 15, cook: 3.5, day: 2 },
  { id: 'onigiri',  kind: 'food',    name: 'Cơm nắm cá hồi',    emoji: '🍙', price: 11, cook: 2.5, day: 2 },
  { id: 'ice',      kind: 'dessert', name: 'Kem tuyết',         emoji: '🍦', price: 10, cook: 2.0, day: 3 },
  { id: 'flan',     kind: 'dessert', name: 'Bánh flan caramel', emoji: '🍮', price: 9,  cook: 2.0, day: 3 },
  { id: 'tempura',  kind: 'food',    name: 'Tôm tempura',       emoji: '🍤', price: 14, cook: 3.0, day: 4 },
  { id: 'matcha',   kind: 'drink',   name: 'Trà xanh matcha',   emoji: '🍵', price: 8,  cook: 1.5, day: 4 },
  { id: 'hotpot',   kind: 'food',    name: 'Lẩu hải sản',       emoji: '🍲', price: 20, cook: 4.5, day: 5 },
  { id: 'dumpling', kind: 'food',    name: 'Há cảo tôm',        emoji: '🥟', price: 13, cook: 3.0, day: 5 },
  { id: 'cake',     kind: 'dessert', name: 'Bánh kem dâu',      emoji: '🍰', price: 14, cook: 2.5, day: 6 },
  { id: 'coconut',  kind: 'drink',   name: 'Nước dừa',          emoji: '🥥', price: 9,  cook: 1.5, day: 6 },
  { id: 'crab',     kind: 'food',    name: 'Cua hấp',           emoji: '🦀', price: 24, cook: 5.0, day: 7 },
  { id: 'bingsu',   kind: 'dessert', name: 'Bingsu đá bào',     emoji: '🍧', price: 13, cook: 2.5, day: 7 },
  { id: 'curry',    kind: 'food',    name: 'Cà ri cá',          emoji: '🍛', price: 18, cook: 4.0, day: 8 },
  { id: 'dango',    kind: 'dessert', name: 'Bánh dango',        emoji: '🍡', price: 11, cook: 2.0, day: 9 },
];

// Lịch mở khoá theo ngày: số bàn và số lượt khách. Sau ngày cuối cùng thì
// giữ nguyên số bàn, mỗi ngày thêm 2 lượt khách.
export const SCHEDULE = [
  null,
  { tables: 3, customers: 6 },   // ngày 1
  { tables: 4, customers: 9 },   // ngày 2
  { tables: 4, customers: 11 },  // ngày 3
  { tables: 5, customers: 13 },  // ngày 4
  { tables: 5, customers: 15 },  // ngày 5
  { tables: 6, customers: 17 },  // ngày 6
  { tables: 6, customers: 19 },  // ngày 7
  { tables: 7, customers: 21 },  // ngày 8
  { tables: 7, customers: 23 },  // ngày 9
  { tables: 8, customers: 25 },  // ngày 10
];
const LAST = SCHEDULE.length - 1;

export function dayInfo(day) {
  const d = Math.min(day, LAST);
  const extra = Math.max(0, day - LAST);
  return { tables: SCHEDULE[d].tables, customers: Math.min(40, SCHEDULE[d].customers + extra * 2) };
}

/** Những gì mới xuất hiện vào ngày `day` (để thông báo). */
export function unlocksFor(day) {
  const prev = day > 1 ? dayInfo(day - 1) : { tables: 0, customers: 0 };
  const now = dayInfo(day);
  return {
    newTables: day > 1 ? now.tables - prev.tables : 0,
    tables: now.tables,
    customers: now.customers,
    dishes: DISHES.filter(d => d.day === day),
  };
}

export const TYPES = [
  { id: 'normal',  scale: 0.9,  drain: 1.0,  tip: 1.0, day: 1 },
  { id: 'chick',   scale: 0.7,  drain: 1.25, tip: 1.4, day: 2 },
  { id: 'emperor', scale: 1.05, drain: 0.8,  tip: 1.8, day: 3 },
];

export const SCARVES = ['#e74c3c', '#3498db', '#27ae60', '#9b59b6', '#f39c12', '#16a085', '#e67e22'];

// Nâng cấp vĩnh viễn
export const UPGRADES = [
  { id: 'shoes', icon: '⛸️', name: 'Giày trượt băng', desc: 'Penny di chuyển nhanh hơn',          costs: [60, 130, 220] },
  { id: 'chef',  icon: '👨‍🍳', name: 'Bếp xịn',         desc: 'Đầu bếp nấu nhanh hơn',              costs: [80, 160, 260] },
  { id: 'tray',  icon: '🍽️', name: 'Khay lớn',        desc: 'Bưng thêm món thứ 3 (đội trên đầu)', costs: [150] },
  { id: 'decor', icon: '🎄', name: 'Trang trí',       desc: 'Khách kiên nhẫn hơn',                costs: [90, 180] },
];

// Thuốc: mua ở shop, dùng trong ngày (bấm nút hoặc phím 1/2/3)
export const POTIONS = [
  { id: 'speed', icon: '⚡', name: 'Thuốc chạy nhanh', desc: 'Penny chạy nhanh gấp đôi trong 20 giây', cost: 25, duration: 20 },
  { id: 'cook',  icon: '🔥', name: 'Thuốc nấu nhanh',  desc: 'Bếp lên món nhanh gấp 3 trong 20 giây',  cost: 30, duration: 20 },
  { id: 'joy',   icon: '💖', name: 'Thuốc vui vẻ',     desc: 'Tất cả khách được đầy lại ♥ ngay',       cost: 35, duration: 0 },
];
export const SPEED_BOOST = 2, COOK_BOOST = 3;

// Hai bố cục: ngang (máy tính / điện thoại xoay ngang) và dọc (điện thoại cầm dọc).
// Logic game giống nhau, chỉ khác toạ độ. `tables` xếp theo thứ tự mở khoá.
export const LAYOUTS = {
  landscape: {
    name: 'landscape', W: 960, H: 600,
    tables: [[300, 290], [490, 290], [300, 470], [490, 470], [680, 290], [680, 470], [870, 290], [870, 470]],
    tableHit: { rx: 88, ry: 60 },
    queueSlot: k => ({ x: 76, y: 250 + k * 88 }), queueMax: 4,
    entry: { x: -50, y: 575 },
    penny: { x: 580, y: 380 },
    rail: { x: 212, y: 30, w: 100 }, kitchenSpot: { x: 262, y: 172 },
    trayX0: 560, trayGap: 78, trayY: 116, trayMax: 5, pickupY: 172,
    counterX0: 200, window: { x: 22, y: 18 }, title: { x: 84, y: 132 },
    board: { x: 610, y: 8, w: 330 }, stoveX: 340,
    rug: { x: 0, y: 150, w: 150, h: 450, rope: 'v' },
    lanterns: [[200, 540], [944, 540]], trees: [[944, 205], [205, 205]],
    hint: { x: 550, y: 578 }, banner: { x: 585, y: 196 },
  },
  portrait: {
    name: 'portrait', W: 600, H: 1100,
    tables: [[170, 300], [430, 300], [170, 480], [430, 480], [170, 660], [430, 660], [170, 840], [430, 840]],
    tableHit: { rx: 125, ry: 72 },
    queueSlot: k => ({ x: 510 - k * 112, y: 1045 }), queueMax: 4,
    entry: { x: -50, y: 1045 },
    penny: { x: 300, y: 600 },
    rail: { x: 10, y: 30, w: 100 }, kitchenSpot: { x: 60, y: 172 },
    trayX0: 172, trayGap: 74, trayY: 116, trayMax: 4, pickupY: 172,
    counterX0: 0, window: null, title: null,
    board: { x: 120, y: 8, w: 292 }, stoveX: 420,
    rug: { x: 0, y: 965, w: 600, h: 135, rope: 'h' },
    lanterns: [[22, 890], [578, 890]], trees: [[32, 205], [568, 205]],
    hint: { x: 300, y: 930 }, banner: { x: 300, y: 196 },
  },
};

export const WAITING = ['arriving', 'queue', 'order', 'waitFood', 'pay'];

export const pennySpeed = save => 300 + 60 * save.up.shoes;
export const cookMul = save => [1, 0.8, 0.65, 0.5][save.up.chef];
export const capacity = save => 2 + save.up.tray; // 2 tay, khay lớn thêm 1 món
export const decorDrain = save => [1, 0.82, 0.68][save.up.decor];
export const goalFor = day => Math.round(dayInfo(day).customers * 11 * (1 + day * 0.03));
export const menuFor = day => DISHES.filter(d => d.day <= day);
export const dish = id => DISHES.find(d => d.id === id);
