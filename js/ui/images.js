/* ui/images.js - 제품 이미지 렌더링 (이미지 교체는 이 파일이 아니라 images/ 폴더만 바꾸면 됨)
   1) images/manifest.js 에 파일이 연결된 제품 → 그 파일(PNG/WebP/JPG/SVG)을 object-fit: contain 으로 표시
   2) 연결된 파일이 없으면 → 임시 SVG 그림(icons-svg.js)
   분량 채움 효과는 두 경우 모두 동일하게 동작합니다. */
(function (root) {
  'use strict';
  const DB = root.DB, manifest = () => DB.imageManifest || {}, opts = () => DB.imageOptions || { fill: { top: 7, bottom: 2 }, perImage: {} };
  const fileOf = id => manifest()[id] || null;

  function fileImage(id, src, fill, h) {
    const w = Math.round(h * 2 / 3), f = Math.max(0, Math.min(1, fill == null ? 1 : fill));
    const o = Object.assign({}, opts().fill, (opts().perImage || {})[id]);
    const img = (cls, st) => `<img class="pi${cls ? ' ' + cls : ''}" src="${src}" alt="" draggable="false"${st ? ` style="${st}"` : ''}>`;
    const box = `<span class="pimg" style="height:${h}px;width:${w}px">`;
    if (f >= 0.995) return box + img('') + '</span>';
    const inset = (o.top + (100 - o.top - o.bottom) * (1 - f)).toFixed(1); // 위쪽부터 잘라 아래에서 채워지는 것처럼 표시
    return box + img('ghost') + img('', `clip-path:inset(${inset}% 0 0 0)`) + '</span>';
  }

  /** 제품 이미지 HTML. fill: 0~1(내부가 채워진 비율), opt.h: 높이(px), opt.flat: 분량 타일용 단색 아이콘 */
  function render(id, fill, opt) {
    opt = opt || {};
    const src = fileOf(id);
    if (src && !opt.flat) return fileImage(id, src, fill, opt.h || 96);
    return DB.icons.drinkIcon(id, fill, opt);
  }
  DB.imageView = { render, fileOf };
})(typeof window !== 'undefined' ? window : globalThis);
