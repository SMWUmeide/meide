/** Canonical application data. DATA-yj.md §3. No display strings or calculated totals are persisted. */
export type Money = { amount: number; currency: string };
export type AllergenCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14;
export type Location = { lat: number; lng: number };
export type KoreanCategory =
  | "국물 요리"
  | "밥·죽"
  | "면 요리"
  | "고기 구이"
  | "해산물"
  | "빵·피자";
export type MenuImage = {
  url: string;
  source: "wikimedia" | "unsplash" | "pexels";
  credit: string;
  license: string;
  pageUrl: string;
  isReference: true;
};
export type MenuPhoto = {
  id: string;
  localKey: string;
  readable: "ok" | "blurry" | "glare";
  itemIds: string[];
};
export type MenuSection = {
  id: string;
  original: string;
  korean: string;
  order: number;
};
export type MenuItem = {
  id: string;
  sectionId: string;
  original: string;
  korean: string;
  price: Money;
  confirmed: {
    ingredients: { korean: string; original: string; note?: string }[];
    allergens: AllergenCode[];
  };
  ai: {
    analogy: string;
    taste: string;
    possibleIngredients: string[];
    cooking: string;
    possibleAllergens: { code: AllergenCode; reason: string }[];
    askStaff?: { korean: string; local: string };
  };
  image?: MenuImage;
  sourcePhotoId: string;
  readConfidence: "high" | "low";
};
export type MenuBoard = {
  id: string;
  createdAt: string;
  status: "analyzing" | "done" | "partial" | "failed";
  photos: MenuPhoto[];
  restaurantNameOnMenu?: string;
  restaurantId?: string;
  language: string;
  currency: string;
  coperto?: Money;
  sections: MenuSection[];
  items: MenuItem[];
};
export type KoreanRating = { average: number; count: number };
export type Restaurant = {
  id: string;
  name: string;
  location: Location;
  address?: string;
  cuisine: string[];
  kind: "local" | "korean" | "asian" | "market";
  category: KoreanCategory[];
  openingHours?: string;
  photo?: MenuImage;
  signatureItem?: { korean: string; original: string; analogy: string };
  koreanRating?: KoreanRating;
};
export type CartLine = {
  itemId: string;
  ownerUserId: string;
  quantity: number;
};
export type CartSession = {
  id: string;
  menuBoardId: string;
  members: {
    userId: string;
    role: "me" | "companion";
    name: string;
    initial: string;
  }[];
  tipPercent?: number;
  request: string;
  version: number;
  lines: CartLine[];
};
export type Taste = {
  allergens: AllergenCode[];
  dislikes: string[];
  likes: string[];
};
export type User = { id: string; name: string; taste: Taste };
export type Friend = {
  id: string;
  name: string;
  taste: Taste;
  linkedUserId?: string;
  travelingWith: boolean;
};
export type Trip = {
  id: string;
  country: string;
  city: string;
  detail?: string;
  timezone: string;
  location: Location;
};
export type MealRecord = {
  id: string;
  orderedAt: string;
  menuBoardId: string;
  restaurantId?: string;
  lines: CartLine[];
  tipPercent?: number;
  request: string;
};
export type Rating = {
  itemId: string;
  value: "again" | "once" | "notForMe";
  at: string;
  mealRecordId: string;
};
export type KoreanRanking = {
  itemKey: string;
  korean: string;
  original: string;
  region: string;
  againPercent: number;
  count: number;
  analogyShort: string;
  image?: MenuImage;
};
export type ExchangeRate = {
  base: string;
  quote: string;
  rate: number;
  date: string;
};
export type OrderSentence = {
  korean: string;
  local: string;
  language: string;
  requestTranslated: boolean;
};
export type Totals = {
  food: Money;
  tip: Money;
  cart: Money;
  receipt: Money;
  count: number;
};
export type Account = {
  restaurants: Restaurant[];
  user: User;
  friends: Friend[];
  trip: Trip;
  boards: MenuBoard[];
  records: MealRecord[];
  ratings: Rating[];
  recentMenuBoardId?: string;
};
export const allergenNames: Record<AllergenCode, string> = {
  1: "글루텐",
  2: "갑각류",
  3: "달걀",
  4: "생선",
  5: "땅콩",
  6: "대두",
  7: "유제품",
  8: "견과류",
  9: "셀러리",
  10: "겨자",
  11: "참깨",
  12: "아황산염",
  13: "루핀",
  14: "조개류",
};
export const tasteOptions = {
  allergens: [2, 8, 7, 1, 3, 4, 5, 14] as AllergenCode[],
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
export const minorDigits = (currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
export function formatAmount(money: Money) {
  return (money.amount / 10 ** minorDigits(money.currency)).toFixed(
    minorDigits(money.currency),
  );
}
export function money(amount: number, currency = "EUR"): Money {
  return { amount: Math.round(amount), currency };
}
export function multiplyMoney(value: Money, quantity: number): Money {
  return money(value.amount * quantity, value.currency);
}
export function convertedWon(value: Money, rate: ExchangeRate) {
  return Math.round(
    (value.amount / 10 ** minorDigits(value.currency)) * rate.rate,
  );
}
export function menuById(id: string, items: MenuItem[]): MenuItem {
  return (
    items.find((m) => m.id === id) ??
    items[0] ?? {
      id: "missing",
      sectionId: "",
      original: "",
      korean: "메뉴를 다시 확인해 주세요",
      price: money(0),
      confirmed: { ingredients: [], allergens: [] },
      ai: {
        analogy: "",
        taste: "",
        possibleIngredients: [],
        cooking: "",
        possibleAllergens: [],
      },
      sourcePhotoId: "",
      readConfidence: "low",
    }
  );
}
export function updateQuantity(
  lines: CartLine[],
  id: string,
  change: number,
  ownerUserId: string,
): CartLine[] {
  const old = lines.find(
    (l) => l.itemId === id && l.ownerUserId === ownerUserId,
  );
  if (!old)
    return change > 0
      ? [...lines, { itemId: id, ownerUserId, quantity: 1 }]
      : lines;
  return lines
    .map((l) =>
      l === old ? { ...l, quantity: Math.max(0, l.quantity + change) } : l,
    )
    .filter((l) => l.quantity > 0);
}
export function totals(
  lines: CartLine[],
  tipPercent: number | undefined,
  items: MenuItem[],
  coperto: Money = money(0),
  people = 0,
): Totals {
  const currency = items[0]?.price.currency ?? coperto.currency;
  const cents = lines.reduce(
    (sum, line) =>
      sum +
      (items.find((m) => m.id === line.itemId)?.price.amount ?? 0) *
        line.quantity,
    0,
  );
  const tip = Math.round((cents * (tipPercent ?? 0)) / 100);
  return {
    food: money(cents, currency),
    tip: money(tip, currency),
    cart: money(cents + tip, currency),
    receipt: money(cents + tip + coperto.amount * people, currency),
    count: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}
export function orderSentences(
  lines: CartLine[],
  request: string,
  items: MenuItem[],
  translation?: { local: string; ok: boolean },
  language = "it",
): OrderSentence {
  const combined = new Map<string, number>();
  lines.forEach((l) =>
    combined.set(l.itemId, (combined.get(l.itemId) ?? 0) + l.quantity),
  );
  const parts = [...combined].map(([id, quantity]) => ({
    menu: menuById(id, items),
    quantity,
  }));
  return {
    korean:
      parts
        .map(({ menu, quantity }) => `${menu.korean} ${quantity}인분`)
        .join(", ") +
      " 주세요." +
      (request ? ` ${request}` : ""),
    local:
      (parts.length
        ? `Vorremmo ordinare ${parts.map(({ menu, quantity }) => `${quantity === 1 ? "una porzione" : `${quantity} porzioni`} di ${menu.original}`).join(", ")}, per favore.`
        : "") +
      (translation?.ok && translation.local ? ` ${translation.local}` : ""),
    language,
    requestTranslated: !request.trim() || Boolean(translation?.ok),
  };
}
export function pendingRatings(records: MealRecord[], ratings: Rating[]) {
  return records.flatMap((record) =>
    [...new Set(record.lines.map((l) => l.itemId))]
      .filter(
        (id) =>
          !ratings.some((r) => r.mealRecordId === record.id && r.itemId === id),
      )
      .map((itemId) => ({ recordId: record.id, itemId })),
  );
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
