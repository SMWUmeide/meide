export type Screen =
  | "home"
  | "08"
  | "09"
  | "10"
  | "11"
  | "39"
  | "40"
  | "41"
  | "13"
  | "14"
  | "01"
  | "06-2"
  | "18"
  | "02"
  | "22"
  | "03"
  | "17"
  | "04"
  | "07"
  | "38"
  | "43"
  | "15"
  | "16"
  | "45"
  | "44"
  | "19"
  | "21"
  | "20"
  | "31"
  | "33"
  | "05-2"
  | "05-3"
  | "42"
  | "32"
  | "23"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "46";
export type Menu = {
  id: string;
  original: string;
  korean: string;
  price: number;
  category: string;
  photo?: string;
  analogy: string;
  taste: string;
  ingredients: [string, string][];
  allergy: string;
  possible: string[];
  cooking: string;
};
export const menus: Menu[] = [
  {
    id: "ceci",
    original: "ZUPPA DI CECI E PORCINI",
    korean: "병아리콩과 포르치니 버섯 수프",
    price: 11,
    category: "수프",
    photo: "fb60b.png",
    analogy: "버섯 향이 나는 걸쭉한 콩국에 가까워요",
    taste: "병아리콩의 고소함과 포르치니 버섯의 진한 향을 느낄 수 있어요.",
    ingredients: [
      ["병아리콩", "ceci"],
      ["포르치니 버섯", "porcini"],
    ],
    allergy: "메뉴판에 별도 표기가 없어요",
    possible: ["양파", "올리브유", "채소 육수"],
    cooking: "병아리콩과 버섯을 푹 끓이는 게 일반적이에요.",
  },
  {
    id: "melanzane",
    original: "ZUPPA DI MELANZANE FUME'",
    korean: "훈제 가지 수프",
    price: 11,
    category: "수프",
    photo: "dfb35.png",
    analogy: "구운 가지를 넣은 부드러운 채소국에 가까워요",
    taste: "가지의 부드러운 식감에 은은한 훈연 향이 더해져요.",
    ingredients: [["가지", "melanzane"]],
    allergy: "메뉴판 표기를 직원에게 확인해 주세요",
    possible: ["올리브유", "치즈", "빵"],
    cooking: "훈연한 가지를 부드럽게 끓여 만드는 게 일반적이에요.",
  },
  {
    id: "porri",
    original: "ZUPPA DI PORRI E PATATE",
    korean: "서양 대파와 감자 크림 수프",
    price: 10,
    category: "수프",
    photo: "60d97.png",
    analogy: "대파 향을 더한 부드러운 감자죽에 가까워요",
    taste: "감자의 고소함에 서양 대파의 은은한 단맛이 더해져요.",
    ingredients: [
      ["서양 대파", "porri"],
      ["감자", "patate"],
    ],
    allergy: "메뉴판 표기를 직원에게 확인해 주세요",
    possible: ["올리브유", "치즈", "아몬드"],
    cooking: "서양 대파와 감자를 푹 끓여 부드럽게 만드는 게 일반적이에요.",
  },
  {
    id: "zucca",
    original: "ZUPPA DI ZUCCA E FARRO",
    korean: "호박과 고대 밀 수프",
    price: 10,
    category: "수프",
    photo: "6415e.png",
    analogy: "보리를 넣은 걸쭉한 호박죽에 가까워요",
    taste: "호박죽보다 덜 달고, 치즈와 올리브유 덕에 고소한 맛이 나요.",
    ingredients: [
      ["단호박", "zucca"],
      ["파로", "farro"],
    ],
    allergy: "글루텐 (EU 1)",
    possible: ["양파", "올리브유", "채소 육수", "파르미지아노 치즈"],
    cooking:
      "호박을 푹 끓여 곱게 간 뒤, 따로 삶은 파로를 넣어 죽처럼 걸쭉하게 만드는 게 일반적이에요.",
  },
  {
    id: "ossobuco",
    original: "OSSOBUCO DI CHIANINA E PURE' DI PATATE",
    korean: "뼈가 붙은 소고기 요리와 으깬 감자",
    price: 18,
    category: "메인 요리",
    analogy: "으깬 감자를 곁들인 소고기찜에 가까워요",
    taste: "오래 익힌 소고기를 부드럽게 즐기는 요리예요.",
    ingredients: [
      ["키아니나 소고기", "Chianina"],
      ["감자", "patate"],
    ],
    allergy: "메뉴판 표기를 직원에게 확인해 주세요",
    possible: ["버터", "우유", "채소 육수"],
    cooking:
      "뼈가 붙은 소고기를 천천히 익히고 으깬 감자를 곁들이는 게 일반적이에요.",
  },
  {
    id: "peposo",
    original: "PEPOSO ALL'IMPRUNETANA",
    korean: "후추를 넣은 토스카나 소고기 스튜",
    price: 17,
    category: "메인 요리",
    analogy: "후추 향이 진한 소고기찜에 가까워요",
    taste: "후추와 고기의 풍미가 진하게 느껴져요.",
    ingredients: [
      ["소고기", "manzo"],
      ["후추", "pepe"],
    ],
    allergy: "메뉴판에 별도 표기가 없어요",
    possible: ["레드 와인", "마늘"],
    cooking: "소고기를 후추와 함께 오랫동안 끓이는 게 일반적이에요.",
  },
  {
    id: "rosato",
    original: "BINDELLA GEMELLA IGT 2025",
    korean: "빈델라 제멜라 로제 와인",
    price: 18,
    category: "로제 와인",
    analogy: "식사에 곁들이는 산뜻한 로제 와인이에요",
    taste: "구체적인 맛은 메뉴판에 적혀 있지 않아요.",
    ingredients: [["산지오베제", "Sangiovese"]],
    allergy: "메뉴판 표기를 직원에게 확인해 주세요",
    possible: ["아황산염"],
    cooking: "포도를 발효해 만드는 와인이에요.",
  },
];
export type CartLine = {
  menuId: string;
  quantity: number;
  owner: "me" | "companion";
};
export type Photo = { id: string; src?: string; readable: boolean };
export type Draft = {
  photos: Photo[];
  lines: CartLine[];
  tip: boolean;
  restaurant: string | null;
  partial: boolean;
  analyzed: boolean;
  request: string;
  answers: Record<string, string>;
  ordered: boolean;
  orderedAt?: string;
};
export const initialDraft: Draft = {
  photos: [],
  lines: [],
  tip: true,
  restaurant: "Osteria La Solita Zuppa",
  partial: false,
  analyzed: false,
  request: "",
  answers: {},
  ordered: false,
};
export const sharedLines: CartLine[] = [
  { menuId: "porri", quantity: 1, owner: "me" },
  { menuId: "zucca", quantity: 1, owner: "companion" },
  { menuId: "ossobuco", quantity: 1, owner: "companion" },
];
export function menuById(id: string) {
  return menus.find((menu) => menu.id === id) ?? menus[3];
}
export function updateQuantity(
  lines: CartLine[],
  id: string,
  change: number,
): CartLine[] {
  const existing = lines.find(
    (line) => line.menuId === id && line.owner === "me",
  );
  if (!existing)
    return change > 0
      ? [...lines, { menuId: id, owner: "me", quantity: 1 }]
      : lines;
  return lines
    .map((line) =>
      line === existing
        ? { ...line, quantity: Math.max(0, line.quantity + change) }
        : line,
    )
    .filter((line) => line.quantity > 0);
}
export function totals(lines: CartLine[], tip: boolean) {
  const cents = lines.reduce(
    (sum, line) =>
      sum + Math.round(menuById(line.menuId).price * 100) * line.quantity,
    0,
  );
  const tipCents = tip ? Math.round(cents * 0.1) : 0;
  return {
    food: cents / 100,
    tip: tipCents / 100,
    cart: (cents + tipCents) / 100,
    receipt: (cents + tipCents + 500) / 100,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
const requests: Record<string, string> = {
  "치즈 빼고 주세요": "Senza formaggio, per favore.",
  "맵지 않게 해주세요": "Non piccante, per favore.",
  "물 주세요": "Un’acqua, per favore.",
  "우유 빼고 주세요": "Senza latte, per favore.",
};
export function orderSentences(lines: CartLine[], request: string) {
  const combined = new Map<string, number>();
  lines.forEach((line) =>
    combined.set(line.menuId, (combined.get(line.menuId) ?? 0) + line.quantity),
  );
  const parts = [...combined].map(([id, quantity]) => ({
    menu: menuById(id),
    quantity,
  }));
  const knownRequest = requests[request.trim()];
  const italian = parts.length
    ? `Vorremmo ordinare ${parts.map(({ menu, quantity }) => `${quantity === 1 ? "una porzione" : `${quantity} porzioni`} di ${menu.original}`).join(", ")}, per favore.`
    : "";
  return {
    korean:
      parts
        .map(({ menu, quantity }) => `${menu.korean} ${quantity}인분`)
        .join(", ") +
      " 주세요." +
      (request ? ` ${request}` : ""),
    italian: italian + (knownRequest ? ` ${knownRequest}` : ""),
    untranslated: Boolean(request.trim() && !knownRequest),
  };
}
export function homePeriod(date: Date, timezone = "Europe/Rome") {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
  return hour >= 6 && hour < 10
    ? "morning"
    : hour >= 10 && hour < 12
      ? "late-morning"
      : hour >= 12 && hour < 17
        ? "lunch"
        : "evening";
}
export const screenPaths: Record<Screen, string> = {
  home: "/",
  "08": "/capture",
  "09": "/capture",
  "10": "/capture/photos",
  "11": "/capture/photos/0",
  "39": "/analyze",
  "40": "/analyze",
  "41": "/capture",
  "13": "/restaurant/confirm",
  "14": "/restaurant/select",
  "01": "/menu",
  "06-2": "/menu/zucca",
  "18": "/menu/zucca/ask",
  "02": "/cart",
  "22": "/cart",
  "03": "/order",
  "17": "/order/large",
  "04": "/receipt",
  "07": "/trip",
  "38": "/trip",
  "43": "/trip",
  "15": "/talk/intro",
  "16": "/talk",
  "45": "/talk",
  "44": "/talk",
  "19": "/history",
  "21": "/history",
  "20": "/history/rate",
  "31": "/explore",
  "33": "/explore/ranking",
  "05-2": "/explore/nearby",
  "05-3": "/explore/nearby",
  "42": "/explore/nearby",
  "32": "/restaurants/rosa",
  "23": "/companions",
  "25": "/companions/miyoung/taste",
  "26": "/companions/new",
  "27": "/companions/youngsu/invite",
  "28": "/my",
  "29": "/my/profile",
  "30": "/my/privacy",
  "46": "/my/privacy",
};
export function screenForPath(path: string, draft: Draft): Screen {
  if (path === "/") return "home";
  if (/^\/companions\/[^/]+\/taste$/.test(path)) return "25";
  if (/^\/companions\/[^/]+\/invite$/.test(path)) return "27";
  if (/^\/restaurants\/[^/]+$/.test(path)) return "32";
  if (path === "/capture") return draft.photos.length ? "09" : "08";
  if (path === "/cart") return draft.lines.length ? "02" : "22";
  if (/^\/capture\/photos\/\d+$/.test(path)) return "11";
  if (/^\/menu\/[^/]+\/ask$/.test(path)) return "18";
  if (/^\/menu\/[^/]+$/.test(path)) return "06-2";
  return (
    (Object.entries(screenPaths).find(
      ([screen, value]) =>
        value === path &&
        ![
          "09",
          "40",
          "41",
          "22",
          "38",
          "43",
          "21",
          "45",
          "44",
          "05-3",
          "42",
          "46",
        ].includes(screen),
    )?.[0] as Screen) ?? "home"
  );
}

export type Taste = {
  allergies: string[];
  dislikes: string[];
  likes: string[];
};
export type Friend = Taste & {
  id: string;
  name: string;
  initial: string;
  kind: "companion" | "teal" | "orange";
  connected: boolean;
  active: boolean;
};
export type MealRecord = {
  id: string;
  restaurant: string;
  at: string;
  lines: CartLine[];
  tip: boolean;
  request: string;
  ratings: Record<string, string>;
};
export type Destination = {
  id: string;
  country: string;
  city: string;
  detail?: string;
  timezone: string;
};
export const destinations: Destination[] = [
  {
    id: "chiusi",
    country: "이탈리아",
    city: "키우시",
    detail: "Chiusi · 토스카나",
    timezone: "Europe/Rome",
  },
  {
    id: "paris",
    country: "프랑스",
    city: "파리",
    detail: "Paris",
    timezone: "Europe/Paris",
  },
  {
    id: "rome",
    country: "이탈리아",
    city: "로마",
    detail: "Roma · 라치오주",
    timezone: "Europe/Rome",
  },
  {
    id: "florence",
    country: "이탈리아",
    city: "피렌체",
    detail: "Firenze · 토스카나",
    timezone: "Europe/Rome",
  },
  {
    id: "barcelona",
    country: "스페인",
    city: "바르셀로나",
    detail: "Barcelona",
    timezone: "Europe/Madrid",
  },
  {
    id: "romani",
    country: "이탈리아",
    city: "로마 근교",
    detail: "Castelli Romani",
    timezone: "Europe/Rome",
  },
  {
    id: "rome-us",
    country: "미국",
    city: "로마",
    detail: "Rome · 조지아주",
    timezone: "America/New_York",
  },
  {
    id: "bologna",
    country: "이탈리아",
    city: "에밀리아로마냐 · 볼로냐",
    detail: "Bologna",
    timezone: "Europe/Rome",
  },
];
export const tasteOptions = {
  allergies: [
    "갑각류",
    "견과류",
    "유제품",
    "글루텐",
    "달걀",
    "생선",
    "땅콩",
    "조개류",
  ],
  dislikes: ["토마토", "고수", "내장", "양고기", "올리브"],
  likes: [
    "담백한 맛",
    "매콤한 맛",
    "국물 요리",
    "고기 요리",
    "해산물",
    "달콤한 디저트",
  ],
};
export const mockRestaurants = [
  {
    id: "rosa",
    name: "Trattoria Da Rosa",
    type: "토스카나 가정식",
    distance: 220,
    walk: 3,
    photo: "fb60b.png",
    rating: 4.6,
    count: 38,
    address: "Via Roma, 8 · 53043 Chiusi SI",
    signature: "리볼리타",
    analogy: "채소를 푹 끓여 우거지국처럼 구수한 수프예요",
    hours: "영업 중 · 22:30까지",
    kind: "local",
  },
  {
    id: "ponte",
    name: "Osteria del Ponte",
    type: "수프·스튜",
    distance: 380,
    walk: 5,
    photo: "6415e.png",
    rating: 4.4,
    count: 21,
    address: "Via Porsenna, 12 · Chiusi",
    signature: "파파 알 포모도로",
    analogy: "빵을 넣고 끓인 토마토 죽 같아 속이 편해요",
    hours: "영업 중 · 23:00까지",
    kind: "local",
  },
  {
    id: "nonna",
    name: "Zuppe della Nonna",
    type: "수프 전문",
    distance: 460,
    walk: 6,
    photo: "60d97.png",
    rating: 4.5,
    count: 26,
    address: "Via Roma, 22 · Chiusi",
    signature: "감자 크림 수프",
    analogy: "감자 수프처럼 부드럽고 순한 맛이에요",
    hours: "곧 마감 · 15:00까지",
    kind: "local",
  },
  {
    id: "kimchi",
    name: "Kimchi House Siena",
    type: "한식",
    distance: 32000,
    walk: 45,
    photo: "",
    rating: 4.7,
    count: 52,
    address: "Siena · Italy",
    signature: "김치찌개 · 비빔밥",
    analogy: "익숙한 한국의 맛을 만나요",
    hours: "영업 중",
    kind: "asian",
  },
  {
    id: "hongkong",
    name: "Ristorante Hong Kong",
    type: "아시안",
    distance: 850,
    walk: 11,
    photo: "",
    rating: 4.2,
    count: 17,
    address: "Chiusi · Italy",
    signature: "중식 · 볶음밥",
    analogy: "고소한 볶음밥을 즐겨요",
    hours: "영업 중",
    kind: "asian",
  },
  {
    id: "market",
    name: "Asia Market Chiusi",
    type: "마켓",
    distance: 700,
    walk: 9,
    photo: "",
    rating: 0,
    count: 0,
    address: "Chiusi · Italy",
    signature: "라면 · 고추장",
    analogy: "여행 중 그리운 식재료를 찾아요",
    hours: "영업 중",
    kind: "asian",
  },
];
export const ranking = [
  { menuId: "zucca", percent: 92, count: 126, short: "보리 호박죽 같아요" },
  {
    menuId: "porri",
    percent: 88,
    count: 93,
    short: "감자 수프처럼 부드럽고 순해요",
  },
  { menuId: "ceci", percent: 85, count: 68, short: "버섯 들깨탕처럼 고소해요" },
  {
    menuId: "melanzane",
    percent: 71,
    count: 42,
    short: "불맛 나는 가지 냉국 같아요",
  },
];
export type Account = {
  profile: { name: string; taste: Taste };
  friends: Friend[];
  destination: Destination;
  recentMenu: boolean;
  records: MealRecord[];
};
export function makeAccount(): Account {
  return {
    profile: {
      name: "박성호",
      taste: {
        allergies: [],
        dislikes: ["고수"],
        likes: ["국물 요리", "매콤한 맛"],
      },
    },
    friends: [
      {
        id: "miyoung",
        name: "김미영",
        initial: "김",
        kind: "companion",
        connected: true,
        active: true,
        allergies: ["갑각류"],
        dislikes: ["토마토", "고수"],
        likes: ["담백한 맛", "국물 요리"],
      },
      {
        id: "jungsook",
        name: "박정숙",
        initial: "박",
        kind: "teal",
        connected: true,
        active: false,
        allergies: ["견과류"],
        dislikes: [],
        likes: ["매콤한 맛"],
      },
      {
        id: "youngsu",
        name: "김영수",
        initial: "영",
        kind: "orange",
        connected: false,
        active: false,
        allergies: ["유제품"],
        dislikes: [],
        likes: ["고기 요리"],
      },
    ],
    destination: { ...destinations[0] },
    recentMenu: true,
    records: [
      {
        id: "today",
        restaurant: "Osteria La Solita Zuppa",
        at: "2026-10-25T12:30:00+02:00",
        lines: sharedLines.map((line) => ({ ...line })),
        tip: true,
        request: "",
        ratings: {},
      },
      {
        id: "yesterday",
        restaurant: "Trattoria Da Rosa",
        at: "2026-10-24T12:00:00+02:00",
        lines: [{ menuId: "ceci", quantity: 1, owner: "me" }],
        tip: false,
        request: "",
        ratings: { ceci: "또 먹고 싶어요" },
      },
    ],
  };
}
export function pendingRatings(records: MealRecord[]) {
  return records.flatMap((record) =>
    [...new Set(record.lines.map((line) => line.menuId))]
      .filter((id) => !record.ratings[id])
      .map((menuId) => ({ recordId: record.id, menuId })),
  );
}
export function searchDestinations(query: string) {
  const q = query.trim().toLowerCase();
  return q
    ? destinations.filter((d) =>
        `${d.country} ${d.city} ${d.detail}`.toLowerCase().includes(q),
      )
    : [];
}
export const screenCatalog = [
  ["home", "홈", "/", "42:1531"],
  ["07", "어디로 떠나시나요?", "/trip", "1:4583"],
  ["38", "여행지 검색 결과", "/trip?q=로마&fixture=38", "1:5889"],
  ["43", "여행지 결과 없음", "/trip?q=로마나&fixture=43", "1:6096"],
  ["08", "메뉴판 촬영", "/capture?fixture=08", "1:4634"],
  ["09", "촬영 완료 · 사진 추가", "/capture?fixture=09", "1:4667"],
  ["10", "촬영 사진 펼쳐보기", "/capture/photos?fixture=10", "1:4705"],
  ["11", "촬영 사진 확대", "/capture/photos/0?fixture=11", "1:4739"],
  ["39", "메뉴 인식 중", "/analyze?fixture=39", "1:5933"],
  ["40", "메뉴 인식 실패", "/analyze?fixture=40", "1:5961"],
  ["41", "카메라 권한 안내", "/capture?fixture=41", "1:6008"],
  ["13", "이 식당이 맞나요?", "/restaurant/confirm", "1:4763"],
  ["14", "지금 계신 식당 고르기", "/restaurant/select", "1:4813"],
  ["01", "메뉴를 골라주세요", "/menu?fixture=shared", "1:1538"],
  ["06-2", "메뉴 상세", "/menu/zucca", "1:4496"],
  ["18", "직원에게 재료 확인하기", "/menu/zucca/ask", "1:4958"],
  ["02", "함께 담은 장바구니", "/cart?fixture=shared", "1:1622"],
  ["22", "장바구니 비어 있음", "/cart?fixture=22", "1:5139"],
  ["03", "이렇게 주문하세요", "/order?fixture=shared", "1:1706"],
  ["17", "주문 문장 크게 보여주기", "/order/large?fixture=shared", "1:4938"],
  ["04", "영수증 미리보기", "/receipt?fixture=shared", "1:1811"],
  ["15", "대화 시작 안내", "/talk/intro?fixture=shared", "1:4865"],
  ["16", "마주보기 대화", "/talk", "1:4896"],
  ["45", "음성 입력 중", "/talk?fixture=45", "31:1319"],
  ["44", "번역 실패", "/talk?fixture=44", "31:1374"],
  ["19", "주문 내역", "/history", "1:4999"],
  ["21", "주문 내역 비어 있음", "/history?fixture=21", "1:5100"],
  ["20", "식사 평가", "/history/rate", "1:5062"],
  ["31", "둘러보기", "/explore", "1:5618"],
  ["33", "한국인 입맛 저격 랭킹", "/explore/ranking", "1:5835"],
  ["05-2", "근처 식당 · 지도", "/explore/nearby", "1:1888"],
  ["05-3", "근처 식당 · 목록", "/explore/nearby?fixture=05-3", "1:1978"],
  ["42", "근처 식당 결과 없음", "/explore/nearby?fixture=42", "1:6035"],
  ["32", "식당 상세", "/restaurants/rosa", "1:5795"],
  ["23", "함께 여행하는 사람", "/companions", "1:5165"],
  ["25", "친구 입맛 수정", "/companions/miyoung/taste", "1:5259"],
  ["26", "새 친구 등록", "/companions/new", "1:5338"],
  ["27", "동행자 초대", "/companions/youngsu/invite", "1:5401"],
  ["28", "MY", "/my", "1:5449"],
  ["29", "프로필 수정", "/my/profile", "1:5532"],
  ["30", "개인정보와 저장", "/my/privacy", "1:5553"],
  ["46", "기록 삭제 확인", "/my/privacy?fixture=46", "1:6195"],
] as const;
export function fixtureScreen(
  path: string,
  params: URLSearchParams,
  draft: Draft,
): Screen {
  const fixture = params.get("fixture");
  const allowed = screenCatalog.find(
    ([number, , url]) => number === fixture && url.split("?")[0] === path,
  );
  if (allowed) return allowed[0] as Screen;
  if (path === "/trip" && params.get("q"))
    return searchDestinations(params.get("q")!).length ? "38" : "43";
  return screenForPath(path, draft);
}
export function isFlowPath(path: string) {
  return (
    screenCatalog.some(([, , url]) => url.split("?")[0] === path) ||
    /^\/menu\/(ceci|melanzane|porri|zucca|ossobuco|peposo|rosato)(\/ask)?$/.test(
      path,
    ) ||
    /^\/capture\/photos\/\d+$/.test(path) ||
    /^\/companions\/[^/]+\/(taste|invite)$/.test(path) ||
    /^\/restaurants\/[^/]+$/.test(path)
  );
}
export type AppView = {
  screen: Screen;
  menuId: string;
  photoIndex: number;
  largeFrom: Screen;
  subjectId?: string;
  recordId?: string;
  returnTo?: Screen;
  talkFrom?: "03" | "18";
};

/** Small, deterministic category/search index for the local restaurant fixtures. */
export function nearbyRestaurants(category: string, query = "") {
  const categories: Record<string, string[]> = {
    "밥·죽": ["ponte"],
    "면 요리": ["rosa"],
    "고기 구이": ["rosa"],
    "빵·피자": ["ponte"],
    해산물: [],
  };
  return mockRestaurants.filter(
    (r) =>
      (category === "한식·아시안" ? r.kind === "asian" : r.kind === "local") &&
      (!Object.hasOwn(categories, category) ||
        categories[category].includes(r.id)) &&
      `${r.name} ${r.signature} ${r.type}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
}
