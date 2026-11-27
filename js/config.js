/* 설정 - 저장 방식과 서버 주소 (이 파일만 고치면 프론트 코드는 그대로)
   storage:
     'auto'   : 로컬 서버(server/server.js)가 응답하면 서버에 저장, 아니면 브라우저(localStorage)에 저장 (기본)
     'local'  : 항상 브라우저(localStorage)에만 저장
     'remote' : 서버에만 저장 (서버가 없으면 브라우저 저장으로 대체하고 알림)
   apiBase: 서버 API 주소. 같은 서버에서 화면을 열면 '/api' 그대로 사용 */
(function (root) {
  (root.DB = root.DB || {}).config = { storage: 'auto', apiBase: '/api' };
})(typeof window !== 'undefined' ? window : globalThis);
