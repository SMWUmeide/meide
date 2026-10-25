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
  | "04";
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
export function homePeriod(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Rome",
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
};
export function screenForPath(path: string, draft: Draft): Screen {
  if (path === "/") return "home";
  if (path === "/capture") return draft.photos.length ? "09" : "08";
  if (path === "/cart") return draft.lines.length ? "02" : "22";
  if (/^\/capture\/photos\/\d+$/.test(path)) return "11";
  if (/^\/menu\/[^/]+\/ask$/.test(path)) return "18";
  if (/^\/menu\/[^/]+$/.test(path)) return "06-2";
  return (
    (Object.entries(screenPaths).find(
      ([screen, value]) =>
        value === path && !["09", "40", "41", "22"].includes(screen),
    )?.[0] as Screen) ?? "home"
  );
}
