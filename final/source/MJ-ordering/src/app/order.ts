import type { MenuBoard } from "@/data/menu-schema";
import type { CartLine } from "./cart";

export function orderLines(board: MenuBoard, cart: CartLine[]) {
  return cart.flatMap(line => {
    const item = board.items.find(item => item.id === line.menuId);
    return item ? [{ ...line, item }] : [];
  });
}

// Keep names and quantities from the menu: a language model must not invent dishes.
export function orderText(board: MenuBoard, cart: CartLine[]) {
  const lines = orderLines(board, cart);
  if (!lines.length) return { korean: "", italian: "" };
  return {
    korean: `${lines.map(({ item, quantity }) => `${item.name} ${quantity}개`).join(", ")} 주세요.`,
    italian: `Vorremmo ordinare ${lines.map(({ item, quantity }) => `${quantity === 1 ? "una porzione" : `${quantity} porzioni`} di ${item.originalName.toLocaleLowerCase("it")}`).join(" e ")}, per favore.`,
  };
}

export const requestPhrases: Record<string, string> = {
  "치즈는 빼주세요": "Senza formaggio, per favore.",
  "덜 짜게 해주세요": "Con poco sale, per favore.",
  "물 주세요": "Dell’acqua, per favore.",
};
