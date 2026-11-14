// 1단계 전용 예시 데이터예요. 실제 메뉴·환율·AI 분석 결과가 아니에요.
export const restaurant = { name: "Osteria La Solita Zuppa", location: "이탈리아 · 키우시", exchangeRate: 1499 };
export const categories = [{ id: "soup", name: "수프", original: "zuppe" }, { id: "main", name: "메인 요리", original: "secondi" }, { id: "wine", name: "주류", original: "vini" }] as const;
import demoPhotos from "./demo-photos.json";
import { menuPhotoSchema } from "./menu-photo";
import type { MenuBoard, MenuItem } from "./menu-schema";
export type { Category, MenuItem } from "./menu-schema";
const soup = { analogy: "따뜻하고 든든한 채소 수프에 가까워요", description: "재료를 푹 끓여 부드럽고 고소한 맛이 나는 예시 메뉴예요.", ingredients: [] as MenuItem["ingredients"], allergen: "메뉴판에서 확인되지 않았어요", estimated: ["양파", "올리브유", "채소 육수"], method: "채소를 부드럽게 끓이는 것이 일반적이에요. 실제 조리법은 직원에게 확인해 주세요.", possibleAllergen: "유제품 등이 들어갈 수 있어요" };
const exampleItems: MenuItem[] = [
  { ...soup, id: "ceci", category: "soup", originalName: "ZUPPA DI CECI E PORCINI", name: "병아리콩과 포르치니 버섯 수프", priceEur: 11, photoUrl: "/figma/124aa.png", ingredients: [{ name: "병아리콩", original: "ceci" }, { name: "포르치니 버섯", original: "porcini" }] },
  { ...soup, id: "porri", category: "soup", originalName: "ZUPPA DI PORRI E PATATE", name: "서양 대파와 감자 크림 수프", priceEur: 10, photoUrl: "/figma/057e9.png", detailPhotoUrl: "/figma/60d97.png", analogy: "대파 향이 은은한 감자 수프에 가까워요", ingredients: [{ name: "서양 대파", original: "porri" }, { name: "감자", original: "patate" }] },
  { ...soup, id: "zucca", category: "soup", originalName: "ZUPPA DI ZUCCA E FARRO", name: "호박과 고대 밀 수프", priceEur: 10, photoUrl: "/figma/0fb39.png", detailPhotoUrl: "/figma/6415e.png", analogy: "보리를 넣은 걸쭉한 호박죽에 가까워요", description: "호박죽보다 덜 달고, 치즈와 올리브유 덕에 고소한 맛이 나요.", ingredients: [{ name: "단호박", original: "zucca" }, { name: "파로", original: "farro" }], allergen: "글루텐 (EU 1)", estimated: ["양파", "올리브유", "채소 육수", "파르미지아노 치즈"], method: "호박을 푹 끓여 곱게 간 뒤, 따로 삶은 파로를 넣어 죽처럼 걸쭉하게 만드는 게 일반적이에요.", possibleAllergen: "유제품 (EU 7) · 치즈가 들어갔을 수 있어요" },
  { ...soup, id: "melanzane", category: "soup", originalName: "ZUPPA DI MELANZANE FUMÉ", name: "훈연 가지 수프", priceEur: 11, photoUrl: null, ingredients: [{ name: "가지", original: "melanzane" }] },
  ...[{ id: "ossobuco", originalName: "OSSOBUCO DI CHIANINA E PURE' DI PATATE", name: "뼈가 붙은 소고기 요리와 으깬 감자", priceEur: 18 }, { id: "peposo", originalName: "PEPOSO ALL’IMPRUNETANA", name: "후추 향의 토스카나 소고기 스튜", priceEur: 17 }, { id: "baccala", originalName: "BACCALÀ AL POMODORO", name: "토마토 소스 대구 튀김", priceEur: 16 }].map(item => ({ ...soup, ...item, category: "main" as const, photoUrl: item.id === "baccala" ? "/figma/f3e0f.png" : null })),
  ...["집에서 고른 레드 와인", "집에서 고른 화이트 와인", "키안티 레드 와인", "토스카나 화이트 와인", "스파클링 와인", "무알코올 포도 음료"].map((name, index) => ({ ...soup, id: `wine-${index}`, category: "wine" as const, originalName: ["ROSSO DELLA CASA", "BIANCO DELLA CASA", "CHIANTI", "BIANCO TOSCANO", "SPUMANTE", "SUCCO D’UVA"][index], name, priceEur: [5, 5, 7, 6, 6, 4][index], photoUrl: null, analogy: "식사에 곁들이는 음료예요", estimated: [], possibleAllergen: "아황산염 등이 들어갈 수 있어요" })),
];
// Resolve every demo image through the same Pixabay metadata as scanned menus.
export const menuItems: MenuItem[] = exampleItems.map(item => {
  const entry = demoPhotos[item.id as keyof typeof demoPhotos];
  const photo = entry?.photo ? menuPhotoSchema.parse(entry.photo) : undefined;
  return {...item, photoQuery: entry?.query, photo, photoUrl: photo?.cutoutUrl ?? photo?.url ?? null, detailPhotoUrl: undefined};
});
export const ranking = [
  { id: "porri", name: "서양 대파·감자 수프", photo: "/figma/057e9.png", score: "4.8" },
  { id: "zucca", name: "호박·밀알 수프", photo: "/figma/0fb39.png", score: "4.8" },
  { id: "baccala", name: "토마토 소스 대구 튀김", photo: "/figma/f3e0f.png", score: "4.7" },
  { id: "ceci", name: "병아리콩·포르치니 버섯 수프", photo: "/figma/124aa.png", score: "4.7" },
];
export function krw(eur: number) { return Math.round(eur * restaurant.exchangeRate).toLocaleString("ko-KR"); }

export const demoBoard: MenuBoard = { restaurantName: restaurant.name, categories: [...categories], items: menuItems, source: "demo", skipped: 0 };
