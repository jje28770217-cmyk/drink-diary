// 클라우드 클라이언트(js/api/cloud.js) 테스트: 가짜 Supabase 서버와 통신 (실제 Supabase 아님)
// 실행: node --test tests/cloud.test.js
const test = require('node:test'), assert = require('node:assert/strict');
const { createCloud } = require('../js/api/cloud.js');
const { createFakeSupabase } = require('./fake-supabase.js');

async function setup(opts) {
  const fake = createFakeSupabase(opts), url = await fake.start();
  const mk = (storage) => createCloud({ url, key: fake.KEY, storage });
  return { fake, url, mk, stop: () => fake.stop() };
}
const state = (extra) => Object.assign({ v: 1, days: { '2026-11-20': { entries: [{ id: 'e1', g: 17.7, ml: 500 }], memo: '메모', cond: ['headache'], photos: ['p1'] } }, fav: ['cass'], recent: [], overrides: {}, custom: [], profile: { sex: 'male', age: '34', pregnant: true } }, extra);

test('설정이 비어 있으면 클라우드는 꺼진 상태', () => {
  assert.equal(createCloud({ url: '', key: '' }).configured, false);
  assert.equal(createCloud({ url: 'https://x.supabase.co', key: 'k' }).configured, true);
});

test('가입·로그인·로그아웃, 잘못된 비밀번호는 오류', async () => {
  const s = await setup(); const a = s.mk();
  assert.equal((await a.signUp('a@test.com', 'secret1')).signedIn, true);
  assert.equal(a.loggedIn, true);
  await a.signOut(); assert.equal(a.loggedIn, false);
  await assert.rejects(a.signIn('a@test.com', 'wrong!'), /Invalid login/);
  const u = await a.signIn('a@test.com', 'secret1'); assert.equal(u.email, 'a@test.com');
  await assert.rejects(s.mk().signUp('b@test.com', '123'), /at least 6/);
  await s.stop();
});

test('이메일 인증이 켜진 프로젝트는 가입 후 로그인 상태가 아님', async () => {
  const s = await setup({ confirmEmail: true }); const a = s.mk();
  const r = await a.signUp('a@test.com', 'secret1'); assert.equal(r.signedIn, false); assert.equal(r.needsConfirm, true); assert.equal(a.loggedIn, false);
  await s.stop();
});

test('세션은 저장소에 남아 다시 열어도 유지되고, 만료되면 자동 갱신', async () => {
  const s = await setup({ expiresIn: 30 }); const mem = {};
  const storage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
  const a = s.mk(storage); await a.signUp('a@test.com', 'secret1');
  const first = a.session.access_token;
  const b = s.mk(storage); assert.equal(b.loggedIn, true);        // 새로고침 후에도 로그인 유지
  await b.saveState(state());                                    // 만료(30초 < 60초 여유)라 갱신 후 저장
  assert.notEqual(b.session.access_token, first);
  assert.deepEqual((await b.loadState()).fav, ['cass']);
  await s.stop();
});

test('내 기록 저장·불러오기, 다른 사람 것은 못 봄', async () => {
  const s = await setup(); const a = s.mk(), b = s.mk();
  await a.signUp('a@test.com', 'secret1'); await b.signUp('b@test.com', 'secret1');
  assert.equal(await a.loadState(), null);
  await a.saveState(state()); assert.equal((await a.loadState()).profile.sex, 'male');
  assert.equal(await b.loadState(), null);
  await s.stop();
});

test('친구: 코드로 요청 → 수락 전엔 못 봄 → 수락 후 공유 범위만 보임(임신·나이 제외)', async () => {
  const s = await setup(); const a = s.mk(), b = s.mk();
  await a.signUp('a@test.com', 'secret1'); await b.signUp('b@test.com', 'secret1');
  await a.saveState(state());
  const bCode = (await b.getProfile()).friend_code;
  assert.equal(await a.requestFriend('없는코드'), 'not_found');
  assert.equal(await a.requestFriend((await a.getProfile()).friend_code), 'self');
  assert.equal(await a.requestFriend(bCode.toLowerCase()), 'sent');       // 대소문자 무관
  assert.equal(await a.requestFriend(bCode), 'exists');
  const aId = a.session.user.id;
  assert.equal(await b.friendState(aId), null);                          // 아직 수락 전
  const inc = (await b.listFriends()).find(f => f.direction === 'incoming'); assert.equal(inc.status, 'pending');
  await b.acceptFriend(aId);
  const fs = await b.friendState(aId);
  assert.equal(fs.days['2026-11-20'].memo, '메모');                       // 메모·컨디션·사진 id 공유
  assert.deepEqual(fs.days['2026-11-20'].photos, ['p1']);
  assert.deepEqual(fs.profile, { sex: 'male' });                         // 나이·임신 없음
  assert.equal(fs.fav, undefined);
  await a.removeFriend(b.session.user.id);                               // 끊으면 다시 못 봄
  assert.equal(await b.friendState(aId), null);
  await s.stop();
});

test('서로 먼저 요청하면 바로 친구가 됨', async () => {
  const s = await setup(); const a = s.mk(), b = s.mk();
  await a.signUp('a@test.com', 'secret1'); await b.signUp('b@test.com', 'secret1');
  assert.equal(await a.requestFriend((await b.getProfile()).friend_code), 'sent');
  assert.equal(await b.requestFriend((await a.getProfile()).friend_code), 'accepted');
  await s.stop();
});

test('사진: 내 폴더에만 올리고, 친구는 수락 후에만 내려받음', async () => {
  const s = await setup(); const a = s.mk(), b = s.mk(), c = s.mk();
  for (const [x, e] of [[a, 'a'], [b, 'b'], [c, 'c']]) await x.signUp(e + '@test.com', 'secret1');
  await a.uploadPhoto('p1', Buffer.from('jpegdata'));
  assert.equal(Buffer.from(await (await a.downloadPhoto(a.session.user.id, 'p1')).arrayBuffer()).toString(), 'jpegdata');
  const aId = a.session.user.id;
  assert.equal(await b.downloadPhoto(aId, 'p1'), null);                  // 친구 아님
  await a.requestFriend((await b.getProfile()).friend_code); await b.acceptFriend(aId);
  assert.equal(Buffer.from(await (await b.downloadPhoto(aId, 'p1')).arrayBuffer()).toString(), 'jpegdata');
  assert.equal(await c.downloadPhoto(aId, 'p1'), null);                  // 다른 사람은 여전히 불가
  await a.deletePhoto('p1'); assert.equal(await a.downloadPhoto(aId, 'p1'), null);
  await s.stop();
});

test('잘못된 키는 거부', async () => {
  const s = await setup(); const bad = createCloud({ url: s.url, key: 'wrong' });
  await assert.rejects(bad.signUp('a@test.com', 'secret1'), /Invalid API key/);
  await s.stop();
});
