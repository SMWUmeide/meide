import { menuItems } from "@/data/mock-menu";
export type CartLine = { menuId: string; person: "me" | "companion-1"; quantity: number };
export const initialCart: CartLine[] = [{ menuId: "porri", person: "me", quantity: 1 }, { menuId: "zucca", person: "companion-1", quantity: 1 }, { menuId: "ossobuco", person: "companion-1", quantity: 1 }];
export function subtotal(cart: CartLine[]) { return Math.round(cart.reduce((sum, line) => sum + (menuItems.find(menu => menu.id === line.menuId)?.priceEur ?? 0) * line.quantity, 0) * 100) / 100; }
export function totals(cart: CartLine[], includeTip: boolean) { const food = subtotal(cart); const tip = includeTip ? Math.round(food * 10) / 100 : 0; return { food, tip, total: Math.round((food + tip) * 100) / 100, count: cart.reduce((sum, line) => sum + line.quantity, 0) }; }
export function changeQuantity(cart: CartLine[], menuId: string, delta: number) { return cart.map(line => line.menuId === menuId && line.person === "me" ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line).filter(line => line.quantity > 0); }
