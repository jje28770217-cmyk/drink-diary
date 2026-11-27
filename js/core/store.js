/* core/store.js - 앱 상태와 모든 데이터 변경(기록 추가·수정·삭제, 설정, 즐겨찾기 등)
   화면 코드는 이 모듈의 메서드만 호출합니다. 저장은 adapter(api/*)가 담당합니다. */
(function (root) {
  'use strict';
  const dep = n => (typeof module !== 'undefined' && module.exports) ? require('./' + n) : root.DB[n];

  const ICON_BASE = { 'johnnie-walker-red': 'johnnie-walker' };

  function blank() { return { v: 1, days: {}, fav: [], recent: [], overrides: {}, custom: [], profile: { sex: 'unset', age: '', pregnant: false } }; }
  function normalize(s) {
    const b = blank();
    if (!s || typeof s !== 'object' || typeof s.days !== 'object') return b;
    return Object.assign(b, s, { profile: Object.assign(b.profile, s.profile || {}) });
  }

  /**
   * @param {{adapter:{load:Function,save:Function}, products:Array, guide:Object, onSaveError?:Function}} o
   */
  function createStore(o) {
    const calc = dep('calc');
    const { adapter, products, guide } = o;
    let state = blank(), saveTimer = null, saving = Promise.resolve();

    /* ---------- 저장 ---------- */
    async function load() { state = normalize(await adapter.load()); return state; }
    function persist() { // 변경이 잦아도 한 번에 저장
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 150);
    }
    function flush() {
      clearTimeout(saveTimer);
      saving = saving.then(() => adapter.save(state)).catch(e => { if (o.onSaveError) o.onSaveError(e); });
      return saving;
    }
    const raw = () => state;

    /* ---------- 제품 ---------- */
    function allProducts() {
      return products.concat(state.custom.map(c => ({ id: c.id, name: c.name, cat: 'custom', sub: '', units: c.units, abv: c.abv, st: 'none', src: '', note: '내가 직접 추가한 제품입니다.', custom: true })));
    }
    const getProduct = id => allProducts().find(p => p.id === id);
    function effAbv(p) { const ov = state.overrides[p.id]; return ov && ov.abv != null ? ov.abv : p.abv; }
    function effMl(p, u) { const ov = state.overrides[p.id]; const v = ov && ov.ml && ov.ml[calc.ukey(u)]; return v != null ? v : u.ml; }
    /** 제품·단위에 해당하는 이미지 id (images/manifest.js 의 키와 같음) */
    function imageId(p, t) {
      const id = ICON_BASE[p.id] || p.id;
      if (p.custom) return t === 'can' ? 'custom-can' : t === 'glass' ? 'custom-glass' : 'custom-bottle';
      if (p.cat === 'beer') return t === 'bottle' ? id + '-bottle' : t === 'glass' ? id + '-glass' : id;
      if (p.cat === 'highball') return t === 'can' ? id + '-can' : t === 'glass' ? 'highball' : id;
      if (p.cat === 'wine' || p.cat === 'whisky') return t === 'glass' ? id + '-glass' : id;
      if (p.cat === 'makgeolli') return t === 'glass' ? 'makgeolli-bowl' : id;
      if (p.id === 'sake') return t === 'glass' ? 'sake-cup' : 'sake';
      if (p.id === 'cocktail') return 'cocktail';
      if (t === 'glass') return 'shot';
      return id;
    }
    const thumbId = p => imageId(p, p.units[0] ? p.units[0].t : 'bottle');

    /* ---------- 조회 ---------- */
    const dayOf = s => state.days[s];
    const entriesOf = s => (state.days[s] && state.days[s].entries) || [];
    const gOf = s => calc.sumG(entriesOf(s));
    const weekSum = s => calc.weekSum(entriesOf, s);
    const streak = s => calc.streak(entriesOf, s);
    const isRecorded = s => entriesOf(s).length > 0 || !!(state.days[s] && state.days[s].sober);
    /** 하루 위험도 분석 (공식 지침 기반 참고 정보) */
    function analyze(s) {
      const day = state.days[s] || {};
      return guide.analyzeDay({ date: s, g: gOf(s), weekG: weekSum(s), streak: streak(s), symptoms: day.cond || [], profile: state.profile, entries: entriesOf(s), gOf, addDays: calc.addDays });
    }

    /** 캘린더 표시용 날짜 상태: 'warn'(경고) | 'ok'(기록 있음·경고 없음) | 'sober'(금주 기록) | 'none'(미기록) */
    function dayStatus(s) {
      if (entriesOf(s).length) return analyze(s).level === 'warn' ? 'warn' : 'ok';
      return state.days[s] && state.days[s].sober ? 'sober' : 'none';
    }

    /* ---------- 기록 변경 ---------- */
    function ensureDay(s) { return state.days[s] || (state.days[s] = { entries: [] }); }
    function cleanDay(s) { const d = state.days[s]; if (d && !d.entries.length && !d.sober && !d.memo && !(d.cond || []).length && !d.start && !d.end) delete state.days[s]; }
    /** 기록 추가(또는 같은 id가 있으면 수정). 음주 기록이 생기면 금주 표시는 해제 */
    function saveEntry(date, e) {
      const d = ensureDay(date); d.sober = false;
      const i = d.entries.findIndex(x => x.id === e.id);
      if (i >= 0) d.entries[i] = e; else d.entries.push(e);
      persist(); return e;
    }
    function deleteEntry(date, id) { const d = state.days[date]; if (!d) return false; d.entries = d.entries.filter(x => x.id !== id); cleanDay(date); persist(); return true; }
    function toggleSober(date) { const d = ensureDay(date); d.sober = !d.sober; cleanDay(date); persist(); return !!(state.days[date] && state.days[date].sober); }
    function setDayField(date, field, value) { ensureDay(date)[field] = value; persist(); }
    function toggleSymptom(date, k) { const d = ensureDay(date); d.cond = d.cond || []; const i = d.cond.indexOf(k); if (i >= 0) d.cond.splice(i, 1); else d.cond.push(k); cleanDay(date); persist(); }

    /* ---------- 제품 관련 설정 ---------- */
    function toggleFav(id) { const i = state.fav.indexOf(id); if (i >= 0) state.fav.splice(i, 1); else state.fav.unshift(id); persist(); }
    function touchRecent(id) { state.recent = [id].concat(state.recent.filter(x => x !== id)).slice(0, 12); persist(); }
    /** 사용자가 고친 도수·용량을 제품 기본값으로 저장 (과거 기록에는 영향 없음) */
    function saveOverride(p, unit, abv, unitMl) {
      if (p.custom) {
        const c = state.custom.find(x => x.id === p.id); if (!c) return;
        c.abv = abv; if (unit.t !== 'ml') { const cu = c.units.find(x => x.t === unit.t); if (cu) cu.ml = unitMl; }
      } else {
        const ov = state.overrides[p.id] || (state.overrides[p.id] = {});
        if (abv !== p.abv) ov.abv = abv;
        if (unit.t !== 'ml' && unitMl !== unit.ml) { ov.ml = ov.ml || {}; ov.ml[calc.ukey(unit)] = unitMl; }
      }
      persist();
    }
    function addCustom({ name, cat, abv, unit, ml }) {
      const id = 'c' + Date.now().toString(36); state.custom.push({ id, name, cat, abv, units: [{ t: unit, ml }] }); persist(); return id;
    }
    function deleteCustom(id) { state.custom = state.custom.filter(c => c.id !== id); persist(); }
    function resetOverrides() { state.overrides = {}; persist(); }
    function setProfile(patch) { Object.assign(state.profile, patch); persist(); }

    /* ---------- 데이터 관리 ---------- */
    const exportJSON = () => JSON.stringify(state);
    function importData(obj) { if (!obj || typeof obj.days !== 'object') throw new Error('올바른 백업 파일이 아닙니다'); state = normalize(obj); persist(); }
    function wipe() { state = blank(); persist(); }

    return { load, flush, raw, allProducts, getProduct, effAbv, effMl, imageId, thumbId, dayOf, entriesOf, gOf, weekSum, streak, isRecorded, analyze, dayStatus,
      saveEntry, deleteEntry, toggleSober, setDayField, toggleSymptom, toggleFav, touchRecent, saveOverride, addCustom, deleteCustom, resetOverrides, setProfile, exportJSON, importData, wipe,
      get profile() { return state.profile; }, get fav() { return state.fav; }, get recent() { return state.recent; }, get custom() { return state.custom; } };
  }

  const api = { createStore, blank, normalize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).store = api;
})(typeof window !== 'undefined' ? window : globalThis);
