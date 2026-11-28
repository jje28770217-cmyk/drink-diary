const { launch, sleep } = require('./cdp.js');
const { createFakeSupabase } = require('../fake-supabase.js');
const fs = require('fs'), os = require('os'), path = require('path');
// 실행: npm run test:e2e:friends — 가짜 Supabase 서버로 가입·친구 요청·수락·친구 기록/사진 보기를 브라우저 두 개로 확인 (실제 Supabase·실제 기록은 건드리지 않음)
const SP = fs.mkdtempSync(path.join(os.tmpdir(), 'drink-friends-'));
const PROJ = path.resolve(__dirname, '../..').split(path.sep).join('/');
const URL = 'file:///' + PROJ + '/index.html';
const R = []; const ok = (n, c, x) => { R.push((c ? 'PASS ' : 'FAIL ') + n + (x ? '  [' + x + ']' : '')); };

async function open(port, name, fake) {
  const b = await launch(port, SP + '/prof_' + name, 420, 1400); await b.setSize(420, 1400, true);
  const inj = `window.DB={};let _c;Object.defineProperty(DB,'config',{configurable:true,get(){return _c},set(v){v.supabase={url:'${fake.url}',key:'${fake.KEY}'};_c=v}});`;
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: inj });
  await b.goto(URL); await boot(b);
  await b.eval("window.confirm=()=>true;DB.app.S.tab='cal';DB.app.render();window.c=s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click();return true};window.txt=s=>(document.querySelector(s)||{}).innerText||'';true");
  return b;
}
async function openRaw(port, name, fake, url) {   // 첫 실행 화면을 그대로 보는 브라우저(캘린더로 건너뛰지 않음)
  const b = await launch(port, SP + '/prof_' + name, 420, 1400); await b.setSize(420, 1400, true);
  const inj = `window.DB={};let _c;Object.defineProperty(DB,'config',{configurable:true,get(){return _c},set(v){v.supabase={url:'${fake.url}',key:'${fake.KEY}'};_c=v}});`;
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: inj });
  await b.goto(url || URL); await boot(b); await H(b); return b;
}
const H = b => b.eval("window.confirm=()=>true;window.c=s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click();return true};window.txt=s=>(document.querySelector(s)||{}).innerText||'';true");
const fillAndClick = (b, email, act) => b.eval(`document.querySelector('#emailIn').value='${email}';document.querySelector('#pwIn').value='secret1';c('[data-act=${act}]');true`);
async function boot(b) { for (let i = 0; i < 60; i++) { try { if (await b.eval('!!(window.DB && DB.app)')) return; } catch (e) { } await sleep(150); } throw new Error('boot ' + (b.logs || []).join(' | ')); }
async function signup(b, email) {
  await b.eval("c('[data-act=tab][data-v=set]');true");
  await b.eval(`document.querySelector('#emailIn').value='${email}';document.querySelector('#pwIn').value='secret1';c('[data-act=signup]');true`);
  await sleep(1500); await boot(b);
  await b.eval("window.confirm=()=>true;DB.app.S.tab='cal';DB.app.render();window.c=s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click();return true};window.txt=s=>(document.querySelector(s)||{}).innerText||'';true");
}

