/* Drink Balance 로컬 백엔드 - 의존성 없는 Node 서버
   - 화면 파일(정적)과 저장 API(/api/*)를 제공합니다. 외부 DB·유료 API·로그인 없음.
   - 내 PC(127.0.0.1)에서만 접속되며, 기록은 server/data/db.json 에만 저장됩니다.
   실행: node server/server.js   (포트 변경: PORT=4000 node server/server.js) */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = process.env.DB_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_BODY = 10 * 1024 * 1024;
// 화면에 필요한 것만 공개 (허용 목록). server/, tests/, research/, package.json 등은 공개하지 않음
const PUBLIC_TOP = new Set(['index.html', 'css', 'js', 'images', 'assets']);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };

/* ---------- 저장소 (파일) ---------- */
function readDb() { try { return fs.readFileSync(DB_FILE, 'utf8'); } catch (e) { return null; } }
function writeDb(text) { // 임시 파일에 쓰고 교체 + 직전 버전 백업
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, text);
  if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, DB_FILE + '.bak');
  fs.renameSync(tmp, DB_FILE);
}
/** 저장 가능한 데이터인지 검사 */
function validate(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return '객체가 아닙니다';
  if (!o.days || typeof o.days !== 'object' || Array.isArray(o.days)) return 'days 가 없습니다';
  for (const [d, v] of Object.entries(o.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '날짜 형식 오류: ' + d;
    if (!v || typeof v !== 'object' || !Array.isArray(v.entries)) return 'entries 오류: ' + d;
    for (const e of v.entries) if (!e || typeof e.id !== 'string' || !(e.g >= 0) || !(e.ml >= 0)) return '기록 형식 오류: ' + d;
  }
  return null;
}

/* ---------- HTTP ---------- */
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
const sendJson = (res, code, obj) => send(res, code, JSON.stringify(obj));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/health' && req.method === 'GET') return sendJson(res, 200, { ok: true });
  if (pathname === '/api/state') {
    if (req.method === 'GET') { const t = readDb(); return t == null ? send(res, 204, '') : send(res, 200, t); }
    if (req.method === 'PUT') {
      // 다른 사이트가 내 서버에 쓰지 못하도록 Origin 검사
      const origin = req.headers.origin;
      if (origin && origin !== 'http://' + req.headers.host) return sendJson(res, 403, { error: 'origin' });
      if (!/^application\/json/i.test(req.headers['content-type'] || '')) return sendJson(res, 415, { error: 'content-type' });
      let obj; try { obj = JSON.parse(await readBody(req)); } catch (e) { return sendJson(res, e.status || 400, { error: e.status ? 'too large' : 'invalid json' }); }
      const err = validate(obj); if (err) return sendJson(res, 422, { error: err });
      writeDb(JSON.stringify(obj)); return sendJson(res, 200, { ok: true });
    }
    return sendJson(res, 405, { error: 'method' });
  }
  return sendJson(res, 404, { error: 'not found' });
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed', 'text/plain');
  let rel; try { rel = decodeURIComponent(pathname); } catch (e) { return send(res, 400, 'Bad Request', 'text/plain'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  const top = path.relative(ROOT, file).split(path.sep)[0];
  if (!file.startsWith(ROOT + path.sep) || !PUBLIC_TOP.has(top)) return send(res, 404, 'Not Found', 'text/plain');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not Found', 'text/plain');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
      serveStatic(req, res, pathname);
    } catch (e) { sendJson(res, 500, { error: 'server error' }); }
  });
}

if (require.main === module) {
  createServer().listen(PORT, HOST, () => console.log(`Drink Balance 서버: http://${HOST}:${PORT}  (데이터: ${DB_FILE})`));
}
module.exports = { createServer, validate };
