/* api/remote.js - 로컬 백엔드(server/server.js) REST 저장 어댑터
   GET  {base}/health  → { ok: true }
   GET  {base}/state   → 저장된 전체 데이터(없으면 204)
   PUT  {base}/state   → 전체 데이터 저장 */
(function (root) {
  'use strict';
  function createRemoteAdapter(base) {
    const json = async (r) => { if (!r.ok && r.status !== 204) throw new Error('서버 오류 ' + r.status); return r.status === 204 ? null : r.json(); };
    return {
      name: 'remote',
      async health() { try { const r = await fetch(base + '/health', { cache: 'no-store' }); return r.ok && (await r.json()).ok === true; } catch (e) { return false; } },
      async load() { return json(await fetch(base + '/state', { cache: 'no-store' })); },
      async save(state) { const r = await fetch(base + '/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }); if (!r.ok) throw new Error('저장 실패 ' + r.status); }
    };
  }
  (root.DB = root.DB || {}).createRemoteAdapter = createRemoteAdapter;
})(typeof window !== 'undefined' ? window : globalThis);
