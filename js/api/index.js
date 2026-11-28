/* api/index.js - 설정(config.js)에 따라 저장 어댑터를 고르고, 처음 서버를 쓸 때는 기존 브라우저 기록을 서버로 옮겨 줌 */
(function (root) {
  'use strict';
  const DB = root.DB;
  const hasData = s => s && typeof s.days === 'object' && (Object.keys(s.days).length || (s.custom || []).length || Object.keys(s.overrides || {}).length);

  /** 로컬 서버/브라우저 저장 중 고르기 (클라우드 이전 단계) */
  async function chooseBase() {
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
  const BACKUP_KEY = 'drinkBalance.beforeCloud';
  /** 로그인 상태면 클라우드 저장을 씀. 클라우드가 비어 있으면 이 기기 기록을 옮기고, 둘 다 있으면 클라우드를 쓰되 이 기기 기록은 따로 보관(덮어쓰지 않음)
   * @returns {Promise<{adapter:Object, mode:'local'|'remote'|'cloud', note:string, migrated?:boolean}>} */
  async function chooseAdapter(cloud) {
    const base = await chooseBase();
    if (!(cloud && cloud.configured && cloud.loggedIn)) return base;
    try {
      const cs = await cloud.loadState(), bs = await base.adapter.load().catch(() => null);
      if (!hasData(cs)) {
        if (hasData(bs)) { await cloud.saveState(bs); return { adapter: cloud.adapter, mode: 'cloud', note: '이 기기의 기록을 내 계정으로 옮겼어요', migrated: true }; }
        return { adapter: cloud.adapter, mode: 'cloud', note: '' };
      }
      let note = '';
      if (hasData(bs) && JSON.stringify(bs) !== JSON.stringify(cs)) {
        try {
          const prev = root.localStorage.getItem(BACKUP_KEY), cur = JSON.stringify(bs);
          if (prev !== cur) { root.localStorage.setItem(BACKUP_KEY, cur); note = '이 기기에 있던 다른 기록은 지우지 않고 따로 보관했어요 (설정에서 내려받기)'; }
        } catch (e) { /* 보관 불가 환경 */ }
      }
      return { adapter: cloud.adapter, mode: 'cloud', note };
    } catch (e) {
      return Object.assign({}, base, { note: '계정에 연결하지 못해 이 기기에만 저장합니다. 이때 기록은 계정에 반영되지 않아요 (' + (e && e.message ? e.message : e) + ')' });
    }
  }
  DB.api = { chooseAdapter, BACKUP_KEY };
})(typeof window !== 'undefined' ? window : globalThis);
