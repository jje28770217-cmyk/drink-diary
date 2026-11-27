# 음주 건강 위험 분석용 공식 지침 기준 조사

조사일: 2026-11-27. 아래 원문 페이지를 직접 열어(HTTP 수집) 확인한 내용만 기록함. 확인 못 한 것은 "확인 못 함".

## 0. 앱에 쓸 확정 임계값 요약

| 구분 | 값 | 근거 |
|---|---|---|
| 한국 고위험 음주 | 1회 평균 남 7잔 이상 / 여 5잔 이상, 주 2회 이상 | 국가건강정보포털 '위험음주!' (1-1) |
| 한국 월간 폭음 | 한 번의 술자리 남 7잔 이상 / 여 5잔 이상, 월 1회 이상 | 위와 동일 |
| 한국 표준잔 | 1표준잔 = 소주 1잔, 한 잔당 알코올 약 8~12 g (소주 1병 = 6.7표준잔) | 위와 동일 (1-2) |
| 미국 표준잔 | 14 g (NIAAA) | 1-3, 2-3 |
| 한국 정부 공식 저위험 음주 수치 | 없음 (암 예방수칙은 "소량도 피하기") | 2-1, 2-2 |
| NIAAA 저위험(구버전) | 남 하루 4잔·주 14잔 이하 / 여 하루 3잔·주 7잔 이하 | 2-3 |
| 대한간학회 (포털 인용) | 알코올성 간 손상 위험 상승: 남 하루 평균 40 g 이상, 여 20 g 이상 | 2-4 |
| WHO | "안전한 음주량 없음", 2023-01-04 (WHO/Europe) | 3 |
| 연속 음주 일수 기준 | 공식 수치 기준 없음. 포털에 "음주 후 적어도 3일은 금주" 권고 문장만 있음 | 7 |

주의: 포털 '음주' 페이지(2026-06-15 업데이트)는 NIAAA 기준을 인용해 "고위험 음주"를 "주당 남 8잔 초과, 여 4잔 초과 또는 1회 남 4잔 초과, 여 3잔 초과"로 쓰고(1-3), 같은 기관의 다른 페이지('위험음주!')는 보건복지부 모니터링 기준(남 7잔/여 5잔, 주 2회)을 씀. 두 정의가 다르므로 앱에서는 "한국 보건복지부·질병관리청 모니터링 기준"과 "NIAAA 기준"을 구분해 표기할 것. 또 포털은 1표준잔 정의가 페이지마다 다름(NIAAA 14 g vs 한국 소주잔 8~12 g).

---

## 1. 한국 '고위험 음주'·'위험 음주' 정의

### 1-1. 질병관리청 국가건강정보포털 - 위험음주! 알려드리겠습니다!
- 기관: 질병관리청 국가건강정보포털
- 등록 2020-04-22, 업데이트 2026-05-08
- URL: https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5355
- 원문:
  - "고위험 음주: 1회 평균 남자는 7잔 이상, 여자는 5잔 이상을 주 2회 이상 음주하는 경우를 의미합니다."
  - "우리나라 보건복지부에서는 ‘월간 폭음’과 ‘고위험 음주’를 대표적인 위험 음주로 규정하고, 이에 대한 모니터링을 하고 있습니다."
  - "월간 폭음(남자 7잔, 여자 5잔 이상을 월 1회)" ; 정의: "최근 1년 동안 월 1회 이상 한 번의 술자리에서 남자는 7잔 이상, 여자는 5잔 이상 음주한 분율"
  - "보건의료분야에서는 폭음과 고위험 음주를 '위험 음주'로 정의하고 있습니다."

### 1-2. 같은 페이지 - 표준잔
- "음주량을 측정할 때의 ‘한 잔’이란 ‘표준잔(standard drink)’을 의미하며, 우리나라에서의 1 표준잔이라고 한다면 소주 1잔을 생각하시면 됩니다."
- "한 잔에 포함된 알코올의 양은 대략 8~12그램 정도로 비슷해집니다."
- "355 mL짜리 맥주 1캔은 1.4 표준잔, 소주 1병은 6.7 표준잔에 해당합니다. 또한 막걸리는 약 5 표준잔"
- 참고: 한국 표준잔의 g 환산은 이 문서에서 단일값으로 확정되지 않음(8~12 g 범위).

