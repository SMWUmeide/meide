import { z } from "zod";
import { menuPhotoSchema, type MenuPhoto } from "./menu-photo";

const text = z.string().trim().min(1).max(800);
export const analysisSchema = z.object({
  isMenu: z.boolean().describe("사진에서 실제 메뉴와 가격을 읽을 수 있으면 true"),
  restaurantName: z.string().trim().max(160).describe("사진에 적힌 식당 이름. 안 보이면 빈 문자열"),
  currency: z.enum(["EUR", "OTHER", "UNKNOWN"]),
  items: z.array(z.object({
    categoryName: text.describe("메뉴판 섹션을 한국어로 번역한 이름"),
    categoryOriginal: z.string().max(160),
    originalName: text,
    photoQuery: z.string().max(120).optional().describe("사진 검색용 구체적인 영어 음식명. 요리 이름을 정확히 모르면 빈 문자열"),
    name: text.describe("한국어 메뉴명"),
    priceEur: z.number().min(0).max(10000).nullable().describe("메뉴판에서 읽은 EUR 가격. 안 보이거나 모호하면 null. 추정 금지"),
    analogy: text.describe("한국 음식에 빗댄 설명. 불확실하면 직원에게 확인하도록 안내"),
    description: text,
    ingredients: z.array(z.object({ name: text, original: text })).max(30).describe("메뉴 이름이나 원문에 실제 적힌 재료만. 추정 재료 금지"),
    allergen: text.describe("원문에 명시된 알레르기만. 없으면 '메뉴판에서 확인되지 않았어요'"),
    estimated: z.array(text).max(20).describe("일반 레시피 기준 추정 재료. 확인된 재료와 구분"),
    method: text,
    possibleAllergen: text.describe("추정 알레르기이며 반드시 직원에게 확인하도록 안내"),
  })).max(80),
});
export type Analysis = z.infer<typeof analysisSchema>;
export type MenuCategory = { id: string; name: string; original: string };
export type Category = string;
export type MenuItem = Omit<Analysis["items"][number], "categoryName" | "categoryOriginal" | "priceEur"> & { id: string; category: Category; priceEur: number; photoUrl: string | null; detailPhotoUrl?: string; photo?: MenuPhoto };
export type MenuBoard = { restaurantName: string; categories: MenuCategory[]; items: MenuItem[]; source: "gemini" | "demo"; skipped: number };

export function normalizeAnalysis(value: unknown): MenuBoard {
  const analysis = analysisSchema.parse(value);
  if (!analysis.isMenu || analysis.currency !== "EUR") throw new Error("유로 메뉴판을 읽을 수 없어요");
  const categories: MenuCategory[] = [];
  const items: MenuItem[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const item of analysis.items) {
    if (item.priceEur === null) { skipped++; continue; }
    const identity = `${item.originalName.toLocaleLowerCase()}|${item.priceEur}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    let category = categories.find(category => category.name === item.categoryName);
    if (!category) { category = { id: `category-${categories.length + 1}`, name: item.categoryName, original: item.categoryOriginal }; categories.push(category); }
    const { categoryName: _name, categoryOriginal: _original, ...details } = item;
    void _name; void _original;
    items.push({ ...details, priceEur: Math.round(item.priceEur * 100) / 100, id: `scan-${items.length + 1}`, category: category.id, photoUrl: null });
  }
  if (!items.length) throw new Error("가격을 읽을 수 있는 메뉴가 없어요");
  return { restaurantName: analysis.restaurantName || "촬영한 메뉴판", categories, items, source: "gemini", skipped };
}

const menuItemSchema = analysisSchema.shape.items.element.omit({ categoryName: true, categoryOriginal: true }).extend({ id: text, category: text, priceEur: z.number().min(0).max(10000), photoUrl: z.union([z.null(), menuPhotoSchema.shape.url]), photo: menuPhotoSchema.optional() });
export const menuBoardSchema = z.object({ restaurantName: text, categories: z.array(z.object({ id: text, name: text, original: z.string().max(160) })).min(1).max(80), items: z.array(menuItemSchema).min(1).max(80), source: z.literal("gemini"), skipped: z.number().int().min(0).max(80) }).refine(board => board.items.every(item => board.categories.some(category => category.id === item.category)) && new Set(board.items.map(item => item.id)).size === board.items.length && new Set(board.categories.map(category => category.id)).size === board.categories.length);
