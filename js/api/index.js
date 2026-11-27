/* api/index.js - 설정(config.js)에 따라 저장 어댑터를 고르고, 처음 서버를 쓸 때는 기존 브라우저 기록을 서버로 옮겨 줌 */
(function (root) {
  'use strict';
  const DB = root.DB;
  const hasData = s => s && typeof s.days === 'object' && (Object.keys(s.days).length || (s.custom || []).length || Object.keys(s.overrides || {}).length);

  /** @returns {Promise<{adapter:Object, mode:'local'|'remote', note:string}>} */
  async function chooseAdapter() {
    const cfg = DB.config, local = DB.localAdapter;
    if (cfg.storage === 'local') return { adapter: local, mode: 'local', note: '' };
    const wantRemote = cfg.storage === 'remote' || (cfg.storage === 'auto' && /^https?:$/.test(root.location.protocol));
    if (!wantRemote) return { adapter: local, mode: 'local', note: '' };
    const remote = DB.createRemoteAdapter(cfg.apiBase);
    if (!(await remote.health())) {
      return { adapter: local, mode: 'local', note: cfg.storage === 'remote' ? '서버에 연결할 수 없어 이 브라우저에 저장합니다' : '' };
    }
    // 서버가 비어 있고 브라우저에 기록이 있으면 한 번만 옮김
    try {
      const rs = await remote.load();
      if (!hasData(rs)) { const ls = await local.load(); if (hasData(ls)) { await remote.save(ls); return { adapter: remote, mode: 'remote', note: '브라우저에 있던 기록을 서버로 옮겼습니다' }; } }
    } catch (e) { return { adapter: local, mode: 'local', note: '서버 연결에 문제가 있어 이 브라우저에 저장합니다' }; }
    return { adapter: remote, mode: 'remote', note: '' };
  }
  DB.api = { chooseAdapter };
})(typeof window !== 'undefined' ? window : globalThis);