### 1-3. 질병관리청 국가건강정보포털 - 음주
- 등록 2020-08-19, 업데이트 2026-06-15
- URL: https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5297
- 원문:
  - "미국국립알코올남용중독연구소(NIAAA) 가이드라인은 주당 평균 음주량이 남성은 8잔 초과, 여성은 4잔을 초과하거나 1회 평균 음주량이 남성 4잔 초과, 여성 3잔을 초과하는 경우 고위험 음주로 정의합니다."
  - "미국국립알코올남용중독연구소에서는 알코올 14 g을 표준 1잔으로 규정합니다. 이는 양주 1.5온스(≒ 45 mL), 포도주 5온스(≒ 150 mL), 맥주 12온스(≒ 350-360 mL)에 해당합니다."
  - "17%의 소주는 ¼병(≒ 90 mL)입니다."
  - "폭음은 미국국립알코올남용중독연구소에 따르면 표준 한잔 기준 남성 4잔(소주 1병) 초과, 여성 3잔(소주 3/4병) 초과입니다."

### 1-4. 질병관리청 국가건강정보포털 - 알코올 간질환
- 등록 2020-03-14, 업데이트 2026-06-05
- URL: https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5310
- 원문(요약 도구 출력에서 인용, 원문 줄 단위 재검증은 하지 않음): "1회 음주 시 60 g 이상의 알코올을 섭취하는 경우 고위험음주로 정의합니다." (표기 방식이 위 정의와 다름에 주의)

---

## 2. 저위험 음주 가이드라인 수치

### 2-1. 한국: 정부 공식 단일 기준
- 확인 못 함 (공식 저위험 수치 없음). 국가암정보센터가 직접 "우리나라에서는 적정 음주에 대한 명확한 기준이 제시되어 있지는 않습니다"라고 기술.

### 2-2. 국가암정보센터(국립암센터) - 질문과 답변 (음주)
- 최종수정 2019-10-14
- URL: https://www.cancer.go.kr/lay1/S1T231C241/contents.do
- 원문:
  - "우리나라에서는 적정 음주에 대한 명확한 기준이 제시되어 있지는 않습니다만 최신 개정된 암예방 수칙에는 암예방을 위해서는 하루 한두 잔의 소량의 술도 마시지 않기를 제안하고 있습니다. 암발생에 있어서는 안전수준의 음주량이 존재하지 않습니다."
  - "2016년 암예방수칙을 ‘암 예방을 위해서는 하루 한두 잔의 소량의 음주도 피하기’로 개정하였습니다."
  - "세계보건기구(WHO)에서는 저위험 음주를 순수 알코올 섭취량으로 보았을 때 남자는 하루 40g(약 소주 3잔) 미만 여자는 하루 20g(약 소주 2잔) 미만으로 정의하고 있습니다." (이 페이지가 WHO 정의로 인용한 문장이며 WHO 원문은 직접 확인 못 함)
  - "과도 음주... 남성의 경우 하루 평균 3표준잔 이상, 여성의 경우 하루 평균 2표준잔 이상" (이 페이지의 정의)
- 2019년 자료로 오래됨. 포털(2026) 및 WHO(2023) 입장과 비교해 "한두 잔도 피하기"가 최신 입장.

### 2-3. NIAAA - Rethinking Drinking (웹아카이브 2020-12-18 스냅샷)
- URL: https://webarchive.library.unt.edu/web/20201218003306mp_/http://rethinkingdrinking.niaaa.nih.gov
- 원문:
  - "A U.S. standard drink contains about 0.6 fluid ounces or 14 grams of pure alcohol"
  - 저위험: Men "No more than 4 drinks on any day ... no more than 14 per week"; Women "No more than 3 drinks on any day ... no more than 7 per week"
  - "Heavy or at-risk drinking — Men: More than 4 drinks on any day or more than 14 drinks per week"
  - "Light to moderate drinking — Men: Up to 2 drinks per day; Women: Up to 1 drink per day"
