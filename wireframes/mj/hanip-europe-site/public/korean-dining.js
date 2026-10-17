// Comparisons are editorial aids, kept separate from the restaurant's description.
// Exact-name matching avoids applying one recipe's ingredients to another dish.
const entries = [
  [['BATTUTA DI CHIANINA', 'BATTUTA DI CHIANINA AL COLTELLO'], '이탈리아식 육회 · 키아니나 소고기', '육회처럼 익히지 않은 소고기를 먹는 요리예요. 이 메뉴는 올리브유·소금·후추로 맛을 내므로, 참기름과 달콤한 양념의 육회와는 향이 달라요.'],
  [["BACCALA’ ALLA FIORENTINA", "BACCALA' ALLA FIORENTINA", 'Baccalà alla Fiorentina'], '토마토 소스 대구 튀김', '생선조림처럼 생선과 소스를 함께 먹지만, 이 식당은 대구를 튀겨 토마토 소스를 곁들여요. 고추장·간장 생선조림과는 양념이 달라요.'],
  [["BACCALA' FRITTO"], '소금에 절인 대구 튀김', '생선튀김처럼 생선 살을 튀긴 음식이에요. 생대구가 아니라 염장 대구를 사용한다는 점이 달라요.'],
  [['ZUPPA DI CECI E PORCINI'], '병아리콩·포르치니 버섯 수프', '콩국이나 콩죽을 떠올리면 콩이 들어간 국물 요리라는 점을 이해하기 쉬워요. 다만 된장·들깨 대신 올리브유와 후추를 곁들이며, 콩을 갈았는지는 공식 설명에 나와 있지 않아요.'],
  [["ZUPPA DI MELANZANE FUME'"], '장작에 익힌 가지 수프', '구운 가지나물에서 느끼는 익힌 가지의 풍미를 떠올려보세요. 나물 반찬이 아니라 수프이며, 훈제 향과 치즈·케이퍼가 더해져요.'],
  [['ZUPPA DI PORRI E PATATE'], '서양 대파·감자 수프', '감자죽처럼 부드럽게 떠먹는 느낌을 떠올릴 수 있어요. 쌀로 쑨 죽이 아니라 감자와 서양 대파로 만든 수프이며, 치즈와 아몬드를 곁들여요.'],
  [['ZUPPA DI ZUCCA E FARRO'], '호박·밀알 수프', '호박죽에 곡물을 더한 구성을 떠올려보세요. 새알심 대신 파로라는 밀알을 쓰고 치즈·후추 등을 곁들이므로, 달콤한 호박죽과 같은 맛으로 생각하지는 마세요.'],
  [['RIBOLLITA ESTIVA'], '차갑게 먹는 여름 채소·빵 수프', '채소국처럼 여러 채소를 함께 먹지만, 이 메뉴는 차갑게 내고 구운 빵을 곁들여요. 따뜻한 국이나 쌀죽과는 달라요.'],
  [['CAPOCOLLO AL ROSMARINO E MIELE DI CASTAGNO'], '밤꿀·사과식초로 맛낸 돼지 목살', '단맛과 새콤함이 어우러진 돼지고기를 떠올려보세요. 간장 불고기 양념 대신 밤꿀·사과식초·로즈마리로 맛을 내요.'],
  [["CINGHIALE IN SALMI'", 'Cinghiale in Salmì'], '레드와인·허브 멧돼지고기 요리', '고기찜처럼 양념한 고기를 먹는 요리로 이해하면 쉬워요. 간장 양념 대신 레드와인과 여러 허브를 쓰며, 멧돼지고기 자체의 향도 고려해주세요.'],
  [['CONIGLIO ALLO ZENZERO E LIMONE'], '생강·레몬 토끼고기 요리', '생강을 곁들인 고기 요리지만, 닭고기가 아니라 토끼고기예요. 한국식 닭찜과 같은 맛·식감으로 생각하기보다는 레몬과 향신료를 쓰는 별도의 요리로 봐주세요.'],
  [['GUANCIA DI MANZO ALLE SPEZIE'], '향신료로 맛낸 소 볼살 요리', '푹 익힌 고기찜처럼 부드러운 고기를 떠올려보세요. 갈비가 아니라 소 볼살을 쓰며, 갈비찜의 간장·설탕 양념과는 달라요.'],
  [['MANZO AI PORCINI'], '포르치니 버섯 소고기 요리', '버섯을 곁들인 소고기 요리로 생각하면 쉬워요. 한국식 불고기 양념이라고 볼 근거는 없으며, 자세한 조리법은 메뉴 설명을 확인해주세요.'],
  [['OSSOBUCO'], '뼈째 익힌 정강이 고기', '뼈가 붙은 고기를 먹는다는 점에서 갈비찜을 떠올릴 수 있어요. 갈비가 아니라 정강이 부위를 쓰는 요리이며, 양념과 고기 종류는 메뉴를 확인해주세요.'],
  [['POLLO ALLE SPEZIE'], '향신료로 맛낸 닭고기', '닭찜처럼 닭고기를 즐기는 메뉴지만, 닭볶음탕의 매운 양념을 뜻하지 않아요. 공식 설명만으로 굽기·찜 여부와 매운 정도를 확정할 수는 없어요.'],
  [['POLPETTE DI CHIANINA E CINTA SENESE AL POMODORO'], '토마토 소스 소고기·돼지고기 완자', '동그랑땡처럼 다진 고기를 뭉친 음식이에요. 달걀옷을 입혀 부친 전 대신 토마토 소스와 으깬 감자를 곁들이는 메뉴예요.'],
  [['ROAST-BEEF DI CHIANINA'], '속을 붉게 익힌 소고기 구이', '소고기구이지만 바로 구운 뜨거운 고기와는 달라요. 이 식당은 속을 붉게 익히고 실온으로 내며, 소금·후추·올리브유를 곁들여요.'],
  [['TRIPPA ALLA FIORENTINA'], '부드럽게 익힌 소 위 요리', '양·내장 요리를 떠올리면 재료를 이해하기 쉬워요. 곱창구이의 바삭함보다 오래 익힌 부드러움을 생각해주세요. 이 메뉴에는 치즈를 곁들여요.'],
  [['GNUDI AL POMODORO'], '토마토 소스 치즈·시금치 경단', '완자나 경단처럼 동그랗게 뭉친 음식이에요. 쌀떡 대신 리코타 치즈와 시금치가 중심이며, 토마토 소스를 곁들여요.'],
  [['GNUDI BURRO E SALVIA'], '버터·허브 치즈 경단', '경단 같은 모양이지만 쌀떡이 아니라 리코타 치즈로 만든 요리예요. 달콤한 고물 대신 버터와 세이지 허브를 곁들여요.'],
  [["PICI ALL'AGLIONE DELLA VALDICHIANA"], '큰 마늘 소스 굵은 수제 면', '굵은 수제 국수를 떠올리면 면의 형태를 이해하기 쉬워요. 칼국수 국물 대신 큰 마늘인 아글리오네를 사용하는 소스를 곁들여요.'],
  [['PICI AL POMODORO'], '토마토 소스 굵은 수제 면', '칼국수처럼 손으로 만든 면을 먹지만, 피치는 납작한 면이 아니라 굵고 긴 면이에요. 국물 대신 토마토 소스를 곁들여요.'],
  [['RAVIOLI ALLO ZENZERO'], '생강 소스 치즈소 만두 파스타', '만두처럼 반죽 안에 소를 넣은 음식이에요. 고기·김치소 대신 양젖 리코타 치즈와 레몬 껍질을 채우고 생강 소스를 곁들여요.'],
  [['SFORMATO DI VERDURE DI STAGIONE'], '부드럽게 익힌 제철 채소 요리', '모양을 잡아 떠먹는 계란찜을 떠올릴 수 있지만, 이 요리는 제철 채소가 중심이에요. 실제 사용 채소와 굽는 방식은 식당에 확인해주세요.'],
  [['risotto'], '육수를 더해 익힌 이탈리아 쌀 요리', '죽처럼 촉촉한 쌀 요리지만, 쌀알의 씹히는 느낌이 남을 수 있어요. 볶음밥처럼 완성된 밥을 볶는 방식과는 달라요.'],
  [['paella'], '육수를 흡수시켜 익힌 스페인 쌀 요리', '솥밥처럼 쌀이 육수를 흡수하며 익는 요리예요. 볶음밥처럼 지은 밥을 볶는 방식이 아니며, 해산물·고기 구성은 메뉴마다 달라요.'],
  [['Wiener Schnitzel', 'schnitzel'], '얇은 고기에 빵가루를 입힌 튀김', '돈가스처럼 고기에 빵가루를 입혀 튀겨요. Wiener Schnitzel은 송아지고기 요리이며, 다른 슈니첼의 고기 종류와 소스는 메뉴를 확인해주세요.'],
];
entries.push(
  [["OSSOBUCO DI CHIANINA E PURE' DI PATATE"], '소 정강이 요리와 으깬 감자', '뼈가 붙은 소 정강이 고기와 으깬 감자를 함께 먹어요. 갈비와는 부위가 다르고, 파슬리·마늘·레몬 껍질 양념을 곁들여요.'],
  [['PICI CINTOCA'], '돼지고기·거위고기 소스 수제 파스타', '굵고 긴 수제 면에 돼지고기와 거위고기로 만든 소스를 곁들여요. 오리고기가 아니라 거위고기를 사용하는 메뉴예요.']
);
const listDescriptions = {
  "BATTUTA DI CHIANINA": '잘게 다진 생소고기에 올리브유로 맛낸 육회 요리',
  "BACCALA' ALLA FIORENTINA": '소금에 절인 대구를 튀겨 토마토 소스를 곁들여요',
  "BACCALA' FRITTO": '소금에 절인 대구를 튀긴 생선 요리',
  'ZUPPA DI CECI E PORCINI': '병아리콩과 포르치니 버섯을 넣은 수프',
  "ZUPPA DI MELANZANE FUME'": '장작 오븐에 익힌 가지로 훈제 향을 낸 수프',
  'ZUPPA DI PORRI E PATATE': '서양 대파와 감자를 부드럽게 만든 수프',
  'ZUPPA DI ZUCCA E FARRO': '호박과 파로 밀알을 넣은 수프',
  'CAPOCOLLO AL ROSMARINO E MIELE DI CASTAGNO': '돼지 목살에 밤꿀·사과식초·로즈마리로 맛내요',
  "CINGHIALE IN SALMI'": '와인·허브 고기 요리 · 고기 종류는 직원에게 확인',
  'CONIGLIO ALLO ZENZERO E LIMONE': '토끼고기에 생강과 레몬을 곁들여요',
  'GUANCIA DI MANZO ALLE SPEZIE': '부드러운 소 볼살에 향신료로 맛낸 요리',
  'MANZO AI PORCINI': '포르치니 버섯을 곁들인 소고기 스튜',
  "OSSOBUCO DI CHIANINA E PURE' DI PATATE": '뼈가 붙은 소 정강이 고기와 으깬 감자',
  'POLLO ALLE SPEZIE': '향신료로 맛낸 닭고기 요리',
  'POLPETTE DI CHIANINA E CINTA SENESE AL POMODORO': '소고기·돼지고기 완자에 토마토 소스를 곁들여요',
  'ROAST-BEEF DI CHIANINA': '속을 붉게 익혀 상온에 내는 소고기 구이',
  'TRIPPA ALLA FIORENTINA': '소의 위를 오래 익혀 부드럽게 만든 요리',
  'PICI CINTOCA': '굵은 수제 면에 돼지고기·거위고기 소스를 곁들여요'
};
const key = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}]/gu, '');
const summaries = new Map(Object.entries(listDescriptions).map(([name, text]) => [key(name), text]));
const byName = new Map(entries.flatMap(([names, korean, analogy]) => names.map(name => [key(name), {korean, analogy}])));
export function koreanDining(item) {
  if (!item || typeof item !== 'object' || typeof item.original !== 'string') return item;
  const entry = byName.get(key(item.original));
  if (!entry) return item;
  return {...item, ...(summaries.has(key(item.original)) ? {listDescription:summaries.get(key(item.original))} : {}), korean: entry.korean, analogy: entry.analogy, comparisonLabel: '한식으로 떠올려보면', comparisonNote: '이해를 돕는 비교예요. 같은 음식이나 같은 맛이라는 뜻은 아니에요.'};
}
export function koreanDiningPayload(value) {
  if (Array.isArray(value)) return value.map(koreanDiningPayload);
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, koreanDiningPayload(v)]));
  return koreanDining(result);
}
