// assets/drinks/*.svg 생성 (js/icons.js 와 같은 소스, 액체 100% 채움, 투명 배경)
// 실행: node tools/build-assets.js
const fs = require('fs'), path = require('path');
const { drinkIcon, ICON_IDS } = require('../js/ui/icons-svg.js');
const out = path.join(__dirname, '..', 'assets', 'drinks');
fs.mkdirSync(out, { recursive: true });
for (const id of ICON_IDS) {
  const svg = drinkIcon(id, 1, { h: 192 }).replace(' aria-hidden="true"', '');
  fs.writeFileSync(path.join(out, id + '.svg'), svg);
}
console.log(ICON_IDS.length + ' icons -> ' + out);
