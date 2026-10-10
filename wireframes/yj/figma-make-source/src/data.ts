export type Ing = { text: string; key?: string; warn?: boolean };
export type Dish = {
  id: string;
  section: string;
  orig: string;
  name: string;
  say: string; // Korean pronunciation of orig, for the order sentence
  desc: string;
  eur: number;
  oldEur?: number;
  noPrice?: boolean;
  soldOut?: boolean;
  img?: string;
  allergens?: string; // menu numbers, "(n)" = may contain
  unlisted?: boolean; // contains an allergen the menu does not mark
  memo?: string;
  ingredients: Ing[];
  recipe?: string;
};

export const RESTAURANT = "Osteria La Solita Zuppa";
export const RESTAURANT_ADDR = "Via Porsenna 21, 53043 Chiusi (SI)";

export const ALLERGEN: Record<string, string> = {
  "1": "글루텐", "2": "갑각류", "3": "달걀", "4": "생선", "5": "땅콩", "6": "대두", "7": "우유",
  "8": "견과류", "9": "셀러리", "10": "겨자", "11": "참깨", "12": "아황산염", "13": "루핀", "14": "연체동물",
};
export const parseAllergens = (s?: string) =>
  (s ?? "").split(",").map((x) => x.trim()).filter((x) => x && x !== "-").map((x) => ({ n: x.replace(/[()]/g, ""), maybe: x.startsWith("(") }));
// Ingredient keys that are not part of the legal 14-allergen labelling.
export const NON_LEGAL = ["토마토", "내장"];

export const sections = [
  { id: "antipasti", it: "Antipasti", ko: "전채", tint: "#f6e6d6" },
  { id: "zuppe", it: "Zuppe", ko: "수프", tint: "#efe6cf", note: "수프는 다른 요리와 함께 주문해야 해요. 디저트만으로는 안 돼요" },
  { id: "pasta", it: "Pasta Fresca", ko: "생면 파스타", tint: "#f5ebc9" },
  { id: "secondi", it: "Secondi", ko: "메인 요리", tint: "#f0dcd3" },
  { id: "contorni", it: "Contorni", ko: "곁들이", tint: "#e2ead7" },
  { id: "dessert", it: "Dessert", ko: "디저트", tint: "#f6e1e3" },
  { id: "bevande", it: "Bevande", ko: "음료", tint: "#e3e8ee" },
];

export const KRW_PER_EUR = 1500;
export const krw = (eur: number) => `약 ${Math.round(eur * KRW_PER_EUR).toLocaleString("ko-KR")}원`;
export const eurFmt = (eur: number) => `EUR ${eur.toFixed(2)}`;

const i = (text: string, key?: string, warn?: boolean): Ing => ({ text, key, warn });
const tom = i("토마토소스", "토마토");
const off = (t: string) => i(`${t}(내장)`, "내장");

