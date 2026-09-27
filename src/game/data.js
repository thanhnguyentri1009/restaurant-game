export const W = 960, H = 600;

export const KINDS = { food: 'Món ăn', drink: 'Đồ uống', dessert: 'Tráng miệng' };

export const DISHES = [
  { id: 'fish',    kind: 'food',    name: 'Cá nướng',         emoji: '🐟', price: 8,  cook: 2.5, day: 1 },
  { id: 'sushi',   kind: 'food',    name: 'Sushi',            emoji: '🍣', price: 12, cook: 3.0, day: 1 },
  { id: 'tea',     kind: 'drink',   name: 'Trà sữa trân châu', emoji: '🧋', price: 6,  cook: 1.5, day: 1 },
  { id: 'ramen',   kind: 'food',    name: 'Mì ramen',         emoji: '🍜', price: 15, cook: 3.5, day: 2 },
  { id: 'onigiri', kind: 'food',    name: 'Cơm nắm cá hồi',   emoji: '🍙', price: 11, cook: 2.5, day: 2 },
  { id: 'ice',     kind: 'dessert', name: 'Kem tuyết',        emoji: '🍦', price: 10, cook: 2.0, day: 3 },
  { id: 'flan',    kind: 'dessert', name: 'Bánh flan caramel', emoji: '🍮', price: 9,  cook: 2.0, day: 3 },
  { id: 'tempura', kind: 'food',    name: 'Tôm tempura',      emoji: '🍤', price: 14, cook: 3.0, day: 4 },
  { id: 'hotpot',  kind: 'food',    name: 'Lẩu hải sản',      emoji: '🍲', price: 20, cook: 4.5, day: 5 },
];

export const TYPES = [
  { id: 'normal',  scale: 0.9,  drain: 1.0,  tip: 1.0, day: 1 },
  { id: 'chick',   scale: 0.7,  drain: 1.25, tip: 1.4, day: 2 },
  { id: 'emperor', scale: 1.05, drain: 0.8,  tip: 1.8, day: 3 },
];

export const SCARVES = ['#e74c3c', '#3498db', '#27ae60', '#9b59b6', '#f39c12', '#16a085', '#e67e22'];

export const UPGRADES = [
  { id: 'shoes',  icon: '⛸️', name: 'Giày trượt băng', desc: 'Penny di chuyển nhanh hơn', costs: [60, 130, 220] },
  { id: 'tables', icon: '🪑', name: 'Thêm bàn',        desc: 'Có thêm bàn cho khách',     costs: [100, 200] },
  { id: 'chef',   icon: '🔥', name: 'Bếp xịn',         desc: 'Đầu bếp nấu nhanh hơn',     costs: [80, 160, 260] },
  { id: 'tray',   icon: '🍽️', name: 'Khay lớn',        desc: 'Bưng 2 khay một lúc',       costs: [150] },
  { id: 'decor',  icon: '🎄', name: 'Trang trí',       desc: 'Khách kiên nhẫn hơn',       costs: [90, 180] },
];

export const TABLE_POS = [[340, 290], [580, 290], [340, 470], [580, 470], [820, 290], [820, 470]];
export const QUEUE_X = 76, QUEUE_Y0 = 250, QUEUE_GAP = 88, QUEUE_MAX = 4;
export const ENTRY = { x: -50, y: 575 };
export const KITCHEN_SPOT = { x: 262, y: 172 };
export const RAIL = { x: 212, y: 30, w: 100, h: 120 };
export const TRAY_X0 = 560, TRAY_GAP = 78, TRAY_Y = 116, TRAY_MAX = 5;
export const WAITING = ['arriving', 'queue', 'order', 'waitFood', 'pay'];

export const pennySpeed = save => 210 + 55 * save.up.shoes;
export const cookMul = save => [1, 0.8, 0.65, 0.5][save.up.chef];
export const capacity = save => 1 + save.up.tray;
export const decorDrain = save => [1, 0.82, 0.68][save.up.decor];
export const goalFor = day => 50 + (day - 1) * 45;
export const menuFor = day => DISHES.filter(d => d.day <= day);
export const dish = id => DISHES.find(d => d.id === id);
