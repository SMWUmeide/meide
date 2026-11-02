/** Derived display values for the existing Figma UI. Persistence and services use model.ts exclusively. */
import * as data from "./model";
import {
  fixtureAccount,
  fixtureBoard,
  fixtureCart,
  fixtureTrips,
  fixtureRanking,
} from "./fixtures";
import { allergyText, imageUrl, restaurantView } from "./presentation";
export { homePeriod } from "./model";
export {
  screenCatalog,
  screenPaths,
  isFlowPath,
  type Screen,
  type AppView,
} from "./routes";
import { fixtureScreen as routeFixture, type Screen } from "./routes";
export const state = {
  account: fixtureAccount(),
  board: structuredClone(fixtureBoard),
  cart: structuredClone(fixtureCart),
  translation: { local: "", ok: false },
  rankings: structuredClone(fixtureRanking),
  origin: undefined as data.Location | undefined,
  rate: { base: "EUR", quote: "KRW", rate: 1499, date: "2026-10-16" },
};
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

export type CartLine = {
  ownerUserId?: string;
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

export type Account = {
  profile: { name: string; taste: Taste };
  friends: Friend[];
  destination: Destination;
  recentMenu: boolean;
  records: MealRecord[];
};

export let menus: Menu[] = [];
export let destinations = fixtureTrips;
export let mockRestaurants: (Omit<
  ReturnType<typeof restaurantView>,
  "photo" | "signature" | "analogy"
> & { photo: string; signature: string; analogy: string })[] = [];
export let ranking: {
  menuId: string;
  percent: number;
  count: number;
  short: string;
}[] = [];
export function refreshViews() {
  menus = state.board.items.map((m) => ({
    id: m.id,
    original: m.original,
    korean: m.korean,
    price: Number(data.formatAmount(m.price)),
    category:
      state.board.sections.find((s) => s.id === m.sectionId)?.korean ?? "",
    photo: imageUrl(
      m.image?.verification === "dish-v1" ? m.image : undefined,
      m.id,
    ),
    analogy: m.ai.analogy,
    taste: m.ai.taste,
    ingredients: m.confirmed.ingredients.map((i) => [i.korean, i.original]),
    allergy: allergyText(m.confirmed.allergens),
    possible: m.ai.possibleIngredients,
    cooking: m.ai.cooking,
  }));
  mockRestaurants = state.account.restaurants
    .filter((r) => r.id !== "solita")
    .map((r) => {
      const v = restaurantView(
        r,
        state.origin ?? state.account.trip.location,
        state.account.trip,
      );
      return {
        ...v,
        photo: v.photoUrl,
        signature: v.signature ?? "",
        analogy: v.analogy ?? "",
      };
    });
  ranking = state.rankings.map((r) => ({
    menuId:
      [...state.board.items, ...fixtureBoard.items].find(
        (m) => m.original === r.original,
      )?.id ?? r.itemKey,
    percent: r.againPercent,
    count: r.count,
    short: r.analogyShort,
  }));
}
export function projectAccount(a: data.Account): Account {
  return {
    profile: { name: a.user.name, taste: displayTaste(a.user.taste) },
    friends: a.friends.map((f, i) => ({
      ...displayTaste(f.taste),
      id: f.id,
      name: f.name,
      initial: f.name === "김영수" ? "영" : f.name[0],
      kind: f.travelingWith ? "companion" : i % 2 ? "teal" : "orange",
      connected: !!f.linkedUserId,
      active: f.travelingWith,
    })),
    destination: a.trip,
    recentMenu: !!a.recentMenuBoardId,
    records: a.records.map((r) => ({
      id: r.id,
      restaurant:
        a.restaurants.find((x) => x.id === r.restaurantId)?.name ??
        a.boards.find((b) => b.id === r.menuBoardId)?.restaurantNameOnMenu ??
        "식당 미연결",
      at: r.orderedAt,
      lines: displayLines(r.lines),
      tip: !!r.tipPercent,
      request: r.request,
      ratings: Object.fromEntries(
        a.ratings
          .filter((x) => x.mealRecordId === r.id)
          .map((x) => [x.itemId, ratingLabels[x.value]]),
      ),
    })),
  };
}
const ratingLabels = {
  again: "또 먹고 싶어요",
  once: "한 번이면 충분해요",
  notForMe: "입맛에 안 맞았어요",
};
export function displayTaste(t: data.Taste): Taste {
  return {
    allergies: t.allergens.map((c) => data.allergenNames[c]),
    dislikes: t.dislikes,
    likes: t.likes,
  };
}
export function canonicalTaste(t: Taste): data.Taste {
  return {
    allergens: t.allergies
      .map((n) =>
        Number(
          Object.entries(data.allergenNames).find(([, v]) => v === n)?.[0],
        ),
      )
      .filter((c) => c >= 1 && c <= 14) as data.AllergenCode[],
    dislikes: t.dislikes,
    likes: t.likes,
  };
}
export function displayLines(lines: data.CartLine[]): CartLine[] {
  return lines.map((l) => ({
    menuId: l.itemId,
    ownerUserId: l.ownerUserId,
    owner: l.ownerUserId === state.account.user.id ? "me" : "companion",
    quantity: l.quantity,
  }));
}
export function canonicalLines(lines: CartLine[]): data.CartLine[] {
  return lines.map((l) => ({
    itemId: l.menuId,
    ownerUserId:
      l.ownerUserId ??
      (l.owner === "me"
        ? state.account.user.id
        : (state.cart.members.find((m) => m.role === "companion")?.userId ??
          "demo-miyoung")),
    quantity: l.quantity,
  }));
}
export function canonicalAccount(a: Account): data.Account {
  const previous = state.account;
  return {
    ...previous,
    user: {
      ...previous.user,
      name: a.profile.name,
      taste: canonicalTaste(a.profile.taste),
    },
    trip: { ...previous.trip, ...a.destination },
    recentMenuBoardId: a.recentMenu ? state.board.id : undefined,
    friends: a.friends.map((f) => ({
      id: f.id,
      name: f.name,
      taste: canonicalTaste(f),
      travelingWith: f.active,
      linkedUserId: f.connected
        ? (previous.friends.find((x) => x.id === f.id)?.linkedUserId ?? f.id)
        : undefined,
    })),
    records: a.records.map((r) => {
      const existing = previous.records.find((x) => x.id === r.id);
      return {
        id: r.id,
        orderedAt: r.at,
        menuBoardId: existing?.menuBoardId ?? state.board.id,
        restaurantId: existing?.restaurantId ?? state.board.restaurantId,
        lines: canonicalLines(r.lines),
        tipPercent: r.tip ? existing?.tipPercent || 10 : 0,
        request: r.request,
      };
    }),
    ratings: a.records.flatMap((r) =>
      Object.entries(r.ratings).map(([itemId, label]) => ({
        itemId,
        mealRecordId: r.id,
        value: (Object.entries(ratingLabels).find(
          ([, v]) => v === label,
        )?.[0] ?? "once") as data.Rating["value"],
        at:
          previous.ratings.find(
            (x) => x.mealRecordId === r.id && x.itemId === itemId,
          )?.at ?? new Date().toISOString(),
      })),
    ),
  };
}
export const makeAccount = () => projectAccount(state.account);
export const sharedLines = displayLines(fixtureAccount().records[0].lines);
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
export function menuById(id: string): Menu {
  const archived = [
    ...state.account.boards.flatMap((b) => b.items),
    ...fixtureBoard.items,
  ].find((m) => m.id === id);
  const rank = state.rankings.find((r) => r.itemKey === id);
  if (!menus.some((m) => m.id === id) && archived)
    return {
      id: archived.id,
      original: archived.original,
      korean: archived.korean,
      price: Number(data.formatAmount(archived.price)),
      category: "",
      photo: imageUrl(
        archived.image?.verification === "dish-v1" ? archived.image : undefined,
        archived.id,
      ),
      analogy: archived.ai.analogy,
      taste: archived.ai.taste,
      ingredients: archived.confirmed.ingredients.map((i) => [
        i.korean,
        i.original,
      ]),
      allergy: allergyText(archived.confirmed.allergens),
      possible: archived.ai.possibleIngredients,
      cooking: archived.ai.cooking,
    };
  if (rank)
    return {
      id,
      original: rank.original,
      korean: rank.korean,
      price: 0,
      category: "",
      photo: imageUrl(rank.image),
      analogy: rank.analogyShort,
      taste: "",
      ingredients: [],
      allergy: "",
      possible: [],
      cooking: "",
    };
  return (
    menus.find((m) => m.id === id) ??
    menus[0] ?? {
      id: "missing",
      original: "",
      korean: "메뉴를 다시 확인해 주세요",
      price: 0,
      category: "",
      analogy: "",
      taste: "",
      ingredients: [],
      allergy: "",
      possible: [],
      cooking: "",
    }
  );
}
export function updateQuantity(lines: CartLine[], id: string, change: number) {
  return displayLines(
    data.updateQuantity(
      canonicalLines(lines),
      id,
      change,
      state.account.user.id,
    ),
  );
}
export function totals(lines: CartLine[], tip: boolean) {
  const t = data.totals(
    canonicalLines(lines),
    tip ? 10 : 0,
    state.board.items,
    state.board.coperto,
    state.cart.members.length,
  );
  return {
    ...Object.fromEntries(
      ["food", "tip", "cart", "receipt"].map((k) => [
        k,
        Number(data.formatAmount(t[k as "food"])),
      ]),
    ),
    count: t.count,
  } as {
    food: number;
    tip: number;
    cart: number;
    receipt: number;
    count: number;
  };
}
export function orderSentences(lines: CartLine[], request: string) {
  const s = data.orderSentences(
    canonicalLines(lines),
    request,
    state.board.items,
    state.translation,
    state.board.language,
  );
  return {
    korean: s.korean,
    italian: s.local,
    untranslated: !s.requestTranslated,
  };
}
export function pendingRatings(records: MealRecord[]) {
  return records.flatMap((r) =>
    [...new Set(r.lines.map((l) => l.menuId))]
      .filter((id) => !r.ratings[id])
      .map((menuId) => ({ recordId: r.id, menuId })),
  );
}
export function searchDestinations(q: string) {
  return q.trim()
    ? destinations.filter((d) =>
        `${d.country} ${d.city} ${d.detail}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
      )
    : [];
}
export function setDestinations(rows: data.Trip[]) {
  destinations = [
    ...new Map([...rows, ...destinations].map((d) => [d.id, d])).values(),
  ];
}
export function fixtureScreen(
  path: string,
  params: URLSearchParams,
  draft: Draft,
): Screen {
  return routeFixture(path, params, {
    photos: draft.photos.map((p) => ({
      id: p.id,
      localKey: p.id,
      readable: p.readable ? "ok" : "blurry",
      itemIds: [],
    })),
    lines: canonicalLines(draft.lines),
  });
}
export const tasteOptions = {
  allergies: data.tasteOptions.allergens.map((c) => data.allergenNames[c]),
  dislikes: data.tasteOptions.dislikes,
  likes: data.tasteOptions.likes,
};
export function nearbyRestaurants(category: string, query = "") {
  const live =
    typeof window !== "undefined" &&
    !new URLSearchParams(window.location.search).has("fixture");
  return mockRestaurants.filter(
    (r) =>
      (!live || r.id.startsWith("osm:")) &&
      (category === "한식·아시안"
        ? ["asian", "korean", "market"].includes(r.kind)
        : r.kind === "local") &&
      (![
        "국물 요리",
        "밥·죽",
        "면 요리",
        "고기 구이",
        "해산물",
        "빵·피자",
      ].includes(category) ||
        r.category.includes(category as data.KoreanCategory)) &&
      `${r.name} ${r.signature} ${r.type}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
}
refreshViews();
