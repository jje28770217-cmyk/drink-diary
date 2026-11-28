/* api/photos.js - 기록 사진 저장 (이 브라우저의 IndexedDB). 기록 데이터에는 사진 id 만 들어가고, 사진 파일은 여기에 따로 저장합니다.
   put(blob) → id / url(id) → 화면용 주소(없으면 null) / remove(id) / clear()
   사진은 올릴 때 긴 변 1280px 이하 JPEG 으로 줄여 저장합니다. 개수 제한은 없습니다.
   ※ 로그인·클라우드(Supabase) 단계에서는 같은 메서드를 가진 클라우드 저장소로 바꿉니다. */
(function (root) {
  'use strict';
  const NAME = 'drinkBalancePhotos', STORE = 'photos', urls = new Map();
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (!root.indexedDB) return rej(new Error('이 브라우저는 사진 저장을 지원하지 않습니다'));
    const r = root.indexedDB.open(NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => { dbp = null; rej(r.error); };
  }));
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), rq = fn(t.objectStore(STORE));
      t.oncomplete = () => res(rq && rq.result); t.onerror = t.onabort = () => rej(t.error);
    });
  }
  /** 사진 파일을 긴 변 max 픽셀 이하의 JPEG Blob 으로 줄임 (휴대폰 촬영 방향 반영, 투명 배경은 흰색) */
  async function shrink(file, max) {
    max = max || 1280;
    const bmp = await root.createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const c = root.document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(bmp, 0, 0, w, h);
    if (bmp.close) bmp.close();
    return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('사진 변환 실패')), 'image/jpeg', 0.82));
  }
  async function put(blob) {
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await tx('readwrite', s => s.put({ blob, at: Date.now() }, id)); return id;
  }
  async function url(id) {
    if (urls.has(id)) return urls.get(id);
    const rec = await tx('readonly', s => s.get(id)); if (!rec) return null;
    const u = root.URL.createObjectURL(rec.blob); urls.set(id, u); return u;
  }
  async function remove(id) { await tx('readwrite', s => s.delete(id)); if (urls.has(id)) { root.URL.revokeObjectURL(urls.get(id)); urls.delete(id); } }
  async function clear() { await tx('readwrite', s => s.clear()); urls.forEach(u => root.URL.revokeObjectURL(u)); urls.clear(); }
  (root.DB = root.DB || {}).photos = { shrink, put, url, remove, clear };
})(typeof window !== 'undefined' ? window : globalThis);