(async () => {
  const fake = createFakeSupabase(); await fake.start();
  const A = await open(9341, 'a', fake), B = await open(9342, 'b', fake);
  try {
    await A.eval("c('[data-act=tab][data-v=set]');true");
    const form = await A.eval("txt('#app')");
    ok('설정에 로그인 폼 표시', /로그인/.test(form) && /새로 가입/.test(form));
    // A: 기록 1건 + 메모 + 사진 만든 뒤 가입(이 기기 기록이 계정으로 옮겨지는지)
    const today = await A.eval('DB.calc.todayS()');
    await A.eval(`DB.app.store.saveEntry('${today}',{id:'e1',pid:'cass',name:'카스 프레시',cat:'beer',icon:'cass',t:'can',qty:1,unitMl:500,abv:4.5,ml:500,g:17.7});DB.app.store.setDayField('${today}','memo','친구에게 보이는 메모');DB.app.store.setProfile({pregnant:true,age:'33',sex:'male'});DB.app.store.flush();true`);
    await A.eval(`(async()=>{const c=document.createElement('canvas');c.width=600;c.height=400;const g=c.getContext('2d');g.fillStyle='#e33';g.fillRect(0,0,600,400);await DB.app.addPhotos('${today}',[new File([await new Promise(r=>c.toBlob(r,'image/png'))],'a.png',{type:'image/png'})])})()`);
    await sleep(500);
    await signup(A, 'a@test.com');
    ok('A 가입 후 로그인 상태', await A.eval('DB.app.cloud.loggedIn'));
    const aState = [...fake.data.values()][0];
    ok('이 기기 기록이 계정(클라우드)으로 옮겨짐', aState && aState.state.days[today] && aState.state.days[today].entries.length === 1);
    await sleep(1200);
    ok('사진이 클라우드에 올라감', fake.photos.size === 1, 'photos=' + fake.photos.size);
    await signup(B, 'b@test.com');
    ok('B 가입 후 로그인 상태', await B.eval('DB.app.cloud.loggedIn'));
    const aCode = await A.eval('DB.app.cloud.getProfile().then(p=>p.friend_code)');
    await A.eval("DB.app.cloud.setDisplayName('에이'); true"); await sleep(300);
    // B: 친구 요청
    await B.eval("c('[data-act=friendsTab]');true"); await sleep(500);
    await B.eval(`document.querySelector('#fcode').value='${aCode}';c('[data-act=friendAdd]');true`); await sleep(800);
    ok('B 보낸 요청 표시', /수락 대기 중/.test(await B.eval("txt('#app')")));
    // A: 수락
    await A.eval("c('[data-act=friendsTab]');true"); await sleep(800);
    const aFr = await A.eval("txt('#app')");
    ok('A 받은 요청 표시', /받은 요청/.test(aFr) && /수락/.test(aFr));
    await A.eval("c('[data-act=friendAccept]');true"); await sleep(800);
    // B: 친구 기록 보기
    await B.eval("c('[data-act=tab][data-v=set]');c('[data-act=friendsTab]');true"); await sleep(800);
    await B.eval("c('[data-act=friendOpen]');true"); await sleep(1800);
    const view = await B.eval("txt('#app')");
    ok('B가 A의 이름·제품·메모 확인', /에이/.test(view) && /카스 프레시/.test(view) && /친구에게 보이는 메모/.test(view), view.replace(/\n/g, ' ').slice(0, 160));
    const imgs = await B.eval("[...document.querySelectorAll('#app img[data-fphoto]')].filter(i=>i.src.startsWith('blob:')&&i.naturalWidth>0).length");
    ok('B가 A의 사진 확인', imgs === 1, 'loaded=' + imgs);
    ok('읽기 전용 안내 표시', /읽기 전용/.test(view));
    await B.shot(SP + '/friend-view.png');
    // 공유 범위: 나이·임신은 친구 쪽 데이터에 없음
    const fsx = await B.eval("DB.app.cloud.friendState(DB.app.S.fr.view.id).then(s=>JSON.stringify(s.profile)+'|'+('fav' in s))");
    ok('친구에게 나이·임신 비공개', fsx === '{"sex":"male"}|false', fsx);
    // A 설정 화면 캡처
    await A.eval("c('[data-act=tab][data-v=set]');true"); await sleep(500); await A.shot(SP + '/acct.png');
    ok('A 설정에 친구 코드 표시', new RegExp(aCode).test(await A.eval("txt('#app')")));
    // 로그아웃
    await A.eval("c('[data-act=logout]');true"); await sleep(1500); await boot(A);
    ok('로그아웃 후 로그인 폼 복귀', await A.eval("DB.app.cloud.loggedIn") === false);
    // ===== 첫 실행: 로그인 → 내 정보, 한 번 하면 다시 묻지 않음 =====
    const C = await openRaw(9343, 'c', fake);
    ok('첫 실행: 로그인 화면이 가장 먼저, 하단 메뉴는 숨김', (await C.eval('DB.app.S.tab')) === 'onboard' && /로그인 없이 이 기기에서만/.test(await C.eval("txt('#app')")) && (await C.eval("document.getElementById('nav').innerHTML.trim()")) === '');
    await fillAndClick(C, 'onb@test.com', 'signup'); await sleep(2000); await boot(C); await H(C);
    ok('가입 후 "내 정보" 화면(2/2)', /내 정보를 알려 주세요/.test(await C.eval("txt('#app')")) && /2 \/ 2/.test(await C.eval("txt('#app')")));
    await C.eval("c('[data-act=sex][data-v=male]');const i=document.getElementById('ageIn');i.value='30';i.dispatchEvent(new Event('input',{bubbles:true}));c('[data-act=obDone]');true"); await sleep(1500);
    ok('시작하기 → 캘린더, 메뉴 표시, 내 정보 저장', (await C.eval('DB.app.S.tab')) === 'cal' && (await C.eval("document.getElementById('nav').innerHTML.trim().length > 0")) && (await C.eval('JSON.stringify([DB.app.store.profile.sex, DB.app.store.profile.age, DB.app.store.profile.onboarded])')) === '["male","30",true]');
    await C.goto(URL); await boot(C); await H(C);
    ok('다시 열어도 묻지 않음', (await C.eval('DB.app.S.tab')) === 'cal');
    // 다른 기기(새 브라우저)에서 같은 계정으로 로그인 → 내 정보가 이미 있어 바로 캘린더
    const D = await openRaw(9344, 'd', fake); await fillAndClick(D, 'onb@test.com', 'login'); await sleep(2000); await boot(D);
    ok('다른 기기 로그인: 내 정보를 다시 묻지 않음(계정에 저장됨)', (await D.eval('DB.app.S.tab')) === 'cal' && (await D.eval('DB.app.store.profile.sex')) === 'male');
    // 로그인 없이 시작
    const E = await openRaw(9345, 'e', fake); await E.eval("c('[data-act=obSkip]');true");
    ok('로그인 없이 시작 → 내 정보 화면', /내 정보를 알려 주세요/.test(await E.eval("txt('#app')")));
    await E.eval("c('[data-act=obDone]');true"); await sleep(300); await E.goto(URL); await boot(E);
    ok('로그인 없이 시작한 뒤에도 다시 묻지 않음', (await E.eval('DB.app.S.tab')) === 'cal');
    // ===== 친구 초대 링크 =====
    await C.eval("window.__shared=null;navigator.share=d=>{window.__shared=d;return Promise.resolve()};c('[data-act=tab][data-v=set]');true"); await sleep(800);
    ok('설정 카드 제목이 "친구 추가"이고 ＋ 버튼이 있음', /친구 추가/.test(await C.eval("txt('#app')")) && !/계정·친구/.test(await C.eval("txt('#app')")) && (await C.eval("!!document.querySelector('[data-act=shareInvite]')")));
    await C.eval("c('[data-act=shareInvite]');true"); await sleep(300);
    const sh = JSON.parse(await C.eval('JSON.stringify(window.__shared)')), myCode = await C.eval('DB.app.cloud.getProfile().then(p=>p.friend_code)');
    ok('＋ 누르면 내 친구 코드가 담긴 초대 링크를 공유', sh && sh.url === 'https://jje28770217-cmyk.github.io/drink-diary/?friend=' + myCode && /드링크 밸런스/.test(sh.title), sh && sh.url);
    const F = await openRaw(9346, 'f', fake, URL + '?friend=' + myCode);
    ok('초대 링크로 처음 들어오면 로그인 화면에 초대 안내', (await F.eval('DB.app.S.tab')) === 'onboard' && new RegExp(myCode).test(await F.eval("txt('#app')")));
    await fillAndClick(F, 'inv@test.com', 'signup'); await sleep(2000); await boot(F); await H(F);
    await F.eval("c('[data-act=obDone]');true"); await sleep(1500);
    ok('내 정보를 마치면 친구 화면에 초대 코드가 자동 입력', (await F.eval('DB.app.S.tab')) === 'friends' && (await F.eval("document.getElementById('fcode').value")) === myCode);
    await F.eval("c('[data-act=friendAdd]');true"); await sleep(1200);
    ok('요청 보내기 → 수락 대기', /수락 대기 중/.test(await F.eval("txt('#app')")));
    await F.shot(SP + '/invite-f.png');
    C.close(); D.close(); E.close(); F.close();
    ok('콘솔 오류 없음(A/B)', A.logs.length === 0 && B.logs.length === 0, A.logs.concat(B.logs).join(' | '));
  } catch (e) { R.push('FAIL 예외 ' + e.message); }
  console.log(R.join('\n')); console.log('\n실패 ' + R.filter(x => x.startsWith('FAIL')).length + '개');
  A.close(); B.close(); await fake.stop(); try { fs.rmSync(SP, { recursive: true, force: true }); } catch (e) { /* Edge가 아직 파일을 쥐고 있으면 임시 폴더는 그대로 둠 */ } process.exit(R.some(x => x.startsWith('FAIL')) ? 1 : 0);
})();
