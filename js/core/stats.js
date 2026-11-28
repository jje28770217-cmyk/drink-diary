/* core/stats.js - 주간·월간·연간 통계 (화면과 무관) */
(function (root) {
  'use strict';
  const dep = n => (typeof module !== 'undefined' && module.exports) ? require('./' + n) : root.DB[n];
  const calc = dep('calc');

  /** kind: 'week' | 'month' | 'year', off: 0=이번, -1=이전 … */
  function periodRange(kind, off, today) {
    const t = calc.parse(today || calc.todayS());
    if (kind === 'week') { const d = new Date(t); d.setDate(d.getDate() - d.getDay() + off * 7); const a = calc.fmt(d); const b = calc.addDays(a, 6); return { from: a, to: b, label: `${calc.niceDate(a)} ~ ${calc.niceDate(b)}` }; }
    if (kind === 'month') { const d = new Date(t.getFullYear(), t.getMonth() + off, 1); return { from: calc.fmt(d), to: calc.fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0)), label: `${d.getFullYear()}년 ${d.getMonth() + 1}월` }; }
    const y = t.getFullYear() + off; return { from: `${y}-01-01`, to: `${y}-12-31`, label: `${y}년` };
  }
  function daysIn(r) { const out = []; let d = r.from; while (d <= r.to) { out.push(d); d = calc.addDays(d, 1); } return out; }

  /** store: core/store 인스턴스. 미래 날짜는 집계하지 않음. 기록 없는 날은 첫 기록일 이후·오늘 이전이면 자동으로 금주로 셈(store.isSober) */
  function summarize(store, r, today) {
    today = today || calc.todayS();
    const days = daysIn(r), past = days.filter(d => d <= today);
    const drink = past.filter(d => store.entriesOf(d).length);
    const sober = past.filter(d => store.isSober(d, today));
    const total = drink.reduce((a, d) => a + store.gOf(d), 0);
    const warn = drink.filter(d => store.analyze(d).level === 'warn').length;
    const byCat = {}, byProd = {};
    drink.forEach(d => store.entriesOf(d).forEach(e => {
      byCat[e.cat] = (byCat[e.cat] || 0) + e.g;
      const o = byProd[e.pid] || (byProd[e.pid] = { name: e.name, icon: e.icon, cat: e.cat, g: 0, ml: 0, n: 0 }); o.g += e.g; o.ml += e.ml; o.n++;
    }));
    let mlSum = 0, mlAbv = 0;   // 평균 도수(마신 양 가중): 소주 반병과 맥주 한 캔처럼 양이 다른 술을 공정하게 평균
    drink.forEach(d => store.entriesOf(d).forEach(e => { mlSum += e.ml; mlAbv += e.ml * e.abv; }));
    let ds = 0, sb = 0, maxDrink = 0, maxSober = 0;
    past.forEach(d => {
      if (store.entriesOf(d).length) { ds++; sb = 0; maxDrink = Math.max(maxDrink, ds); }
      else if (store.isSober(d, today)) { sb++; ds = 0; maxSober = Math.max(maxSober, sb); }
      else { ds = 0; sb = 0; }
    });
    return { days, drink, sober, total, warn, byCat, byProd, avg: drink.length ? total / drink.length : 0, maxDrink, maxSober, ml: mlSum, abvAvg: mlSum ? mlAbv / mlSum : null };
  }
  /** 최근 n주(7일 합계) 추이: 오늘부터 7일 간격 */
  function weeklySeries(store, n, today) {
    today = today || calc.todayS(); const out = [];
    for (let i = n - 1; i >= 0; i--) { const e = calc.addDays(today, -i * 7); out.push({ end: e, v: calc.r1(store.weekSum(e)) }); }
    return out;
  }
  /** 이전 기간 대비 변화율(%) — 이전 기간 합계가 0이면 null */
  const changePct = (cur, prev) => prev ? Math.round((cur - prev) / prev * 100) : null;

  /** 현재 연속 금주 일수(자동 금주 포함). 오늘 마셨으면 0, 오늘이 아직 미기록이면 어제부터 셈 */
  function soberStreak(store, today) {
    today = today || calc.todayS();
    let d = today, n = 0;
    if (store.entriesOf(d).length) return 0;
    if (!store.isSober(d, today)) d = calc.addDays(d, -1);
    while (store.isSober(d, today)) { n++; d = calc.addDays(d, -1); }
    return n;
  }
  /** 최근 7일과 그 앞 7일 비교 + 최근 7일 금주 기록 일수 */
  function weekCompare(store, today) {
    today = today || calc.todayS();
    const cur = store.weekSum(today), prev = store.weekSum(calc.addDays(today, -7));
    let sober = 0; for (let i = 0; i < 7; i++) { const d = calc.addDays(today, -i); if (store.isSober(d, today)) sober++; }
    return { cur, prev, pct: changePct(cur, prev), sober };
  }

  /** 금주 배지 기준(연속 금주일). 앱 자체 규칙 */
  const BADGES = [3, 7, 14, 30];
  /** 지금까지 가장 길었던 연속 금주(금주로 기록한 날, 음주 기록이 없는 날) 일수 */
  function longestSober(store, today) {
    today = today || calc.todayS(); const f = store.firstRecordDate(); if (!f) return 0;
    let best = 0, run = 0;
    for (let d = f; d <= today; d = calc.addDays(d, 1)) { if (store.isSober(d, today)) { run++; if (run > best) best = run; } else run = 0; }
    return best;
  }
  /** 이번 주(일~토) 목표 진행. 설정한 목표만 돌려줌: [{key,label,cur,max,unit,pct,over,met}] */
  function goalProgress(store, today) {
    today = today || calc.todayS();
    const g = store.goals, days = daysIn(periodRange('week', 0, today)).filter(d => d <= today), drink = days.filter(d => store.entriesOf(d).length);
    const total = drink.reduce((a, d) => a + store.gOf(d), 0), out = [];
    const item = (key, label, cur, max, unit) => ({ key, label, cur, max, unit, pct: max > 0 ? Math.min(100, Math.round(cur / max * 100)) : (cur > 0 ? 100 : 0), over: cur > max, met: cur === max });
    if (g.weekDays != null) out.push(item('days', '이번 주 음주일', drink.length, g.weekDays, '일'));
    if (g.weekG != null) out.push(item('g', '이번 주 순수 알코올', calc.r1(total), g.weekG, 'g'));
    return out;
  }
  /** 금주 배지: 현재 연속, 최장 연속, 얻은 배지, 다음 배지까지 남은 일수 */
  function badges(store, today) {
    const cur = soberStreak(store, today), best = longestSober(store, today), earned = BADGES.filter(b => b <= Math.max(cur, best)), next = BADGES.find(b => b > cur);
    return { cur, best, earned, next: next || null, left: next ? next - cur : 0 };
  }

  const api = { periodRange, daysIn, summarize, weeklySeries, changePct, soberStreak, weekCompare, BADGES, longestSober, goalProgress, badges };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).stats = api;
})(typeof window !== 'undefined' ? window : globalThis);