export const dishes: Dish[] = [
  // Antipasti
  { id: "battuta", section: "antipasti", orig: "Battuta di Chianina", say: "바투타 디 키아니나", name: "키아니나 소고기 육회", desc: "키아니나 소고기를 칼로 다진 생고기 요리. 육회를 떠올리면 돼요", eur: 13.5, allergens: "-", ingredients: [i("생소고기"), i("올리브유")] },
  { id: "carpaccio", section: "antipasti", orig: "Carpaccio di Chianina", say: "카르파초 디 키아니나", name: "키아니나 소고기 카르파초", desc: "생소고기를 얇게 저며 올리브유와 치즈를 뿌렸어요. 육사시미와 비슷해요", eur: 12, allergens: "(7)", ingredients: [i("생소고기"), i("치즈")] },
  { id: "crostino", section: "antipasti", orig: "Crostino Toscano", say: "크로스티노 토스카노", name: "토스카나식 닭간 크로스티니", desc: "닭간을 곱게 갈아 빵에 바른 전채. 순대 간처럼 고소해요", eur: 9, allergens: "(1),4,9", ingredients: [off("닭간"), i("빵")] },
  { id: "lampredotto", section: "antipasti", orig: "Lampredotto", say: "람프레도토", name: "피렌체식 소 막창", desc: "소의 네 번째 위(막창)를 푹 삶은 피렌체 음식이에요", eur: 9, allergens: "(1),4,9", ingredients: [off("소 막창"), i("초록 소스")] },
  { id: "cacio", section: "antipasti", orig: "Cacio con le Pere", say: "카초 콘 레 페레", name: "양젖 치즈와 배", desc: "짭짤한 치즈와 달콤한 배를 함께 먹어요", eur: 8.5, allergens: "7", ingredients: [i("양젖 치즈"), i("배")] },
  // Zuppe
  { id: "ceci", section: "zuppe", orig: "Zuppa di Ceci e Porcini", say: "주파 디 체치 에 포르치니", name: "병아리콩 포르치니 버섯 수프", desc: "콩과 버섯을 함께 끓여 구수해요", eur: 10.5, allergens: "9", ingredients: [i("병아리콩"), i("포르치니 버섯"), i("셀러리")] },
  { id: "carciofi", section: "zuppe", orig: "Zuppa di Carciofi, Menta e Orzo", say: "주파 디 카르초피, 멘타 에 오르초", name: "아티초크 민트 보리 수프", desc: "미쉐린 가이드가 추천한 수프. 보리가 들어가 걸쭉해요", eur: 10, allergens: "(1),9", ingredients: [i("아티초크"), i("민트"), i("보리")] },
  { id: "porri", section: "zuppe", orig: "Zuppa di Porri, Patate e Mandorle", say: "주파 디 포리, 파타테 에 만도를레", name: "리크 감자 아몬드 수프", desc: "서양 대파와 감자로 부드럽게 끓였어요", eur: 9, allergens: "9", unlisted: true, ingredients: [i("리크"), i("감자"), i("아몬드(견과류)", "견과류", true)] },
  { id: "ribollita", section: "zuppe", orig: "Zuppa Ribollita", say: "주파 리볼리타", name: "리볼리타 (빵 채소 수프)", desc: "빵과 채소, 강낭콩을 넣고 다시 끓인 수프. 우거지죽처럼 걸쭉해요", eur: 10, allergens: "(1),9", ingredients: [i("빵"), i("흑양배추"), i("흰강낭콩"), i("토마토", "토마토"), i("셀러리")] },
  { id: "carabaccia", section: "zuppe", orig: "Carabaccia (Zuppa di Cipolle) Cotta a Legna", say: "카라바차 코타 아 레냐", name: "장작불 양파 수프", desc: "양파를 오래 끓여 달큰해요", eur: 10.5, allergens: "(1),7,9", ingredients: [i("양파"), i("빵"), i("치즈")] },
  // Pasta fresca
  { id: "pici-pom", section: "pasta", orig: "Pici al Pomodoro", say: "피치 알 포모도로", name: "토마토 피치", desc: "손으로 밀어 만든 굵은 면(우동 굵기)에 토마토소스", eur: 11.5, allergens: "1,3", ingredients: [i("피치 면"), tom] },
  { id: "pici-aglione", section: "pasta", orig: "Pici all'Aglione", say: "피치 알랄리오네", name: "마늘 토마토 피치", desc: "토스카나 왕마늘 '아리오네'와 토마토소스. 마늘 향이 진해요", eur: 12.5, allergens: "1,3", ingredients: [i("피치 면"), i("마늘"), tom] },
  { id: "pici-ragu", section: "pasta", orig: "Pici al Ragù Toscano", say: "피치 알 라구 토스카노", name: "토스카나 고기 소스 피치", desc: "고기를 오래 끓인 라구 소스", eur: 14, allergens: "1,3,5,(7),9,12", img: "/assets/photo1.jpg", ingredients: [i("피치 면"), i("다진 고기"), i("토마토", "토마토")] },
  { id: "gnudi-burro", section: "pasta", orig: "Gnudi al Burro e Salvia", say: "뉴디 알 부로 에 살비아", name: "버터 세이지 뇨디", desc: "리코타와 시금치로 만든 경단. 만두소만 빚은 느낌이에요", eur: 13, allergens: "1,3,7,8", ingredients: [i("리코타"), i("시금치"), i("버터")] },
  { id: "gnudi-pom", section: "pasta", orig: "Gnudi al Pomodoro", say: "뉴디 알 포모도로", name: "토마토 뇨디", desc: "같은 경단에 토마토소스", eur: 13, allergens: "1,3,7,8", ingredients: [i("리코타"), i("시금치"), tom] },
  { id: "ravioli", section: "pasta", orig: "Ravioli allo Zenzero", say: "라비올리 알로 첸체로", name: "생강 라비올리", desc: "생강 향이 나는 만두 모양 파스타", eur: 13, allergens: "1,3,7", ingredients: [i("밀가루"), i("달걀"), i("생강")] },
  { id: "tagliatelle", section: "pasta", orig: "Tagliatelle al Ragù B.", say: "탈리아텔레 알 라구", name: "고기 소스 탈리아텔레", desc: "넓적한 생면(칼국수 면)에 고기 소스", eur: 13.5, allergens: "1,3,7,12", img: "/assets/photo1.jpg", memo: "\"B.\"가 어떤 라구인지는 직원에게 확인해주세요", ingredients: [i("탈리아텔레 면"), i("고기 소스")] },
  // Secondi
  { id: "baccala", section: "secondi", orig: "Baccalà alla Fiorentina", say: "바깔라 알라 피오렌티나", name: "피렌체식 염장 대구 요리", desc: "염장 대구를 토마토소스에 익힌 요리. 토마토 생선조림을 떠올릴 수 있어요.", eur: 16, img: "/assets/70c3c.png", allergens: "3,4,5", ingredients: [i("대구"), tom, i("올리브유"), i("파슬리")], recipe: "염장 대구를 물에 불려 짠맛을 뺀 뒤, 밀가루를 입혀 굽고 토마토·마늘 소스에 천천히 졸여요." },
  { id: "maiale", section: "secondi", orig: "Maiale alle Mele Gold Rush", say: "마이알레 알레 멜레 골드 러시", name: "사과 소스를 곁들인 돼지고기 구이", desc: "구운 돼지고기에 달콤한 사과 소스를 곁들인 요리예요.", eur: 14.5, img: "/assets/a7be7.png", allergens: "8,9,12", ingredients: [i("돼지고기"), i("사과"), i("버터")], recipe: "돼지 등심을 노릇하게 구운 뒤 졸인 사과 소스를 얹어 내요." },
  { id: "cinghiale", section: "secondi", orig: "Cinghiale in Salmì", say: "친기알레 인 살미", name: "멧돼지 와인 조림", desc: "멧돼지 고기를 와인에 푹 익힌 진한 고기 조림이에요.", eur: 14.5, img: "/assets/6828e.png", allergens: "9,12", ingredients: [i("멧돼지 고기"), i("레드 와인"), i("향신채소")], recipe: "멧돼지 고기를 와인과 향신료에 하루 재운 뒤 오랜 시간 뭉근히 끓여요." },
  { id: "guancia", section: "secondi", orig: "Guancia alle Spezie", say: "구안차 알레 스페치에", name: "향신료 돼지 볼살 찜", desc: "돼지 볼살을 향신료와 함께 부드럽게 익힌 요리예요.", eur: 14.5, img: "/assets/a7693.png", allergens: "8,9,12", ingredients: [i("돼지 볼살"), i("향신료"), i("양파")], recipe: "돼지 볼살을 향신료와 함께 오븐에서 부드러워질 때까지 쪄내요." },
  { id: "coniglio", section: "secondi", orig: "Coniglio allo Zenzero", say: "코닐리오 알로 첸체로", name: "생강 토끼 요리", desc: "중세 레시피를 되살린 요리로 미쉐린 가이드 추천", eur: 14.5, allergens: "8,9,12", ingredients: [i("토끼고기"), i("생강")] },
  { id: "pollo", section: "secondi", orig: "Pollo alle Spezie", say: "폴로 알레 스페치에", name: "향신료 닭 요리", desc: "향신료로 양념한 닭고기", eur: 13.5, allergens: "6,7,9,12", ingredients: [i("닭고기"), i("향신료")] },
  { id: "trippa", section: "secondi", orig: "Trippa alla Fiorentina", say: "트리파 알라 피오렌티나", name: "피렌체식 소 양 토마토 조림", desc: "소 양(벌집양)을 토마토소스에 졸였어요. 양곰탕의 양을 떠올리면 돼요", eur: 12.5, allergens: "9", ingredients: [off("소 양"), tom] },
  { id: "manzo", section: "secondi", orig: "Manzo Stufato ai Carciofi", say: "만초 스투파토 아이 카르초피", name: "아티초크 소고기 찜", desc: "소고기를 아티초크와 푹 쪄서 갈비찜처럼 부드러워요", eur: 16.5, allergens: "9,12", ingredients: [i("소고기"), i("아티초크")] },
  { id: "polpette", section: "secondi", orig: "Polpette al Pomodoro e Purè", say: "폴페테 알 포모도로 에 푸레", name: "토마토 미트볼과 감자퓌레", desc: "동그랑땡 같은 고기 완자를 토마토소스에", eur: 15, allergens: "1,3,7,9", ingredients: [i("다진 고기"), tom, i("감자")] },
  { id: "ossobuco", section: "secondi", orig: "Ossobuco Chianino e Purè", say: "오소부코 키아니노 에 푸레", name: "키아니나 정강이 찜과 감자퓌레", desc: "뼈째 썬 소 정강이를 오래 익힌 사태찜", eur: 16.5, allergens: "7,9,12", ingredients: [i("소 정강이"), i("감자")] },
  { id: "roastbeef", section: "secondi", orig: "Roast-Beef Chianino", say: "로스트비프 키아니노", name: "키아니나 로스트비프", desc: "키아니나 소고기를 구워 얇게 썰었어요", eur: 15, allergens: "-", img: "/assets/photo2.jpg", ingredients: [i("소고기")] },
  { id: "baccala-fritto", section: "secondi", orig: "Baccalà Fritto", say: "바깔라 프리토", name: "염장 대구 튀김", desc: "염장 대구에 반죽을 입혀 바삭하게 튀겼어요", eur: 16, oldEur: 15, soldOut: true, allergens: "(1),4,5", ingredients: [i("대구")] },
  // Contorni
  { id: "fagioli", section: "contorni", orig: "Fagioli", say: "파졸리", name: "흰강낭콩", desc: "부드럽게 삶은 흰강낭콩에 올리브유를 둘렀어요", eur: 6, allergens: "9", ingredients: [i("흰강낭콩")] },
  { id: "patate", section: "contorni", orig: "Patate al Rosmarino", say: "파타테 알 로즈마리노", name: "로즈메리 감자구이", desc: "로즈메리 향을 입혀 노릇하게 구운 감자예요", eur: 5, allergens: "-", ingredients: [i("감자"), i("로즈메리")] },
  { id: "verdure", section: "contorni", orig: "Verdure Spontanee Saltate", say: "베르두레 스폰타네에 살타테", name: "들나물 볶음", desc: "들에서 자란 나물을 볶았어요. 나물볶음과 비슷해요", eur: 7, allergens: "-", ingredients: [i("들나물")] },
  // Dessert
  { id: "cantucci", section: "dessert", orig: "Cantucci e Vinsanto del Chianti", say: "칸투치 에 빈산토 델 키안티", name: "아몬드 과자와 디저트 와인", desc: "단단한 아몬드 과자를 달콤한 와인에 적셔 드세요", eur: 8, allergens: "1,3,8,12", ingredients: [i("아몬드 과자"), i("빈산토 와인")] },
  { id: "tiramisu", section: "dessert", orig: "Tiramisù Artigianale", say: "티라미수 아르티자날레", name: "수제 티라미수", desc: "커피에 적신 과자와 마스카르포네 크림을 겹겹이 쌓았어요", eur: 7.5, allergens: "1,3,7", ingredients: [i("마스카르포네"), i("커피"), i("과자")] },
  { id: "pannacotta", section: "dessert", orig: "Panna Cotta di Stagione", say: "판나 코타 디 스타조네", name: "제철 판나코타", desc: "우유 푸딩에 제철 과일을 얹었어요", eur: 7, allergens: "7", ingredients: [i("생크림"), i("제철 과일")] },
  { id: "crumble", section: "dessert", orig: "Crumble di Nocciole con Mela Gold Rush", say: "크럼블 디 노촐레 콘 멜라 골드 러시", name: "헤이즐넛 사과 크럼블", desc: "구운 사과 위에 헤이즐넛 소보로를 얹었어요", eur: 7.5, allergens: "1,7,8", ingredients: [i("사과"), i("헤이즐넛"), i("버터")] },
  // Bevande
  { id: "calice", section: "bevande", orig: "Calice di Vino Rosso della Casa", say: "칼리체 디 비노 로소 델라 카사", name: "하우스 레드 와인 한 잔", desc: "식당에서 고른 레드 와인을 잔으로 마셔요", eur: 4.5, img: "/assets/photo3.jpg", ingredients: [i("레드 와인")] },
  { id: "caraffa", section: "bevande", orig: "Caraffa Vino Rosso I.G.T. Montalcino 1L", say: "카라파 비노 로소 몬탈치노 운 리트로", name: "몬탈치노 레드 와인 1리터", desc: "여럿이 나눠 마시기 좋은 1리터 카라페예요", eur: 12, img: "/assets/photo3.jpg", ingredients: [i("레드 와인")] },
  { id: "caffe", section: "bevande", orig: "Caffè", say: "카페", name: "에스프레소", desc: "식사 뒤에 마시는 작고 진한 커피예요", eur: 0, noPrice: true, img: "/assets/photo4.jpg", ingredients: [i("커피")] },
  { id: "acqua", section: "bevande", orig: "Acqua in bottiglia (Panna, S. Pellegrino)", say: "아쿠아 인 보틸리아", name: "생수·탄산수", desc: "판나는 생수, 산펠레그리노는 탄산수예요", eur: 3, img: "/assets/photo5.jpg", ingredients: [i("물")] },
];

