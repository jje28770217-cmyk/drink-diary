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
  await b.eval("window.confirm=()=>true;window.c=s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click();return true};window.txt=s=>(document.querySelector(s)||{}).innerText||'';true");
  return b;
}
async function boot(b) { for (let i = 0; i < 60; i++) { try { if (await b.eval('!!(window.DB && DB.app)')) return; } catch (e) { } await sleep(150); } throw new Error('boot'); }
async function signup(b, email) {
  await b.eval("c('[data-act=tab][data-v=set]');true");
  await b.eval(`document.querySelector('#emailIn').value='${email}';document.querySelector('#pwIn').value='secret1';c('[data-act=signup]');true`);
  await sleep(1500); await boot(b);
  await b.eval("window.confirm=()=>true;window.c=s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click();return true};window.txt=s=>(document.querySelector(s)||{}).innerText||'';true");
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
    ok('콘솔 오류 없음(A/B)', A.logs.length === 0 && B.logs.length === 0, A.logs.concat(B.logs).join(' | '));
  } catch (e) { R.push('FAIL 예외 ' + e.message); }
  console.log(R.join('\n')); console.log('\n실패 ' + R.filter(x => x.startsWith('FAIL')).length + '개');
  A.close(); B.close(); await fake.stop(); fs.rmSync(SP, { recursive: true, force: true }); process.exit(R.some(x => x.startsWith('FAIL')) ? 1 : 0);
})();
