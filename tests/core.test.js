// 실행: node --test tests/   (의존성 없음, Node 18+)
const test = require('node:test'), assert = require('node:assert/strict');
const calc = require('../js/core/calc.js');
const { createStore } = require('../js/core/store.js');
const { createDraft } = require('../js/core/draft.js');
const stats = require('../js/core/stats.js');
const { PRODUCTS } = require('../js/data/products.js');
const guide = require('../js/data/guidelines.js');

const memAdapter = () => { let saved = null; return { name: 'mem', async load() { return saved; }, async save(s) { saved = JSON.parse(JSON.stringify(s)); }, get saved() { return saved; } }; };
async function newStore(profile) {
  const adapter = memAdapter();
  const store = createStore({ adapter, products: PRODUCTS, guide });
  await store.load();
  if (profile) store.setProfile(profile);
  return { store, adapter };
}
// 기록 헬퍼: 제품 id, 단위 인덱스, 분량 → 저장
function drink(store, date, pid, unitIdx, qty, abv) {
  const dr = createDraft(store, pid, { date });
  dr.setUnit(unitIdx); dr.preset(qty); if (abv != null) dr.setAbv(abv);
  const r = dr.commit(); assert.ok(r.entry, JSON.stringify(r)); return r.entry;
}

test('순수 알코올 계산 - 요청서의 예시', () => {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≠ ${b}`);
  near(calc.gramOf(360, 16), 45.45);   // 소주 한 병
  near(calc.gramOf(180, 16), 22.72);   // 반병
  near(calc.gramOf(120, 16), 15.15);   // 1/3병
  near(calc.gramOf(500, 5), 19.73);    // 맥주 500mL 한 캔
  near(calc.gramOf(180, 16) + calc.gramOf(500, 5), 42.45); // 같은 날 합산
});

test('분량 표기', () => {
  assert.equal(calc.fmtQty(0.5), '½'); assert.equal(calc.fmtQty(1 / 3), '⅓'); assert.equal(calc.fmtQty(0.75), '¾');
  assert.equal(calc.fmtQty(1.5), '1.5'); assert.equal(calc.fmtQty(2), '2'); assert.equal(calc.fmtQty(0.37), '0.37');
  assert.equal(calc.qtyLabel({ t: 'bottle', qty: 0.5 }), '½병');
  assert.equal(calc.qtyLabel({ t: 'can', qty: 1 }), '1캔');
  assert.equal(calc.qtyLabel({ t: 'ml', qty: 180 }), '180mL');
});

test('기록 저장·합산: 참이슬 반병 + 카스 1캔 같은 날', async () => {
  const { store } = await newStore();
  drink(store, '2026-11-26', 'chamisul-fresh', 0, 0.5);       // 360mL 15.7% 반병
  drink(store, '2026-11-26', 'cass', 1, 1);                    // 캔 500mL 4.5%
  const es = store.entriesOf('2026-11-26');
  assert.equal(es.length, 2);
  assert.ok(Math.abs(es[0].g - 180 * 15.7 / 100 * 0.789) < 1e-9);
  assert.ok(Math.abs(store.gOf('2026-11-26') - (es[0].g + es[1].g)) < 1e-9);
  assert.equal(es[0].icon, 'chamisul-fresh'); assert.equal(es[1].icon, 'cass');
  const ag = calc.aggregate(es); assert.equal(ag.length, 2);
});

test('도수 미확인 제품은 입력 전 저장 불가, 입력하면 기본값으로 기억', async () => {
  const { store } = await newStore();
  const dr = createDraft(store, 'daesun', { date: '2026-11-26' });
  assert.equal(dr.validate().field, 'abv');
  assert.equal(dr.commit().error.field, 'abv');
  assert.equal(store.entriesOf('2026-11-26').length, 0);
  dr.setAbv('16.9'); assert.ok(dr.commit().entry);
  assert.equal(store.effAbv(store.getProduct('daesun')), 16.9); // 다음부터 자동
  const dr2 = createDraft(store, 'daesun', { date: '2026-11-27' }); assert.equal(dr2.abv, 16.9);
});

test('수정·삭제와 금주 표시', async () => {
  const { store } = await newStore();
  const d = '2026-11-20';
  const e = drink(store, d, 'chamisul-fresh', 0, 1);
  // 수정: 반병으로
  const dr = createDraft(store, 'chamisul-fresh', { date: d, entry: e }); dr.preset(0.5);
  assert.ok(dr.commit().entry); assert.equal(store.entriesOf(d).length, 1); assert.equal(store.entriesOf(d)[0].qty, 0.5);
  // 삭제
  assert.ok(store.deleteEntry(d, e.id)); assert.equal(store.entriesOf(d).length, 0); assert.equal(store.dayOf(d), undefined);
  // 금주 기록 후 음주 기록하면 금주 해제
  assert.equal(store.toggleSober(d), true); assert.ok(store.isRecorded(d));
  drink(store, d, 'cass', 0, 1, 4.5); assert.equal(store.dayOf(d).sober, false);
});

test('과거 기록은 제품 도수를 바꿔도 유지(스냅샷)', async () => {
  const { store } = await newStore();
  const e = drink(store, '2026-11-01', 'cass', 1, 1);
  const g0 = e.g;
  const p = store.getProduct('cass'); store.saveOverride(p, p.units[1], 9, 500);
  assert.equal(store.entriesOf('2026-11-01')[0].g, g0);
  assert.equal(store.effAbv(p), 9);
});

test('위험도 분석: 하루 기준, 주간 기준, 증상, 임신', async () => {
  const { store } = await newStore(); // 성별 미선택 → 더 낮은 기준(하루 42g 초과)
  drink(store, '2026-11-10', 'chamisul-fresh', 0, 1, 16); // 45.4g
  assert.equal(store.analyze('2026-11-10').level, 'warn');
  drink(store, '2026-11-11', 'chamisul-fresh', 0, 0.5, 16); // 22.7g — 하루/주간 모두 이내
  // 11-11 의 7일 합계: 45.4+22.7=68.1 > 56(주간, 여성/미선택) → 주간 경고
  assert.equal(store.analyze('2026-11-11').level, 'warn');
  assert.ok(store.analyze('2026-11-11').reasons.some(r => /7일/.test(r.text)));
  // 남성 기준: 하루 56g, 주간 112g → 같은 기록이 경고 아님
  store.setProfile({ sex: 'male' });
  assert.equal(store.analyze('2026-11-10').level, 'none');
  assert.equal(store.analyze('2026-11-11').level, 'none');
  // 응급 증상 → 경고 + emergency
  store.toggleSymptom('2026-11-11', 'breath');
  const a = store.analyze('2026-11-11'); assert.equal(a.level, 'warn'); assert.equal(a.emergency, true);
  // 임신 설정 → 음주 기록이 있으면 경고
  store.setProfile({ pregnant: true });
  assert.equal(store.analyze('2026-11-10').level, 'warn');
});

test('연속 음주 3일 이상은 앱 자체 규칙으로 안내', async () => {
  const { store } = await newStore({ sex: 'male' });
  ['2026-11-01', '2026-11-02', '2026-11-03'].forEach(d => drink(store, d, 'cass', 0, 0.25, 4.5));
  assert.equal(store.streak('2026-11-03'), 3);
  const a = store.analyze('2026-11-03'); assert.equal(a.level, 'warn');
  assert.ok(a.reasons.some(r => /연속/.test(r.text) && /앱 자체 규칙/.test(r.basis)));
  assert.equal(store.analyze('2026-11-02').level, 'none');
});

test('통계: 기록 없는 날은 금주로 세지 않고, 이전 기간과 비교', async () => {
  const { store } = await newStore({ sex: 'male' });
  drink(store, '2026-11-02', 'chamisul-fresh', 0, 0.5, 16);
  drink(store, '2026-11-03', 'cass', 1, 1, 5);
  store.toggleSober('2026-11-05');
  const r = stats.periodRange('month', 0, '2026-11-27'), s = stats.summarize(store, r, '2026-11-27');
  assert.equal(r.label, '2026년 11월');
  assert.equal(s.drink.length, 2); assert.equal(s.sober.length, 1);            // 11-05 만 금주 (나머지 미기록)
  assert.ok(Math.abs(s.total - (calc.gramOf(180, 16) + calc.gramOf(500, 5))) < 1e-9);
  assert.equal(s.maxDrink, 2); assert.equal(s.maxSober, 1);
  assert.deepEqual(Object.keys(s.byCat).sort(), ['beer', 'soju']);
  const prev = stats.summarize(store, stats.periodRange('month', -1, '2026-11-27'), '2026-11-27');
  assert.equal(prev.total, 0); assert.equal(stats.changePct(s.total, prev.total), null);
  const w = stats.periodRange('week', 0, '2026-11-27'); assert.equal(w.from, '2026-11-22'); assert.equal(w.to, '2026-11-28');
  assert.equal(stats.periodRange('year', 0, '2026-11-27').to, '2026-12-31');
  assert.equal(stats.weeklySeries(store, 12, '2026-11-27').length, 12);
});

test('직접 추가 제품·즐겨찾기·최근 기록', async () => {
  const { store } = await newStore();
  const id = store.addCustom({ name: '내 수제맥주', cat: 'beer', abv: 6, unit: 'can', ml: 355 });
  const p = store.getProduct(id); assert.equal(p.name, '내 수제맥주'); assert.equal(store.imageId(p, 'can'), 'custom-can');
  drink(store, '2026-11-04', id, 0, 1);
  assert.ok(Math.abs(store.entriesOf('2026-11-04')[0].g - calc.gramOf(355, 6)) < 1e-9);
  assert.equal(store.recent[0], id);
  store.toggleFav('cass'); assert.deepEqual(store.fav, ['cass']); store.toggleFav('cass'); assert.deepEqual(store.fav, []);
  store.deleteCustom(id); assert.equal(store.getProduct(id), undefined);
});

test('mL 직접 입력', async () => {
  const { store } = await newStore();
  const dr = createDraft(store, 'chamisul-fresh', { date: '2026-11-06' });
  dr.setUnit('ml'); dr.customQty(150);
  const n = dr.numbers(); assert.equal(n.totalMl, 150); assert.ok(Math.abs(n.g - calc.gramOf(150, 15.7)) < 1e-9); assert.equal(n.fill, 150 / 360);
  assert.ok(dr.commit().entry);
  const e = store.entriesOf('2026-11-06')[0]; assert.equal(e.t, 'ml'); assert.equal(calc.qtyLabel(e), '150mL');
});

test('저장·불러오기·가져오기·초기화', async () => {
  const { store, adapter } = await newStore();
  drink(store, '2026-11-08', 'cass', 0, 1, 4.5); await store.flush();
  assert.equal(Object.keys(adapter.saved.days).length, 1);
  const json = store.exportJSON();
  store.wipe(); assert.equal(store.entriesOf('2026-11-08').length, 0);
  store.importData(JSON.parse(json)); assert.equal(store.entriesOf('2026-11-08').length, 1);
  assert.throws(() => store.importData({ nope: 1 }));
  // 새 스토어가 저장된 데이터를 읽는다
  await store.flush();
  const s2 = createStore({ adapter, products: PRODUCTS, guide }); await s2.load();
  assert.equal(s2.entriesOf('2026-11-08').length, 1);
});

test('제품 DB: 도수·용량 미확인 값은 비어 있고, 모든 제품에 이미지 id 가 있다', () => {
  const ids = new Set(PRODUCTS.map(p => p.id)); assert.equal(ids.size, PRODUCTS.length, '제품 id 중복');
  PRODUCTS.forEach(p => { assert.ok(p.units.length, p.id); if (p.st === 'none') assert.ok(p.abv == null || p.note, p.id + ' 미확인 제품에 값이 있음'); });
  assert.equal(PRODUCTS.find(p => p.id === 'chamisul-original').abv, null);
});

test('캘린더 날짜 상태(dayStatus)·연속 금주·최근 7일 비교', async () => {
  const { store } = await newStore({ sex: 'male' });
  drink(store, '2026-11-20', 'cass', 1, 1, 4.5);                 // 기준 이내
  drink(store, '2026-11-21', 'jack-daniels', 0, 1, 40);          // 700mL 40% = 220g → 경고
  store.toggleSober('2026-11-23'); store.toggleSober('2026-11-24'); store.toggleSober('2026-11-25');
  assert.equal(store.dayStatus('2026-11-20'), 'ok');
  assert.equal(store.dayStatus('2026-11-21'), 'warn');
  assert.equal(store.dayStatus('2026-11-23'), 'sober');
  assert.equal(store.dayStatus('2026-11-22'), 'none');            // 미기록은 금주가 아님
  assert.equal(stats.soberStreak(store, '2026-11-25'), 3);
  assert.equal(stats.soberStreak(store, '2026-11-26'), 3);        // 오늘 미기록이면 어제부터
  assert.equal(stats.soberStreak(store, '2026-11-22'), 0);
  const w = stats.weekCompare(store, '2026-11-26');
  assert.equal(w.sober, 3); assert.ok(Math.abs(w.cur - (calc.gramOf(500, 4.5) + calc.gramOf(700, 40))) < 1e-9);
  assert.equal(w.prev, 0); assert.equal(w.pct, null);
});

test('경고 누적 횟수에 따라 단계와 권장 행동이 달라진다', () => {
  const guide = require('../js/data/guidelines.js');
  const t1 = guide.advise({ monthWarn: 1, yearWarn: 1, monthDrink: 3 });
  const t2 = guide.advise({ monthWarn: 3, yearWarn: 5, monthDrink: 8 });
  const t3a = guide.advise({ monthWarn: 4, yearWarn: 6, monthDrink: 12 });
  const t3b = guide.advise({ monthWarn: 1, yearWarn: 12, monthDrink: 2 });
  assert.deepEqual([t1.tier, t2.tier, t3a.tier, t3b.tier], [1, 2, 3, 3]);
  assert.ok(/3번째/.test(t2.headline) && /4회/.test(t3a.headline) && /올해 경고 12회/.test(t3b.headline));
  assert.ok(t1.actions.length < t3a.actions.length && t1.actions.join() !== t2.actions.join());
  assert.ok(t3a.actions.some(x => /AUDIT-K/.test(x)));
  assert.equal(guide.RISKS.length, 4);
  guide.RISKS.forEach(r => r.papers.forEach(k => assert.ok(guide.PAPERS[k] && /^https:\/\//.test(guide.PAPERS[k].url), k)));
});

test('사진: 기록에 id 로 붙이고(개수 제한 없음) 지우면 빈 날은 정리된다', async () => {
  const { store: s } = await newStore();
  for (let i = 0; i < 12; i++) s.addPhoto('2026-11-10', 'p' + i);
  s.addPhoto('2026-11-10', 'p0'); // 같은 id 중복 방지
  assert.equal(s.photosOf('2026-11-10').length, 12);
  assert.equal(s.isRecorded('2026-11-10'), false); // 사진만 있는 날은 기록/금주로 세지 않음
  for (let i = 0; i < 12; i++) s.removePhoto('2026-11-10', 'p' + i);
  assert.equal(s.dayOf('2026-11-10'), undefined);
  s.toggleSober('2026-11-11'); s.addPhoto('2026-11-11', 'x'); s.toggleSober('2026-11-11');
  assert.deepEqual(s.photosOf('2026-11-11'), ['x']); // 사진이 있으면 금주 취소해도 날이 남음
});

test('주간 목표 진행·금주 배지', async () => {
  const { store: s } = await newStore();
  assert.deepEqual(stats.goalProgress(s, '2026-11-25'), []);              // 목표 없으면 비어 있음
  s.setGoals({ weekDays: '2', weekG: 100 });
  assert.deepEqual(s.goals, { weekDays: 2, weekG: 100 });
  s.setGoals({ weekDays: -3 }); assert.equal(s.goals.weekDays, null);     // 음수는 목표 없음
  s.setGoals({ weekDays: 99 }); assert.equal(s.goals.weekDays, 7);       // 주 7일 상한
  s.setGoals({ weekDays: 2 });
  // 2026-11-25(수) 기준 이번 주: 11-22(일)~11-28. 11-23, 11-24에 각 소주 반병(약 22g), 11-27은 미래라 집계 제외
  drink(s, '2026-11-23', 'chamisul-fresh', 0, 0.5); drink(s, '2026-11-24', 'chamisul-fresh', 0, 0.5); drink(s, '2026-11-27', 'chamisul-fresh', 0, 0.5);
  const p = stats.goalProgress(s, '2026-11-25'), d = p.find(x => x.key === 'days'), g = p.find(x => x.key === 'g');
  assert.equal(d.cur, 2); assert.equal(d.met, true); assert.equal(d.over, false); assert.equal(d.pct, 100);
  assert.ok(g.cur > 40 && g.cur < 48 && g.pct < 50 && !g.over, JSON.stringify(g));
  drink(s, '2026-11-25', 'chamisul-fresh', 0, 0.5);
  assert.equal(stats.goalProgress(s, '2026-11-25').find(x => x.key === 'days').over, true);
  // 배지: 11-10~11-16 7일 연속 금주 기록 → 3·7일 배지
  for (let i = 10; i <= 16; i++) s.toggleSober('2026-11-' + i);
  const b = stats.badges(s, '2026-11-25');
  assert.equal(stats.longestSober(s), 7); assert.deepEqual(b.earned, [3, 7]); assert.equal(b.cur, 0); assert.equal(b.next, 3);
});
