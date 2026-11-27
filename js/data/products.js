/* Drink Balance - 제품 DB
   조사일: 2026-11-27. 제조사 공식 정보로 확인된 값은 st:'official', 뉴스·판매처 등 2차 출처로만 확인된 값은 st:'ref'(참고값, 확인 필요),
   확인하지 못한 값은 null (사용자가 직접 입력). 임의로 추정해서 채우지 않았습니다.
   unit: { t:'bottle'|'can'|'glass', ml:숫자|null, st? }  (ml 직접 입력은 앱에서 항상 제공)
   abv: 도수(%) 숫자 또는 null.  src: 출처 URL(있는 경우), note: 확인 필요 사항 */
(function (root) {
  const B = ml => ({ t: 'bottle', ml }), C = ml => ({ t: 'can', ml }), G = ml => ({ t: 'glass', ml });
  const P = [];
  const add = (id, name, cat, o) => P.push(Object.assign({ id, name, cat, sub: '', units: [], abv: null, st: 'none', src: '', note: '' }, o));

  // ===== 소주 =====
  add('chamisul-fresh', '참이슬 후레쉬', 'soju', { units: [B(360)], abv: 15.7, st: 'ref', src: 'https://biz.sbs.co.kr/amp/article/20000314098', note: '뉴스 보도 기준입니다. 라벨의 도수를 확인해 주세요.' });
  add('chamisul-original', '참이슬 오리지널', 'soju', { units: [B(360)], abv: null, st: 'none', note: '도수 자료가 서로 달라 확인하지 못했습니다. 라벨을 보고 직접 입력해 주세요.' });
  add('chumchurum', '처음처럼', 'soju', { units: [B(360)], abv: 16, st: 'ref', src: 'https://www.hankyung.com/amp/2026061076991', note: '16도 보도 기준입니다. 도수가 바뀌었다는 보도가 있어 라벨 확인이 필요합니다.' });
  add('jinro', '진로', 'soju', { units: [B(360)], abv: 15.7, st: 'ref', src: 'https://magazine.hankyung.com/business/article/202602121449b', note: '뉴스 보도 기준입니다.' });
  add('saero', '새로', 'soju', { units: [B(360)], abv: 15.7, st: 'ref', src: 'https://news.bizwatch.co.kr/article/consumer/2026/01/22/0020', note: '뉴스 보도 기준입니다.' });
  add('saero-apricot', '새로 살구', 'soju', { sub: '새로', units: [B(null)], abv: null, st: 'none', note: '도수와 용량을 확인하지 못했습니다. 라벨을 보고 직접 입력해 주세요.' });
  add('saero-daerae', '새로 다래', 'soju', { sub: '새로', units: [B(null)], abv: null, st: 'none', note: '도수와 용량을 확인하지 못했습니다. 라벨을 보고 직접 입력해 주세요.' });
  add('joeunday', '좋은데이', 'soju', { units: [B(360)], abv: 15.7, st: 'official', src: 'https://www.muhak.co.kr/product/goodday/', note: '제조사(무학) 공식 사이트 기준입니다.' });
  add('hallasan', '한라산', 'soju', { units: [B(360)], abv: null, st: 'none', note: '제품(17도/21도 등)에 따라 도수가 달라 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('daesun', '대선', 'soju', { units: [B(360)], abv: null, st: 'none', note: '현재 도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  // 과일소주 (소주 탭 안의 하위 분류)
  add('grapefruit-eseul', '자몽에이슬', 'soju', { sub: '과일소주', units: [B(null)], abv: 13, st: 'ref', src: 'https://www.etoday.co.kr/news/view/1146979', note: '2021년 보도 기준 도수이며 현행 값과 용량은 확인하지 못했습니다.' });
  add('grape-eseul', '청포도에이슬', 'soju', { sub: '과일소주', units: [B(null)], note: '도수와 용량을 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('peach-eseul', '복숭아에이슬', 'soju', { sub: '과일소주', units: [B(null)], note: '제품 정보를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('soonhari', '순하리', 'soju', { sub: '과일소주', units: [B(null)], note: '도수와 용량을 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('cheongha', '청하', 'soju', { sub: '청주', units: [B(null)], note: '도수와 용량을 확인하지 못했습니다. 직접 입력해 주세요.' });

  // ===== 맥주 =====
  add('cass', '카스 프레시', 'beer', { units: [C(355), C(500), B(null)], abv: 4.5, st: 'ref', src: 'https://www.ddaily.co.kr/page/view/2025070410155807358', note: '뉴스 보도 기준입니다. 병 용량은 확인하지 못했습니다.' });
  add('terra', '테라', 'beer', { units: [C(355), C(500), B(null)], abv: 4.6, st: 'ref', src: 'https://biz.newdaily.co.kr/site/data/html/2022/03/25/2022032500', note: '2022년 보도 기준이라 현행 규격 확인이 필요합니다.' });
  add('kelly', '켈리', 'beer', { units: [C(null), B(null)], abv: 4.5, st: 'ref', src: 'https://www.etoday.co.kr/news/view/2235658', note: '도수는 보도 기준이며 용량은 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('hanmac', '한맥', 'beer', { units: [C(330), B(null)], abv: 4.6, st: 'ref', src: 'https://www.taxtimes.co.kr/news/article.html?no=275631', note: '뉴스 보도 기준입니다.' });
  add('cloud', '클라우드', 'beer', { units: [C(null), B(null)], abv: 5, st: 'ref', src: 'https://www.ddaily.co.kr/page/view/2026052020412693287', note: '2026년 5월 리뉴얼 기사 기준 도수이며 용량은 확인하지 못했습니다.' });
  add('asahi', '아사히 슈퍼드라이', 'beer', { units: [C(485), C(355), C(500)], abv: 5, st: 'ref', src: 'https://www.asiae.co.kr/en/article/2025052210305249043', note: '국내 485mL 캔만 확인했습니다. 355·500mL는 미확인입니다.' });
  add('tsingtao', '칭따오', 'beer', { units: [B(330), C(330), C(500)], abv: null, note: '도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('heineken', '하이네켄', 'beer', { units: [C(500), B(null)], abv: null, note: '도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('kirin', '기린 이치방', 'beer', { units: [C(350), C(500), B(null)], abv: 5, st: 'ref', src: 'https://news.mtn.co.kr/news-detail/2026101209042481545', note: '뉴스 보도 기준입니다.' });
  add('sapporo', '삿포로', 'beer', { units: [B(330), C(null)], abv: null, note: '국내 표기 도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('budweiser', '버드와이저', 'beer', { units: [B(355), C(null)], abv: null, note: '도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('hoegaarden', '호가든', 'beer', { units: [B(330), C(330), C(500)], abv: 4.9, st: 'ref', src: 'https://biz.newdaily.co.kr/site/data/html/2020/07/07/2020070700', note: '2020년 보도 기준이라 현행 값 확인이 필요합니다.' });
  add('kozel', '코젤 다크', 'beer', { units: [B(330), B(500), C(500)], abv: null, note: '도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('guinness', '기네스 드래프트', 'beer', { units: [C(330), C(440)], abv: null, note: '판매처마다 도수 표기가 달라 확인하지 못했습니다. 직접 입력해 주세요.' });

  // ===== 막걸리 =====
  add('seoul-jangsu', '서울장수', 'makgeolli', { units: [B(null)], note: '용량과 도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('jipyeong', '지평 생막걸리', 'makgeolli', { units: [B(750)], abv: 5.6, st: 'ref', src: 'https://porterslux.com.au/products/ji-pyeong-fresh-rice-wine', note: '해외 수출 표기 기준이라 국내 라벨 도수 확인이 필요합니다.' });
  add('neurinmaeul', '느린마을', 'makgeolli', { units: [B(750)], abv: 6, st: 'ref', src: 'https://dailyshot.co/m/item/16212', note: '판매처 표기 기준입니다.' });
  add('kooksoondang', '국순당 생막걸리', 'makgeolli', { units: [B(750)], abv: 6, st: 'ref', src: 'https://soju.squarespace.com/shop-soju/p/kooksoondang-makgeolli', note: '판매처 표기 기준입니다.' });
  add('boksoondoga', '복순도가 손막걸리', 'makgeolli', { units: [B(935)], abv: 6.5, st: 'ref', src: 'https://dailyshot.co/m/item/7091', note: '판매처 표기 기준입니다.' });

  // ===== 위스키 (잔 30mL는 사용자가 지정한 예시값) =====
  const wh = (id, name, bottle, abv, st, src, note) => add(id, name, 'whisky', { units: [B(bottle), G(30)], abv, st, src, note });
  wh('jack-daniels', '잭다니엘 Old No.7', 700, 40, 'ref', 'https://m.kihya.com/goods/goods_view.php?goodsNo=1000001496', '판매처 표기 기준입니다.');
  wh('jim-beam', '짐빔 화이트', 700, 40, 'ref', 'https://dailyshot.co/m/item/4630', '700mL와 750mL 표기가 갈려 국내 규격 확인이 필요합니다.');
  wh('suntory', '산토리 가쿠빈', 700, 40, 'ref', 'https://m.kihya.com/goods/goods_view.php?goodsNo=1000020622', '판매처 표기 기준입니다.');
  wh('ballantines', '발렌타인', null, null, 'none', '', '용량과 도수를 확인하지 못했습니다. 직접 입력해 주세요.');
  wh('johnnie-walker', '조니워커 블랙 라벨', 700, 40, 'official', 'https://johnniewalker.com/en-au/our-whisky/core-range/', '제조사 공식 사이트(호주) 기준입니다. 국내 판매품과 다를 수 있습니다.');
  wh('johnnie-walker-red', '조니워커 레드 라벨', 700, 40, 'ref', 'https://www.danmurphys.com.au/product/9068/', '판매처 표기 기준입니다.');
  wh('jameson', '제임슨', 700, 40, 'ref', 'https://m.kihya.com/goods/goods_view.php?goodsNo=1000004438', '판매처 표기 기준입니다.');
  wh('glenfiddich', '글렌피딕 12년', 700, 40, 'ref', 'https://dailyshot.co/m/item/2329', '판매처 표기 기준입니다.');

  // ===== 하이볼 (잔 350mL는 사용자가 지정한 예시값) =====
  add('suntory-highball', '산토리 하이볼', 'highball', { units: [C(350), C(500)], abv: 7, st: 'ref', src: 'https://isplus.com/article/view/isp202611020163', note: '뉴스 보도 기준입니다.' });
  add('jimbeam-highball', '짐빔 하이볼', 'highball', { units: [C(350)], abv: 5, st: 'ref', src: 'https://sports.khan.co.kr/article/202607161359003', note: '뉴스 보도 기준입니다.' });
  add('earlgrey-highball', '얼그레이 하이볼', 'highball', { units: [C(355)], abv: null, note: '도수를 확인하지 못했습니다. 직접 입력해 주세요.' });
  add('highball', '기타 하이볼', 'highball', { units: [G(350)], abv: null, note: '직접 만든 하이볼은 도수가 제각각이라 직접 입력해 주세요.' });

  // ===== 와인 (병 750mL는 일반 표준 규격, 잔 150mL는 사용자가 지정한 예시값) =====
  [['wine-red', '레드와인'], ['wine-white', '화이트와인'], ['wine-rose', '로제와인'], ['wine-sparkling', '스파클링와인']].forEach(([id, n]) =>
    add(id, n, 'wine', { units: [B(750), G(150)], abv: null, note: '병 750mL는 일반 표준 규격이며 제품마다 다를 수 있습니다. 도수는 라벨을 보고 입력해 주세요.' }));

  // ===== 기타 =====
  add('sake', '사케', 'etc', { units: [B(720), G(null)], abv: null, st: 'none', note: '720mL는 일반 규격(2차 출처)입니다. 도수는 라벨을 보고 입력해 주세요.' });
  add('kaoliang', '고량주', 'etc', { units: [B(500), B(250), G(null)], abv: null, note: '용량은 판매처 표기 기준입니다. 도수는 제품마다 달라 직접 입력해 주세요.' });
  add('cocktail', '칵테일', 'etc', { units: [G(null)], abv: null, note: '칵테일은 종류마다 다릅니다. 한 잔 용량과 도수를 직접 입력해 주세요.' });
  add('vodka', '보드카', 'etc', { units: [B(750), G(null)], abv: null, note: '750mL는 일반 표준 규격입니다. 도수는 라벨을 보고 입력해 주세요.' });
  add('tequila', '데킬라', 'etc', { units: [B(750), G(null)], abv: null, note: '750mL는 일반 표준 규격입니다. 도수는 라벨을 보고 입력해 주세요.' });
  add('rum', '럼', 'etc', { units: [B(750), G(null)], abv: null, note: '750mL는 일반 표준 규격입니다. 도수는 라벨을 보고 입력해 주세요.' });

  const CATS = [['all', '전체'], ['soju', '소주'], ['beer', '맥주'], ['makgeolli', '막걸리'], ['wine', '와인'], ['whisky', '위스키'], ['highball', '하이볼'], ['etc', '기타']];
  const CAT_NAME = { soju: '소주', beer: '맥주', makgeolli: '막걸리', wine: '와인', whisky: '위스키', highball: '하이볼', etc: '기타', custom: '직접 추가' };
  const api = { PRODUCTS: P, CATS, CAT_NAME };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).data = api;
})(typeof window !== 'undefined' ? window : globalThis);