export type Destination = { flag: string; label: string; sub: string; lang: string };

export const destinations: Destination[] = [
  { flag: "🇮🇹", label: "이탈리아 · 키우지", sub: "Chiusi", lang: "이탈리아어" },
  { flag: "🇮🇹", label: "이탈리아 · 로마", sub: "Roma", lang: "이탈리아어" },
  { flag: "🇫🇷", label: "프랑스 · 파리", sub: "Paris", lang: "프랑스어" },
  { flag: "🇪🇸", label: "스페인 · 바르셀로나", sub: "Barcelona", lang: "스페인어" },
  { flag: "🇬🇧", label: "영국 · 런던", sub: "London", lang: "영어" },
  { flag: "🇯🇵", label: "일본 · 도쿄", sub: "Tokyo", lang: "일본어" },
  { flag: "🇺🇸", label: "미국 · 뉴욕", sub: "New York", lang: "영어" },
  { flag: "🇫🇷", label: "프랑스 · 니스", sub: "Nice", lang: "프랑스어" },
  { flag: "🇮🇹", label: "이탈리아 · 피렌체", sub: "Firenze", lang: "이탈리아어" },
];

export type Person = { id: string; name: string; isMe?: boolean; allergies: string[]; dislikes: string[]; likes?: string[]; taste?: string };

