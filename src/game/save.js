const SAVE_KEY = 'penny-diner-save-v1';

export function freshSave() {
  return { day: 1, wallet: 0, up: { shoes: 0, tables: 0, chef: 0, tray: 0, decor: 0 } };
}

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.up && s.day) return { ...freshSave(), ...s, up: { ...freshSave().up, ...s.up } };
  } catch (e) { /* bỏ qua */ }
  return freshSave();
}

export function writeSave(save) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
}
