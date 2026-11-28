/* sw.js - 홈 화면 설치·오프라인용 서비스 워커
   화면 파일(HTML·CSS·JS·이미지)은 "인터넷이 되면 최신 파일, 안 되면 저장해 둔 파일"로 불러옵니다.
   /api/*(저장 서버)와 다른 사이트(Supabase 등)로 가는 요청은 건드리지 않습니다.
   캐시를 비워야 할 때는 아래 CACHE 이름의 숫자를 올리세요. */
const CACHE = 'drink-balance-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || /\/api\//.test(url.pathname)) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