- 현행 NIAAA 페이지(Last Revised 2025-05-08) 'Basics: Defining How Much Alcohol is Too Much'에는 위 저위험 수치가 없음(WebFetch 요약 기준):
  - URL: https://www.niaaa.nih.gov/health-professionals-communities/core-resource-on-alcohol/basics-defining-how-much-alcohol-too-much
  - "there is no guaranteed safe amount of alcohol for anyone" / "the less alcohol, the better"
  - 폭음: "When a woman has 4 or more drinks—or a man has 5 or more—in about 2 hours"
  - 과음: 여 "4 or more drinks on any day or 8 or more per week", 남 "5 or more drinks on any day or 15 or more per week"
  - 표준잔: "any drink containing 14 grams, or about 0.6 fluid ounces, of “pure” ethanol"
- 따라서 NIAAA 4/14, 3/7은 "구버전(아카이브)"으로만 표기하고 현행 권고처럼 쓰지 말 것.

### 2-4. 대한간학회 기준 (포털 인용)
- 국가건강정보포털 '음주' 페이지(1-3 URL): "대한간학회는 남성에서 하루 평균 40 g(약 소주 4잔) 이상, 여성에서 하루 평균 20 g(약 소주 2잔)이상의 음주는 알코올성 간 손상의 위험을 높이므로 과도한 음주를 피하도록 권고하며"
- 학회 기준이며 정부 지침 아님.

### 2-5. 포털의 '적절 음주'
- "미국국립알코올남용중독연구소는 적절 음주를 표준 1잔(알코올 14g) 기준 일주일에 남성 8잔(소주 2병) 이하, 여성 4잔(소주 1병) 이하로 정의하였습니다."
- "하지만, 세계보건기구(WHO)는 건강을 위해 안전한 알코올 섭취량은 없다고 선언하였으므로 적절 음주량은 0이라 할 수 있습니다." (1-3 URL)

---

## 3. WHO '안전한 음주량 없음' 성명

- 기관: WHO 유럽지역사무소
- 문서: "No level of alcohol consumption is safe for our health" (보도자료)
- 발표: 2023-01-04
- URL: https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health
- 원문: "there is no safe amount that does not affect health." / "the risk to the drinker's health starts from the first drop of any alcoholic beverage." / "Alcohol causes at least seven types of cancer" / "currently available evidence cannot indicate the existence of a threshold"
- 별도: WHO Fact sheet "Alcohol" (2024-06-28): "There is no form of alcohol consumption that is risk-free." (이 문서에는 "no safe level" 문구 자체는 없음)
  - URL: https://www.who.int/news-room/fact-sheets/detail/alcohol
- 한국 포털은 이를 "세계보건기구(WHO) 역시 '건강을 위해 안전한 알코올 섭취량은 없다'고 선언하였습니다"로 인용(1-1 URL). 연도는 포털에 없음.

---

## 4. 임신·청소년·고령 등 예외 안내

### 임신
- 질병관리청 국가건강정보포털 '식이영양(임산부)' (업데이트 2026-05-11): "임신 중 알코올 섭취는 유산이나 태아의 발달에 문제를 유발할 수 있으므로 절대로 피해야 합니다."
  - URL: https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214
- 국립암센터 '엄마도 아기도 안전한 음주 예방 가이드라인' (발행 2025-02): "임신 중에는 술을 마시지 않는 것이 가장 안전합니다. 소량의 음주도 안심할 수 없습니다." / "모유수유 기간 중에도 술은 마시지 않는 것이 가장 안전합니다."
  - URL: https://cancer.go.kr/download.do?uuid=d0b02241-3714-416c-b5bc-9979f8f74607.pdf
- 국가암정보센터 '음주 위해' (최종수정 2023-06-13): "특히 임산부의 음주는 태아의 저체중 및 선천성 기형이나 신경학적 질환을 유발하는 것으로 잘 알려져 있습니다."
  - URL: https://www.cancer.go.kr/lay1/S1T231C232/contents.do
- WHO Fact sheet: "Alcohol consumption during pregnancy increases the risk of having a child with fetal alcohol spectrum disorders (FASDs)"
- NIAAA (아카이브 2020): "women who are pregnant or may become pregnant should not drink."

