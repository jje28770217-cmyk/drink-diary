# Drink Balance
- 주제: 마신 술의 종류와 양을 날짜별로 기록하고, 순수 알코올 섭취량과 건강 위험을 확인하는 화면
- 대상: 나 혼자 쓰는 개인용
- 상태: 기능 완성(캘린더·기록·통계·위험 분석·서버 저장), Stitch 시안(`stitch/`) 적용. 제품 이미지는 새로 3종만 실물, 나머지는 임시 그림. GitHub 업로드 전
## 고치는 법
1. 제품 추가·도수 수정: js/data/products.js
2. 이미지 교체: images/<이미지 id>.png 저장 후 npm run build:images
3. 색·모양: css/tokens.css, css/style.css
4. 기능 확인: npm test, npm run test:e2e

---

음주를 날짜별로 기록하고, 순수 알코올 섭취량과 건강 위험을 확인하는 웹앱입니다.
로그인·외부 DB·유료 API가 없고, 기록은 **내 브라우저 또는 내 PC의 로컬 서버에만** 저장됩니다.

> 건강 안내는 공식 지침을 바탕으로 한 **참고용 정보**이며 의사의 진단이 아닙니다. 음주량이 적다고 안전하다는 뜻이 아닙니다.

## 실행

| 방법 | 명령 | 저장 위치 |
|---|---|---|
| 파일로 열기 | `index.html` 더블클릭 | 이 브라우저(localStorage) |
| 로컬 서버(권장) | `npm start` → http://127.0.0.1:3000 | `server/data/db.json` |

- Node 18 이상 필요. 서버는 의존성이 없어 `npm install`이 필요 없습니다. 내 PC(127.0.0.1)에서만 접속됩니다.
- 서버로 처음 열면 브라우저에 있던 기존 기록을 서버로 한 번 옮깁니다. 설정 화면에서 현재 저장 위치를 볼 수 있습니다.
- 저장 방식은 `js/config.js` 의 `storage` 로 바꿉니다: `auto`(기본: 서버가 있으면 서버, 없으면 브라우저) / `local` / `remote`.

## 폴더 구조 (프론트엔드 / 백엔드 / 디자인 분리)

```
drink-diary/
├─ index.html              화면 뼈대와 스크립트 로드 순서
├─ server/                 ── 백엔드 ──
│  └─ server.js            의존성 없는 Node 서버: 정적 파일 + 저장 API (/api/*)
├─ js/
│  ├─ config.js            저장 방식·API 주소 설정
│  ├─ data/                ── 데이터 ──
│  │  ├─ products.js       제품 DB(이름·용량·도수·출처·확인 상태)
│  │  └─ guidelines.js     건강 지침 기준, 위험도 분석 규칙, 출처, 안내 문구
│  ├─ core/                ── 프론트엔드 기능(화면 없음, Node에서 테스트 가능) ──
│  │  ├─ calc.js           날짜·단위·순수 알코올 계산, 분량 표기
│  │  ├─ store.js          상태와 모든 데이터 변경(저장·수정·삭제·설정)
│  │  ├─ draft.js          "마신 양 선택" 한 번의 입력(단위·분량·검증·저장)
│  │  └─ stats.js          주간·월간·연간 통계
│  ├─ api/                 ── 저장 연결(어댑터) ──
│  │  ├─ local.js          브라우저 localStorage
│  │  ├─ remote.js         로컬 서버 REST
│  │  └─ index.js          설정에 따라 선택, 서버 최초 사용 시 기록 이전
│  └─ ui/                  ── 화면(디자인 쪽) ──
│     ├─ views.js          화면 마크업(HTML 문자열)
│     ├─ app.js            이벤트 연결·화면 상태(컨트롤러)
│     ├─ images.js         제품 이미지 선택·렌더링(파일 있으면 파일, 없으면 SVG)
│     └─ icons-svg.js      이미지가 없을 때 쓰는 임시 SVG 그림
├─ css/
│  ├─ tokens.css           색·그림자·글꼴·차트 색 (테마)
│  ├─ style.css            컴포넌트 스타일
│  └─ responsive.css       태블릿·PC 배치
├─ images/                 제품 이미지 (교체 대상)
│  ├─ manifest.js          이미지 id → 파일 경로 (자동 생성, 수정 가능)
│  ├─ options.js           이미지 표시 옵션(채움 범위)
│  └─ *.png                실제 이미지 파일
├─ assets/drinks/*.svg     임시 SVG 이미지 모음(자동 생성)
├─ tools/                  build-manifest.js(이미지 연결), build-assets.js(SVG 생성)
├─ tests/                  core.test.js, server.test.js, e2e/(브라우저 시나리오)
└─ research/               제품 정보·건강 지침 조사 기록(근거 문서)
```

