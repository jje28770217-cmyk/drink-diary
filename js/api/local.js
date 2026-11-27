/* api/local.js - 브라우저 localStorage 저장 어댑터 (서버·네트워크 없음) */
(function (root) {
  'use strict';
  const KEY = 'drinkBalance.v1';
  const adapter = {
    name: 'local',
    async load() { try { return JSON.parse(root.localStorage.getItem(KEY)); } catch (e) { return null; } },
    async save(state) { root.localStorage.setItem(KEY, JSON.stringify(state)); }
  };
  (root.DB = root.DB || {}).localAdapter = adapter;
})(typeof window !== 'undefined' ? window : globalThis);
