const { launch, sleep } = require('./cdp.js');
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
// 실행: node tests/e2e/e2e.js   (npm run test:e2e) — Edge 또는 Chrome 필요. 실제 기록(localStorage, server/data)은 건드리지 않음
const PROJ = path.resolve(__dirname, '../..').split(path.sep).join('/');
const SP = fs.mkdtempSync(path.join(os.tmpdir(), 'drink-e2e-'));

async function scenario(b, url, label, expectRemote) {
  const R = []; const ok = (n, c, x) => R.push((c ? 'PASS ' : 'FAIL ') + n + (x ? '  [' + x + ']' : ''));
  await b.goto(url);
  for (let i = 0; i < 40; i++) { if (await b.eval('!!(window.DB && DB.app)')) break; await sleep(150); }
  ok('앱 부팅', await b.eval('!!(window.DB && DB.app)'));
  await b.eval(`window.confirm=()=>true; DB.app.S.tab='cal';DB.app.render(); window.c=s=>{const e=document.querySelector(s); if(!e) throw new Error('missing '+s); e.click(); return true}; window.txt=s=>(document.querySelector(s)||{}).innerText||''; true`);
  await b.eval(`DB.app.store.wipe(); DB.app.render(); true`);
  // 1) 소주 반병
  await b.eval(`c('[data-act=tab][data-v=rec]'); c('[data-act=pick][data-v=chamisul-fresh]'); c('[data-act=qty][data-v="0.5"]'); true`);
  const val = await b.eval(`txt('#val')`); ok('분량 표시(½병, 순수 알코올)', /½병/.test(val) && /22\.3g/.test(val), val.replace(/\n/g, ' '));
  await b.eval(`c('#saveBtn')`);
  // 2) 맥주 캔 500mL
  await b.eval(`c('[data-act=pick][data-v=cass]'); c('[data-act=unit][data-v="1"]'); c('[data-act=qty][data-v="1"]'); c('#saveBtn'); true`);
  const day = await b.eval(`(()=>{const s=DB.app.S.recDate; const es=DB.app.store.entriesOf(s); return JSON.stringify({s, n:es.length, g:+DB.app.store.gOf(s).toFixed(2), names:es.map(e=>e.name+' '+e.qty+e.t)})})()`);
  const d = JSON.parse(day); ok('같은 날 2개 기록, 합산', d.n === 2 && Math.abs(d.g - (180 * 15.7 / 100 * 0.789 + 500 * 4.5 / 100 * 0.789)) < 0.01, day);
  ok('저장 직후 경고 없음(기준 이내)', await b.eval(`document.getElementById('sheetWrap').hidden`));
  // 3) 캘린더 표시
  await b.eval(`c('[data-act=tab][data-v=cal]'); true`);
  const card = await b.eval(`JSON.stringify({n:document.querySelectorAll('.day-card .day-ent').length, imgs:document.querySelectorAll('.day-card .day-ent svg.di, .day-card .day-ent img.pi').length, txt:txt('.day-card')})`);
  const cd = JSON.parse(card);
  ok('캘린더: 선택한 날 카드에 제품 이미지·분량, 칸에 표시', cd.n === 2 && cd.imgs === 2 && /½병/.test(cd.txt) && /1캔/.test(cd.txt) && await b.eval(`!!document.querySelector('.cell.today .mk.drink')`), card.slice(0, 90));
  // 4) 날짜 상세 → 수정(1병으로) → 경고
  await b.eval(`c('.cell.today'); c('[data-act=daySheet]'); true`);
  ok('상세 시트: 총 순수 알코올·하루 정보 입력칸', /총 순수 알코올/.test(await b.eval(`txt('#sheet')`)) && /시작 시간/.test(await b.eval(`txt('#sheet')`)));
  await b.eval(`c('[data-act=closeSheet]'); c('.day-card [data-act=editEntry]'); c('[data-act=qty][data-v="1"]'); c('#saveBtn'); true`);
  const warnTxt = await b.eval(`txt('#sheet')`);
  ok('수정 후 하루 기준 초과 → 경고 시트(이유·누적 횟수·권장 행동·출처)', !document_hidden(await b.eval(`document.getElementById('sheetWrap').hidden`)) && /경고가 발생한 이유/.test(warnTxt) && /판단 기준·출처 보기/.test(warnTxt) && /이번 달 경고/.test(warnTxt) && /지금 권장하는 행동/.test(warnTxt));
  await b.eval(`c('[data-act=closeSheet]'); true`);
  ok('캘린더 경고 표시(빨간 아이콘)', await b.eval(`!!document.querySelector('.cell.today.st-warn .mk.drink.warn')`));
  // 5) 삭제
  await b.eval(`c('.cell.today'); c('.day-card [data-act=delEntry]'); true`);
  ok('삭제', await b.eval(`DB.app.store.entriesOf(DB.app.S.recDate).length`) === 1);
  await b.eval(`c('[data-act=closeSheet]'); true`);
  // 6) 금주: 기록 없는 날은 첫 기록일 이후부터 자동 금주(칸 색·체크), 첫 기록 전·마신 날은 아님
  const y = await b.eval(`DB.calc.addDays(DB.calc.todayS(), -1)`), y2 = await b.eval('DB.calc.addDays(DB.calc.todayS(), -2)'), y3 = await b.eval('DB.calc.addDays(DB.calc.todayS(), -3)'), y4 = await b.eval('DB.calc.addDays(DB.calc.todayS(), -4)');
  await b.eval(`DB.app.store.saveEntry('${y3}', { id: 'e-auto', pid: 'cass', name: '카스 프레시', cat: 'beer', icon: 'cass', t: 'can', qty: 1, unitMl: 500, abv: 4.5, ml: 500, g: 17.7 }); DB.app.render(); c('[data-act=day][data-v="${y}"]'); true`);
  const sober = d => b.eval(`!!document.querySelector('[data-act=day][data-v="${d}"] .mk.sober')`), cls = d => b.eval(`document.querySelector('[data-act=day][data-v="${d}"]').className`);
  ok('기록 없는 날(어제·그제)은 자동 금주: 체크와 칸 색', (await sober(y)) && (await sober(y2)) && /st-sober/.test(await cls(y)));
  ok('첫 기록 전(4일 전)·마신 날(3일 전)은 금주가 아님', !(await sober(y4)) && !(await sober(y3)));
  ok('날짜 카드에 자동 금주 안내(금주 버튼 없음)', /자동으로 금주일/.test(await b.eval(`txt('.day-card')`)) && !(await b.eval(`!!document.querySelector('.day-card [data-act=sober]')`)));
  await b.eval(`DB.app.store.deleteEntry('${y3}', 'e-auto'); DB.app.render(); true`);
  // 7) 검색 + 이미지 파일 연결
  await b.eval(`c('[data-act=tab][data-v=rec]'); const q=document.getElementById('q'); q.value='새로'; q.dispatchEvent(new Event('input',{bubbles:true})); true`);
  const names = await b.eval(`JSON.stringify([...document.querySelectorAll('.pcard .nm')].map(x=>x.textContent))`);
  ok('제품 검색(새로 3종)', ['새로', '새로 살구', '새로 다래'].every(n => names.includes(n)), names);
  ok('이미지 파일(PNG) 연결 + contain', await b.eval(`document.querySelectorAll('.pcard img.pi').length`) >= 3 && await b.eval(`getComputedStyle(document.querySelector('img.pi')).objectFit`) === 'contain');
  // 8) 직접 추가 제품
  await b.eval(`const q2=document.getElementById('q'); q2.value=''; q2.dispatchEvent(new Event('input',{bubbles:true})); c('[data-act=addCustom]'); document.getElementById('cName').value='내 수제맥주'; document.getElementById('cMl').value='355'; document.getElementById('cAbv').value='6'; c('[data-act=cUnit][data-v=can]'); c('[data-act=saveCustom]'); true`);
  ok('직접 추가 제품 → 분량 화면', /내 수제맥주/.test(await b.eval(`txt('#amount')`)));
  await b.eval(`c('[data-act=qty][data-v="0.5"]'); c('#saveBtn'); true`);
  ok('직접 추가 제품 기록 저장', (await b.eval(`DB.app.store.entriesOf(DB.app.S.recDate).some(e=>e.name==='내 수제맥주')`)));
  // 9) 도수 미확인 제품은 입력 전 저장 불가
  await b.eval(`c('[data-act=cat][data-v=soju]'); c('[data-act=pick][data-v=daesun]'); c('#saveBtn'); true`);
  ok('도수 미확인 제품: 입력 전 저장 막힘', /도수/.test(await b.eval(`txt('#toast')`)) && !(await b.eval(`document.getElementById('amount').hidden`)));
  await b.eval(`const a=document.getElementById('abvIn'); a.value='16.9'; a.dispatchEvent(new Event('input',{bubbles:true})); c('#saveBtn'); true`);
  ok('도수 입력 후 저장', await b.eval(`DB.app.store.entriesOf(DB.app.S.recDate).some(e=>e.name==='대선' && e.abv===16.9)`));
  await b.eval(`c('[data-act=closeSheet]'); true`).catch(() => { });
  // 10) 통계/리포트/설정
  await b.eval(`c('[data-act=tab][data-v=stats]'); true`);
  const st = await b.eval(`txt('#app')`);
  ok('통계(월간)', /음주 횟수/.test(st) && /과 비교/.test(st) && !/주종별 알코올 비율/.test(st) && !/주차별 순수 알코올/.test(st) && !/최장 연속/.test(st) && /음주 습관 변화 추이/.test(st) && /자주 마신 제품 TOP 3/.test(st) && !!(await b.eval(`document.querySelectorAll('#app svg.chart').length >= 1 && document.querySelectorAll('#app .kpi').length === 4 && !!document.querySelector('#app .cmt')`)));
  // 통계 기간 선택 달력: 몇 년 전 달·연도·주로 이동
  {
    const lab = () => b.eval(`txt('.range-label')`), yr = await b.eval('+DB.calc.todayS().slice(0,4)');
    await b.eval(`c('[data-act=rangePick]'); true`);
    ok('달력 아이콘을 누르면 월 선택 달력이 펼쳐짐', /월 선택/.test(await b.eval(`txt('#sheet')`)) && (await b.eval(`document.querySelectorAll('#sheet .pick-btn').length`)) === 12);
    await b.eval(`c('[data-act=pickNav][data-v="-1"]'); c('[data-act=pickNav][data-v="-1"]'); c('[data-act=pickMonth][data-v="${yr - 2}-03"]'); true`);
    ok('2년 전 3월로 이동', new RegExp(`${yr - 2}년 3월`).test(await lab()) && (await b.eval('DB.app.S.statOff')) === (-24 + (3 - (+(await b.eval('DB.calc.todayS()')).slice(5, 7)))));
    await b.eval(`c('[data-act=statP][data-v=year]'); c('[data-act=rangePick]'); true`);
    ok('연 단위: 연도 선택 목록', /연도 선택/.test(await b.eval(`txt('#sheet')`)));
    await b.eval(`c('[data-act=pickYearSel][data-v="${yr - 1}"]'); true`);
    ok('작년으로 이동', new RegExp(`${yr - 1}년`).test(await lab()));
    await b.eval(`c('[data-act=statP][data-v=week]'); c('[data-act=rangePick]'); c('[data-act=pickNav][data-v="-1"]'); true`);
    const dd = await b.eval(`DB.calc.addDays(DB.calc.todayS(), -40)`);
    ok('주 단위: 날짜를 누르는 달력', /주 선택/.test(await b.eval(`txt('#sheet')`)) && (await b.eval(`document.querySelectorAll('#sheet .cell.pk').length > 27`)));
    await b.eval(`DB.app.S.statOff = 0; c('[data-act=closeSheet]'); c('[data-act=statP][data-v=month]'); true`);
  }
  await b.eval(`c('[data-act=statP][data-v=week]'); true`); ok('통계(주간)', /일/.test(await b.eval(`txt('#app')`)));
  await b.eval(`c('[data-act=statP][data-v=year]'); true`); ok('통계(연간)', /20\d\d년/.test(await b.eval(`txt('#app')`)));
  await b.eval(`c('[data-act=tab][data-v=report]'); true`);
  const rp = await b.eval(`txt('#app')`); ok('건강 리포트(기준·출처·면책)', /음주 판단 기준/.test(rp) && /출처/.test(rp) && /진단이나 전문의 소견이 아닙니다/.test(rp));
  await b.eval(`c('[data-act=tab][data-v=set]'); true`);
  const set = await b.eval(`txt('#app')`);
  ok('설정의 저장 위치 표시', expectRemote ? /내 PC의 서버/.test(set) : /이 브라우저/.test(set));
  // 10-2) 사진: 개수 제한 없이 추가(5장) → 화면에 표시 → 새로고침 후에도 유지 → 삭제
  const mk = `async n => { const c = document.createElement('canvas'); c.width = 2400; c.height = 1800; const g = c.getContext('2d'); g.fillStyle = 'hsl(' + (n * 60) + ',70%,50%)'; g.fillRect(0, 0, 2400, 1800); return new File([await new Promise(r => c.toBlob(r, 'image/png'))], 'p' + n + '.png', { type: 'image/png' }); }`;
  await b.eval(`c('[data-act=tab][data-v=cal]'); true`);
  const pr = await b.eval(`(async () => { const mk = ${mk}; const fs = []; for (let i = 0; i < 5; i++) fs.push(await mk(i)); return JSON.stringify(await DB.app.addPhotos(DB.calc.todayS(), fs)); })()`);
  ok('사진 5장 추가(개수 제한 없음)', JSON.parse(pr).n === 5 && JSON.parse(pr).bad === 0, pr);
  await sleep(500);
  const shown = await b.eval(`[...document.querySelectorAll('#app img[data-photo]')].filter(i => i.src.startsWith('blob:')).length`);
  ok('캘린더 날짜 카드에 사진 5장 표시', shown === 5, '표시 ' + shown);
  const dim = await b.eval(`(async () => { const id = DB.app.store.photosOf(DB.calc.todayS())[0]; const u = await DB.photos.url(id); const im = new Image(); im.src = u; await im.decode(); return im.naturalWidth + 'x' + im.naturalHeight; })()`);
  ok('사진이 긴 변 1280px 이하로 줄어 저장됨', dim === '1280x960', dim);
  await b.eval(`DB.app.store.flush()`); await sleep(400);
  // 10-3) 지난 날짜 기록: 캘린더에서 고른 날짜·날짜 칩·다른 날짜 입력이 모두 그 날짜로 저장되고 오늘로 새지 않음
  {
    const today = await b.eval(`DB.calc.todayS()`), d3 = await b.eval(`DB.calc.addDays(DB.calc.todayS(), -3)`), d2 = await b.eval(`DB.calc.addDays(DB.calc.todayS(), -2)`), d6 = await b.eval(`DB.calc.addDays(DB.calc.todayS(), -6)`);
    const cnt = d => b.eval(`DB.app.store.entriesOf('${d}').length`);
    const [t0, a0, c0, f0] = [await cnt(today), await cnt(d3), await cnt(d2), await cnt(d6)];
    await b.eval(`c('[data-act=tab][data-v=cal]'); c('[data-act=day][data-v="${d3}"]'); c('[data-act=tab][data-v=rec]'); true`);
    ok('캘린더에서 고른 날짜로 기록하기 시작', (await b.eval(`DB.app.S.recDate`)) === d3);
    await b.eval(`c('[data-act=pick][data-v=chamisul-fresh]'); true`);
    ok('분량 화면에 기록할 날짜·지난 날짜 표시', /에 기록 · 지난 날짜/.test(await b.eval(`txt('#amount')`)));
    await b.eval(`c('[data-act=qty][data-v="0.5"]'); c('#saveBtn'); true`); await sleep(300);
    ok('고른 날짜에 저장(오늘로 새지 않음)', (await cnt(d3)) === a0 + 1 && (await cnt(today)) === t0);
    await b.eval(`c('[data-act=setRecDate][data-v="${d2}"]'); c('[data-act=pick][data-v=chamisul-fresh]'); c('[data-act=qty][data-v="0.5"]'); c('#saveBtn'); true`); await sleep(300);
    ok('그제 칩으로 그제에 저장', (await cnt(d2)) === c0 + 1 && (await cnt(today)) === t0);
    await b.eval(`(() => { const i = document.getElementById('dateIn'); i.value = '${d6}'; i.dispatchEvent(new Event('change', { bubbles: true })); return 1; })()`);
    await b.eval(`c('[data-act=pick][data-v=chamisul-fresh]'); c('[data-act=qty][data-v="0.5"]'); c('#saveBtn'); true`); await sleep(300);
    ok('다른 날짜 입력으로 6일 전에 저장', (await cnt(d6)) === f0 + 1 && (await cnt(today)) === t0);
    await b.eval(`c('[data-act=tab][data-v=stats]'); c('[data-act=tab][data-v=rec]'); true`);
    ok('다른 탭에서 기록하기를 누르면 오늘로 시작', (await b.eval(`DB.app.S.recDate`)) === today);
    await b.eval(`DB.app.store.deleteEntry('${d3}', DB.app.store.entriesOf('${d3}').slice(-1)[0].id); DB.app.store.deleteEntry('${d2}', DB.app.store.entriesOf('${d2}').slice(-1)[0].id); DB.app.store.deleteEntry('${d6}', DB.app.store.entriesOf('${d6}').slice(-1)[0].id); DB.app.render(); true`);
  }
  // 10-4) 다크 모드: 설정에서 고르면 즉시 적용·저장되고, 시스템 모드는 OS 설정을 따름
  {
    const theme = () => b.eval(`document.documentElement.getAttribute('data-theme')`), bg = () => b.eval(`getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()`);
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await b.eval(`c('[data-act=tab][data-v=set]'); c('[data-act=theme][data-v=light]'); true`);
    const lightBg = await bg(); ok('라이트 선택 → 밝은 배경', (await theme()) === 'light' && /^#f/i.test(lightBg), lightBg);
    await b.eval(`c('[data-act=theme][data-v=dark]'); true`);
    const darkBg = await bg(); ok('다크 선택 → 어두운 배경, 저장됨', (await theme()) === 'dark' && /^#0/i.test(darkBg) && (await b.eval(`localStorage.getItem('drinkBalance.theme')`)) === 'dark', darkBg);
    ok('다크에서 차트·본문 색 변수가 바뀜', (await b.eval(`getComputedStyle(document.documentElement).getPropertyValue('--card').trim()`)) !== '#ffffff');
    await b.eval(`c('[data-act=theme][data-v=system]'); true`);
    ok('시스템 모드 + OS 라이트 → 라이트', (await theme()) === 'light');
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }); for (let i = 0; i < 20 && (await theme()) !== 'dark'; i++) await sleep(150); // OS 설정 변경 알림을 최대 3초 기다림
    ok('시스템 모드 + OS 다크 → 다크(자동 따라감)', (await theme()) === 'dark');
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await b.eval(`c('[data-act=theme][data-v=light]'); c('[data-act=tab][data-v=cal]'); true`);
  }
  // 11) 저장 유지: 새로고침 후에도 남아 있는지
  await b.eval(`DB.app.store.flush()`); await sleep(400);
  const before = await b.eval(`DB.app.store.entriesOf(DB.calc.todayS()).length`);
  await b.goto(url); for (let i = 0; i < 40; i++) { if (await b.eval('!!(window.DB && DB.app)')) break; await sleep(150); }
  const after = await b.eval(`DB.app.store.entriesOf(DB.calc.todayS()).length`);
  ok('새로고침 후 기록 유지', before > 0 && before === after, before + '→' + after);
  await sleep(500);
  const pAfter = await b.eval(`DB.app.store.photosOf(DB.calc.todayS()).length`);
  const pLoad = await b.eval(`(async () => { const ids = DB.app.store.photosOf(DB.calc.todayS()); const us = await Promise.all(ids.map(i => DB.photos.url(i))); return us.filter(Boolean).length; })()`);
  ok('새로고침 후 사진 유지(기록 5건·파일 5개)', pAfter === 5 && pLoad === 5, pAfter + '/' + pLoad);
  await b.eval(`(async () => { const s = DB.app.store, d = DB.calc.todayS(); for (const id of s.photosOf(d).slice()) { s.removePhoto(d, id); await DB.photos.remove(id); } DB.app.render(); })()`);
  ok('사진 삭제 후 0장', (await b.eval(`DB.app.store.photosOf(DB.calc.todayS()).length`)) === 0);
  ok('콘솔 오류 없음', b.logs.length === 0, b.logs.join(' | '));
  console.log('\n== ' + label + ' ==\n' + R.join('\n')); return R;
}
const document_hidden = v => v === true;