## 사용 기술

HTML / CSS / JavaScript(빌드 도구·프레임워크 없음, 스크립트 태그로 로드), Node.js(서버·테스트). 차트는 SVG를 직접 그립니다. 외부 CDN·라이브러리·폰트 요청이 없습니다.

## 주요 기능

- **캘린더**: 날짜별 제품 이미지와 분량 표시(`½병`, `1캔`), 금주 체크, 과음 경고 테두리·`!`, 오늘 표시, 미기록일은 빈칸(금주로 계산하지 않음)
- **주류 선택**: 카테고리, 제품 검색, 즐겨찾기, 최근 기록, 목록에 없는 제품 직접 추가
- **음주량 입력**: 1/4·1/3·1/2·2/3·3/4·1·1.5·2병, 직접 입력, +/- 조절, 병·캔·잔·mL 단위, 분량에 따라 이미지가 채워짐
- **기록 관리**: 같은 날 여러 제품, 저장·수정·삭제, 시작·종료 시간·컨디션·메모(선택)
- **계산**: 순수 알코올(g) = 마신 용량(mL) × 도수(%) ÷ 100 × 0.789, 같은 날 모든 술을 합산
- **통계**: 주간·월간·연간, 횟수·총량·평균·금주 일수·최장 연속 음주/금주·이전 기간 대비, 막대·도넛·선 그래프, 제품별 기록
- **위험도 분석**: 하루 기준, 최근 7일 기준, 반복 고위험 음주, 연속 음주, 음주 후 증상, 임신 설정. 기록 저장 직후 경고, 이유·위험·권장 행동·출처 표시
- **건강 리포트**: 간·위장·수면·심혈관·반복 음주 설명, 판단 기준·출처·연도
- **반응형**: 모바일 1열, 태블릿·PC 넓은 배치(통계 2열, 분량 선택 좌우 2열)

## 데이터와 저장 방식

기록 한 건은 저장 시점의 제품명·용량·도수를 **그대로 복사**해서 저장합니다(나중에 제품 도수를 고쳐도 과거 기록은 바뀌지 않음).

```jsonc
{
  "v": 1,
  "days": { "2026-11-27": {
      "entries": [ { "id":"e..", "pid":"cass", "name":"카스 프레시", "cat":"beer", "icon":"cass",
                     "t":"can", "qty":1, "unitMl":500, "abv":4.5, "ml":500, "g":17.75 } ],
      "sober": false, "start":"20:00", "end":"23:00", "cond":["headache"], "memo":"" } },
  "fav": ["cass"], "recent": ["cass"],
  "overrides": { "cass": { "abv": 4.5, "ml": { "can:500": 500 } } },   // 사용자가 고친 제품 기본값
  "custom": [ { "id":"c..", "name":"내 수제맥주", "cat":"beer", "abv":6, "units":[{"t":"can","ml":355}] } ],
  "profile": { "sex":"unset", "age":"", "pregnant":false }
}
```

- 브라우저 저장: localStorage 키 `drinkBalance.v1`
- 서버 저장: `server/data/db.json` (저장 시 직전 버전을 `db.json.bak`으로 보관)
- 설정 화면에서 JSON 백업 내보내기·가져오기, 전체 삭제

### 서버 API (`server/server.js`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/health` | `{ "ok": true }` |
| GET | `/api/state` | 저장된 전체 데이터 (없으면 204) |
| PUT | `/api/state` | 전체 데이터 저장. 형식 검사(날짜·기록 필드), 10MB 제한, 다른 사이트(Origin)의 쓰기 거부 |

정적 파일은 `index.html`, `css/`, `js/`, `images/`, `assets/` 만 공개합니다(`server/`, `tests/`, `research/` 등은 404).

## 제품 정보와 건강 기준에 대해

- 제품 용량·도수는 **제조사 공식 값으로 확인된 것이 거의 없습니다**(좋은데이 도수, 조니워커 블랙 정도). 대부분은 뉴스·판매처 기준의 "참고값"이며 화면에 배지로 표시됩니다. 확인하지 못한 값은 비워 두고 처음 기록할 때 직접 입력하게 합니다(입력값은 기본값으로 저장). 근거는 `js/data/products.js` 와 `research/*.json` 에 있습니다.
- 건강 기준은 `js/data/guidelines.js` 에 출처·연도와 함께 있습니다. 한국 정부의 단일 저위험 음주 수치와 연속 음주 일수의 공식 기준은 확인하지 못해, 해당 규칙은 "앱 자체 규칙"으로 화면에 표시됩니다. 근거 문서와 미확인 항목은 `research/guidelines.md`.

