// Lưu tiến trình lên Firestore theo username (không cần đăng nhập).
// Mỗi username là một collection, tiến trình nằm ở document {username}/progress.
// Username do admin tạo tay trong Firebase Console, game không tự tạo username mới.
// Username đã nhập được nhớ trong localStorage. Không cấu hình VITE_FIREBASE_* thì chỉ lưu trên máy.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const DOC = 'progress';
const CODE_KEY = 'penny-sync-code';

export const cloudEnabled = !!(config.apiKey && config.projectId);

// Chỉ tải thư viện Firebase khi thật sự cần, để game mở nhanh
let fb = null;
function firestore() {
  fb = fb || Promise.all([import('firebase/app'), import('firebase/firestore')])
    .then(([app, f]) => ({ f, db: f.getFirestore(app.initializeApp(config)) }));
  return fb;
}

/** Username hợp lệ: chữ, số, "-" và "_", tối đa 32 ký tự (phân biệt hoa thường như Firestore). */
export const normalizeCode = s => s.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);

export function getCode() {
  try { return localStorage.getItem(CODE_KEY) || ''; } catch (e) { return ''; }
}
export function setCode(code) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch (e) { /* bỏ qua */ }
  status.code = code;
  emit({ state: code ? 'idle' : 'off' });
}

// Trạng thái đồng bộ để hiển thị: off | idle | loading | saving | saved | error
const status = { code: getCode(), state: getCode() ? 'idle' : 'off', at: 0 };
const listeners = new Set();
function emit(patch) {
  Object.assign(status, patch);
  listeners.forEach(fn => fn({ ...status }));
}
export function onStatus(fn) {
  listeners.add(fn);
  fn({ ...status });
  return () => listeners.delete(fn);
}

// Firestore tự thử lại mãi khi mất mạng, nên đặt giới hạn thời gian chờ
const withTimeout = (promise, ms = 8000) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
]);

/** Đọc {username}/progress: `exists` = username đã được tạo, `save` = tiến trình (null nếu chưa chơi). */
export async function pullSave(code) {
  emit({ state: 'loading' });
  try {
    const { f, db } = await firestore();
    const snap = await withTimeout(f.getDoc(f.doc(db, code, DOC)));
    emit({ state: 'idle' });
    return { exists: snap.exists(), save: snap.exists() ? snap.data().save || null : null };
  } catch (e) {
    emit({ state: 'error' });
    throw e;
  }
}

export async function pushSave(code, save) {
  emit({ state: 'saving' });
  try {
    const { f, db } = await firestore();
    await withTimeout(f.setDoc(f.doc(db, code, DOC), { save, updatedAt: f.serverTimestamp() }));
    emit({ state: 'saved', at: Date.now() });
  } catch (e) {
    emit({ state: 'error' });
  }
}

// Gom nhiều lần lưu liên tiếp (mua đồ liên tục) thành một lần ghi
let timer = 0;
export function schedulePush(save) {
  const code = status.code;
  if (!cloudEnabled || !code) return;
  clearTimeout(timer);
  const copy = JSON.parse(JSON.stringify(save));
  timer = setTimeout(() => pushSave(code, copy), 1200);
}
