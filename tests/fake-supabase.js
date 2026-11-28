/* tests/fake-supabase.js - 테스트 전용 가짜 Supabase 서버 (메모리). supabase/schema.sql 의 규칙을 흉내 냄:
   내 기록은 나만, 친구는 수락된 경우에만 friend_state()·사진 접근, 친구 요청은 코드로만.
   ※ 실제 Supabase 가 아니므로 실제 프로젝트에서의 최종 확인은 따로 필요합니다. */
const http = require('http');

function createFakeSupabase(opts) {
  opts = opts || {};
  const KEY = opts.key || 'test-publishable-key';
  const users = new Map(), byToken = new Map(), data = new Map(), profiles = new Map(), friendships = [], photos = new Map();
  let seq = 0, tokenSeq = 0;
  const calls = [];

  const send = (res, code, body, type) => { res.writeHead(code, { 'Content-Type': type || 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-upsert, prefer, x-client-info', 'Access-Control-Allow-Methods': '*' }); res.end(body === undefined ? '' : (typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))); };
  const readBody = req => new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
  const issue = u => { const access = 'at_' + u.id + '_' + (++tokenSeq), refresh = 'rt_' + u.id + '_' + tokenSeq; byToken.set(access, u.id); u.refresh = refresh; return { access_token: access, refresh_token: refresh, expires_in: opts.expiresIn || 3600, user: { id: u.id, email: u.email } }; };
  const isFriend = (a, b) => friendships.some(f => f.status === 'accepted' && ((f.requester === a && f.addressee === b) || (f.requester === b && f.addressee === a)));

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname, q = u.searchParams;
    if (req.method === 'OPTIONS') return send(res, 204);
    calls.push(req.method + ' ' + p);
    if (req.headers.apikey !== KEY) return send(res, 401, { message: 'Invalid API key' });
    const body = await readBody(req), bearer = (req.headers.authorization || '').replace('Bearer ', ''), uid = byToken.get(bearer);
    const json = () => { try { return JSON.parse(body.toString() || '{}'); } catch (e) { return {}; } };
    const need = () => { if (!uid) { send(res, 401, { message: 'JWT expired or missing' }); return false; } return true; };

    // ---- 인증
    if (p === '/auth/v1/signup') {
      const { email, password } = json();
      if (!email || !password || password.length < 6) return send(res, 422, { msg: 'Password should be at least 6 characters' });
      if ([...users.values()].some(x => x.email === email)) return send(res, 422, { msg: 'User already registered' });
      const id = 'u' + (++seq), user = { id, email, password }; users.set(id, user);
      profiles.set(id, { id, friend_code: ('CODE' + String(seq).padStart(4, '0')), display_name: '' });
      if (opts.confirmEmail) return send(res, 200, { id, email });
      return send(res, 200, Object.assign(issue(user), { expires_at: undefined }));
    }
    if (p === '/auth/v1/token') {
      const b = json();
      if (q.get('grant_type') === 'password') {
        const user = [...users.values()].find(x => x.email === b.email && x.password === b.password);
        if (!user) return send(res, 400, { error_description: 'Invalid login credentials' });
        return send(res, 200, issue(user));
      }
      const user = [...users.values()].find(x => x.refresh === b.refresh_token);
      if (!user) return send(res, 400, { error_description: 'Invalid Refresh Token' });
      return send(res, 200, issue(user));
    }
    if (p === '/auth/v1/logout') { byToken.delete(bearer); return send(res, 204); }

    // ---- 내 기록
    if (p === '/rest/v1/user_data') {
      if (!need()) return;
      if (req.method === 'GET') { const id = (q.get('user_id') || '').replace('eq.', ''); return send(res, 200, id === uid && data.has(uid) ? [{ state: data.get(uid).state }] : []); }
      if (req.method === 'POST') { const b = json(); if (b.user_id !== uid) return send(res, 403, { message: 'new row violates row-level security policy' }); data.set(uid, { state: b.state }); return send(res, 201); }
    }
    // ---- 프로필
    if (p === '/rest/v1/profiles') {
      if (!need()) return;
      const id = (q.get('id') || '').replace('eq.', '');
      if (id !== uid) return send(res, 200, []);
      if (req.method === 'GET') { const pr = profiles.get(uid); return send(res, 200, [{ friend_code: pr.friend_code, display_name: pr.display_name }]); }
      if (req.method === 'PATCH') { const b = json(); if (Object.keys(b).some(k => k !== 'display_name')) return send(res, 403, { message: 'permission denied' }); profiles.get(uid).display_name = b.display_name; return send(res, 204); }
    }
    // ---- 친구 함수
    if (p === '/rest/v1/rpc/request_friend') {
      if (!need()) return;
      const code = String(json().code || '').trim().toUpperCase(), target = [...profiles.values()].find(x => x.friend_code === code);
      if (!target) return send(res, 200, JSON.stringify('not_found'));
      if (target.id === uid) return send(res, 200, JSON.stringify('self'));
      const rel = friendships.find(f => (f.requester === uid && f.addressee === target.id) || (f.requester === target.id && f.addressee === uid));
      if (rel) { if (rel.status === 'pending' && rel.addressee === uid) { rel.status = 'accepted'; return send(res, 200, JSON.stringify('accepted')); } return send(res, 200, JSON.stringify('exists')); }
      friendships.push({ requester: uid, addressee: target.id, status: 'pending' }); return send(res, 200, JSON.stringify('sent'));
    }
    if (p === '/rest/v1/rpc/list_friends') {
      if (!need()) return;
      return send(res, 200, friendships.filter(f => f.requester === uid || f.addressee === uid).map(f => { const o = f.requester === uid ? f.addressee : f.requester, pr = profiles.get(o); return { friend_id: o, name: pr.display_name || '친구 ' + pr.friend_code.slice(0, 4), code: pr.friend_code, status: f.status, direction: f.requester === uid ? 'outgoing' : 'incoming' }; }));
    }
    if (p === '/rest/v1/rpc/friend_state') {
      if (!need()) return;
      const f = json().friend; if (!isFriend(uid, f) || !data.has(f)) return send(res, 200, 'null');
      const s = data.get(f).state; return send(res, 200, { v: 1, days: s.days || {}, profile: { sex: (s.profile && s.profile.sex) || 'unset' } });
    }
    if (p === '/rest/v1/friendships') {
      if (!need()) return;
      const m = /requester=eq\.([^&]+)&addressee=eq\.([^&]+)/.exec(u.search);
      if (req.method === 'PATCH' && m) { const f = friendships.find(x => x.requester === m[1] && x.addressee === m[2] && x.addressee === uid && x.status === 'pending'); if (f) f.status = 'accepted'; return send(res, 204); }
      if (req.method === 'DELETE') { for (let i = friendships.length - 1; i >= 0; i--) if (friendships[i].requester === uid || friendships[i].addressee === uid) { const f = friendships[i]; const o = f.requester === uid ? f.addressee : f.requester; if (u.search.includes(o)) friendships.splice(i, 1); } return send(res, 204); }
    }
    // ---- 사진
    let m;
    if ((m = /^\/storage\/v1\/object\/(?:authenticated\/)?photos\/([^/]+)\/(.+)$/.exec(p))) {
      if (!need()) return;
      const owner = m[1], path = owner + '/' + m[2];
      if (req.method === 'POST') { if (owner !== uid) return send(res, 403, { message: 'new row violates row-level security policy' }); photos.set(path, body); return send(res, 200, { Key: 'photos/' + path }); }
      if (req.method === 'DELETE') { if (owner !== uid) return send(res, 403, {}); photos.delete(path); return send(res, 200, {}); }
      if (req.method === 'GET') { if (owner !== uid && !isFriend(uid, owner)) return send(res, 400, { message: 'Object not found' }); return photos.has(path) ? send(res, 200, photos.get(path), 'image/jpeg') : send(res, 404, { message: 'Object not found' }); }
    }
    send(res, 404, { message: 'not found: ' + p });
  });

  return {
    KEY, calls, photos, data,
    async start() { await new Promise(r => server.listen(0, '127.0.0.1', r)); this.url = 'http://127.0.0.1:' + server.address().port; return this.url; },
    stop() { return new Promise(r => server.close(r)); }
  };
}
module.exports = { createFakeSupabase };