## 디자인을 바꿀 때 (다른 AI·디자이너 작업용)

**기능 코드(`js/core`, `js/api`, `js/data`, `server`)는 건드리지 않고** 아래만 수정하면 됩니다.

| 바꾸려는 것 | 수정 파일 |
|---|---|
| 색·그림자·글꼴·차트 색 | `css/tokens.css` |
| 컴포넌트 모양(카드, 버튼, 칩, 시트 등) | `css/style.css` |
| 태블릿·PC 배치 | `css/responsive.css` |
| 화면 구조(HTML) | `js/ui/views.js` |
| 이미지 크기(px) | `js/ui/views.js` 맨 위 `SIZE` |
| 제품 이미지 | `images/` 폴더 (아래) |

지켜야 할 규칙:
1. 버튼·입력의 `data-act`, `data-v`, `id`(예: `#abvIn`, `#saveBtn`, `#q`, `#val`, `#heroPic`) 값은 유지하세요. 이벤트가 이것으로 연결됩니다. 모양·위치·클래스 이름은 자유롭게 바꿔도 됩니다.
2. 계산·저장 로직을 화면 파일에 넣지 마세요. 필요한 값은 `core/store.js`, `core/draft.js`, `core/stats.js` 의 메서드로 얻습니다.
3. 변경 후 `npm test` 와 `npm run test:e2e` 가 통과하면 기능이 그대로인 것입니다. E2E 는 실제 브라우저(Edge/Chrome)에서 기록·수정·삭제·통계·저장을 끝까지 확인합니다. 브라우저 경로가 다르면 `BROWSER_PATH` 환경변수로 지정하세요.

### 제품 이미지 교체

1. 이미지를 `images/<이미지 id>.png` 로 저장합니다(png·webp·jpg·svg 가능). 예: `images/cass.png`, `images/cass-bottle.png`
2. `npm run build:images` 를 실행하면 `images/manifest.js` 가 자동으로 갱신됩니다(직접 고쳐도 됩니다). 값이 `null`인 제품은 임시 SVG 그림을 씁니다.
3. 이미지는 **세로로 긴 2:3 비율 캔버스에 제품이 정면으로 서 있고, 배경이 투명(또는 흰색)** 이면 가장 잘 맞습니다. 비율이 달라도 `object-fit: contain`으로 잘리거나 늘어나지 않습니다.
4. 분량에 따라 이미지가 채워지는 효과는 이미지 위에서 위쪽부터 흐리게 처리하는 방식입니다. 병 목·캡 위치가 다르면 `images/options.js` 의 `fill.top / fill.bottom` (또는 `perImage`)을 조정하세요.

이미지 id 규칙(`js/core/store.js` 의 `imageId()`):

| 제품 종류 | 단위 | 이미지 id |
|---|---|---|
| 소주·막걸리·위스키·와인·기타 | 병 | 제품 id (예: `chamisul-fresh`) |
| 맥주 | 캔 / 병 / 잔 | `cass` / `cass-bottle` / `cass-glass` |
| 위스키·와인 | 잔 | `jack-daniels-glass`, `wine-red-glass` |
| 하이볼 | 캔 / 잔 | `suntory-highball-can` / `highball` |
| 공통 잔 | 소주·고량주 등 | `shot`, `sake-cup`, `makgeolli-bowl`, `cocktail` |
| 직접 추가한 제품 | 병 / 캔 / 잔 | `custom-bottle` / `custom-can` / `custom-glass` |

전체 이미지 id 목록은 `images/manifest.js` 에 있습니다. 새 제품은 `js/data/products.js` 에 추가합니다.
현재 실제 이미지가 연결된 제품은 새로·새로 살구·새로 다래(`images/saero*.png`)뿐이고, 나머지는 임시 SVG입니다. `images/_원본/`은 원본 보관용이며 앱에서 쓰지 않습니다.

## 테스트

```
npm test            # 계산·저장소·통계·위험도·서버 API 단위 테스트 (Node)
npm run test:e2e    # 실제 브라우저로 화면 시나리오 (파일 열기 + 서버 모드)
```

## 알려진 한계

- 실제 스마트폰 기기에서는 확인하지 못했고, 브라우저 화면 크기를 바꿔 확인했습니다.
- 여러 기기·여러 탭에서 동시에 쓰면 마지막에 저장한 내용이 이깁니다(서버는 전체 데이터를 한 번에 저장).
- 백업은 수동입니다(설정 → 백업 내보내기).
