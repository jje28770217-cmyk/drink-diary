/* 설정 - 저장 방식과 서버 주소 (이 파일만 고치면 프론트 코드는 그대로)
   storage:
     'auto'   : 로컬 서버(server/server.js)가 응답하면 서버에 저장, 아니면 브라우저(localStorage)에 저장 (기본)
     'local'  : 항상 브라우저(localStorage)에만 저장
     'remote' : 서버에만 저장 (서버가 없으면 브라우저 저장으로 대체하고 알림)
   apiBase: 서버 API 주소. 같은 서버에서 화면을 열면 '/api' 그대로 사용
   supabase: 로그인·클라우드 저장·친구 공유(선택). url 과 key 를 채우면 설정 화면에 로그인이 나타납니다.
     url = 프로젝트 주소(https://xxxx.supabase.co), key = publishable(anon) 키. 이 두 값은 공개되어도 됩니다.
     ※ secret/service_role 키와 데이터베이스 비밀번호는 절대 넣지 마세요. 비어 있으면 클라우드 기능은 꺼집니다. */
(function (root) {
  (root.DB = root.DB || {}).config = { storage: 'auto', apiBase: '/api', supabase: { url: '', key: '' } };
})(typeof window !== 'undefined' ? window : globalThis);
