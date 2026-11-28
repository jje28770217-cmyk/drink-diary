/* core/calc.js - 날짜·단위·순수 알코올 계산 (화면과 무관한 순수 함수, Node에서도 동작) */
(function (root) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
  const todayS = () => fmt(new Date());
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const niceDate = s => { const d = parse(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };

  const TYPE_LABEL = { bottle: '병', can: '캔', glass: '잔', ml: 'mL' };
  const FRACS = [0.5, 1, 2]; // 분량 버튼(간단하게 3개). 그 밖의 분수·소수는 "직접 입력"에서
  const ALCOHOL_DENSITY = 0.789;

  /** 순수 알코올(g) = 마신 용량(mL) × 도수(%) ÷ 100 × 0.789 */
  const gramOf = (ml, abv) => ml * abv / 100 * ALCOHOL_DENSITY;
  const r1 = n => Math.round(n * 10) / 10;
  const r2 = n => Math.round(n * 100) / 100;
  const ukey = u => u.t + ':' + (u.ml == null ? '' : u.ml);
  /** 버튼·+/- 로 만들 수 있는 "간단한 양": ½ 또는 1 이상의 정수. 그 외(¼, 1.5 등)는 직접 입력으로 봄 */
  const isPreset = q => Math.abs(q - 0.5) < 0.005 || (q >= 0.995 && Math.abs(q - Math.round(q)) < 0.005);

  const FR = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  function fmtQty(q) {
    if (Math.abs(q - 1 / 3) < 0.01) return '⅓';
    if (Math.abs(q - 2 / 3) < 0.01) return '⅔';
    for (const k in FR) if (Math.abs(q - k) < 0.005) return FR[k];
    const whole = Math.floor(q + 1e-9), rem = q - whole;
    if (whole > 0 && Math.abs(rem - 0.5) < 0.005) return whole + '.5';
    return String(r2(q));
  }
  const qtyLabel = e => e.t === 'ml' ? Math.round(e.qty) + 'mL' : fmtQty(e.qty) + TYPE_LABEL[e.t];

  const sumG = entries => (entries || []).reduce((a, e) => a + e.g, 0);
  /** s 날짜를 포함한 최근 7일 순수 알코올 합계. entriesOf: date → entry[] */
  function weekSum(entriesOf, s) { let t = 0; for (let i = 0; i < 7; i++) t += sumG(entriesOf(addDays(s, -i))); return t; }
  /** s 날짜까지 이어진 연속 음주일 수 */
  function streak(entriesOf, s) { let n = 0, d = s; while ((entriesOf(d) || []).length) { n++; d = addDays(d, -1); } return n; }
  /** 같은 제품·단위·용량의 기록을 합쳐서 캘린더에 표시할 목록으로 */
  function aggregate(entries) {
    const m = new Map();
    entries.forEach(e => { const k = e.pid + '|' + e.t + '|' + e.unitMl; const o = m.get(k) || Object.assign({}, e, { qty: 0 }); o.qty += e.qty; m.set(k, o); });
    return [...m.values()];
  }

  /** 친구 초대 링크: 주소 뒤에 ?friend=친구코드 를 붙임(코드가 없으면 앱 주소만). 이미 붙은 쿼리·해시는 지움 */
  const inviteUrl = (base, code) => { const u = String(base || '').split('#')[0].split('?')[0]; return code ? u + '?friend=' + encodeURIComponent(String(code).trim().toUpperCase()) : u; };
  /** 주소의 ?friend=코드 에서 코드를 꺼냄(영문·숫자 4~16자만 인정, 대문자로). 없으면 null */
  const inviteCode = search => { const m = /[?&]friend=([A-Za-z0-9]{4,16})(?:&|$)/.exec(String(search || '')); return m ? m[1].toUpperCase() : null; };

  const api = { inviteUrl, inviteCode, pad, fmt, parse, addDays, todayS, WD, niceDate, TYPE_LABEL, FRACS, ALCOHOL_DENSITY, gramOf, r1, r2, ukey, isPreset, fmtQty, qtyLabel, sumG, weekSum, streak, aggregate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).calc = api;
})(typeof window !== 'undefined' ? window : globalThis);
