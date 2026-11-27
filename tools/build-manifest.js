// images/manifest.js 생성: images/ 폴더의 파일을 제품 이미지 id 와 자동으로 연결
// 규칙: images/<이미지 id>.(png|webp|jpg|jpeg|svg)  예) images/cass.png, images/cass-bottle.png
// 실행: node tools/build-manifest.js   (npm run build:images)
const fs = require('fs'), path = require('path');
const { ICON_IDS } = require('../js/ui/icons-svg.js');
const dir = path.join(__dirname, '..', 'images');
fs.mkdirSync(dir, { recursive: true });
const EXT = ['.png', '.webp', '.jpg', '.jpeg', '.svg'];
const files = {}; // id → 파일명
fs.readdirSync(dir).forEach(f => { const e = path.extname(f).toLowerCase(); const id = path.basename(f, path.extname(f)); if (EXT.includes(e) && !f.startsWith('_')) files[id] = f; });
const known = new Set(ICON_IDS);
const unknown = Object.keys(files).filter(id => !known.has(id));
const ids = ICON_IDS.slice().sort();
const lines = ids.map(id => `  ${JSON.stringify(id)}: ${files[id] ? JSON.stringify('images/' + files[id]) : 'null'},`);
const out = `/* images/manifest.js - 제품 이미지 id → 파일 경로. 자동 생성: node tools/build-manifest.js
   - 값이 null 이면 임시 SVG 그림(assets/drinks, js/ui/icons-svg.js)을 사용합니다.
   - 이미지를 교체하려면 images/<id>.png 로 파일을 넣고 위 명령을 다시 실행하거나, 이 파일의 값을 직접 고치세요.
   - 새 제품을 만들면 js/data/products.js 에 제품을 추가하고, 이미지 id 는 js/core/store.js 의 imageId() 규칙을 따릅니다. */
(function (root) {
  (root.DB = root.DB || {}).imageManifest = {
${lines.join('\n')}
  };
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(dir, 'manifest.js'), out);
const have = ids.filter(id => files[id]);
console.log(`manifest: ${ids.length}개 id 중 이미지 연결 ${have.length}개 (${have.join(', ') || '없음'})`);
if (unknown.length) console.log('※ 연결되지 않은 파일(이름이 이미지 id 와 다름): ' + unknown.join(', '));
