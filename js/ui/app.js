/* ui/app.js - 화면 상태와 이벤트 연결(컨트롤러). 데이터 변경은 모두 core/store, core/draft 의 메서드를 호출합니다.
   부팅: 저장소 선택(api/) → 불러오기 → 화면 그리기 */
(function (root) {
  'use strict';
  const DB = root.DB, calc = DB.calc, stats = DB.stats, doc = root.document;
  const $ = s => doc.querySelector(s);

  const S = { tab: 'cal', month: calc.todayS().slice(0, 7), recDate: calc.todayS(), sel: calc.todayS(), cat: 'all', q: '', statP: 'month', statOff: 0, cc: { cat: 'etc', unit: 'bottle' } };
  let cloud = null, store = null, views = null, draft = null, storageInfo = { mode: 'local', note: '' };
  S.fr = { list: null, err: '', view: null };   // 친구 화면 상태
  S.acct = { profile: null };                    // 내 친구 코드·표시 이름

  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2400); }

  /* ---------- 그리기 ---------- */
  function render() {
    $('#nav').innerHTML = views.nav();
    const v = { cal: views.cal, rec: views.rec, stats: views.stats, report: views.report, set: views.settings, friends: views.friends }[S.tab];
    $('#app').innerHTML = v(); hydrate();
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
  /** 사진 칸(img[data-photo])에 저장된 사진을 채움. 파일이 없으면(백업 가져오기 등) 안내 문구로 바꿈 */
  function hydrate() {
    doc.querySelectorAll('img[data-photo]:not([data-ok])').forEach(img => {
      img.dataset.ok = '1';
      DB.photos.url(img.dataset.photo).then(u => { if (u) img.src = u; else img.replaceWith(Object.assign(doc.createElement('span'), { className: 'pmiss', textContent: '사진 없음' })); }).catch(() => { });
    });
    doc.querySelectorAll('img[data-fphoto]:not([data-ok])').forEach(img => {
      img.dataset.ok = '1'; const [o, id] = img.dataset.fphoto.split('|');
      DB.photos.friendUrl(o, id).then(u => { if (u) img.src = u; else img.replaceWith(Object.assign(doc.createElement('span'), { className: 'pmiss', textContent: '사진 없음' })); }).catch(() => { });
    });
  }
  async function addPhotos(date, files) {
    let n = 0, bad = 0;
    for (const f of Array.from(files)) {
      try { const id = await DB.photos.put(await DB.photos.shrink(f)); store.addPhoto(date, id); n++; } catch (e) { bad++; }
    }
    S.sel = date; render(); if (!$('#sheetWrap').hidden && $('#sheet').dataset.date === date) openDay(date);
    toast(bad ? `${n}장 추가, ${bad}장은 읽지 못했어요 (지원하지 않는 형식일 수 있어요)` : `사진 ${n}장을 추가했어요`);
    return { n, bad };
  }
  function openSheet(html) { $('#sheet').innerHTML = html; hydrate(); $('#sheetWrap').hidden = false; $('#sheet').scrollTop = 0; }
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
      case 'tab': if (v === 'rec') S.recDate = (S.tab === 'cal' && S.sel && S.sel <= calc.todayS()) ? S.sel : calc.todayS(); S.tab = v; render(); root.scrollTo(0, 0); break;
      case 'mon': { const [y, m] = S.month.split('-').map(Number); const d = new Date(y, m - 1 + (+v), 1); S.month = d.getFullYear() + '-' + calc.pad(d.getMonth() + 1); render(); break; }
      case 'monToday': S.month = calc.todayS().slice(0, 7); render(); break;
      case 'day': S.sel = v; render(); break;            // 캘린더: 날짜를 고르면 아래 카드에 상세가 보임
      case 'daySheet': openDay(v); break;                // 시간·증상·메모가 있는 상세 시트
      case 'warn': openWarn(v); break;
      case 'closeSheet': closeSheet(); break;
      case 'addTo': if (v > calc.todayS()) { toast('아직 오지 않은 날짜에는 기록할 수 없어요'); break; } S.recDate = v; S.tab = 'rec'; closeSheet(); render(); root.scrollTo(0, 0); break;
      case 'cat': S.cat = v; S.q = ''; render(); break;
      case 'fav': store.toggleFav(v); render(); break;
      case 'pick': openAmount(v); break;
      case 'theme': lsSet(THEME_KEY, v); applyTheme(); render(); break;
      case 'setRecDate': S.recDate = v; render(); break;
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
      case 'photoView': { const [s, id] = v.split('|'); openSheet(views.photoView(s, id)); break; }
      case 'delPhoto': { const [s, id] = v.split('|'); if (!root.confirm('이 사진을 삭제할까요?')) break; store.removePhoto(s, id); DB.photos.remove(id).catch(() => { }); closeSheet(); render(); toast('사진을 삭제했어요'); break; }
      case 'login': case 'signup': {
        const em = ($('#emailIn') || {}).value || '', pw = ($('#pwIn') || {}).value || '';
        if (!em.trim() || !pw) { toast('이메일과 비밀번호를 입력해 주세요'); break; }
        cloudTry(async () => {
          if (act === 'signup') { const r = await cloud.signUp(em.trim(), pw); if (r.needsConfirm) { toast('가입했어요. 이메일로 온 인증 링크를 누른 뒤 로그인해 주세요'); return; } } else await cloud.signIn(em.trim(), pw);
          root.location.reload();
        });
        break;
      }
      case 'logout': if (root.confirm('로그아웃할까요? 이 기기에는 마지막으로 불러온 기록이 남아 있지 않을 수 있어요.')) cloud.signOut().then(() => root.location.reload()); break;
      case 'saveName': cloudTry(async () => { await cloud.setDisplayName(($('#nameIn') || {}).value || ''); await loadAcct(); toast('표시 이름을 저장했어요'); }); break;
      case 'copyCode': { const c = S.acct.profile && S.acct.profile.friend_code; if (c && root.navigator.clipboard) root.navigator.clipboard.writeText(c).then(() => toast('친구 코드를 복사했어요')).catch(() => toast('복사하지 못했어요. 코드를 직접 알려 주세요')); break; }
      case 'exportStash': { const t = root.localStorage.getItem(DB.api.BACKUP_KEY); if (!t) break; const b = new Blob([t], { type: 'application/json' }), a = doc.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'drink-balance-device-backup.json'; a.click(); break; }
      case 'friendsTab': S.tab = 'friends'; S.fr.view = null; render(); loadFriends(); break;
      case 'friendAdd': { const code = ($('#fcode') || {}).value || ''; if (!code.trim()) { toast('친구 코드를 입력해 주세요'); break; } cloudTry(async () => { const r = await cloud.requestFriend(code); toast({ sent: '친구 요청을 보냈어요', accepted: '서로 요청해서 바로 친구가 됐어요', exists: '이미 요청했거나 친구예요', self: '내 코드예요', not_found: '해당 코드를 찾을 수 없어요' }[r] || '처리했어요'); await loadFriends(); }); break; }
      case 'friendAccept': cloudTry(async () => { await cloud.acceptFriend(v); toast('친구가 됐어요'); await loadFriends(); }); break;
      case 'friendRemove': if (root.confirm('친구 관계를 끊거나 요청을 취소할까요? 서로의 기록이 더 이상 보이지 않아요.')) cloudTry(async () => { await cloud.removeFriend(v); S.fr.view = null; await loadFriends(); }); break;
      case 'friendOpen': openFriend(v); break;
      case 'friendMonth': { const [y, m] = S.fr.view.month.split('-').map(Number); const d = new Date(y, m - 1 + (+v), 1); S.fr.view.month = d.getFullYear() + '-' + calc.pad(d.getMonth() + 1); render(); break; }
      case 'friendBack': S.fr.view = null; render(); break;
      case 'fphotoView': { const [o, id] = v.split('|'); openSheet(views.fphotoView(o, id)); break; }
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
      case 'export': { const b = new Blob([store.exportJSON()], { type: 'application/json' }), a = doc.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'drink-balance-backup-' + calc.todayS() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); lsSet('drinkBalance.lastBackup', calc.todayS()); render(); break; }
      case 'snoozeBackup': lsSet('drinkBalance.backupSnooze', calc.todayS()); render(); toast('3일 뒤에 다시 알려 드릴게요'); break;
      case 'wipe': if (root.confirm('모든 기록을 삭제할까요? 되돌릴 수 없습니다.') && root.confirm('정말 전체 삭제할까요?')) { { const ids = []; Object.keys(store.raw().days).forEach(d => (store.raw().days[d].photos || []).forEach(i => ids.push(i))); if (cloud.loggedIn) ids.forEach(i => cloud.deletePhoto(i).catch(() => { })); } store.wipe(); DB.photos.clear().catch(() => { }); render(); toast('전체 삭제했어요'); } break;
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
    else if (t.id === 'goalDays') store.setGoals({ weekDays: t.value });
    else if (t.id === 'goalG') store.setGoals({ weekG: t.value });
    else if (t.id === 'ageIn') store.setProfile({ age: t.value });
    else if (t.id === 'pregIn') store.setProfile({ pregnant: t.checked });
    else if (t.dataset.f) store.setDayField($('#sheet').dataset.date, t.dataset.f, t.value);
  });
  doc.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'dateIn' && t.value) { S.recDate = t.value; render(); }
    if (t.dataset && t.dataset.photoIn && t.files.length) { addPhotos(t.dataset.photoIn, t.files); t.value = ''; }
    if (t.id === 'importIn' && t.files[0]) {
      const rd = new FileReader();
      rd.onload = () => { try { const o = JSON.parse(rd.result); if (!root.confirm('현재 기록을 백업 파일 내용으로 바꿀까요?')) return; store.importData(o); render(); toast('가져왔어요'); } catch (e) { toast('올바른 백업 파일이 아니에요'); } };
      rd.readAsText(t.files[0]);
    }
  });
  // 탭을 닫거나 숨길 때 저장이 끝나도록
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'hidden' && store) store.flush(); });
  root.addEventListener('pagehide', () => { if (store) store.flush(); });

  /* ---------- 화면 테마 (시스템 / 라이트 / 다크) ---------- */
  const THEME_KEY = 'drinkBalance.theme';
  const getTheme = () => { const t = lsGet(THEME_KEY); return t === 'light' || t === 'dark' ? t : 'system'; };
  function applyTheme() {
    const t = getTheme(), sysDark = !!(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches), dark = t === 'dark' || (t === 'system' && sysDark);
    doc.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const m = doc.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', dark ? '#0e1511' : '#f3fcf3');
  }
  try { root.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (getTheme() === 'system') { applyTheme(); if (views) render(); } }); } catch (e) { /* 구형 브라우저 */ }

  /* ---------- 백업 알림 ---------- */
  const lsGet = k => { try { return root.localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { root.localStorage.setItem(k, v); } catch (e) { /* 저장 불가 */ } };
  const daysSince = d => d ? Math.round((calc.parse(calc.todayS()) - calc.parse(d)) / 86400000) : null;
  /** 클라우드에 저장 중이면 알리지 않음. 기록이 있고 마지막 백업이 7일을 넘었으면(또는 한 번도 없으면) 알림. '나중에'는 3일간 숨김 */
  function backupInfo() {
    if (storageInfo.mode === 'cloud' || !store) return { due: false, days: null };
    const has = Object.keys(store.raw().days).length > 0; if (!has) return { due: false, days: null };
    const last = lsGet('drinkBalance.lastBackup'), days = daysSince(last), snooze = daysSince(lsGet('drinkBalance.backupSnooze'));
    if (snooze != null && snooze < 3) return { due: false, days };
    return { due: last == null ? Object.keys(store.raw().days).length >= 3 : days >= 7, days };
  }

  /* ---------- 계정·친구 (클라우드) ---------- */
  const cloudErr = e => (e && e.message) ? e.message : String(e);
  async function cloudTry(fn) { try { await fn(); } catch (e) { toast('실패했어요: ' + cloudErr(e)); } }
  async function loadAcct() { try { S.acct.profile = await cloud.getProfile(); } catch (e) { S.acct.profile = null; } if (S.tab === 'set') render(); }
  async function loadFriends() {
    try { S.fr.list = await cloud.listFriends(); S.fr.err = ''; } catch (e) { S.fr.err = cloudErr(e); }
    if (S.tab === 'friends') render();
  }
  async function openFriend(id) {
    const f = (S.fr.list || []).find(x => x.friend_id === id); if (!f) return;
    S.fr.view = { id, name: f.name, month: calc.todayS().slice(0, 7), store: null, err: '' }; render();
    try {
      const st = await cloud.friendState(id);
      if (!st) { S.fr.view.err = '아직 기록이 없거나 볼 수 있는 권한이 없어요'; render(); return; }
      const fs = DB.store.createStore({ adapter: { load: async () => st, save: async () => { } }, products: DB.data.PRODUCTS, guide: DB.guide });
      await fs.load(); S.fr.view.store = fs;   // 읽기 전용: 저장 어댑터가 아무것도 하지 않음
    } catch (e) { S.fr.view.err = cloudErr(e); }
    render();
  }

  /* ---------- 부팅 ---------- */
  async function boot() {
    $('#app').innerHTML = '<div class="empty">불러오는 중…</div>';
    const make = a => DB.store.createStore({ adapter: a, products: DB.data.PRODUCTS, guide: DB.guide, onSaveError: e => toast('저장하지 못했어요: ' + (e && e.message ? e.message : e)) });
    let lsx = null; try { lsx = root.localStorage; } catch (e) { /* 저장소 접근 불가 */ }
    const cfg = DB.config.supabase || {};
    cloud = DB.createCloud({ url: cfg.url, key: cfg.key, storage: lsx });
    DB.photos.setCloud(cloud);
    let sel = await DB.api.chooseAdapter(cloud);
    store = make(sel.adapter);
    try { await store.load(); } catch (e) {
      sel = { adapter: DB.localAdapter, mode: 'local', note: '서버에서 기록을 불러오지 못해 이 브라우저 저장을 사용합니다' };
      store = make(sel.adapter); await store.load();
    }
    storageInfo = sel;
    views = DB.createViews({ store, calc, stats, S, GUIDE: DB.guide, DATA: DB.data, storageInfo: () => storageInfo, cloud, backupInfo, theme: getTheme });
    render();
    if (sel.note) toast(sel.note);
    DB.app = { store, S, render, openAmount, openDay, addPhotos, cloud };   // 디버깅·테스트용
    if (cloud.configured && cloud.loggedIn) {
      loadAcct();
      // 처음 한 번(또는 기록을 옮긴 직후) 이 기기의 사진을 계정으로 올림
      let done = null; try { done = root.localStorage.getItem('drinkBalance.photosUp:' + cloud.session.user.id); } catch (e) { /* 무시 */ }
      if (sel.mode === 'cloud' && (sel.migrated || !done)) {
        const ids = []; Object.keys(store.raw().days).forEach(d => (store.raw().days[d].photos || []).forEach(i => ids.push(i)));
        DB.photos.uploadLocal(ids).then(() => { try { root.localStorage.setItem('drinkBalance.photosUp:' + cloud.session.user.id, '1'); } catch (e) { /* 무시 */ } });
      }
    }
  }
  boot();
})(typeof window !== 'undefined' ? window : globalThis);