(async () => {
  const results = [];
  // A) 파일로 열기(브라우저 저장)
  let b = await launch(9401, path.join(SP, 'e2e_a'));
  results.push(...await scenario(b, 'file:///' + PROJ + '/index.html', 'A. file:// (브라우저 저장)', false)); b.close(); await sleep(500);
  // B) 서버로 열기(서버 저장)
  const dbdir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-db-'));
  const srv = spawn(process.execPath, [PROJ + '/server/server.js'], { env: Object.assign({}, process.env, { PORT: '3111', DB_DIR: dbdir }), stdio: 'ignore' });
  await sleep(800);
  b = await launch(9402, path.join(SP, 'e2e_b'));
  results.push(...await scenario(b, 'http://127.0.0.1:3111/', 'B. http 서버 (서버 저장)', true));
  const saved = JSON.parse(fs.readFileSync(path.join(dbdir, 'db.json'), 'utf8'));
  const n = Object.values(saved.days).reduce((a, d) => a + d.entries.length, 0);
  const line = (n >= 3 ? 'PASS ' : 'FAIL ') + '서버 파일(db.json)에 기록 저장됨 [' + n + '건]'; console.log(line); results.push(line);
  b.close(); srv.kill(); fs.rmSync(dbdir, { recursive: true, force: true });
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log('\n총 ' + results.length + '개 중 실패 ' + fails.length + '개'); process.exit(0);
})().catch(e => { console.error('E2E 오류', e); process.exit(1); });
