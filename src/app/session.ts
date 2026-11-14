import { z } from "zod";
import { menuBoardSchema, type MenuBoard } from "@/data/menu-schema";
import { demoBoard } from "@/data/mock-menu";
import { initialCart, type CartLine } from "./cart";

const key = "meide.order.v1";
const schema = z.object({
  version: z.literal(1), board: z.union([z.literal("demo"), menuBoardSchema]),
  cart: z.array(z.object({ menuId: z.string(), person: z.enum(["me", "companion-1", "companion-2", "companion-3"]), quantity: z.number().int().min(1).max(20) })).max(160),
  category: z.string(), tip: z.boolean(), tipRate: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]), request: z.string().max(500),
});
export type OrderSession = { board: MenuBoard; cart: CartLine[]; category: string; tip: boolean; tipRate: number; request: string };
export function readSession(): OrderSession {
  const fallback = { board: demoBoard, cart: initialCart, category: "soup", tip: true, tipRate: 10, request: "" };
  try {
    const saved = schema.parse(JSON.parse(localStorage.getItem(key) || "null"));
    const board = saved.board === "demo" ? demoBoard : saved.board;
    const seen = new Set<string>();
    const cart = saved.cart.filter(line => {
      const id = `${line.person}:${line.menuId}`;
      if (seen.has(id) || !board.items.some(item => item.id === line.menuId)) return false;
      seen.add(id); return true;
    });
    return { ...saved, board, cart, category: board.categories.some(category => category.id === saved.category) ? saved.category : board.categories[0].id };
  } catch { return fallback; }
}
export function saveSession(session: OrderSession) {
  try { localStorage.setItem(key, JSON.stringify({ ...session, version: 1, board: session.board.source === "demo" ? "demo" : session.board })); }
  catch { /* Browsing and ordering remain available when device storage is full. */ }
}
