import { schedulePush } from './cloud.js';

const SAVE_KEY = 'penny-diner-save-v1';

export function freshSave() {
  return {
    day: 1,
    wallet: 0,
    up: { shoes: 0, chef: 0, tray: 0, decor: 0 },
    potions: { speed: 1, cook: 1, joy: 1 }, // tặng mỗi loại 1 lọ lúc bắt đầu
    updatedAt: 0, // lần lưu gần nhất (ms), để biết bản nào mới hơn khi đồng bộ
  };
}

/** Chuẩn hoá một bản lưu (từ máy hoặc từ Firestore); trả về null nếu không hợp lệ. */
export function parseSave(s) {
  if (!s || !s.up || !s.day) return null;
  const base = freshSave();
  const save = {
    ...base, ...s,
    up: { ...base.up, ...s.up },
    potions: { ...base.potions, ...(s.potions || {}) },
  };
  // Bản cũ có nâng cấp "Thêm bàn" (nay bàn tăng theo ngày): hoàn lại tiền đã mua
  if (save.up.tables) {
    save.wallet += [0, 100, 300][save.up.tables] || 0;
  }
  delete save.up.tables;
  return save;
}

export function loadSave() {
  try {
    const save = parseSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (save) return save;
  } catch (e) { /* bỏ qua */ }
  return freshSave();
}

/** Ghi vào máy; `sync` = false khi bản lưu vừa được tải từ Firestore về. */
export function writeSave(save, sync = true) {
  if (sync) save.updatedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
  if (sync) schedulePush(save);
}
