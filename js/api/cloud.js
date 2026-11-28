/* api/cloud.js - Supabase 클라이언트 (로그인·클라우드 저장·친구·사진). 라이브러리 없이 fetch 로 REST API 를 직접 호출합니다.
   설정: js/config.js 의 supabase.url / supabase.key (publishable 키). 비어 있으면 클라우드 기능은 꺼집니다.
   ※ secret/service_role 키는 절대 넣지 않습니다. 데이터 보호는 supabase/schema.sql 의 RLS 규칙이 담당합니다.
   Node(테스트)와 브라우저 둘 다에서 동작하도록 fetch·저장소를 주입할 수 있게 만들었습니다. */
(function (root) {
  'use strict';

  function createCloud(opts) {
    const url = String(opts.url || '').replace(/\/+$/, ''), key = opts.key || '';
    const doFetch = opts.fetch || ((...a) => root.fetch(...a));
    const mem = {}, store = opts.storage || { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
    const SKEY = 'drinkBalance.session';
    const configured = !!(url && key);
    let session = null;
    try { session = JSON.parse(store.getItem(SKEY)); } catch (e) { session = null; }
    const saveSession = s => { session = s; try { if (s) store.setItem(SKEY, JSON.stringify(s)); else store.removeItem(SKEY); } catch (e) { /* 저장 불가 환경 */ } };

    async function raw(path, o) {
      o = o || {};
      const headers = Object.assign({ apikey: key }, o.headers || {});
      if (o.auth !== false && session) headers.Authorization = 'Bearer ' + session.access_token;
      if (o.json !== undefined) { headers['Content-Type'] = 'application/json'; }
      const res = await doFetch(url + path, { method: o.method || 'GET', headers, body: o.json !== undefined ? JSON.stringify(o.json) : o.body });
      return res;
    }
    async function check(res) {
      if (res.ok) return res;
      let msg = '요청 실패 (' + res.status + ')';
      try { const j = await res.clone().json(); msg = j.msg || j.message || j.error_description || j.error || msg; } catch (e) { /* 본문 없음 */ }
      const err = new Error(msg); err.status = res.status; throw err;
    }
    const jsonOf = async res => { const t = await res.text(); return t ? JSON.parse(t) : null; };
    const toSession = j => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)), user: { id: j.user.id, email: j.user.email } });

    /** 만료가 가까우면 갱신. 갱신 실패(로그아웃 상태)면 세션을 지움 */
    async function ensureToken() {
      if (!session) throw new Error('로그인이 필요합니다');
      if (session.expires_at - 60 > Date.now() / 1000) return;
      const res = await raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', json: { refresh_token: session.refresh_token }, auth: false });
      if (!res.ok) { saveSession(null); throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요'); }
      saveSession(toSession(await res.json()));
    }
    async function call(path, o) { await ensureToken(); return check(await raw(path, o)); }

    /* ---------- 로그인 ---------- */
    async function signUp(email, password) {
      const j = await jsonOf(await check(await raw('/auth/v1/signup', { method: 'POST', json: { email, password }, auth: false })));
      if (j && j.access_token) { saveSession(toSession(j)); return { signedIn: true }; }
      return { signedIn: false, needsConfirm: true };   // 이메일 인증이 켜져 있으면 메일 확인 후 로그인
    }
    async function signIn(email, password) {
      const j = await jsonOf(await check(await raw('/auth/v1/token?grant_type=password', { method: 'POST', json: { email, password }, auth: false })));
      saveSession(toSession(j)); return session.user;
    }
    async function signOut() { try { if (session) await raw('/auth/v1/logout', { method: 'POST' }); } catch (e) { /* 오프라인이어도 이 기기에서는 로그아웃 */ } saveSession(null); }

    /* ---------- 내 기록 ---------- */
    async function loadState() {
      const rows = await jsonOf(await call('/rest/v1/user_data?user_id=eq.' + session.user.id + '&select=state'));
      return rows && rows[0] ? rows[0].state : null;
    }
    async function saveState(state) {
      await call('/rest/v1/user_data?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, json: { user_id: session.user.id, state, updated_at: new Date().toISOString() } });
    }
    /** 저장 어댑터(core/store.js 가 쓰는 load/save 형태) */
    const adapter = { name: 'cloud', load: loadState, save: saveState };

    /* ---------- 프로필·친구 ---------- */
    async function getProfile() { const r = await jsonOf(await call('/rest/v1/profiles?id=eq.' + session.user.id + '&select=friend_code,display_name')); return r && r[0] ? r[0] : null; }
    async function setDisplayName(name) { await call('/rest/v1/profiles?id=eq.' + session.user.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, json: { display_name: String(name || '').slice(0, 20) } }); }
    const rpc = async (fn, args) => jsonOf(await call('/rest/v1/rpc/' + fn, { method: 'POST', json: args || {} }));
    const listFriends = () => rpc('list_friends');
    const requestFriend = code => rpc('request_friend', { code });
    const friendState = id => rpc('friend_state', { friend: id });
    async function acceptFriend(friendId) { await call('/rest/v1/friendships?requester=eq.' + friendId + '&addressee=eq.' + session.user.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, json: { status: 'accepted' } }); }
    async function removeFriend(friendId) {
      const me = session.user.id;
      await call('/rest/v1/friendships?or=(and(requester.eq.' + me + ',addressee.eq.' + friendId + '),and(requester.eq.' + friendId + ',addressee.eq.' + me + '))', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }

    /* ---------- 사진 (비공개 버킷, 경로: <주인 id>/<사진 id>.jpg) ---------- */
    async function uploadPhoto(id, blob) { await call('/storage/v1/object/photos/' + session.user.id + '/' + id + '.jpg', { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob }); }
    async function downloadPhoto(ownerId, id) {
      await ensureToken();
      const res = await raw('/storage/v1/object/authenticated/photos/' + ownerId + '/' + id + '.jpg');
      if (res.status === 404 || res.status === 400) return null;
      return (await check(res)).blob();
    }
    async function deletePhoto(id) { await call('/storage/v1/object/photos/' + session.user.id + '/' + id + '.jpg', { method: 'DELETE' }); }

    return {
      configured, adapter, signUp, signIn, signOut, loadState, saveState, getProfile, setDisplayName, listFriends, requestFriend, friendState, acceptFriend, removeFriend, uploadPhoto, downloadPhoto, deletePhoto,
      get session() { return session; }, get loggedIn() { return !!session; }
    };
  }

  const api = { createCloud };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).createCloud = createCloud;
})(typeof window !== 'undefined' ? window : globalThis);
