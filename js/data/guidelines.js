/* Drink Balance - 건강 위험 분석 (공식 지침 기반 참고 정보)
   근거 문서와 확인·미확인 내용은 research/guidelines.md 에 정리했습니다 (조사일 2026-11-27).
   - 의학적 진단이 아니며, 안전한 음주량을 보장하는 표현을 쓰지 않습니다.
   - 한국 정부의 단일 저위험 음주 수치는 확인하지 못했습니다. 아래 기준은 질병관리청 국가건강정보포털이 인용한 NIAAA 정의,
     보건복지부 모니터링 기준, 대한간학회 권고(포털 인용)를 출처와 함께 표시한 것입니다.
   - 연속 음주 일수의 공식 임계값은 없어서 앱 자체 규칙으로 표시합니다. */
(function (root) {
  const PORTAL_DRINK = 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5297';
  const PORTAL_RISK = 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5355';

  const SOURCES = [
    { org: '질병관리청 국가건강정보포털', title: '음주', year: '2026.06 업데이트', url: PORTAL_DRINK },
    { org: '질병관리청 국가건강정보포털', title: '위험음주! 알려드리겠습니다!', year: '2026.05 업데이트', url: PORTAL_RISK },
    { org: 'WHO 유럽지역사무소', title: 'No level of alcohol consumption is safe for our health', year: '2023', url: 'https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health' },
    { org: 'WHO', title: 'Alcohol (Fact sheet)', year: '2024', url: 'https://www.who.int/news-room/fact-sheets/detail/alcohol' },
    { org: '국가암정보센터(국립암센터)', title: '음주 위해', year: '2023', url: 'https://www.cancer.go.kr/lay1/S1T231C232/contents.do' },
    { org: '질병관리청 국가건강정보포털', title: '식이영양(임산부)', year: '2026.05 업데이트', url: 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214' },
    { org: 'NIAAA(미국 국립알코올남용중독연구소)', title: 'Alcohol overdose (한국어판, 미국 기관 문서의 번역본)', year: '2021', url: 'https://www.niaaa.nih.gov/sites/default/files/publications/Alcohol_overdose_Korean.pdf' }
  ];

  const CRITERIA = [
    { text: '하루 기준: 1회 음주량이 남성 4표준잔(56g) 초과, 여성 3표준잔(42g) 초과이면 고위험 음주로 정의 (표준잔 14g, NIAAA 정의를 질병관리청 포털이 인용)', org: '질병관리청 포털 인용', year: '2026' },
    { text: '주간 기준: 주당 평균 음주량이 남성 8표준잔(112g) 초과, 여성 4표준잔(56g) 초과이면 고위험 음주로 정의 (NIAAA 정의를 포털이 인용)', org: '질병관리청 포털 인용', year: '2026' },
    { text: '한국 고위험 음주(모니터링 기준): 1회 평균 남성 7잔·여성 5잔 이상을 주 2회 이상. 표준잔의 알코올 양이 8~12g 범위로만 제시되어, 앱은 낮은 값(8g)으로 환산해 남성 56g·여성 40g 이상을 한 번으로 계산합니다 (앱 계산)', org: '보건복지부·질병관리청', year: '2026' },
    { text: '대한간학회 권고: 하루 평균 남성 40g, 여성 20g 이상은 알코올성 간 손상 위험을 높임 (학회 기준이며 정부 지침은 아님)', org: '대한간학회(포털 인용)', year: '2026' },
    { text: '연속 음주: 공식 임계값은 확인하지 못했습니다. 포털의 "음주 후에는 적어도 3일은 금주" 권고를 참고해 3일 이상 연속 음주를 앱 자체 규칙으로 알려 드립니다', org: '앱 자체 규칙', year: '' },
    { text: '임신 중 알코올 섭취는 절대로 피해야 합니다', org: '질병관리청 포털', year: '2026' },
    { text: '건강에 안전한 알코올 섭취량은 없다고 밝힘', org: 'WHO 유럽지역사무소', year: '2023' }
  ];

  const SYMPTOMS = [
    { k: 'headache', label: '두통' }, { k: 'nausea', label: '메스꺼움·속쓰림' }, { k: 'dizzy', label: '어지러움' },
    { k: 'palp', label: '심장 두근거림' }, { k: 'sleep', label: '수면 방해' }, { k: 'flush', label: '얼굴 붉어짐' }, { k: 'blackout', label: '기억이 끊김' },
    { k: 'confusion', label: '정신 혼동·의식 유지 어려움', severe: true }, { k: 'breath', label: '호흡 곤란', severe: true },
    { k: 'vomit', label: '심한 구토', severe: true }, { k: 'seizure', label: '발작', severe: true }, { k: 'cold', label: '차고 축축한 피부·체온 저하', severe: true }
  ];

  /* 참고 논문 (2026-11-28 PubMed·PMC 검색으로 서지 정보 확인. 초록 수준만 확인했고 전문은 읽지 않았습니다).
     모두 관찰연구·메타분석이라 "관련이 있다"는 뜻이며, 개인에게 일어날 일을 단정하지 않습니다. */
  const PAPERS = {
    liver: { short: '간경변 메타분석 2019', cite: 'Alcohol Consumption and Risk of Liver Cirrhosis: A Systematic Review and Meta-Analysis. Am J Gastroenterol 2019;114(10):1574-1586', url: 'https://pubmed.ncbi.nlm.nih.gov/31464740/',
      find: '하루 5잔 이상이면 남녀 모두 간경변 위험이 크게 커지고, 여성은 하루 1잔에서도 늘어났어요.' },
    cancer: { short: 'Bagnardi 2015', cite: 'Bagnardi V, et al. Alcohol consumption and site-specific cancer risk: a comprehensive dose-response meta-analysis. Br J Cancer 2015;112(3):580-593', url: 'https://pubmed.ncbi.nlm.nih.gov/25422909/',
      find: '구강·인두, 식도, 대장, 간, 후두, 여성 유방암 위험이 음주량에 따라 높아졌어요.' },
    bp: { short: 'Roerecke 2018', cite: 'Roerecke M, et al. Sex-Specific Associations Between Alcohol Consumption and Incidence of Hypertension: A Systematic Review and Meta-Analysis of Cohort Studies. J Am Heart Assoc 2018;7:e008202', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6064910/',
      find: '남성은 마신 양에 따라 고혈압 위험이 올라갔고, 여성은 하루 1~2잔을 넘으면 올라갔어요.' },
    wood: { short: 'Wood 2018', cite: 'Wood AM, et al. Risk thresholds for alcohol consumption: combined analysis of individual-participant data for 599,912 current drinkers in 83 prospective studies. Lancet 2018;391:1513-1523', url: 'https://pubmed.ncbi.nlm.nih.gov/29676281/',
      find: '주 100g을 넘게 마실수록 뇌졸중 위험이 커지고 기대수명이 줄었어요 (주 100g 초과 시 40세 기준 약 6개월~, 350g 초과 시 4~5년 짧아짐, 고소득국 현재 음주자 대상).' },
    sleep: { short: 'Ebrahim 2013', cite: 'Ebrahim IO, et al. Alcohol and sleep I: effects on normal sleep. Alcohol Clin Exp Res 2013;37(4):539-549', url: 'https://pubmed.ncbi.nlm.nih.gov/23347102/',
      find: '술은 잠드는 시간을 줄여도 밤 후반 수면을 더 깨뜨려요. 수면 보조 용도로 쓰면 안 된다고 결론 내렸어요.' },
    mood: { short: 'Boden 2011', cite: 'Boden JM, Fergusson DM. Alcohol and depression. Addiction 2011;106(5):906-914', url: 'https://pubmed.ncbi.nlm.nih.gov/21382111/',
      find: '알코올 사용 장애와 우울증 사이에 인과 관계가 있다고 볼 수 있다고 정리했어요 (알코올 사용 장애 기준).' }
  };

  /* 한눈에 읽는 건강 위험 4가지. 정부 지침(질병관리청 포털) 내용에 논문 근거(papers)를 함께 표시합니다 */
  const RISKS = [
    { icon: '🫀', title: '간·췌장', text: '간 손상·간경변 위험이 높아지고, 췌장염의 주요 위험인자예요.', papers: ['liver'] },
    { icon: '🎗️', title: '암', text: '알코올은 1군 발암물질이에요. 식도·간·유방·대장암 등과 관련이 있어요.', papers: ['cancer'] },
    { icon: '❤️', title: '혈압·뇌졸중', text: '소량도 고혈압을 부를 수 있고, 과음은 심장질환·뇌졸중 위험을 높여요.', papers: ['bp', 'wood'] },
    { icon: '🌙', title: '수면·마음', text: '수면의 질과 시간이 줄고, 우울감과도 관련이 있어요.', papers: ['sleep', 'mood'] }
  ];
  const RISK_SRC = '질병관리청 국가건강정보포털';
  const PAPER_NOTE = '논문은 대규모 관찰연구·메타분석으로, 음주와 질환이 "관련 있다"는 근거예요. 나에게 꼭 일어난다는 뜻은 아니에요.';

  /* 누적 경고 횟수(이번 달·올해)에 따라 단계와 권장 행동을 달리합니다.
     ※ 횟수 구간(이번 달 2회·4회, 올해 12회)은 앱 자체 규칙이며 공식 기준이 아닙니다.
     c: { monthWarn, yearWarn, monthDrink } (경고가 난 날 수, 음주한 날 수) */
  function advise(c) {
    const mw = c.monthWarn || 0, yw = c.yearWarn || 0, md = c.monthDrink || 0;
    const tier = (mw >= 4 || yw >= 12) ? 3 : mw >= 2 ? 2 : 1;
    const label = ['', '첫 경고', '반복 경고', '잦은 경고'][tier];
    let headline;
    if (tier === 1) headline = '이번 달 첫 경고예요. 오늘 멈추면 여기서 끝낼 수 있어요';
    else if (tier === 2) headline = `이번 달 벌써 ${mw}번째 경고예요. 반복되고 있어요`;
    else if (mw >= 4) headline = `이번 달 경고 ${mw}회. 거의 매주 기준을 넘고 있어요`;
    else headline = `올해 경고 ${yw}회. 한 달에 한 번 이상 기준을 넘고 있어요`;
    const stop = '오늘은 추가 음주를 멈추고 물과 식사로 쉬세요. 찬물 샤워·커피로 술을 깨려 하지 마세요.';
    const rest3 = '음주 후에는 적어도 3일은 금주하세요 (질병관리청 포털 권고).';
    const actions = tier === 1 ? [stop, rest3]
      : tier === 2 ? [stop, '이번 달 남은 기간에 금주하는 요일을 미리 정해 두세요.', rest3]
      : [stop, '지금은 줄이기가 필요한 때예요. 이번 주 금주일부터 먼저 정해 보세요.', '자가진단(AUDIT-K)을 해 보고, 고위험이면 알코올 전문가의 도움을 받으세요 (질병관리청 포털).',
         '몸에 이상 증상이 반복되면 의료진과 상담하세요.'];
    return { tier, label, headline, actions, monthWarn: mw, yearWarn: yw, monthDrink: md };
  }
  const EMERGENCY = '기록하신 증상(정신 혼동·의식 유지 어려움, 호흡 곤란, 심한 구토, 발작, 차고 축축한 피부·체온 저하)은 알코올 과다복용의 신호일 수 있습니다. 혼자 두지 말고 즉시 119에 연락해 도움을 받으세요. (NIAAA 한국어판 문서 기준, 미국 기관 문서의 번역본)';
  const SAFE_NOTE = 'WHO는 2023년에 건강에 안전한 음주량은 없다고 밝혔습니다.';
  const DISCLAIMER = '이 앱의 안내는 공식 건강 지침을 바탕으로 한 참고용 정보이며, 의사의 진단이나 전문의 소견이 아닙니다. 음주량이 적다고 해서 건강 위험이 없거나 안전하다고 보장할 수 없습니다. 걱정되는 증상이 있거나 음주 조절이 어렵다면 의료진 또는 전문 상담기관과 상의하세요.';

  const TOPICS = [
    { k: 'liver', emoji: '🫀', title: '간 건강', text: '음주는 알코올성 간 손상의 위험을 높이고 간경변 발생과 사망률을 증가시킵니다. 대한간학회는 하루 평균 남성 40g, 여성 20g 이상의 음주가 간 손상 위험을 높인다고 권고합니다. 같은 양을 마셔도 여성의 간경변 위험도가 더 높다고 알려져 있습니다.' },
    { k: 'gut', emoji: '🍽️', title: '위장 건강', text: '음주는 췌장염의 주요한 위험인자이며, 국가암정보센터는 위암을 음주와 관련된 암으로 설명합니다. 속쓰림이나 메스꺼움이 반복되면 진료를 받아 보세요.' },
    { k: 'sleep', emoji: '🌙', title: '수면의 질', text: '음주는 수면장애를 유발하며, 과음하면 수면의 질과 수면 시간이 모두 줄어듭니다. 음주량이 늘수록 남성의 수면 중 호흡장애가 증가한다고 알려져 있습니다.' },
    { k: 'heart', emoji: '❤️', title: '심혈관 건강', text: '소량의 음주라도 고혈압을 유발할 수 있으며, 과도한 음주는 관상동맥질환·심장질환·뇌졸중 위험을 높입니다. 위험 음주는 심방세동의 위험도를 높인다고 알려져 있습니다.' },
    { k: 'repeat', emoji: '🔁', title: '반복적인 음주와 의존', text: '과도한 음주가 이어지면 영양 결핍, 수면장애, 우울감과 관련이 있고 알코올 사용 장애로 이어질 수 있습니다. 국가암정보센터는 하루 50g 정도의 알코올을 마시는 경우 음주 관련 암 위험이 2~3배까지 증가한다고 설명합니다.' }
  ];

  function thresholds(profile) {
    const male = profile && profile.sex === 'male';
    return male
      ? { dayG: 56, weekG: 112, krG: 56, liverG: 40, label: '남성 기준 (하루 56g 초과, 주간 112g 초과)' }
      : { dayG: 42, weekG: 56, krG: 40, liverG: 20, label: (profile && profile.sex === 'female' ? '여성 기준' : '성별 미선택 · 더 낮은 기준(여성) 적용') + ' (하루 42g 초과, 주간 56g 초과)' };
  }

  const r1 = n => Math.round(n * 10) / 10;
  function analyzeDay(c) {
    const th = thresholds(c.profile), reasons = [], notes = [];
    const syms = c.symptoms || [], severe = SYMPTOMS.filter(s => s.severe && syms.includes(s.k));
    if (c.g > 0) {
      if (c.profile && c.profile.pregnant) reasons.push({ text: '임신 중이거나 임신을 계획 중이라고 설정하셨습니다. 임신 중 알코올 섭취는 절대로 피해야 한다고 안내됩니다.', basis: '질병관리청 국가건강정보포털, 2026' });
      if (c.g > th.dayG) reasons.push({ text: `하루 순수 알코올이 ${r1(c.g)}g으로 참고 기준 ${th.dayG}g을 넘었습니다.`, basis: 'NIAAA 정의(질병관리청 포털 인용, 2026) · 표준잔 14g' });
      if (c.weekG > th.weekG) reasons.push({ text: `최근 7일 순수 알코올 합계가 ${r1(c.weekG)}g으로 참고 기준 ${th.weekG}g을 넘었습니다.`, basis: 'NIAAA 정의(질병관리청 포털 인용, 2026)' });
      if (c.g >= th.krG && c.gOf) {
        let n = 0; for (let i = 0; i < 7; i++) { const d = c.addDays(c.date, -i); if (c.gOf(d) >= th.krG) n++; }
        if (n >= 2) reasons.push({ text: `최근 7일 동안 한 번에 ${th.krG}g 이상 마신 날이 ${n}일입니다. (한 번에 많이 마시는 날이 주 2회 이상)`, basis: '보건복지부 고위험 음주 모니터링 기준(질병관리청 포털, 2026) · 표준잔 8g로 환산한 앱 계산' });
      }
      if (c.streak >= 3) reasons.push({ text: `${c.streak}일 연속으로 음주를 기록했습니다.`, basis: '앱 자체 규칙(공식 임계값 아님). 포털은 "음주 후에는 적어도 3일은 금주"를 권고합니다' });
      if (c.weekG / 7 >= th.liverG) notes.push(`최근 7일 하루 평균 ${r1(c.weekG / 7)}g으로 대한간학회 권고 기준(하루 평균 ${th.liverG}g 이상 시 간 손상 위험 증가)에 해당합니다.`);
    }
    if (severe.length) reasons.push({ text: `음주 후 증상으로 "${severe.map(s => s.label).join(', ')}"을(를) 기록했습니다.`, basis: 'NIAAA Alcohol overdose 한국어판, 2021' });
    const mild = SYMPTOMS.filter(s => !s.severe && syms.includes(s.k));
    if (mild.length) notes.push(`기록한 증상: ${mild.map(s => s.label).join(', ')}. 반복되면 의료진과 상담하세요.`);
    return { level: reasons.length ? 'warn' : 'none', reasons, emergency: severe.length > 0, notes };
  }

  function report(c) {
    const m = c.month, th = thresholds(c.profile), notes = {};
    if (c.weekG / 7 >= th.liverG) notes.liver = `최근 7일 하루 평균 ${r1(c.weekG / 7)}g으로 대한간학회 권고 기준(${th.liverG}g)에 해당합니다. 간 건강에 관해 의료진과 상담해 보세요.`;
    if (m.maxDrink >= 3) notes.repeat = `이번 달 최장 ${m.maxDrink}일 연속 음주가 기록되었습니다 (앱 자체 규칙 기준).`;
    if (m.drink.length >= 2 && m.total / m.drink.length > th.dayG) notes.heart = '음주일 평균이 하루 참고 기준을 넘었습니다. 과도한 음주는 심혈관 위험을 높이므로 횟수와 양을 줄이는 계획을 세워 보세요.';
    let headline, body;
    if (!m.drink.length && !m.sober.length) { headline = '이번 달 기록이 아직 없어요'; body = '기록하지 않은 날은 금주일로 계산하지 않습니다. 음주일과 금주일을 기록하면 이곳에서 요약을 볼 수 있어요.'; }
    else if (!m.drink.length) { headline = '이번 달 음주 기록이 없어요'; body = `금주를 기록한 날은 ${m.sober.length}일입니다. 기록하지 않은 날은 집계에 포함되지 않습니다. ${SAFE_NOTE}`; }
    else if (m.warn > 0) { headline = `이번 달 경고 기준에 해당한 날이 ${m.warn}회 있어요`; body = `음주일은 ${m.drink.length}일, 순수 알코올 합계는 ${r1(m.total)}g입니다. 경고 이유와 권장 행동은 캘린더의 빨간 표시를 눌러 확인하세요.`; }
    else { headline = '이번 달 참고 기준을 넘은 날은 없어요'; body = `음주일은 ${m.drink.length}일, 순수 알코올 합계는 ${r1(m.total)}g입니다. 기준 미만이라는 것이 건강 위험이 없다는 뜻은 아닙니다. ${SAFE_NOTE}`; }
    return { headline, body, notes };
  }

  const api = { thresholds, analyzeDay, report, advise, SOURCES, CRITERIA, SYMPTOMS, RISKS, RISK_SRC, PAPERS, PAPER_NOTE, EMERGENCY, SAFE_NOTE, DISCLAIMER, TOPICS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.DB = root.DB || {}).guide = api;
})(typeof window !== 'undefined' ? window : globalThis);
