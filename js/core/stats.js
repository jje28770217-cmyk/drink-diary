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

  /** store: core/store 인스턴스. 미래 날짜는 집계하지 않고, 기록하지 않은 날은 금주로 세지 않음 */
  function summarize(store, r, today) {
    today = today || calc.todayS();
    const days = daysIn(r), past = days.filter(d => d <= today);
    const drink = past.filter(d => store.entriesOf(d).length);
    const sober = past.filter(d => !store.entriesOf(d).length && store.dayOf(d) && store.dayOf(d).sober);
    const total = drink.reduce((a, d) => a + store.gOf(d), 0);
    const warn = drink.filter(d => store.analyze(d).level === 'warn').length;
    const byCat = {}, byProd = {};
    drink.forEach(d => store.entriesOf(d).forEach(e => {
      byCat[e.cat] = (byCat[e.cat] || 0) + e.g;
      const o = byProd[e.pid] || (byProd[e.pid] = { name: e.name, icon: e.icon, cat: e.cat, g: 0, ml: 0, n: 0 }); o.g += e.g; o.ml += e.ml; o.n++;
    }));
    let ds = 0, sb = 0, maxDrink = 0, maxSober = 0;
    past.forEach(d => {
      if (store.entriesOf(d).length) { ds++; sb = 0; maxDrink = Math.max(maxDrink, ds); }
      else if (store.dayOf(d) && store.dayOf(d).sober) { sb++; ds = 0; maxSober = Math.max(maxSober, sb); }
      else { ds = 0; sb = 0; }
    });
    return { days, drink, sober, total, warn, byCat, byProd, avg: drink.length ? total / drink.length : 0, maxDrink, maxSober };
  }
  /** 최근 n주(7일 합계) 추이: 오늘부터 7일 간격 */
  function weeklySeries(store, n, today) {
    today = today || calc.todayS(); const out = [];
    for (let i = n - 1; i >= 0; i--) { const e = calc.addDays(today, -i * 7); out.push({ end: e, v: calc.r1(store.weekSum(e)) }); }
    return out;
  }
  /** 이전 기간 대비 변화율(%) — 이전 기간 합계가 0이면 null */
  const changePct = (cur, prev) => prev ? Math.round((cur - prev) / prev * 100) : null;

  /** 현재 연속 금주(금주로 기록한 날)일 수. 오늘이 미기록이면 어제부터 셈 */
  function soberStreak(store, today) {
    today = today || calc.todayS();
    let d = today, n = 0;
    if (!store.isRecorded(d)) d = calc.addDays(d, -1);
    while (store.dayOf(d) && store.dayOf(d).sober && !store.entriesOf(d).length) { n++; d = calc.addDays(d, -1); }
    return n;
  }
  /** 최근 7일과 그 앞 7일 비교 + 최근 7일 금주 기록 일수 */
  function weekCompare(store, today) {
    today = today || calc.todayS();
    const cur = store.weekSum(today), prev = store.weekSum(calc.addDays(today, -7));
    let sober = 0; for (let i = 0; i < 7; i++) { const d = calc.addDays(today, -i); if (store.dayOf(d) && store.dayOf(d).sober && !store.entriesOf(d).length) sober++; }
    return { cur, prev, pct: changePct(cur, prev), sober };
  }

  const api = { periodRange, daysIn, summarize, weeklySeries, changePct, soberStreak, weekCompare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).stats = api;
})(typeof window !== 'undefined' ? window : globalThis);
