/* core/draft.js - "마신 양 선택" 한 번의 입력 세션(초안). 단위·분량·도수·용량 선택과 검증, 저장까지 담당
   화면은 draft 의 값을 읽어 그리기만 하고, 계산과 저장 규칙은 여기서만 정의합니다. */
(function (root) {
  'use strict';
  const dep = n => (typeof module !== 'undefined' && module.exports) ? require('./' + n) : root.DB[n];

  function createDraft(store, pid, opt) {
    const calc = dep('calc');
    opt = opt || {};
    const p = store.getProduct(pid);
    if (!p) return null;
    const d = { pid, product: p, date: opt.date || calc.todayS(), unitSel: 0, qty: 1, customMode: false, saveDef: true, editId: null, unitMl: null, abv: undefined };

    const curUnit = () => d.unitSel === 'ml' ? { t: 'ml', ml: 1 } : p.units[d.unitSel];
    const refMl = () => { const u = p.units.find(x => store.effMl(p, x)); return u ? store.effMl(p, u) : 360; };

    function setUnit(i) {
      d.unitSel = i;
      if (i === 'ml') { d.unitMl = 1; d.qty = d.qty > 10 ? d.qty : 100; d.customMode = true; return; }
      d.unitMl = store.effMl(p, p.units[i]);
      if (d.customMode === true && d.qty > 10) d.qty = 1; // mL 값이 병 수로 넘어가지 않도록
      d.customMode = !calc.isPreset(d.qty);
    }
    function preset(f) { d.qty = f; d.customMode = false; }
    function customQty(q) { d.customMode = true; if (q != null && q > 0) d.qty = q; }
    /** + / − : mL 는 50씩, 병·캔·잔은 1씩(1 → 2 → 3). 분수·소수는 "직접 입력"에서만. 1 아래로는 줄이지 않음 */
    function step(delta) {
      if (curUnit().t === 'ml') { d.qty = Math.max(10, Math.round((d.qty + delta) * 100) / 100); d.customMode = true; return; }
      const q = d.qty;
      if (delta > 0) d.qty = Math.floor(q + 1e-9) + 1;
      else if (q > 1 + 1e-9) d.qty = Math.max(1, Math.ceil(q - 1e-9) - 1);
      d.customMode = !calc.isPreset(d.qty);
    }
    const setAbv = v => { d.abv = (v === '' || v == null || isNaN(v)) ? null : +v; };
    const setUnitMl = v => { d.unitMl = +v || 0; };

    /** 현재 선택의 계산 결과 */
    function numbers() {
      const u = curUnit(), unitMl = u.t === 'ml' ? 1 : (+d.unitMl || 0), totalMl = d.qty * unitMl;
      const abv = d.abv == null || d.abv === '' ? null : +d.abv;
      return { unit: u, unitMl, totalMl, abv, g: abv != null && unitMl ? calc.gramOf(totalMl, abv) : null, fill: u.t === 'ml' ? Math.min(1, totalMl / refMl()) : null };
    }
    /** 저장 전 검증: 문제가 있으면 { field, message } */
    function validate() {
      const n = numbers();
      if (n.abv == null || isNaN(n.abv) || n.abv < 0 || n.abv > 100) return { field: 'abv', message: '도수(%)를 입력해 주세요' };
      if (!n.unitMl) return { field: 'ml', message: '용량(mL)을 입력해 주세요' };
      if (!(d.qty > 0)) return { field: 'qty', message: '마신 양을 입력해 주세요' };
      return null;
    }
    /** 저장될 기록(스냅샷: 나중에 제품 도수를 바꿔도 과거 기록은 그대로) */
    function toEntry() {
      const n = numbers(), t = n.unit.t, ml = d.qty * n.unitMl;
      return { id: d.editId || 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), pid: p.id, name: p.name, cat: p.cat,
        icon: store.imageId(p, t === 'ml' ? p.units[0].t : t), t, qty: d.qty, unitMl: n.unitMl, abv: n.abv, ml, g: calc.gramOf(ml, n.abv) };
    }
    /** 검증 → 저장. 성공하면 저장된 기록, 실패하면 { error } */
    function commit() {
      const err = validate(); if (err) return { error: err };
      const n = numbers(), e = toEntry();
      store.saveEntry(d.date, e);
      if (d.saveDef || p.custom) store.saveOverride(p, n.unit, n.abv, n.unitMl);
      store.touchRecent(p.id);
      return { entry: e };
    }

    // 초기값
    if (opt.entry) { // 수정 모드
      const e = opt.entry; d.editId = e.id;
      if (e.t === 'ml') d.unitSel = 'ml'; else { const i = p.units.findIndex(u => u.t === e.t); d.unitSel = i < 0 ? 0 : i; }
      d.qty = e.qty; d.unitMl = e.unitMl; d.abv = e.abv; d.customMode = !calc.isPreset(e.qty);
    } else setUnit(0);
    if (d.abv === undefined) d.abv = store.effAbv(p);

    return Object.assign(d, { curUnit, refMl, setUnit, preset, customQty, step, setAbv, setUnitMl, numbers, validate, toEntry, commit });
  }

  const api = { createDraft };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).draft = api;
})(typeof window !== 'undefined' ? window : globalThis);
