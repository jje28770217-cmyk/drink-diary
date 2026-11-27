/* ui/views.js - 화면 마크업(HTML 문자열)만 만든다. 데이터 계산·저장은 core/ 를 호출하고, 이벤트는 ui/app.js 가 처리.
   디자인을 바꿀 때는 이 파일(구조)과 css/ (스타일), images/ (이미지)만 수정하면 되고 core/ 는 건드릴 필요가 없습니다.
   버튼은 data-act / data-v 속성으로 동작을 알리므로, 마크업을 바꿔도 data-act 값과 id 만 유지하면 기능이 그대로 동작합니다.
   시안(stitch/): 초록 톤 카드형. 시안의 근거 없는 건강 수치·조언 문구와 동작하지 않는 요소(프로필·이미지 저장·로고)는 넣지 않았습니다. */
(function (root) {
  'use strict';
  const DB = root.DB;

  /* 디자인 상수: 이미지 크기(px) */
  const SIZE = { card: 84, cal: 56, hero: 230, heroMany: 140, tile: 46, row: 46, stat: 44 };
  const CAT_EMOJI = { soju: '🍶', beer: '🍺', makgeolli: '🥣', wine: '🍷', whisky: '🥃', highball: '🍹', etc: '🍸' };
  const svg = (p, extra) => `<svg viewBox="0 0 24 24" ${extra || ''} aria-hidden="true">${p}</svg>`;
  const I = {
    cal: svg('<rect x="3.5" y="5" width="17" height="15" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    stats: svg('<path d="M5 20V11M12 20V5M19 20v-7"/>'),
    rec: svg('<path d="M12 5v14M5 12h14"/>'),
    report: svg('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
    set: svg('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.400-2.300.9a7 7 0 0 0-2-1.200L14.300 3h-4l-.4 2.600a7 7 0 0 0-2 1.200l-2.300-.9-2 3.400 2 1.500A7 7 0 0 0 5 12c0 .4 0 .8.1 1.200l-2 1.500 2 3.400 2.300-.9c.6.500 1.300.9 2 1.200l.4 2.600h4l.4-2.600c.7-.3 1.400-.7 2-1.200l2.300.9 2-3.400-2-1.500c.1-.4.1-.8.1-1.200z"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>'), prev: svg('<path d="M15 5l-7 7 7 7"/>'), next: svg('<path d="M9 5l7 7-7 7"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'), search: svg('<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500"/>'),
    check: svg('<circle cx="12" cy="12" r="8.500"/><path d="M8 12.500l3 3 5-6"/>'),
    glass: svg('<path d="M5 5h14l-7 8zM12 13v7M8 20h8"/>'), leaf: svg('<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19l7-7"/>'),
    drop: svg('<path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z"/>'), bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.500 2h-15zM10 20a2 2 0 0 0 4 0"/>'),
    edit: svg('<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>'), trash: svg('<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>'),
    day: svg('<rect x="3.500" y="5" width="17" height="15" rx="3.500"/><path d="M3.500 10h17"/>'), info: svg('<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5M12 8v.1"/>')
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 차트 색은 css/tokens.css 의 변수에서 읽음 (디자인 변경 시 CSS 만 수정)
  const tok = (n, f) => { try { return getComputedStyle(root.document.documentElement).getPropertyValue(n).trim() || f; } catch (e) { return f; } };

  function createViews(ctx) {
    const { store, calc, stats, S, GUIDE, DATA } = ctx;
    const { CATS, CAT_NAME } = DATA;
    const img = (id, fill, o) => DB.imageView.render(id, fill, o);
    const { niceDate, r1, r2, fmtQty, qtyLabel, TYPE_LABEL } = calc;
    const catOf = p => p.cat === 'custom' ? 'etc' : p.cat;
    const srcList = list => list.map(x => `${esc(x.org)}, ${esc(x.title)} (${esc(x.year)}) ${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">원문</a>` : ''}`).join('<br>');
    const topbar = () => '<header class="topbar"><span class="brand">드링크 밸런스</span></header>';
    const monthRange = ym => { const [y, m] = ym.split('-').map(Number); return { from: `${y}-${calc.pad(m)}-01`, to: calc.fmt(new Date(y, m, 0)) }; };
    const STATUS_LABEL = { ok: '기준 이내', warn: '경고', sober: '금주', none: '기록 없음' };

    /* ---------- 하단 메뉴 ---------- */
    function nav() {
      const t = (k, label) => `<button data-act="tab" data-v="${k}" class="${S.tab === k ? 'on' : ''}">${I[k]}<span>${label}</span></button>`;
      return `<div class="nav-in">${t('cal', '캘린더')}${t('stats', '통계')}
        <button data-act="tab" data-v="rec" class="plus ${S.tab === 'rec' ? 'on' : ''}"><span class="dot">${I.rec}</span><span>기록하기</span></button>
        ${t('report', '리포트')}${t('set', '설정')}</div>`;
    }

    /* ---------- 캘린더 ---------- */
    function dayCard(s) {
      const es = store.entriesOf(s), d = store.dayOf(s) || {}, st = store.dayStatus(s), g = store.gOf(s), th = GUIDE.thresholds(store.profile), a = es.length ? store.analyze(s) : null;
      const bad = st === 'warn', pct = Math.min(100, g / th.dayG * 100);
      let body = '';
      if (es.length) {
        body = `<div class="gauge ${bad ? 'bad' : ''}"><div class="gauge-top"><span>${bad ? esc(a.reasons[0].text) : '하루 참고 기준 이내예요'}</span><b>${r1(g)}g / ${th.dayG}g</b></div>
            <div class="bar"><i style="width:${pct}%"></i></div>
            <small>기준 이내여도 건강 위험이 없다는 뜻은 아니에요. ${esc(GUIDE.SAFE_NOTE)}</small></div>
          <div class="muted-h">마신 음료 내역</div>
          ${es.map(e => `<div class="day-ent"><span class="ptile sm">${img(e.icon, 1, { h: SIZE.cal, shadowRx: 12 })}</span>
            <div class="t"><b>${esc(e.name)}</b><span>${esc(CAT_NAME[e.cat] || '')} · ${e.abv}% · ${esc(qtyLabel(e))} (${Math.round(e.ml)}mL)</span></div>
            <div class="g"><b>${r1(e.g)}g</b><small>순수 알코올</small></div>
            <div class="mini"><button class="mini-btn" data-act="editEntry" data-v="${s}|${e.id}" aria-label="수정">${I.edit}</button><button class="mini-btn danger" data-act="delEntry" data-v="${s}|${e.id}" aria-label="삭제">${I.trash}</button></div></div>`).join('')}`;
      } else body = `<div class="empty tight">${d.sober ? '금주일로 기록했어요.' : '이 날은 기록이 없어요. 기록하지 않은 날은 금주로 계산하지 않아요.'}</div>`;
      return `<section class="card day-card"><div class="day-head"><span class="round">${I.day}</span><div class="sp"><h3>${niceDate(s)}</h3>${d.memo ? `<small>${esc(d.memo)}</small>` : ''}</div><span class="pill st-${st}">${STATUS_LABEL[st]}</span></div>
        ${body}
        <div class="btn-row"><button class="btn soft" data-act="addTo" data-v="${s}">${I.plus}기록 추가</button>
          ${!es.length ? `<button class="btn tint" data-act="sober" data-v="${s}">${I.leaf}${d.sober ? '금주 기록 취소' : '금주일로 기록'}</button>` : ''}
          ${bad ? `<button class="btn danger" data-act="warn" data-v="${s}">${I.bell}경고 이유 보기</button>` : ''}</div>
        ${es.length || d.sober ? `<button class="linkbtn" data-act="daySheet" data-v="${s}">시간·증상·메모 ›</button>` : ''}</section>`;
    }
    function cal() {
      const [y, mo] = S.month.split('-').map(Number), r = monthRange(S.month), sm = stats.summarize(store, r);
      const first = new Date(y, mo - 1, 1), last = new Date(y, mo, 0).getDate(), today = calc.todayS();
      let cells = '';
      for (let i = 0; i < first.getDay(); i++) cells += '<span class="cell out"></span>';
      for (let d = 1; d <= last; d++) {
        const s = `${y}-${calc.pad(mo)}-${calc.pad(d)}`, st = store.dayStatus(s);
        const mk = st === 'sober' ? `<span class="mk sober">${I.check}</span>` : (st === 'ok' || st === 'warn') ? `<span class="mk drink ${st}">${I.glass}<i class="dot"></i></span>` : '';
        cells += `<button class="cell st-${st} ${s === today ? 'today' : ''} ${s === S.sel ? 'sel' : ''}" data-act="day" data-v="${s}" aria-label="${niceDate(s)} ${STATUS_LABEL[st]}"><span class="d">${d}</span>${mk}</button>`;
      }
      return `${topbar()}
        <div class="cal-head"><h2>${y}년 ${mo}월</h2><button class="icon-btn" data-act="mon" data-v="-1" aria-label="이전 달">${I.prev}</button><button class="icon-btn" data-act="mon" data-v="1" aria-label="다음 달">${I.next}</button><span class="sp"></span><button class="pill ghost" data-act="monToday">● 오늘</button></div>
        <div class="stat-chips"><span class="chip-stat"><i class="dot"></i>음주 <b>${sm.drink.length}일</b></span><span class="chip-stat tint">${I.leaf}금주 <b>${sm.sober.length}일</b></span><span class="chip-stat">${I.drop}순수 알코올 <b>${r1(sm.total)}g</b></span></div>
        <section class="card cal-card"><div class="wk">${calc.WD.map(w => `<span>${w}</span>`).join('')}</div><div class="grid">${cells}</div>
          <div class="legend"><span><i class="dot ok"></i>기준 이내</span><span><i class="dot warn"></i>경고</span><span class="lg-chk">${I.check}금주</span><span>미기록은 빈칸</span></div></section>
        ${S.sel ? dayCard(S.sel) : ''}
        ${weekCard()}
        <div class="disc">${esc(GUIDE.DISCLAIMER)}</div>`;
    }
    function weekCard() {
      const w = stats.weekCompare(store), has = w.cur > 0 || w.prev > 0 || w.sober > 0;
      if (!has) return '';
      return `<section class="card note-card"><span class="round">${I.leaf}</span><div><h4>최근 7일</h4>
        <p>순수 알코올 <b>${r1(w.cur)}g</b> · 그 앞 7일 ${r1(w.prev)}g${w.pct == null ? '' : ` (${w.pct > 0 ? '+' : ''}${w.pct}%)`}<br>금주로 기록한 날 <b>${w.sober}일</b></p></div></section>`;
    }

    /* ---------- 기록하기: 주류 선택 ---------- */
    function pcard(p) {
      const ab = store.effAbv(p), fav = store.fav.includes(p.id);
      return `<div class="pcard" data-act="pick" data-v="${p.id}" role="button" tabindex="0">
        <span class="ptile"><span class="star ${fav ? 'on' : ''}" data-act="fav" data-v="${p.id}" role="button" aria-label="즐겨찾기">${fav ? '★' : '☆'}</span>${img(store.thumbId(p), 1, { h: SIZE.card, shadowRx: 14 })}</span>
        <span class="nm">${esc(p.name)}</span>
        <span class="ab ${ab == null ? 'need' : ''}">${ab == null ? '도수 입력' : Number(ab).toFixed(1) + '%'}</span></div>`;
    }
    function rec() {
      const all = store.allProducts(), q = S.q.trim().toLowerCase();
      let body = '';
      const sec = (title, list, more) => list.length ? `<div class="sec-h"><h3>${title}</h3>${more ? `<button data-act="cat" data-v="${more}">더보기 ›</button>` : ''}</div><div class="pgrid c4">${list.map(pcard).join('')}</div>` : '';
      if (q) {
        const list = all.filter(p => (p.name + ' ' + (p.sub || '')).toLowerCase().includes(q));
        body = list.length ? `<div class="pgrid c3">${list.map(pcard).join('')}</div>` : '<div class="empty">검색 결과가 없어요.<br>아래에서 직접 추가할 수 있어요.</div>';
      } else if (S.cat !== 'all') {
        body = `<div class="pgrid c3">${all.filter(p => catOf(p) === S.cat).map(pcard).join('')}</div>`;
      } else {
        const fav = store.fav.map(store.getProduct).filter(Boolean), rc = store.recent.map(store.getProduct).filter(Boolean).slice(0, 4);
        body = sec('★ 즐겨찾기', fav.slice(0, 8), '') + sec('최근 기록', rc, '');
        CATS.slice(1).forEach(([k, n]) => { body += sec(`${CAT_EMOJI[k] || ''} ${n}`, all.filter(p => catOf(p) === k).slice(0, 4), k); });
      }
      const es = store.entriesOf(S.recDate), g = store.gOf(S.recDate);
      return `<div class="sc-head"><button class="icon-btn x" data-act="tab" data-v="cal" aria-label="뒤로">${I.back}</button><span>주류 선택</span></div>
        <div class="row center-row"><button class="pill ghost" data-act="pickDate">${niceDate(S.recDate)} ▾</button></div>
        <input type="date" id="dateIn" class="hidden-date" value="${S.recDate}" max="${calc.todayS()}">
        ${es.length || (store.dayOf(S.recDate) && store.dayOf(S.recDate).sober) ? `<div class="today-bar" data-act="daySheet" data-v="${S.recDate}" role="button"><span>이 날 기록 <b>${es.length}건</b> · 순수 알코올 <b>${r1(g)}g</b></span><span class="sp"></span><span>보기 ›</span></div>` : ''}
        <label class="search"><span aria-hidden="true">${I.search}</span><input id="q" type="search" placeholder="주류를 검색해 보세요 (예: 참이슬, 카스)" value="${esc(S.q)}" autocomplete="off"></label>
        <div class="chips">${CATS.map(([k, n]) => `<button class="chip ${S.cat === k && !q ? 'on' : ''}" data-act="cat" data-v="${k}">${n}</button>`).join('')}</div>
        ${body}
        <div class="card add-own"><span class="round">${I.plus}</span><div class="sp"><b>찾으시는 주류가 없나요?</b><small>직접 이름과 도수를 입력하여 추가해 보세요.</small></div><button class="btn white sm" data-act="addCustom">직접 등록</button></div>
        ${!es.length ? `<button class="btn tint block" data-act="sober" data-v="${S.recDate}">${I.leaf}이 날은 금주했어요 (금주일로 기록)</button>` : ''}`;
    }

    /* ---------- 분량 선택 화면 ---------- */
    function qtyImages(icon, qty, h) {
      const n = Math.floor(qty + 1e-9), rem = qty - n, out = [];
      if (n > 4) return img(icon, 1, { h }) + `<b class="times">×${fmtQty(qty)}</b>`;
      for (let i = 0; i < n; i++) out.push(img(icon, 1, { h }));
      if (rem > 0.01 || n === 0) out.push(img(icon, n === 0 ? qty : rem, { h })); // 1.5병 = 가득 찬 병 + 반쯤 찬 병
      return out.join('');
    }
    function heroPic(dr) {
      const N = dr.numbers(), t = N.unit.t, p = dr.product, icon = store.imageId(p, t === 'ml' ? p.units[0].t : t);
      return t === 'ml' ? img(icon, N.fill, { h: SIZE.hero }) : qtyImages(icon, dr.qty, dr.qty > 2 ? SIZE.heroMany : SIZE.hero);
    }
    /** 입력할 때마다 갱신되는 부분(수량 표시, 히어로 이미지, 기록 버튼 문구) */
    function amountLive(dr) {
      const N = dr.numbers(), t = N.unit.t;
      const main = t === 'ml' ? Math.round(dr.qty) + 'mL' : fmtQty(dr.qty) + TYPE_LABEL[t];
      return {
        val: `<b>${main}</b><span>${N.totalMl ? Math.round(N.totalMl) + 'mL' : '용량을 입력하세요'} · ${N.g != null ? '순수 알코올 ' + r1(N.g) + 'g' : '도수를 입력하세요'}</span>`,
        hero: heroPic(dr),
        btn: `${dr.editId ? '수정하기' : '기록하기'}${N.g != null ? ` (${r1(N.g)}g ${dr.editId ? '' : '추가'})` : ''}`.replace(' )', ')')
      };
    }
    function amount(dr) {
      const N = dr.numbers(), p = dr.product, t = N.unit.t, icon = store.imageId(p, t === 'ml' ? p.units[0].t : t), live = amountLive(dr);
      const sizes = {}; p.units.forEach(x => sizes[x.t] = (sizes[x.t] || 0) + 1);
      const unitChips = p.units.map((x, i) => `<button class="chip ${dr.unitSel === i ? 'on' : ''}" data-act="unit" data-v="${i}">${TYPE_LABEL[x.t]}${sizes[x.t] > 1 && store.effMl(p, x) ? ' ' + store.effMl(p, x) + 'mL' : ''}</button>`).join('') + `<button class="chip ${dr.unitSel === 'ml' ? 'on' : ''}" data-act="unit" data-v="ml">mL</button>`;
      const stBadge = { official: '<span class="badge official">공식 확인</span>', ref: '<span class="badge ref">참고값 · 확인 필요</span>', none: '<span class="badge none">정보 미확인</span>' }[p.custom ? 'none' : p.st];
      const tiles = t === 'ml' ? '' : calc.FRACS.map(f => {
        const on = !dr.customMode && Math.abs(dr.qty - f) < 0.005, ml = N.unitMl ? Math.round(f * N.unitMl) : null;
        const g = N.unitMl && N.abv != null ? calc.gramOf(f * N.unitMl, N.abv) : null;
        return `<button class="tile ${on ? 'on' : ''}" data-act="qty" data-v="${f}"><span class="ptile xs">${img(icon, Math.min(1, f), { flat: true, h: SIZE.tile })}</span><span class="tl"><b>${fmtQty(f)}${TYPE_LABEL[t]}</b> <em>${ml ? (f >= 1 ? ml + 'ml' : '약 ' + ml + 'ml') : '용량 입력'}</em></span><small>${g != null ? '순수 알코올 ' + r1(g) + 'g' : '도수·용량을 입력하세요'}</small></button>`;
      }).join('') + `<button class="tile ${dr.customMode ? 'on' : ''}" data-act="custom"><span class="ptile xs mint"><span class="tile-pen">✎</span></span><span class="tl"><b>직접 입력</b></span><small>${dr.customMode ? '아래에서 숫자를 조절하세요' : '잔·mL 단위로 세부 조절'}</small></button>`;
      const step = t === 'ml' ? 50 : 0.25;
      return `<div class="screen-in">
        <div class="sc-head"><button class="icon-btn x" data-act="closeAmount" aria-label="뒤로">${I.back}</button><span>음주 기록</span></div>
        <div class="live-badge"><span class="pill ghost"><i class="dot ok"></i>실시간 순수 알코올 계산</span></div>
        <div class="amount-grid"><div class="amount-left">
        <section class="card hero"><div class="pic" id="heroPic">${live.hero}</div>
          <h2>${esc(p.name)}</h2>
          <div class="chips-row"><span class="pill mint">${esc(p.sub || CAT_NAME[p.cat])}</span>
            <label class="pill in"><span class="k">도수</span><input id="abvIn" inputmode="decimal" class="${N.abv == null ? 'need' : ''}" value="${dr.abv == null ? '' : dr.abv}" placeholder="입력"><span class="u">%</span></label>
            ${t === 'ml' ? '' : `<label class="pill in"><span class="k">용량</span><input id="mlIn" inputmode="decimal" class="${!N.unitMl ? 'need' : ''}" value="${dr.unitMl || ''}" placeholder="입력"><span class="u">ml</span></label>`}</div>
          <div class="badge-row">${stBadge}</div></section>
        <div class="note">${esc(p.note || '')}${p.src ? ` <a href="${esc(p.src)}" target="_blank" rel="noopener noreferrer">출처</a>` : ''} 제품·출시 시기에 따라 다를 수 있으니 라벨을 확인해 수정해 주세요. 이미지는 실제 제품과 다를 수 있습니다.</div></div>
        <div class="amount-right">
        <div class="amt-title"><h3>마신 양을 선택하세요</h3><p>순수 알코올 양(g)이 자동 환산됩니다</p></div>
        <div class="units">${unitChips}</div>
        ${t === 'ml' ? '' : `<div class="tiles">${tiles}</div>`}
        <div class="stepper"><button data-act="step" data-v="-${step}" aria-label="줄이기">−</button><div class="val" id="val">${live.val}</div><button data-act="step" data-v="${step}" aria-label="늘리기">＋</button></div>
        ${t === 'ml' ? `<label class="field"><span>마신 양 (mL) 직접 입력</span><input id="qtyIn" inputmode="decimal" value="${dr.qty}"></label>` : (dr.customMode ? `<label class="field"><span>마신 양 (${TYPE_LABEL[t]}) 직접 입력</span><input id="qtyIn" inputmode="decimal" value="${r2(dr.qty)}"></label>` : '')}
        <label class="chk"><input type="checkbox" id="saveDef" ${dr.saveDef ? 'checked' : ''}> 입력한 도수·용량을 이 제품 기본값으로 저장</label>
        <div class="tip">${I.info}<p>${esc(GUIDE.SAFE_NOTE)} 이 앱의 안내는 참고용이며 진단이 아닙니다.</p></div></div></div>
      </div>
      <div class="foot"><button class="btn" data-act="saveEntry" id="saveBtn">${live.btn}</button></div>`;
    }

    /* ---------- 시트 ---------- */
    function day(s) {
      const es = store.entriesOf(s), d = store.dayOf(s) || {}, g = store.gOf(s), a = es.length ? store.analyze(s) : null;
      return `<h2>${niceDate(s)}</h2>
        ${es.length ? `<div class="total"><span class="sub">총 순수 알코올</span><b>${r1(g)}g</b><span class="sub">· ${Math.round(es.reduce((x, e) => x + e.ml, 0))}mL</span></div>` : '<div class="empty tight">기록이 없어요.</div>'}
        ${es.map(e => `<div class="ent"><span class="ptile xs">${img(e.icon, 1, { h: SIZE.row, shadowRx: 11 })}</span><div class="t"><b>${esc(e.name)}</b><span>${esc(qtyLabel(e))} · ${Math.round(e.ml)}mL · ${e.abv}% · ${r1(e.g)}g</span></div>
          <button class="btn ghost sm" data-act="editEntry" data-v="${s}|${e.id}">수정</button><button class="btn danger sm" data-act="delEntry" data-v="${s}|${e.id}">삭제</button></div>`).join('')}
        ${a && a.level === 'warn' ? `<div class="alert"><h3>⚠ 건강 위험 안내</h3><div class="alert-txt">${a.reasons.map(r => esc(r.text)).join('<br>')}</div><button class="btn sm danger mt8" data-act="warn" data-v="${s}">자세히 보기</button></div>` : ''}
        ${a && a.level !== 'warn' ? `<div class="disc">현재 기준에서는 경고 조건에 해당하지 않지만, 음주량이 적다고 건강 위험이 없다는 뜻은 아닙니다. ${esc(GUIDE.SAFE_NOTE)}</div>` : ''}
        <div class="row gap8 mt12"><button class="btn" data-act="addTo" data-v="${s}">＋ 술 추가</button>
          ${!es.length ? `<button class="btn ghost" data-act="sober" data-v="${s}">${d.sober ? '금주 기록 취소' : '금주일로 기록'}</button>` : ''}</div>
        ${es.length || d.sober ? `<h3 class="h-sm">하루 정보 (선택)</h3>
          <div class="two"><label class="field"><span>시작 시간</span><input type="time" data-f="start" value="${esc(d.start || '')}"></label><label class="field"><span>종료 시간</span><input type="time" data-f="end" value="${esc(d.end || '')}"></label></div>
          <div class="field"><span>음주 후 컨디션·증상</span><div class="sym">${GUIDE.SYMPTOMS.map(x => `<button class="chip ${(d.cond || []).includes(x.k) ? 'on' : ''}" data-act="sym" data-v="${s}|${x.k}">${esc(x.label)}</button>`).join('')}</div></div>
          <label class="field"><span>메모</span><textarea data-f="memo" placeholder="오늘의 한 줄">${esc(d.memo || '')}</textarea></label>` : ''}
        <div class="disc">${esc(GUIDE.DISCLAIMER)}</div>`;
    }
    function warn(s, fresh) {
      const a = store.analyze(s);
      return `<h2 class="t-red">⚠ ${fresh ? '기록이 저장됐어요 · ' : ''}건강 위험 안내</h2><div class="sub">${niceDate(s)} · 순수 알코올 ${r1(store.gOf(s))}g · 최근 7일 합계 ${r1(store.weekSum(s))}g</div>
        <div class="alert"><h3>경고가 발생한 이유</h3><ul>${a.reasons.map(r => `<li>${esc(r.text)}${r.basis ? `<br><span class="sub">기준: ${esc(r.basis)}</span>` : ''}</li>`).join('')}</ul></div>
        ${a.emergency ? `<div class="alert"><h3>⚠ 즉시 도움이 필요할 수 있어요</h3><div class="alert-txt lh">${esc(GUIDE.EMERGENCY)}</div></div>` : ''}
        <div class="plain"><h3 class="h-sm">음주와 관련된 건강 위험</h3><ul>${GUIDE.RISKS.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3 class="h-sm">권장 행동</h3><ul>${GUIDE.ACTIONS.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <h3 class="h-sm">정보 출처</h3><div class="src">${srcList(GUIDE.SOURCES)}</div>
        <div class="disc">${esc(GUIDE.DISCLAIMER)}</div><button class="btn ghost mt12" data-act="closeSheet">확인했어요</button>`;
    }
    function custom() {
      return `<h2>제품 직접 추가</h2><div class="note">목록에 없는 제품의 이름, 용량, 도수를 입력해 주세요. 값은 이 기기(또는 내 서버)에만 저장됩니다.</div>
        <label class="field"><span>제품명</span><input id="cName" maxlength="30"></label>
        <div class="field"><span>종류</span><div class="chips">${['soju', 'beer', 'makgeolli', 'wine', 'whisky', 'highball', 'etc'].map(k => `<button class="chip ${k === 'etc' ? 'on' : ''}" data-act="cCat" data-v="${k}">${CAT_NAME[k]}</button>`).join('')}</div></div>
        <div class="field"><span>기본 단위</span><div class="chips">${['bottle', 'can', 'glass'].map(k => `<button class="chip ${k === 'bottle' ? 'on' : ''}" data-act="cUnit" data-v="${k}">${TYPE_LABEL[k]}</button>`).join('')}</div></div>
        <div class="two"><label class="field"><span>한 단위 용량 (mL)</span><input id="cMl" inputmode="decimal"></label><label class="field"><span>도수 (%)</span><input id="cAbv" inputmode="decimal"></label></div>
        <button class="btn" data-act="saveCustom">추가하고 기록하기</button>`;
    }

    /* ---------- 통계 ---------- */
    function barChart(items, thr, thrLabel) {
      const W = 340, H = 150, pl = 6, pb = 22, n = Math.max(1, items.length), mx = Math.max(10, thr || 0, ...items.map(i => i.v)) * 1.1, bw = Math.max(2, (W - pl * 2) / n - (n > 20 ? 1.5 : 10));
      const x = i => pl + i * ((W - pl * 2) / n) + ((W - pl * 2) / n - bw) / 2, y = v => H - pb - (H - pb - 8) * v / mx;
      const bar = tok('--chart-bar', '#b1f0cd'), now = tok('--chart-bar-now', '#125238'), bad = tok('--chart-warn', '#ffb95d'), txt = tok('--chart-text', '#5a645d');
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="기간별 순수 알코올 막대그래프">
        ${thr ? `<line x1="0" x2="${W}" y1="${y(thr)}" y2="${y(thr)}" stroke="${bad}" stroke-dasharray="4 3"/><text x="${pl}" y="${y(thr) - 4}" font-size="9" fill="${txt}" text-anchor="start">${esc(thrLabel || '참고 기준')} ${Math.round(thr)}g</text>` : ''}
        ${items.map((it, i) => `<rect x="${x(i)}" y="${y(it.v)}" width="${bw}" height="${Math.max(0, H - pb - y(it.v))}" rx="${Math.min(6, bw / 2)}" fill="${it.warn ? bad : it.now ? now : bar}"/>${it.v > 0 && n <= 12 ? `<text x="${x(i) + bw / 2}" y="${y(it.v) - 3}" font-size="8.500" fill="${txt}" text-anchor="middle">${Math.round(it.v)}</text>` : ''}${it.lab ? `<text x="${x(i) + bw / 2}" y="${H - 6}" font-size="9" fill="${txt}" text-anchor="middle">${it.lab}</text>` : ''}`).join('')}</svg>`;
    }
    function donut(byCat) {
      const tot = Object.values(byCat).reduce((a, b) => a + b, 0); if (!tot) return '<div class="empty">기록이 없어요.</div>';
      const col = k => tok('--cat-' + k, tok('--cat-etc', '#c0c9c1')), ink = tok('--ink', '#151d19'), sub = tok('--chart-text', '#5a645d');
      let a0 = -Math.PI / 2, paths = ''; const R = 52, r = 36, cx = 60, cy = 60, ents = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
      ents.forEach(([k, v]) => { const a1 = a0 + (v / tot) * Math.PI * 2 - 0.0001, big = a1 - a0 > Math.PI ? 1 : 0, P = (R2, a) => [cx + R2 * Math.cos(a), cy + R2 * Math.sin(a)];
        const [x1, y1] = P(R, a0), [x2, y2] = P(R, a1), [x3, y3] = P(r, a1), [x4, y4] = P(r, a0);
        paths += ents.length === 1 ? `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${col(k)}" stroke-width="${R - r}"/>` : `<path d="M${x1} ${y1}A${R} ${R} 0 ${big} 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${big} 0 ${x4} ${y4}Z" fill="${col(k)}"/>`; a0 = a1 + 0.0001; });
      const top = ents[0];
      return `<div class="donut-row"><svg viewBox="0 0 120 120" width="132" height="132" role="img" aria-label="주종별 비율 도넛그래프">${paths}<text x="60" y="54" text-anchor="middle" font-size="7.500" fill="${sub}">주력 주종</text><text x="60" y="68" text-anchor="middle" font-size="13" font-weight="800" fill="${ink}">${CAT_NAME[top[0]] || top[0]}</text><text x="60" y="80" text-anchor="middle" font-size="8" fill="${sub}">${Math.round(top[1] / tot * 100)}%</text></svg>
        <div class="legend-col">${ents.map(([k, v]) => `<div class="lg-row"><i style="background:${col(k)}"></i><span class="sp">${CAT_NAME[k] || k}</span><b>${r1(v)}g</b><small>(${Math.round(v / tot * 100)}%)</small></div>`).join('')}</div></div>`;
    }
    function lineChart(pts) {
      const W = 340, H = 130, mx = Math.max(10, ...pts.map(p => p.v)) * 1.15, n = pts.length, X = i => 16 + i * (W - 32) / Math.max(1, n - 1), Y = v => H - 22 - (H - 34) * v / mx;
      const c = tok('--chart-line', '#2f6b4f'), txt = tok('--chart-text', '#5a645d'), line = pts.map((p, i) => X(i) + ',' + Y(p.v)).join(' ');
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="주간 음주량 변화 선그래프"><polygon points="${X(0)},${H - 22} ${line} ${X(n - 1)},${H - 22}" fill="${c}" opacity=".08"/><polyline points="${line}" fill="none" stroke="${c}" stroke-width="2.400" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.v)}" r="3.400" fill="#fff" stroke="${c}" stroke-width="2"/>${i % 2 === 0 || n < 7 ? `<text x="${X(i)}" y="${H - 6}" font-size="9" fill="${txt}" text-anchor="middle">${p.lab}</text>` : ''}`).join('')}</svg>`;
    }
    function statsView() {
      const r = stats.periodRange(S.statP, S.statOff), s = stats.summarize(store, r), ps = stats.summarize(store, stats.periodRange(S.statP, S.statOff - 1));
      const lim = GUIDE.thresholds(store.profile), today = calc.todayS();
      let items, chartTitle, thr = null, thrLabel = '';
      if (S.statP === 'year') { chartTitle = '월별 순수 알코올'; items = Array.from({ length: 12 }, (_, m) => { const y = r.from.slice(0, 4); let v = 0; stats.daysIn({ from: `${y}-${calc.pad(m + 1)}-01`, to: calc.fmt(new Date(+y, m + 1, 0)) }).forEach(d => v += store.gOf(d)); return { v, lab: m + 1 }; }); }
      else if (S.statP === 'month') {
        chartTitle = '주차별 순수 알코올'; thr = lim.weekG; thrLabel = '주간 참고 기준';
        items = []; for (let i = 0; i < s.days.length; i += 7) { const ds = s.days.slice(i, i + 7), v = ds.reduce((a, d) => a + store.gOf(d), 0); items.push({ v, lab: `${i / 7 + 1}주차`, warn: v > lim.weekG, now: ds.includes(today) && !(v > lim.weekG) }); }
      } else { chartTitle = '요일별 순수 알코올'; thr = lim.dayG; thrLabel = '하루 참고 기준'; items = s.days.map(d => ({ v: store.gOf(d), lab: calc.WD[calc.parse(d).getDay()], warn: store.entriesOf(d).length && store.analyze(d).level === 'warn', now: d === today })); }
      const delta = stats.changePct(s.total, ps.total), prevName = S.statP === 'week' ? '지난주' : S.statP === 'month' ? '지난달' : '작년';
      const wk = stats.weeklySeries(store, 12).map(p => ({ v: p.v, lab: (calc.parse(p.end).getMonth() + 1) + '/' + calc.parse(p.end).getDate() }));
      const prods = Object.values(s.byProd).sort((a, b) => b.g - a.g).slice(0, 3), mxp = prods[0] ? prods[0].g : 1;
      const rate = s.days.length ? Math.round(s.drink.length / s.days.length * 100) : 0;
      const insight = !s.drink.length ? '이 기간에 기록된 음주가 없어요.' : ps.total ? `${prevName}보다 총 순수 알코올이 ${Math.abs(delta)}% ${delta < 0 ? '줄었어요' : delta > 0 ? '늘었어요' : '같아요'}.` : `${prevName} 기록이 없어 비교할 수 없어요.`;
      const kpi = (label, val, unit, sub, ic, cls) => `<div class="kpi ${cls || ''}"><div class="kpi-top"><small>${label}</small>${ic ? `<span class="kic">${I[ic]}</span>` : ''}</div><b>${val}</b>${unit ? `<em>${unit}</em>` : ''}${sub ? `<small class="ks">${sub}</small>` : ''}</div>`;
      return `${topbar()}
        <div class="page-head"><div><small>밸런스 리포트</small><h1>음주 통계</h1></div><div class="seg">${[['week', '주'], ['month', '월'], ['year', '년']].map(([k, n]) => `<button class="${S.statP === k ? 'on' : ''}" data-act="statP" data-v="${k}">${n}</button>`).join('')}</div></div>
        <div class="range-nav"><button class="icon-btn" data-act="statOff" data-v="-1" aria-label="이전">${I.prev}</button><span class="range-label">${I.cal}${r.label}</span><button class="icon-btn" data-act="statOff" data-v="1" aria-label="다음" ${S.statOff >= 0 ? 'disabled' : ''}>${I.next}</button></div>
        <section class="card note-card soft"><span class="round">${I.leaf}</span><div><h4>${esc(r.label)} 요약</h4><p>${esc(insight)}</p></div></section>
        <div class="kpis">${kpi('총 음주 횟수', s.drink.length, '회', `기간 중 ${rate}%`, 'glass')}${kpi('총 순수 알코올', r1(s.total), 'g', '', 'drop')}
          ${kpi('음주일 평균', r1(s.avg), 'g/일', '음주한 날 기준', 'day')}${kpi('경고 횟수', s.warn, '회', s.warn ? '이유는 캘린더에서 확인' : '경고 없음', 'bell', s.warn ? 'warn' : '')}
          ${kpi('금주 기록일', s.sober.length, '일', '직접 기록한 날만 집계', 'check')}${kpi(prevName + ' 대비', delta == null ? '–' : (delta > 0 ? '+' : '') + delta, delta == null ? '' : '%', ps.total ? `${r1(Math.abs(s.total - ps.total))}g ${s.total < ps.total ? '덜' : '더'} 마셨어요` : '비교할 기록 없음', 'stats')}
          ${kpi('최장 연속 음주', s.maxDrink, '일', '', 'glass')}${kpi('최장 연속 금주', s.maxSober, '일', '금주 기록 기준', 'leaf')}</div>
        <div class="stat-grid"><section class="card"><h3 class="card-h">${chartTitle}</h3>${barChart(items, thr, thrLabel)}</section>
        <section class="card"><h3 class="card-h">주종별 알코올 비율</h3>${donut(s.byCat)}</section>
        <section class="card"><h3 class="card-h">음주 습관 변화 추이</h3><p class="card-p">최근 12주, 7일 합계(g)</p>${lineChart(wk)}</section>
        <section class="card"><h3 class="card-h">자주 마신 제품 TOP 3</h3>${prods.length ? prods.map((p, i) => `<div class="top-row"><span class="ptile xs">${img(p.icon, 1, { h: SIZE.stat, shadowRx: 9 })}</span><div class="sp"><div class="top-t"><b>${i + 1}. ${esc(p.name)}</b><b>${r1(p.g)}g</b></div><small>${esc(CAT_NAME[p.cat] || '')} · 총 ${p.n}회 기록</small><div class="bar"><i style="width:${p.g / mxp * 100}%"></i></div></div></div>`).join('') : '<div class="empty">기록이 없어요.</div>'}</section></div>
        <div class="disc">기록하지 않은 날은 금주일로 계산하지 않습니다. 금주일은 직접 "금주일로 기록"을 눌러야 집계됩니다.</div>`;
    }

    /* ---------- 리포트 ---------- */
    function report() {
      const ym = calc.todayS().slice(0, 7), r = stats.periodRange('month', 0), s = stats.summarize(store, r), ps = stats.summarize(store, stats.periodRange('month', -1));
      const today = calc.todayS(), w = stats.weekCompare(store, today), lim = GUIDE.thresholds(store.profile), st = store.streak(today), sober = stats.soberStreak(store, today);
      const rep = GUIDE.report({ month: s, weekG: w.cur, profile: store.profile, streak: st }), delta = stats.changePct(s.total, ps.total);
      const kpi = (label, val, unit, tag, ic, cls) => `<div class="kpi big ${cls || ''}"><div class="kpi-top"><small>${label}</small><span class="kic">${I[ic]}</span></div><b>${val}</b>${unit ? `<em>${unit}</em>` : ''}${tag ? `<span class="pill sm ${cls || ''}">${tag}</span>` : ''}</div>`;
      return `${topbar()}
        <div class="page-head"><div><small>건강 모니터링 분석</small><h1>월간 건강 리포트</h1><p class="sub">${r.label}의 기록을 분석했어요</p></div></div>
        <section class="card summary"><span class="round lg">${I.leaf}</span><div><small class="pill mint sm">${r.label} 요약</small><h3>${esc(rep.headline)}</h3><p>${esc(rep.body)}</p></div></section>
        <div class="muted-h">주요 지표 요약 <small>${r.from.replace(/-/g, '.')} ~ ${r.to.replace(/-/g, '.')}</small></div>
        <div class="kpis">${kpi('이번 달 순수 알코올', r1(s.total), 'g', delta == null ? '' : `전월 대비 ${delta > 0 ? '+' : ''}${delta}%`, 'drop')}
          ${kpi('최근 7일 합계', r1(w.cur), 'g', w.cur > lim.weekG ? '주간 참고 기준 초과' : '주간 참고 기준 이내', 'day', w.cur > lim.weekG ? 'warn' : '')}
          ${kpi('음주일 / 경고', `${s.drink.length}<small class="slash">일 / ${s.warn}회</small>`, '', '', 'glass', s.warn ? 'warn' : '')}
          ${kpi('현재 연속 금주', sober, '일째', sober ? '금주 기록 기준' : '', 'leaf')}</div>
        <section class="card"><h3 class="card-h">몸에 미치는 영향 <small>공식 지침 기반 참고 정보</small></h3>${GUIDE.TOPICS.map(t => `<div class="topic"><div class="em">${t.emoji}</div><div><h4>${esc(t.title)}</h4><p>${esc(t.text)}</p>${rep.notes[t.k] ? `<p class="topic-note">${esc(rep.notes[t.k])}</p>` : ''}</div></div>`).join('')}</section>
        <section class="card"><h3 class="card-h">음주 판단 기준</h3><p class="card-p">현재 설정: ${esc(lim.label)}</p><ul class="crit">${GUIDE.CRITERIA.map(c => `<li>${esc(c.text)} <span class="sub">(${esc(c.org)}${c.year ? ', ' + esc(c.year) : ''})</span></li>`).join('')}</ul></section>
        <section class="card"><h3 class="card-h">출처</h3><div class="src">${srcList(GUIDE.SOURCES)}</div></section>
        <div class="disc">${esc(GUIDE.DISCLAIMER)}</div>`;
    }

    /* ---------- 설정 ---------- */
    function settings() {
      const pf = store.profile, info = ctx.storageInfo();
      return `${topbar()}<div class="page-head"><div><h1>설정</h1></div></div>
        <section class="card"><h3 class="card-h">내 정보 <small>건강 기준 선택용</small></h3><div class="note">이 정보는 이 기기(또는 내 서버)에만 저장되며 외부로 전송되지 않습니다. 선택하지 않으면 더 낮은(보수적인) 기준을 사용합니다.</div>
          <div class="field"><span>성별</span><div class="chips">${[['unset', '선택 안 함'], ['female', '여성'], ['male', '남성']].map(([k, n]) => `<button class="chip ${pf.sex === k ? 'on' : ''}" data-act="sex" data-v="${k}">${n}</button>`).join('')}</div></div>
          <label class="field"><span>나이 (선택)</span><input id="ageIn" inputmode="numeric" value="${esc(pf.age)}" placeholder="예: 34"></label>
          <label class="chk"><input type="checkbox" id="pregIn" ${pf.pregnant ? 'checked' : ''}> 임신 중이거나 임신을 계획 중입니다</label></section>
        <section class="card"><h3 class="card-h">제품 값 초기화</h3><div class="note">기록할 때 수정해서 저장한 도수·용량을 모두 기본값으로 되돌립니다. (과거 기록은 바뀌지 않습니다.)</div><button class="btn ghost" data-act="resetOv">수정한 제품 값 초기화</button></section>
        <section class="card"><h3 class="card-h">직접 추가한 제품 (${store.custom.length})</h3>${store.custom.map(c => `<div class="ent"><div class="t"><b>${esc(c.name)}</b><span>${esc(CAT_NAME[c.cat] || '')} · ${c.abv}%</span></div><button class="btn danger sm" data-act="delCustom" data-v="${c.id}">삭제</button></div>`).join('') || '<div class="note">없음</div>'}</section>
        <section class="card"><h3 class="card-h">데이터</h3><div class="note">저장 위치: <b>${info.mode === 'remote' ? '내 PC의 서버 (server/data/db.json)' : '이 브라우저(localStorage)'}</b>. 외부로 전송되지 않습니다. 다른 곳으로 옮기려면 백업 파일을 사용하세요.</div>
          <div class="row gap8 wrap"><button class="btn ghost sm" data-act="export">백업 내보내기</button><label class="btn ghost sm pointer">백업 가져오기<input type="file" id="importIn" accept="application/json" hidden></label><button class="btn danger sm" data-act="wipe">전체 삭제</button></div></section>
        <section class="card"><h3 class="card-h">이미지·정보 안내</h3><div class="note">이미지가 없는 제품은 임시로 직접 그린 일러스트를 보여 줍니다. 용량·도수는 2026-11-27 조사한 참고값이며 제조사 공식 값이 아닌 항목이 많으니 라벨을 확인해 수정해 주세요.</div></section>
        <div class="disc">${esc(GUIDE.DISCLAIMER)}</div>`;
    }

    return { nav, cal, rec, amount, amountLive, day, warn, custom, stats: statsView, report, settings };
  }
  DB.createViews = createViews;
})(typeof window !== 'undefined' ? window : globalThis);
