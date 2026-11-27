/* ui/app.js - 화면 상태와 이벤트 연결(컨트롤러). 데이터 변경은 모두 core/store, core/draft 의 메서드를 호출합니다.
   부팅: 저장소 선택(api/) → 불러오기 → 화면 그리기 */
(function (root) {
  'use strict';
  const DB = root.DB, calc = DB.calc, stats = DB.stats, doc = root.document;
  const $ = s => doc.querySelector(s);

  const S = { tab: 'cal', month: calc.todayS().slice(0, 7), recDate: calc.todayS(), sel: calc.todayS(), cat: 'all', q: '', statP: 'month', statOff: 0, cc: { cat: 'etc', unit: 'bottle' } };
  let store = null, views = null, draft = null, storageInfo = { mode: 'local', note: '' };

  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2400); }

  /* ---------- 그리기 ---------- */
  function render() {
    $('#nav').innerHTML = views.nav();
    const v = { cal: views.cal, rec: views.rec, stats: views.stats, report: views.report, set: views.settings }[S.tab];
    $('#app').innerHTML = v();
    if (S.tab === 'rec' && S.keepFocus) { const i = $('#q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } S.keepFocus = false; }
  }
  const renderAmount = () => { $('#amount').innerHTML = views.amount(draft); };
  function updateLive() { const l = views.amountLive(draft), v = $('#val'), h = $('#heroPic'), b = $('#saveBtn'); if (v) v.innerHTML = l.val; if (h) h.innerHTML = l.hero; if (b) b.textContent = l.btn; }
  function openAmount(pid, opt) {
    opt = opt || {};
    const d = DB.draft.createDraft(store, pid, { date: opt.date || S.recDate, entry: opt.entry });
    if (!d) return; draft = d; renderAmount(); $('#amount').hidden = false; $('#amount').scrollTop = 0;
  }
  const closeAmount = () => { draft = null; $('#amount').hidden = true; };
  function openSheet(html) { $('#sheet').innerHTML = html; $('#sheetWrap').hidden = false; $('#sheet').scrollTop = 0; }
  const closeSheet = () => { $('#sheetWrap').hidden = true; };
  function openDay(s) { openSheet(views.day(s)); $('#sheet').dataset.date = s; }
  function openWarn(s, fresh) { if (!store.analyze(s).reasons.length) return openDay(s); openSheet(views.warn(s, fresh)); }

  function saveEntry() {
    const r = draft.commit();
    if (r.error) { toast(r.error.message); const el = $(r.error.field === 'abv' ? '#abvIn' : r.error.field === 'ml' ? '#mlIn' : '#qtyIn'); if (el) el.focus(); return; }
    const date = draft.date; closeAmount(); S.recDate = date; S.sel = date; S.month = date.slice(0, 7); render();
    if (store.analyze(date).level === 'warn') openWarn(date, true);
    else toast(`${calc.niceDate(date)} 기록 저장 · 총 ${calc.r1(store.gOf(date))}g`);
  }

  /* ---------- 이벤트 ---------- */
  doc.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, v = el.dataset.v;
    if (act === 'warn' || act === 'fav') ev.stopPropagation();
    switch (act) {
      case 'tab': S.tab = v; render(); root.scrollTo(0, 0); break;
      case 'mon': { const [y, m] = S.month.split('-').map(Number); const d = new Date(y, m - 1 + (+v), 1); S.month = d.getFullYear() + '-' + calc.pad(d.getMonth() + 1); render(); break; }
      case 'monToday': S.month = calc.todayS().slice(0, 7); render(); break;
      case 'day': S.sel = v; render(); break;            // 캘린더: 날짜를 고르면 아래 카드에 상세가 보임
      case 'daySheet': openDay(v); break;                // 시간·증상·메모가 있는 상세 시트
      case 'warn': openWarn(v); break;
      case 'closeSheet': closeSheet(); break;
      case 'addTo': S.recDate = v; S.tab = 'rec'; closeSheet(); render(); root.scrollTo(0, 0); break;
      case 'cat': S.cat = v; S.q = ''; render(); break;
      case 'fav': store.toggleFav(v); render(); break;
      case 'pick': openAmount(v); break;
      case 'pickDate': { const i = $('#dateIn'); if (i.showPicker) i.showPicker(); else i.click(); break; }
      case 'closeAmount': closeAmount(); break;
      case 'unit': draft.setUnit(v === 'ml' ? 'ml' : +v); renderAmount(); break;
      case 'qty': draft.preset(+v); renderAmount(); break;
      case 'custom': draft.customQty(); renderAmount(); { const q = $('#qtyIn'); if (q) q.focus(); } break;
      case 'step': draft.step(+v); renderAmount(); break;
      case 'saveEntry': saveEntry(); break;
      case 'sober': { const on = store.toggleSober(v); S.sel = v; closeSheet(); render(); toast(on ? '금주일로 기록했어요' : '금주 기록을 취소했어요'); break; }
      case 'editEntry': { const [s, id] = v.split('|'); const e = store.entriesOf(s).find(x => x.id === id); if (!e) break; closeSheet(); if (!store.getProduct(e.pid)) { toast('삭제된 제품이라 수정할 수 없어요'); break; } openAmount(e.pid, { date: s, entry: e }); break; }
      case 'delEntry': { const [s, id] = v.split('|'); if (!root.confirm('이 기록을 삭제할까요?')) break; store.deleteEntry(s, id); render(); if (!$('#sheetWrap').hidden) openDay(s); break; }
      case 'sym': { const [s, k] = v.split('|'); store.toggleSymptom(s, k); render(); openDay(s); break; }
      case 'addCustom': S.cc = { cat: 'etc', unit: 'bottle' }; openSheet(views.custom()); break;
      case 'cCat': S.cc.cat = v; el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); break;
      case 'cUnit': S.cc.unit = v; el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); break;
      case 'saveCustom': {
        const name = $('#cName').value.trim(), ml = parseFloat($('#cMl').value), abv = parseFloat($('#cAbv').value);
        if (!name) return toast('제품명을 입력해 주세요'); if (!(ml > 0)) return toast('용량(mL)을 입력해 주세요'); if (!(abv >= 0 && abv <= 100)) return toast('도수(%)를 입력해 주세요');
        const id = store.addCustom({ name, cat: S.cc.cat, abv, unit: S.cc.unit, ml }); closeSheet(); render(); openAmount(id); break; }
      case 'statP': S.statP = v; S.statOff = 0; render(); break;
      case 'statOff': if (+v > 0 && S.statOff >= 0) break; S.statOff += +v; render(); break;
      case 'sex': store.setProfile({ sex: v }); render(); break;
      case 'resetOv': if (root.confirm('수정한 제품 값을 모두 기본값으로 되돌릴까요?')) { store.resetOverrides(); toast('초기화했어요'); } break;
      case 'delCustom': if (root.confirm('이 제품을 삭제할까요? (과거 기록은 유지됩니다)')) { store.deleteCustom(v); render(); } break;
      case 'export': { const b = new Blob([store.exportJSON()], { type: 'application/json' }), a = doc.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'drink-balance-backup-' + calc.todayS() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); break; }
      case 'wipe': if (root.confirm('모든 기록을 삭제할까요? 되돌릴 수 없습니다.') && root.confirm('정말 전체 삭제할까요?')) { store.wipe(); render(); toast('전체 삭제했어요'); } break;
    }
  });
  doc.addEventListener('keydown', ev => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.pcard,[data-act="day"]') && ev.target.tagName !== 'BUTTON') { ev.preventDefault(); ev.target.click(); }
    if (ev.key === 'Escape') { if (!$('#sheetWrap').hidden) closeSheet(); else if (draft) closeAmount(); }
  });
  const num = s => parseFloat(String(s).replace(',', '.'));
  doc.addEventListener('input', ev => {
    const t = ev.target;
    if (t.id === 'q') { S.q = t.value; S.keepFocus = true; render(); }
    else if (t.id === 'abvIn') { draft.setAbv(t.value === '' ? null : num(t.value)); t.classList.toggle('need', draft.abv == null); updateLive(); }
    else if (t.id === 'mlIn') { draft.setUnitMl(num(t.value)); t.classList.toggle('need', !draft.unitMl); updateLive(); }
    else if (t.id === 'qtyIn') { const q = num(t.value); if (q > 0) { draft.customQty(q); updateLive(); } }
    else if (t.id === 'saveDef') draft.saveDef = t.checked;
    else if (t.id === 'ageIn') store.setProfile({ age: t.value });
    else if (t.id === 'pregIn') store.setProfile({ pregnant: t.checked });
    else if (t.dataset.f) store.setDayField($('#sheet').dataset.date, t.dataset.f, t.value);
  });
  doc.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'dateIn' && t.value) { S.recDate = t.value; render(); }
    if (t.id === 'importIn' && t.files[0]) {
      const rd = new FileReader();
      rd.onload = () => { try { const o = JSON.parse(rd.result); if (!root.confirm('현재 기록을 백업 파일 내용으로 바꿀까요?')) return; store.importData(o); render(); toast('가져왔어요'); } catch (e) { toast('올바른 백업 파일이 아니에요'); } };
      rd.readAsText(t.files[0]);
    }
  });
  // 탭을 닫거나 숨길 때 저장이 끝나도록
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'hidden' && store) store.flush(); });
  root.addEventListener('pagehide', () => { if (store) store.flush(); });

  /* ---------- 부팅 ---------- */
  async function boot() {
    $('#app').innerHTML = '<div class="empty">불러오는 중…</div>';
    const make = a => DB.store.createStore({ adapter: a, products: DB.data.PRODUCTS, guide: DB.guide, onSaveError: e => toast('저장하지 못했어요: ' + (e && e.message ? e.message : e)) });
    let sel = await DB.api.chooseAdapter();
    store = make(sel.adapter);
    try { await store.load(); } catch (e) {
      sel = { adapter: DB.localAdapter, mode: 'local', note: '서버에서 기록을 불러오지 못해 이 브라우저 저장을 사용합니다' };
      store = make(sel.adapter); await store.load();
    }
    storageInfo = sel;
    views = DB.createViews({ store, calc, stats, S, GUIDE: DB.guide, DATA: DB.data, storageInfo: () => storageInfo });
    render();
    if (sel.note) toast(sel.note);
    DB.app = { store, S, render, openAmount, openDay };   // 디버깅·테스트용
  }
  boot();
})(typeof window !== 'undefined' ? window : globalThis);
