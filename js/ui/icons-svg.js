/* ui/icons-svg.js - 자체 제작 SVG 대체 이미지 (images/ 에 실물 이미지가 없는 제품에 사용)
   (이 파일은 '이미지가 없을 때의 임시 그림'입니다. 이미지 연결은 images/manifest.js + ui/images.js)
   제품의 대표 색·형태·이름을 참고해 직접 그린 입체 일러스트입니다. 실제 제품과 다를 수 있습니다.
   모든 아이콘: viewBox 0 0 64 96, 투명 배경, 정면 구도.
   drinkIcon(id, fill, opt)  fill 0~1 만큼 내부 액체가 채워짐.  opt.flat=true 이면 분량 타일용 단색 아이콘 */
(function (root) {
  const FONT = '"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif';

  // 라벨/캔에 쓰는 이름 (base id → [큰 글자, 작은 글자])
  const TEXT = {
    'chamisul-fresh': ['참이슬', 'fresh'], 'chamisul-original': ['참이슬', 'original'], chumchurum: ['처음처럼', ''], jinro: ['진로', ''], saero: ['새로', ''],
    joeunday: ['좋은데이', ''], hallasan: ['한라산', ''], daesun: ['대선', ''], 'grapefruit-eseul': ['자몽', '에이슬'], 'grape-eseul': ['청포도', '에이슬'],
    'peach-eseul': ['복숭아', '에이슬'], soonhari: ['순하리', ''], bokbunja: ['복분자', ''], cheongha: ['청하', ''],
    cass: ['Cass', 'FRESH'], 'cass-light': ['Cass', 'LIGHT'], terra: ['TERRA', ''], 'terra-light': ['TERRA', 'LIGHT'], kelly: ['Kelly', ''], hanmac: ['한맥', ''], cloud: ['클라우드', ''], asahi: ['ASAHI', 'SUPER DRY'],
    tsingtao: ['칭따오', ''], heineken: ['HEINEKEN', ''], kirin: ['KIRIN', '一番搾り'], sapporo: ['SAPPORO', ''], budweiser: ['Bud', 'weiser'],
    hoegaarden: ['호가든', ''], kozel: ['Kozel', 'DARK'], guinness: ['GUINNESS', ''],
    'seoul-jangsu': ['서울장수', ''], jipyeong: ['지평', ''], neurinmaeul: ['느린마을', ''], kooksoondang: ['국순당', ''], boksoondoga: ['복순도가', ''],
    'jack-daniels': ['Jack', 'No.7'], 'jim-beam': ['JIM BEAM', ''], suntory: ['角瓶', 'SUNTORY'], ballantines: ['BALLANTINE', ''], 'johnnie-walker': ['JOHNNIE', 'WALKER'], jameson: ['Jameson', ''], glenfiddich: ['GLEN', 'FIDDICH'],
    'suntory-highball': ['하이볼', 'SUNTORY'], 'jimbeam-highball': ['하이볼', 'JIM BEAM'], 'earlgrey-highball': ['얼그레이', '하이볼'], highball: ['', ''],
    'wine-red': ['RED', 'WINE'], 'wine-white': ['WHITE', 'WINE'], 'wine-rose': ['ROSÉ', 'WINE'], 'wine-sparkling': ['SPARKLING', ''],
    sake: ['日本酒', ''], kaoliang: ['高粱酒', ''], vodka: ['VODKA', ''], tequila: ['TEQUILA', ''], rum: ['RUM', '']
  };

  const textEl = (t, x, y, size, w, color, weight, italic) => t ? `<text x="${x}" y="${y}" text-anchor="middle" font-family='${FONT}' font-size="${size}" font-weight="${weight || 800}" ${italic ? 'font-style="italic"' : ''} fill="${color}" textLength="${w}" lengthAdjust="spacingAndGlyphs">${t}</text>` : '';
  // 병 라벨: 둥글게 감긴 느낌(양 끝 어둡게)은 공통 셰이드가 덮어 줌
  function label(x, y, w, h, p, tx) {
    const [t, t2] = tx || ['', ''];
    const big = Math.min(w - 5, Math.max(8, t.length * 4.6)), cx = x + w / 2;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.2" fill="${p.label}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${Math.max(3, h * .16)}" rx="2" fill="${p.accent}"/>
      ${p.drop ? `<path d="M${x + 5.5} ${y + h * .45}c-2.6 3-3.6 4.4-3.6 6a3.6 3.600 0 0 0 7.200 0c0-1.600-1-3-3.600-6z" fill="${p.drop}"/>` : ''}
      ${textEl(t, p.drop ? cx + 2.5 : cx, y + h * (t2 ? .62 : .66), t.length > 3 ? 5.6 : 7.5, p.drop ? big - 4 : big, p.tc || '#1e2621', 900)}
      ${textEl(t2, cx, y + h * .86, 3.3, Math.min(w - 6, t2.length * 2.6), p.tc2 || p.accent, 700, true)}`;
  }
  const capEl = (x, y, w, h, c, id) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="url(#${id}m)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="${c}" opacity=".78"/>
      <path d="M${x + w * .3} ${y + 1}V${y + h - 1}M${x + w * .5} ${y + 1}V${y + h - 1}M${x + w * .7} ${y + 1}V${y + h - 1}" stroke="#fff" stroke-opacity=".28" stroke-width=".6"/>`;

  const SHAPES = {
    soju: (p, tx, k) => ({
      clip: 'M27 13H37V30C37 36 44 40 44 48V86Q44 91 39 91H25Q20 91 20 86V48C20 40 27 36 27 30Z', top: 13, bot: 91, cap: [26, 4.5, 12, 10],
      front: capEl(26, 4.5, 12, 10, p.cap, k) + `<rect x="27" y="14" width="10" height="2.4" fill="${p.cap}" opacity=".55"/>` + label(20.3, 52, 23.4, 29, p, tx), hl: [22.4, 46, 40]
    }),
    saero: (p, tx, k) => ({
      clip: 'M28 12H36V28C36 34 43 36 43 44C43 52 38 54 43 62C47 70 41 74 43 82V86Q43 91 38 91H26Q21 91 21 86V82C23 74 17 70 21 62C26 54 21 52 21 44C21 36 28 34 28 28Z', top: 12, bot: 91, cap: [27, 4.5, 10, 9],
      front: capEl(27, 4.5, 10, 9, p.cap, k) + `<path d="M21.500 50Q32 56 42.500 50M21.500 62Q32 68 42.500 62M22 74Q32 80 42 74" stroke="${p.accent}" stroke-width="1.800" fill="none" opacity=".85"/>` + textEl(tx[0], 32, 68, 6.5, 14, p.accent, 900), hl: [23.6, 44, 38]
    }),
    can: (p, tx, k) => ({
      clip: 'M17 20Q17 17 20 17H44Q47 17 47 20V86Q47 90 43 90H21Q17 90 17 86Z', top: 17, bot: 90, cap: [17, 13.5, 30, 6],
      front: `<rect x="17" y="13" width="30" height="6.500" rx="3" fill="url(#${k}m)"/><ellipse cx="32" cy="15.200" rx="8" ry="1.800" fill="#8d96ad" opacity=".7"/><rect x="26" y="14.400" width="9" height="1.500" rx=".7" fill="#fff" opacity=".7"/>
        <rect x="17" y="30" width="30" height="40" fill="${p.band}"/><rect x="17" y="30" width="30" height="3" fill="${p.accent}"/><rect x="17" y="67" width="30" height="3" fill="${p.accent}"/>
        ${textEl(tx[0], 32, tx[1] ? 49 : 52, tx[0].length > 5 ? 5.4 : 9, Math.min(25, Math.max(14, tx[0].length * (/[가-힣]/.test(tx[0]) ? 6 : 4.4))), p.tc || p.accent, 900, /^[A-Za-z]/.test(tx[0]))}
        ${textEl(tx[1], 32, 58, 3.4, Math.min(24, tx[1].length * 2.6 + 3), p.tc || p.accent, 700)}
        <path d="M17 84Q17 90 21 90H43Q47 90 47 84Z" fill="#aab2c6" opacity=".55"/>`, hl: [20.4, 24, 58]
    }),
    beerBottle: (p, tx, k) => ({
      clip: 'M28 10H36V34C36 40 43 44 43 52V86Q43 91 38 91H26Q21 91 21 86V52C21 44 28 40 28 34Z', top: 10, bot: 91, cap: [27, 4, 10, 7],
      front: capEl(27, 4, 10, 7, p.cap, k) + `<rect x="28" y="26" width="8" height="9" fill="${p.accent}" opacity=".55"/>` + label(21.3, 56, 21.4, 22, p, tx), hl: [23, 50, 36]
    }),
    mug: (p) => ({
      pre: `<path d="M46 34H53Q59 34 59 42V64Q59 72 53 72H46" stroke="${p.stroke}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`,
      clip: 'M14 24H46V82Q46 88 40 88H20Q14 88 14 82Z', top: 30, bot: 88,
      post: (y, f) => f > 0 ? `<path d="M13 ${y + 3}q3-9 9-4q4-8 10-2q5-7 10-1q6-5 9 4v7h-38z" fill="#fffdf4" stroke="#f1e7c8" stroke-width=".8"/>` : '',
      front: '', hl: [18, 32, 48]
    }),
    wineBottle: (p, tx, k) => ({
      clip: 'M29 6H35V34C35 40 42 44 42 54V86Q42 91 37 91H27Q22 91 22 86V54C22 44 29 40 29 34Z', top: 6, bot: 91, cap: [28, 2.5, 8, 17],
      front: `<rect x="28" y="2.500" width="8" height="17" rx="2" fill="${p.cap}"/><rect x="28.300" y="3" width="2" height="16" rx="1" fill="#fff" opacity=".3"/>` + label(22.3, 60, 19.4, 22, p, tx), hl: [24, 54, 34]
    }),
    wineGlass: (p) => ({
      pre: `<rect x="30.400" y="46" width="3.200" height="36" fill="#e3e9f5"/><path d="M19 85Q32 78 45 85Q45 90 32 90Q19 90 19 85Z" fill="#e9eef9" stroke="${p.stroke}" stroke-width="1.400"/>`,
      clip: 'M17 9H47C47 30 43 46 32 48C21 46 17 30 17 9Z', top: 14, bot: 47, front: '', hl: [21, 14, 22]
    }),
    makBottle: (p, tx, k) => ({
      clip: 'M26 12H38V26C38 30 47 32 47 42V84Q47 90 41 90H23Q17 90 17 84V42C17 32 26 30 26 26Z', top: 12, bot: 90, cap: [25, 5, 14, 8],
      front: capEl(25, 5, 14, 8, p.cap, k) + label(17.3, 50, 29.4, 28, p, tx), hl: [20, 40, 40]
    }),
    bowl: (p) => ({
      clip: 'M7 50H57Q57 84 32 89Q7 84 7 50Z', top: 52, bot: 88,
      pre: `<path d="M22 88H42L40 92H24Z" fill="${p.stroke}" opacity=".5"/>`, front: '', hl: [11, 56, 16]
    }),
    whiskyBottle: (p, tx, k) => ({
      clip: 'M26 12H38V26L44 34Q46 36 46 40V86Q46 91 41 91H23Q18 91 18 86V40Q18 36 20 34L26 26Z', top: 12, bot: 91, cap: [25, 4, 14, 9],
      front: capEl(25, 4, 14, 9, p.cap, k) + label(18.3, 50, 27.4, 30, p, tx), hl: [20.4, 42, 42]
    }),
    spirit: (p, tx, k) => ({
      clip: 'M27 12H37V24C37 30 45 32 45 42V86Q45 91 40 91H24Q19 91 19 86V42C19 32 27 30 27 24Z', top: 12, bot: 91, cap: [26, 4, 12, 9],
      front: capEl(26, 4, 12, 9, p.cap, k) + label(19.3, 48, 25.4, 30, p, tx), hl: [21.4, 40, 44]
    }),
    tumbler: (p) => ({
      clip: 'M13 38H51L47 86Q47 90 43 90H21Q17 90 17 86Z', top: 38, bot: 90,
      post: () => p.ice ? `<g fill="#fff" fill-opacity=".55" stroke="#fff" stroke-opacity=".9" stroke-width="1">
        <rect x="19" y="52" width="15" height="15" rx="3.500" transform="rotate(-9 26 59)"/><rect x="31" y="66" width="15" height="15" rx="3.500" transform="rotate(10 38 73)"/></g>` : '',
      front: '', hl: [18, 44, 36]
    }),
    highball: (p) => ({
      clip: 'M20 12H44L42 86Q42 90 38 90H26Q22 90 22 86Z', top: 12, bot: 90,
      post: () => `<g fill="#fff" fill-opacity=".5" stroke="#fff" stroke-opacity=".9" stroke-width="1">
        <rect x="24" y="16" width="13" height="13" rx="3" transform="rotate(-8 30 22)"/><rect x="29" y="34" width="13" height="13" rx="3" transform="rotate(9 35 40)"/><rect x="24" y="52" width="13" height="13" rx="3" transform="rotate(-6 30 58)"/></g>
        <g fill="#fff" fill-opacity=".7"><circle cx="39" cy="26" r="1.400"/><circle cx="25" cy="48" r="1.300"/><circle cx="40" cy="62" r="1.500"/><circle cx="27" cy="76" r="1.300"/></g>`,
      front: p.accent ? `<circle cx="42" cy="14" r="6" fill="${p.accent}" opacity=".9"/><circle cx="42" cy="14" r="3.400" fill="#fff" opacity=".35"/>` : '', hl: [24, 18, 60]
    }),
    cocktail: (p) => ({
      pre: `<rect x="30.400" y="46" width="3.200" height="36" fill="#e3e9f5"/><path d="M19 85Q32 78 45 85Q45 90 32 90Q19 90 19 85Z" fill="#e9eef9" stroke="${p.stroke}" stroke-width="1.400"/>`,
      clip: 'M8 12H56L35 46Q32 49 29 46Z', top: 12, bot: 48,
      front: `<path d="M38 3L51 22" stroke="#9a8a6a" stroke-width="1.600"/><circle cx="49" cy="17" r="4.200" fill="${p.accent}"/><circle cx="48" cy="16" r="1.200" fill="#fff" opacity=".7"/>`, hl: [14, 15, 8]
    }),
    sake: (p, tx, k) => ({
      clip: 'M28 14H36V32C36 38 46 42 46 56V82Q46 90 38 90H26Q18 90 18 82V56C18 42 28 38 28 32Z', top: 14, bot: 90, cap: [27, 10, 10, 5],
      front: `<path d="M18 62Q25 58 32 62T46 62" stroke="${p.accent}" stroke-width="2.200" fill="none"/>` + textEl(tx[0], 32, 76, 6, 14, p.accent, 900) + capEl(27, 9.500, 10, 5.500, p.cap, k), hl: [21, 52, 28]
    }),
    ochoko: (p) => ({
      clip: 'M12 44H52L47 86Q46 90 42 90H22Q18 90 17 86Z', top: 44, bot: 90, front: `<path d="M14 54H50" stroke="${p.accent}" stroke-width="2" opacity=".7"/>`, hl: [17, 50, 30]
    }),
    jar: (p, tx, k) => ({
      clip: 'M27 14H37V26C37 32 46 34 46 46V84Q46 90 40 90H24Q18 90 18 84V46C18 34 27 32 27 26Z', top: 14, bot: 90, cap: [26, 7.5, 12, 7],
      front: capEl(26, 7.5, 12, 7, p.cap, k) + label(18.3, 50, 27.4, 28, p, tx), hl: [21, 44, 38]
    })
  };

  const S = [];
  const add = (id, shape, p) => S.push([id, shape, Object.assign({ stroke: '#8fa0c0', empty: '#eef3fb', liq: '#f2c14e', cap: '#7b8aa8', label: '#ffffff', accent: '#9a86e8', band: '#ffffff' }, p)]);

  // --- 소주 / 과일소주 ---
  const green = { empty: '#cbe8d6', stroke: '#1f7a45', liq: '#2e9e55', cap: '#1f7a45' };
  add('chamisul-fresh', 'soju', { ...green, label: '#ffffff', accent: '#2e9e55', drop: '#3aa8e8', tc: '#1e2621', tc2: '#2e9e55' });
  add('chamisul-original', 'soju', { ...green, empty: '#c0e0cd', stroke: '#1b6e3f', liq: '#2a9150', cap: '#1b6e3f', label: '#fff7f0', accent: '#e4584b', tc: '#c0392b', tc2: '#e4584b' });
  add('chumchurum', 'soju', { ...green, label: '#ffffff', accent: '#6fcf97', tc: '#1b6e3f', tc2: '#2e9e55' });
  add('jinro', 'soju', { empty: '#d7edf9', stroke: '#2f86bd', liq: '#59b6e6', cap: '#2f86bd', label: '#ffffff', accent: '#2f86bd', tc: '#1f5f8a' });
  add('saero', 'saero', { empty: '#f7fafd', stroke: '#9fb4c9', liq: '#dbeaf6', cap: '#f08aa5', accent: '#e8708a' });
  add('saero-apricot', 'saero', { empty: '#fdecea', stroke: '#e9a39a', liq: '#f7b9ad', cap: '#e8d9c8', accent: '#e8708a' });
  add('saero-daerae', 'saero', { empty: '#f1f8e4', stroke: '#9ec062', liq: '#cfe39a', cap: '#e8e8e8', accent: '#7fa82a' });
  add('joeunday', 'soju', { ...green, label: '#f1f7ff', accent: '#3b82d8', tc: '#1b6e3f' });
  add('hallasan', 'soju', { empty: '#e9f3fb', stroke: '#6fa3cf', liq: '#bcdcf2', cap: '#2f6fb0', label: '#ffffff', accent: '#2f6fb0', tc: '#1f4f85' });
  add('daesun', 'soju', { ...green, label: '#fffbe8', accent: '#d9a420', tc: '#1b6e3f' });
  const fruit = (id, glass, liq, accent) => add(id, 'soju', { empty: glass, stroke: accent, liq, cap: accent, label: '#ffffff', accent, tc: accent });
  fruit('grapefruit-eseul', '#ffe1e1', '#ff8585', '#e5484d');
  fruit('grape-eseul', '#effad2', '#bfe05a', '#7fa82a');
  fruit('peach-eseul', '#ffe9dc', '#ffae85', '#ee7f50');
  fruit('soonhari', '#fff9d8', '#f7e27a', '#c9a21a');
  fruit('bokbunja', '#f3dfec', '#9a2c63', '#5a1738');

  // --- 맥주: 캔(id), 병(id-bottle), 잔(id-glass) ---
  const beer = (id, can, bottle, liq) => {
    add(id, 'can', { empty: can.body, stroke: can.edge || '#8fa0c0', liq: can.liq || can.band, band: can.band, accent: can.accent, tc: can.tc });
    add(id + '-bottle', 'beerBottle', { empty: bottle.glass, stroke: bottle.edge, liq, cap: bottle.cap, label: bottle.label, accent: bottle.accent, tc: bottle.tc });
    add(id + '-glass', 'mug', { empty: '#eef3fb', stroke: '#9db0cf', liq });
  };
  beer('cass', { body: '#9cc4f4', band: '#2563c9', accent: '#9ec4ff', tc: '#fff' }, { glass: '#d8b27a', edge: '#8a5a22', cap: '#2563c9', label: '#2563c9', accent: '#9ec4ff', tc: '#fff' }, '#f5b942');
  beer('terra', { body: '#a8e2c4', band: '#17924f', accent: '#f2e27a', tc: '#fff' }, { glass: '#b7d9a4', edge: '#3f7f3a', cap: '#17924f', label: '#17924f', accent: '#f2e27a', tc: '#fff' }, '#f2c14e');
  beer('cass-light', { body: '#e4eefb', band: '#5b9be0', accent: '#ffffff', tc: '#fff' }, { glass: '#e3cfa0', edge: '#8a5a22', cap: '#5b9be0', label: '#5b9be0', accent: '#ffffff', tc: '#fff' }, '#f7d56e');
  beer('terra-light', { body: '#dcf4e7', band: '#4fbf86', accent: '#f6ecab', tc: '#fff' }, { glass: '#c9e3b8', edge: '#3f7f3a', cap: '#4fbf86', label: '#4fbf86', accent: '#f6ecab', tc: '#fff' }, '#f6d36b');
  beer('kelly', { body: '#f7dd8c', band: '#e0a41f', liq: '#e8b132', accent: '#fff1b8', tc: '#7a4a08' }, { glass: '#e3c58a', edge: '#9a7020', cap: '#e0a41f', label: '#e0a41f', accent: '#fff1b8', tc: '#7a4a08' }, '#f6bf3a');
  beer('hanmac', { body: '#e7b9b0', band: '#a63a3a', accent: '#f1d27a', tc: '#fff' }, { glass: '#d8b27a', edge: '#8a5a22', cap: '#a63a3a', label: '#a63a3a', accent: '#f1d27a', tc: '#fff' }, '#f1a52f');
  beer('cloud', { body: '#e3f1fb', band: '#ffffff', liq: '#f4f9fd', accent: '#4aa3df', tc: '#2f86bd', edge: '#9fb4c9' }, { glass: '#d8b27a', edge: '#8a5a22', cap: '#4aa3df', label: '#ffffff', accent: '#4aa3df', tc: '#2f86bd' }, '#f5b942');
  beer('asahi', { body: '#e4e8ef', edge: '#9aa3b8', band: '#d6dae4', liq: '#dfe3ec', accent: '#1f3d82', tc: '#1f3d82' }, { glass: '#d8b27a', edge: '#8a5a22', cap: '#c9ced9', label: '#d9dde6', accent: '#1f3d82', tc: '#1f3d82' }, '#f2b83a');
  beer('tsingtao', { body: '#bfe6cf', band: '#1f7a4d', accent: '#ffffff', tc: '#fff' }, { glass: '#a8d9b8', edge: '#2f7f55', cap: '#1f7a4d', label: '#ffffff', accent: '#1f7a4d', tc: '#1f7a4d' }, '#f2c14e');
  beer('heineken', { body: '#9ed8b0', band: '#13803d', accent: '#e24b4b', tc: '#fff' }, { glass: '#a6dbb5', edge: '#237a47', cap: '#13803d', label: '#ffffff', accent: '#e24b4b', tc: '#13803d' }, '#f2c14e');
  beer('kirin', { body: '#f1e3b8', band: '#d9a52b', accent: '#2b6a3a', tc: '#5a3a08' }, { glass: '#d8b27a', edge: '#8a5a22', cap: '#d9a52b', label: '#fff4cf', accent: '#2b6a3a', tc: '#5a3a08' }, '#f6bf3a');
  beer('sapporo', { body: '#f6e19a', band: '#c9962a', accent: '#8a4a1a', tc: '#5a2f08' }, { glass: '#d8b27a', edge: '#8a5a22', cap: '#c9962a', label: '#fff4cf', accent: '#8a4a1a', tc: '#5a2f08' }, '#f6bf3a');
  beer('budweiser', { body: '#f0a9a0', band: '#d0302b', accent: '#ffffff', tc: '#fff' }, { glass: '#d8b27a', edge: '#8a5a22', cap: '#d0302b', label: '#d0302b', accent: '#ffffff', tc: '#fff' }, '#f5b942');
  beer('hoegaarden', { body: '#d6ecf7', band: '#8cc7e6', accent: '#f6c04a', tc: '#1f5f8a' }, { glass: '#e8dcc0', edge: '#a89258', cap: '#7fbfe0', label: '#ffffff', accent: '#f6c04a', tc: '#1f5f8a' }, '#f3e2a2');
  beer('kozel', { body: '#d2a98a', band: '#5a2f1d', accent: '#e6c15a', tc: '#f4e3b0' }, { glass: '#a67a52', edge: '#5a3a22', cap: '#5a2f1d', label: '#f4ead2', accent: '#8a2f2a', tc: '#5a2f1d' }, '#8a4a1f');
  beer('guinness', { body: '#6a6a72', edge: '#2e2e36', band: '#1d1d22', accent: '#e8c35a', tc: '#e8c35a' }, { glass: '#4a3a30', edge: '#1d1d22', cap: '#1d1d22', label: '#1d1d22', accent: '#e8c35a', tc: '#e8c35a' }, '#2b1a14');

  // --- 막걸리 ---
  const mak = (id, cap, label, accent) => add(id, 'makBottle', { empty: '#e9eefb', stroke: '#a9b4cf', liq: '#f0e8cd', cap, label, accent, tc: accent });
  mak('seoul-jangsu', '#3aa56a', '#ffffff', '#2e8a56');
  mak('jipyeong', '#4a7fd8', '#ffffff', '#3a6fc8');
  mak('neurinmaeul', '#8a5a3a', '#f4ead2', '#6e4528');
  mak('kooksoondang', '#d94c4c', '#ffffff', '#c93a3a');
  mak('boksoondoga', '#c9a46a', '#fffaf0', '#a8824a');
  add('makgeolli-bowl', 'bowl', { empty: '#f4f1e6', stroke: '#c9b980', liq: '#efe6c8' });

  // --- 위스키: 병(id)과 잔(id-glass) ---
  const wh = (id, glass, edge, liq, cap, label, accent, tc) => {
    add(id, 'whiskyBottle', { empty: glass, stroke: edge, liq, cap, label, accent, tc: tc || accent });
    add(id + '-glass', 'tumbler', { empty: '#eef3fb', stroke: '#9db0cf', liq, ice: true });
  };
  wh('jack-daniels', '#c9c4bd', '#4a4540', '#c9791f', '#2a2a2e', '#1f1f23', '#d9d9de', '#f2f2f4');
  wh('jim-beam', '#f2e4c2', '#b0803a', '#d98a2b', '#c9962a', '#ffffff', '#c9962a', '#8a5a08');
  wh('suntory', '#f3dc9a', '#b0873a', '#e0a53a', '#b9893a', '#fff4cf', '#7a5a2a', '#5a3a08');
  wh('ballantines', '#d7e0d4', '#6b7f6a', '#d98a2b', '#2f4a3a', '#f4ead2', '#2f4a3a', '#2f4a3a');
  wh('johnnie-walker', '#e8d9b6', '#a07a3a', '#d98a2b', '#2a2a2e', '#d94c3c', '#2a2a2e', '#fff');
  wh('jameson', '#b9dcb0', '#3f7f3a', '#d9a02b', '#3f7f3a', '#f4ead2', '#3f7f3a', '#2f6a2a');
  wh('glenfiddich', '#a9d3b0', '#2f7f55', '#e0a53a', '#2f7f55', '#f4ead2', '#d9b24a', '#2f7f55');

  // --- 하이볼: 잔(id)과 캔(id-can) ---
  const hb = (id, liq, accent, can) => {
    add(id, 'highball', { empty: '#eef3fb', stroke: '#9db0cf', liq, accent });
    add(id + '-can', 'can', { empty: can.body, stroke: '#8fa0c0', liq: can.liq || can.band, band: can.band, accent: can.accent, tc: can.tc });
  };
  hb('suntory-highball', '#f4dc7a', '#9ccf5a', { body: '#f7e8a8', band: '#d9a52b', accent: '#fff', tc: '#fff' });
  hb('jimbeam-highball', '#f0b24a', '#f2c14e', { body: '#f6d4a0', band: '#b8651b', accent: '#fff', tc: '#fff' });
  hb('earlgrey-highball', '#c9a27a', '#b9a7f5', { body: '#dcd2f7', band: '#6d5bd0', accent: '#fff', tc: '#fff' });
  hb('highball', '#f4dc7a', '', { body: '#f1f3f9', band: '#9a86e8', accent: '#ffffff', tc: '#fff' });

  // --- 와인 ---
  const wi = (id, liq, glassC, edge, cap, label, accent, tc) => {
    add(id, 'wineBottle', { empty: glassC, stroke: edge, liq, cap, label, accent, tc: tc || accent });
    add(id + '-glass', 'wineGlass', { empty: '#f1f5fb', stroke: '#9db0cf', liq });
  };
  wi('wine-red', '#7d1a3c', '#a9b8a5', '#4e6b57', '#5b1f33', '#fff3d6', '#8e2748', '#7d1a3c');
  wi('wine-white', '#e8d870', '#cfe3b8', '#6a8f4e', '#c9b24a', '#ffffff', '#c9b24a', '#8a7a1a');
  wi('wine-rose', '#f08aa5', '#f7dce0', '#d98a9a', '#e8708a', '#ffffff', '#e8708a', '#c04a68');
  wi('wine-sparkling', '#f5e6a2', '#cfe3b8', '#6a8f4e', '#c9a24a', '#fffaf0', '#c9a24a', '#8a6a1a');

  // --- 기타 ---
  add('cheongha', 'soju', { empty: '#e4f4ea', stroke: '#6fb08c', liq: '#bfe6cf', cap: '#3f9a6a', label: '#ffffff', accent: '#3f9a6a', tc: '#2a7a52' });
  add('sake', 'sake', { empty: '#f6f8ff', stroke: '#8aa6d9', liq: '#cfe6f6', cap: '#6f8fe0', accent: '#4f6fd0' });
  add('sake-cup', 'ochoko', { empty: '#f6f8ff', stroke: '#8aa6d9', liq: '#cfe6f6', accent: '#6f8fe0' });
  add('kaoliang', 'jar', { empty: '#ffffff', stroke: '#c9ced9', liq: '#e8f0f7', cap: '#d94c4c', label: '#fff8f0', accent: '#d94c4c', tc: '#c0392b' });
  add('cocktail', 'cocktail', { empty: '#f7f1fc', stroke: '#9db0cf', liq: '#ff8fb3', accent: '#e5384f' });
  add('vodka', 'spirit', { empty: '#f4f8fc', stroke: '#9bb2c9', liq: '#d9ecf8', cap: '#4a7fd8', label: '#ffffff', accent: '#4a7fd8', tc: '#2f5fb8' });
  add('tequila', 'spirit', { empty: '#fdf3e0', stroke: '#c9a24a', liq: '#f6d98a', cap: '#3a8a5a', label: '#fff8e8', accent: '#3a8a5a', tc: '#2a6a42' });
  add('rum', 'spirit', { empty: '#e6cfae', stroke: '#8a5a22', liq: '#a3601f', cap: '#2a2a2e', label: '#f4ead2', accent: '#8a2f2a', tc: '#6a1f1a' });
  add('shot', 'ochoko', { empty: '#f1f5fb', stroke: '#9db0cf', liq: '#f2c14e', accent: '#b9a7f5' });
  add('custom-bottle', 'spirit', { empty: '#e9f2ec', stroke: '#6fa085', liq: '#7fb596', cap: '#3f7f5f', label: '#ffffff', accent: '#3f7f5f', tc: '#2a5f45' });
  add('custom-can', 'can', { empty: '#e9f2ec', stroke: '#6fa085', liq: '#7fb596', band: '#3f7f5f', accent: '#ffffff', tc: '#fff' });
  add('custom-glass', 'tumbler', { empty: '#f1f7f3', stroke: '#6fa085', liq: '#7fb596', ice: false });

  const SPECS = {};
  S.forEach(([id, shape, p]) => { SPECS[id] = { shape, p }; });
  const baseId = id => id.replace(/-(bottle|glass|can)$/, '');

  let uid = 0;
  function drinkIcon(id, fill, opt) {
    opt = opt || {};
    const sp = SPECS[id] || SPECS['custom-bottle'], p = sp.p, k = 'di' + (++uid);
    const tx = TEXT[baseId(id)] || ['', ''];
    const d = SHAPES[sp.shape](p, tx, k);
    fill = Math.max(0, Math.min(1, fill == null ? 1 : fill));
    const y = d.bot - (d.bot - d.top) * fill;
    const size = opt.h ? ` height="${opt.h}" width="${(opt.h * 2 / 3).toFixed(1)}"` : '';
    const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96"${size} class="di" role="img" aria-hidden="true">`;

    if (opt.flat) { // 분량 타일용 단색 아이콘 (시안의 단순한 초록 병)
      const c = opt.color || p.flat || p.liq;
      const cp = d.cap ? `<rect x="${d.cap[0] + 1}" y="${d.cap[1] + 1}" width="${d.cap[2] - 2}" height="${d.cap[3] - 1}" rx="2" fill="${c}"/>` : '';
      return `${head}<defs><clipPath id="${k}c"><path d="${d.clip}"/></clipPath></defs>${cp}
        <path d="${d.clip}" fill="#fff" stroke="${c}" stroke-width="2.600" stroke-linejoin="round" opacity=".95"/>
        ${fill > 0 ? `<g clip-path="url(#${k}c)"><rect x="0" y="${y.toFixed(2)}" width="64" height="${(96 - y).toFixed(2)}" fill="${c}"/></g>` : ''}</svg>`;
    }

    const liquid = fill > 0 ? `<g clip-path="url(#${k}c)"><rect x="0" y="${y.toFixed(2)}" width="64" height="${(96 - y).toFixed(2)}" fill="${p.liq}"/>
      <rect x="0" y="${y.toFixed(2)}" width="64" height="${(96 - y).toFixed(2)}" fill="url(#${k}v)"/>
      <rect x="0" y="${y.toFixed(2)}" width="64" height="2.600" fill="#fff" opacity=".55"/></g>` : '';
    const hl = d.hl ? `<rect x="${d.hl[0]}" y="${d.hl[1]}" width="2.600" height="${d.hl[2]}" rx="1.300" fill="#fff" opacity=".7"/><rect x="${d.hl[0] + 4.600}" y="${d.hl[1] + 4}" width="1" height="${Math.max(6, d.hl[2] - 12)}" rx=".5" fill="#fff" opacity=".28"/>` : '';
    return `${head}
<defs><clipPath id="${k}c"><path d="${d.clip}"/></clipPath>
<linearGradient id="${k}s" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset=".07" stop-color="#000" stop-opacity=".1"/><stop offset=".16" stop-color="#fff" stop-opacity=".5"/><stop offset=".27" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity=".1"/><stop offset=".93" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
<linearGradient id="${k}v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<linearGradient id="${k}m" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#8a93a8"/><stop offset=".3" stop-color="#fff"/><stop offset=".6" stop-color="#c3c9d8"/><stop offset="1" stop-color="#7d869b"/></linearGradient>
<filter id="${k}b" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="1.800"/></filter></defs>
<ellipse cx="32" cy="93.200" rx="${opt.shadowRx || 16}" ry="2.600" fill="#1e2a22" opacity=".3" filter="url(#${k}b)"/>
${d.pre || ''}
<path d="${d.clip}" fill="${p.empty}" fill-opacity=".95"/>
${liquid}
${d.post ? d.post(y, fill) : ''}
${d.front || ''}
<path d="${d.clip}" fill="url(#${k}s)"/>
<path d="${d.clip}" fill="none" stroke="${p.stroke}" stroke-opacity=".75" stroke-width="1.200" stroke-linejoin="round"/>
${hl}
</svg>`;
  }

  const api = { drinkIcon, SPECS, ICON_IDS: Object.keys(SPECS), TEXT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).icons = api;
})(typeof window !== 'undefined' ? window : globalThis);
