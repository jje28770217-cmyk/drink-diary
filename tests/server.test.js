// 서버 API 테스트: 임시 데이터 폴더를 쓰므로 실제 기록(server/data)에는 영향 없음
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
process.env.DB_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'drink-db-'));
const { createServer } = require('../server/server.js');

let server, base, host;
test.before(async () => { server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r)); host = '127.0.0.1:' + server.address().port; base = 'http://' + host; });
test.after(() => { server.close(); fs.rmSync(process.env.DB_DIR, { recursive: true, force: true }); });

const okState = { v: 1, days: { '2026-11-26': { entries: [{ id: 'e1', pid: 'cass', name: '카스', g: 17.7, ml: 500 }] } }, fav: [], recent: [], overrides: {}, custom: [], profile: {} };
const put = (body, headers) => fetch(base + '/api/state', { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: typeof body === 'string' ? body : JSON.stringify(body) });

test('health, 빈 상태는 204', async () => {
  assert.deepEqual(await (await fetch(base + '/api/health')).json(), { ok: true });
  assert.equal((await fetch(base + '/api/state')).status, 204);
});
test('저장하고 다시 읽기', async () => {
  assert.equal((await put(okState)).status, 200);
  const r = await fetch(base + '/api/state'); assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), okState);
  assert.equal((await put(Object.assign({}, okState, { fav: ['cass'] }))).status, 200);
  assert.ok(fs.existsSync(path.join(process.env.DB_DIR, 'db.json.bak')), '직전 버전 백업');
});
test('잘못된 데이터는 거부', async () => {
  assert.equal((await put('not json')).status, 400);
  assert.equal((await put({ nope: 1 })).status, 422);
  assert.equal((await put({ days: { 'bad-date': { entries: [] } } })).status, 422);
  assert.equal((await put({ days: { '2026-11-26': { entries: [{ id: 'x', g: -1, ml: 1 }] } } })).status, 422);
  assert.equal((await put(okState, { 'Content-Type': 'text/plain' })).status, 415);
  assert.deepEqual(await (await fetch(base + '/api/state')).json(), Object.assign({}, okState, { fav: ['cass'] })); // 거부된 요청은 저장 안 됨
});
test('다른 사이트(Origin)에서의 쓰기는 거부', async () => {
  assert.equal((await put(okState, { Origin: 'http://evil.example' })).status, 403);
  assert.equal((await put(okState, { Origin: 'http://' + host })).status, 200);
});
test('정적 파일 제공과 비공개 폴더 차단', async () => {
  assert.equal((await fetch(base + '/')).status, 200);
  assert.match((await (await fetch(base + '/')).text()), /Drink Balance/);
  assert.equal((await fetch(base + '/css/style.css')).headers.get('content-type').startsWith('text/css'), true);
  for (const p of ['/server/server.js', '/server/data/db.json', '/tests/core.test.js', '/research/guidelines.md', '/package.json', '/README.md', '/.git/config', '/%2e%2e/server/server.js'])
    assert.equal((await fetch(base + p)).status, 404, p);
  // 경로 탈출: fetch 는 주소를 정규화하므로 원본 경로를 그대로 보내서 확인
  for (const p of ['/../package.json', '/css/../../package.json', '/..%2fpackage.json', '/css/..%5c..%5cpackage.json']) {
    const code = await new Promise(r => http.get({ host: '127.0.0.1', port: server.address().port, path: p }, res => { res.resume(); r(res.statusCode); }));
    assert.ok(code === 404 || code === 400, p + ' → ' + code);
  }
  assert.equal((await fetch(base + '/js/core/calc.js')).status, 200);
  assert.equal((await fetch(base + '/assets/drinks/cass.svg')).status, 200);
});
test('알 수 없는 API 와 메서드', async () => {
  assert.equal((await fetch(base + '/api/nothing')).status, 404);
  assert.equal((await fetch(base + '/api/state', { method: 'DELETE' })).status, 405);
});
