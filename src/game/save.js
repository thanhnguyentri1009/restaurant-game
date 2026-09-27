const SAVE_KEY = 'penny-diner-save-v1';

export function freshSave() {
  return {
    day: 1,
    wallet: 0,
    up: { shoes: 0, chef: 0, tray: 0, decor: 0 },
    potions: { speed: 1, cook: 1, joy: 1 }, // tặng mỗi loại 1 lọ lúc bắt đầu
  };
}

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.up && s.day) {
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
  } catch (e) { /* bỏ qua */ }
  return freshSave();
}

export function writeSave(save) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
}
