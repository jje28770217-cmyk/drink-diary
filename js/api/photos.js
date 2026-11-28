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
  let cloud = null;   // 로그인 상태의 클라우드 클라이언트(없으면 이 기기에만 저장)
  const setCloud = c => { cloud = c && c.configured && c.loggedIn ? c : null; };
  async function put(blob) {
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await tx('readwrite', s => s.put({ blob, at: Date.now() }, id));
    if (cloud) cloud.uploadPhoto(id, blob).catch(() => { });   // 업로드 실패해도 이 기기에는 저장됨
    return id;
  }
  /** 이 기기에 있는 사진을 클라우드로 올림(이미 있으면 덮어씀). 올린 개수를 돌려줌 */
  async function uploadLocal(ids) {
    let n = 0; if (!cloud) return 0;
    for (const id of ids) { try { const rec = await tx('readonly', s => s.get(id)); if (rec) { await cloud.uploadPhoto(id, rec.blob); n++; } } catch (e) { /* 다음 접속 때 다시 */ } }
    return n;
  }
  async function url(id) {
    if (urls.has(id)) return urls.get(id);
    let rec = await tx('readonly', s => s.get(id));
    if (!rec && cloud) {   // 다른 기기에서 올린 내 사진: 클라우드에서 받아 이 기기에도 보관
      try { const b = await cloud.downloadPhoto(cloud.session.user.id, id); if (b) { rec = { blob: b, at: Date.now() }; await tx('readwrite', s => s.put(rec, id)); } } catch (e) { /* 오프라인 */ }
    }
    if (!rec) return null;
    const u = root.URL.createObjectURL(rec.blob); urls.set(id, u); return u;
  }
  /** 친구의 사진(읽기 전용, 이 기기에는 저장하지 않음) */
  async function friendUrl(ownerId, id) {
    const k = ownerId + '/' + id; if (urls.has(k)) return urls.get(k);
    if (!cloud) return null;
    const b = await cloud.downloadPhoto(ownerId, id); if (!b) return null;
    const u = root.URL.createObjectURL(b); urls.set(k, u); return u;
  }
  async function remove(id) { if (cloud) cloud.deletePhoto(id).catch(() => { }); await tx('readwrite', s => s.delete(id)); if (urls.has(id)) { root.URL.revokeObjectURL(urls.get(id)); urls.delete(id); } }
  async function clear() { await tx('readwrite', s => s.clear()); urls.forEach(u => root.URL.revokeObjectURL(u)); urls.clear(); }
  (root.DB = root.DB || {}).photos = { shrink, put, url, friendUrl, remove, clear, setCloud, uploadLocal };
})(typeof window !== 'undefined' ? window : globalThis);
