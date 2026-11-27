/* images/options.js - 제품 이미지 표시 옵션 (직접 편집). 이미지 교체 시 필요하면 여기만 조정하세요.
   fill.top / fill.bottom : 분량에 따라 병이 채워지는 범위. 이미지 높이의 %로, 병 목·캡(top)과 바닥 여백(bottom)을 제외하는 값
   perImage[id]          : 특정 이미지만 다른 값을 쓰고 싶을 때 { top, bottom } */
(function (root) {
  (root.DB = root.DB || {}).imageOptions = {
    fill: { top: 7, bottom: 2 },
    perImage: {
      // 'cass': { top: 10, bottom: 3 },
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