// Party profiles: edit these to see chips regenerate.
export const initialParty: Person[] = [
  { id: "me", name: "성호", isMe: true, allergies: [], dislikes: ["내장"], likes: ["진한 고기 요리", "와인 조림", "치즈"], taste: "고기 요리 좋아함 · 내장 못 먹음" },
  { id: "miyoung", name: "미영", allergies: ["토마토"], dislikes: ["내장"], likes: ["담백한 맛", "토마토 요리", "해산물"], taste: "담백한 맛 좋아함 · 토마토 알레르기" },
  { id: "park", name: "박정숙", allergies: ["새우"], dislikes: [], likes: ["매운 음식", "해산물 파스타"], taste: "매운 음식 좋아함 · 갑각류 알레르기" },
  { id: "kim", name: "김영수", allergies: [], dislikes: ["양고기"], likes: ["피자", "젤라또"], taste: "단 음식 좋아함 · 양고기 못 먹음" },
];

// Phrases to show staff, per ingredient key.
export const staffPhrase: Record<string, { allergy: string; dislike: string }> = {
  토마토: { allergy: "Allergia al pomodoro", dislike: "Senza pomodoro, per favore" },
  내장: { allergy: "Allergia alle frattaglie", dislike: "Non mangiamo frattaglie, grazie" },
  새우: { allergy: "Allergia ai crostacei", dislike: "Senza gamberi, per favore" },
  견과류: { allergy: "Allergia alla frutta a guscio", dislike: "Senza frutta a guscio, per favore" },
};

export type Favorite = { dishId: string; restaurant: string; city: string; date: Date };