### 청소년
- NIAAA(아카이브 2020): "The younger people are when they start to drink, the more likely they are to develop alcohol use disorder at some point in their lives." 현행 NIAAA 페이지는 법적 음주 연령(21세, 미국) 미만을 음주 회피 대상으로 분류(요약 기준).
- WHO Fact sheet: "Younger people are disproportionately negatively affected by alcohol consumption"
- 한국: 포털 '음주' 페이지는 청소년/노인 내용 없이 별도 페이지 링크만 있음. 청소년 음주에 대한 한국 공식 권고 문장은 확인 못 함 (국가암정보센터 Q&A에 청소년 음주율 통계만 있음). 한국 법적 음주 연령(19세) 관련 공식 문서 문장도 이번에 확인 못 함.

### 고령·기타
- 국가암정보센터 Q&A(2019): "예를 들면 노약자나 약물을 복용하는 사람은 더 적은 양의 술을 마시더라도 폭음이 될 수 있습니다."
  - URL: https://www.cancer.go.kr/lay1/S1T231C241/contents.do
- 고령자 전용 권고 수치: 확인 못 함 (WHO Fact sheet에 고령자 내용 없음).
- 기저질환(포털 '음주', 1-3 URL): "대한고혈압학회에서는 고혈압 환자에게 금주를 권하며, 부득이한 경우 혈압 조절이 잘 될 때에 한해 하루 1잔(10 g) 이하로 알코올 섭취를 제한하라고 권고합니다." / "혈당 조절이 잘 되는 당뇨병 환자에 한해 1일 1~2잔으로 제한하며, 간질환 또는 이상지질혈증이 있거나 비만한 당뇨병 환자에게는 금주를 권고합니다."

---

## 5. 음주 관련 건강 위험 (공식 문서 명시 문장)

출처: 국가건강정보포털 '음주' (업데이트 2026-06-15) https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5297 (별도 표기 제외)

- 간: "대한간학회는 남성에서 하루 평균 40 g ... 여성에서 하루 평균 20 g ... 음주는 알코올성 간 손상의 위험을 높이므로 과도한 음주를 피하도록 권고하며" / "음주는 간경변 발생과 사망률을 증가시킵니다. 같은 양의 술을 마셔도 여성은 간경변의 위험도가 더 높습니다."
- 위장·췌장: "음주는 췌장염의 주요한 위험인자입니다." (일반 위장 증상/위염 문장은 이 문서에서 확인 못 함). 국가암정보센터 '음주 위해'는 위암을 음주로 발생하는 암으로 나열.
- 수면: "음주는 수면장애를 유발합니다. ... 과음을 하면 수면의 질과 수면 시간이 모두 줄어듭니다." / "음주량이 늘수록 남성의 수면 시 호흡장애가 증가합니다."
- 심혈관: "소량의 음주라도 고혈압, 암을 유발할 수 있으며, 과도한 음주는 간질환, 관상동맥, 심장질환 및 뇌졸중 위험을 높입니다." / "위험 음주는 심방세동의 위험도를 높입니다."
- 암: "국제 암연구소(IARC)에 따르면 알코올은 1군 발암물질이며 암 발병률을 높입니다. 두경부암(구강, 인두, 후두 등), 식도암, 간암, 유방암, 대장암, 췌장암은 음주와 관련이 있습니다." 국가암정보센터(2023-06-13): "술을 마시지 않는 사람보다 하루에 50g 정도(맥주 500ml 2잔, 막걸리 760ml 1병, 소주 360ml 2/3병, 또는 위스키 3잔에 해당)의 알코올 섭취를 하는 사람의 경우, 이러한 암 발생의 위험이 2-3배까지 증가하게 됩니다." / "또한 음주와 흡연을 동시에 할 경우 암 발생 위험은 배가 됩니다." (https://www.cancer.go.kr/lay1/S1T231C232/contents.do)
- 의존·정신: "알코올 사용 장애가 있는 사람은 일반인에 비해 약물 사용 장애가 있을 위험도가 10배, 우울증이나 양극성 장애 위험도가 4배, 불안장애를 겪을 위험도는 3배 높습니다." / "과도한 음주는 영양 결핍과 수면장애를 유발하고, 우울감 및 자살률 증가와 관련이 있습니다." / 국가암정보센터: "알코올 중독이나 알코올 의존성 등의 정신사회적 문제"
- 자가진단: "AUDIT-K ... 총합이 8점 이상일 때 위험 음주라고 정의합니다."
- 포털 '위험음주!'(1-1 URL): "음주 자가진단에서 고도 음주자나 알코올 의존성이 있는 것으로 결과가 나온 경우, 알코올 전문가의 도움을 받도록 합니다."
- WHO Fact sheet: "Alcohol is an established carcinogen and alcohol consumption increases the risk of several cancers"; "209 million people (3.7% of the adult world population) lived with alcohol dependence"

---

## 6. 음주 후 응급 증상 시 의료기관 안내 근거

- NIAAA 한국어판 'Alcohol overdose' (2021년 6월 업데이트; 영문 원본의 한국어 번역본)
  - URL: https://www.niaaa.nih.gov/sites/default/files/publications/Alcohol_overdose_Korean.pdf
  - "알코올 과다복용의 증상에는 정신 혼동, 의식을 유지하기 어려움, 구토, 발작, 호흡 곤란, 느린 심박수, 축축한 피부, 구역질 반사(질식 방지)없음과 같은 둔한 반응 및 매우 낮은 체온이 포함됩니다."
  - "위험 신호를 파악하고 알코올 과다복용이 의심되는 경우, 즉시 119로 전화하여 도움을 받으십시오."
  - "의사처럼 행동하지 마십시오—찬물 샤워, 뜨거운 커피 및 걷기는 알코올 과다복용의 영향을 회복시키지 않으며 실제로 이를 더 악화시킬 수 있습니다."
  - 주의: 미국 기관 문서의 한국어 번역본이며 한국 공식 기관 문서가 아님. 영문 원본은 열지 못함.
- 질병관리청 국가건강정보포털 '음주'(1-3 URL): "금단 섬망(정신 상태의 혼란, 환각 등이 동반되는 응급 상태)" / "알코올 금단 증상은 조기에 철저한 평가를 시행해 전문적인 치료를 받아야 합니다." 급성 알코올 중독(과음 직후) 응급 대응 문장은 이 페이지에 없음.
- 국가건강정보포털 '알코올 간질환'(1-4 URL): "우상복부 통증, 고열, 심한 황달이 나타날 수 있으며" (중증 간손상 징후. 병원 방문 지시 문장 자체는 확인 못 함).
- 한국 보건복지부·질병관리청 문서 중 급성 알코올 중독 시 119/응급실 방문을 직접 지시하는 문장: 확인 못 함.

---

## 7. 연속 음주 일수에 관한 기준

- 한국·WHO·NIAAA 공식 문서에서 "연속 음주 N일 이상이 위험"이라는 정량 기준: 확인 못 함 (없음).
- 가장 가까운 문장: 국가건강정보포털 '음주'(1-3 URL) "술을 안 마시는 금주 요일을 스스로 정하고, 음주 후에는 적어도 3일은 금주합니다." (생활 속 음주 관리 권고이며 위험 임계값이 아님)
- 국가암정보센터 '절주 계획과 실천'(최종수정 2023-06-13)은 "1주일 중 음주일: ( ) 일"을 스스로 정하는 양식만 있고 수치 기준 없음. https://www.cancer.go.kr/lay1/S1T231C234/contents.do
- 앱에서 연속 음주 일수 경고를 넣는다면 "공식 임계값이 아닌 앱 자체 규칙"으로 표기해야 함.

---

## 8. 확인 못 한 항목 / 한계

- 보건복지부 현행 절주 가이드라인 원문: 확인 못 함. 열어본 mohw.go.kr 문서는 임신 음주 보도자료(2010-08-04, 구 질병관리본부 발표)뿐이며 본문은 헤드라인 수준.
- 한국 법적 음주 연령(19세) 및 청소년 음주 공식 권고 문장: 확인 못 함.
- 고령자 전용 수치: 확인 못 함.
- WHO 원문에서 "저위험 음주 남 40 g / 여 20 g 미만" 정의: 확인 못 함 (국가암정보센터 인용만 확인).
- 현행 NIAAA 영문 'Alcohol overdose' 페이지 및 현행 NIAAA 저위험 한도 페이지: 열지 못함(추정 URL 404). NIAAA 현행 페이지 내용은 WebFetch 요약 결과 기반.
- 국가건강정보포털 '알코올 간질환' 60 g 문장은 요약 도구 출력에서 인용, 원문 재검증 안 함.
- 포털 '음주'와 '위험음주!'에서 고위험 음주 정의가 NIAAA 기준과 보건복지부 기준으로 이원화되어 있음.
