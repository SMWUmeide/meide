import { describe, expect, it } from "vitest";
import { demoBoard } from "@/data/mock-menu";
import { orderText } from "./order";
import { changeQuantity, initialCart, totals } from "./cart";
import { readSession, saveSession } from "./session";

describe("주문 데이터 일관성", () => {
  it("변경한 수량과 원어 메뉴명으로 주문 문장을 만들어요", () => {
    const cart = changeQuantity(initialCart, "porri", 1);
    const text = orderText(demoBoard, cart);
    expect(text.korean).toContain("서양 대파와 감자 크림 수프 2개");
    expect(text.italian).toContain("2 porzioni di zuppa di porri e patate");
    expect(text.italian).not.toContain("cinghiale");
    expect(totals(cart, true, demoBoard.items, 15).total).toBe(55.2);
  });
  it("수량은 20개를 넘지 않고 동반인 수량도 독립적으로 바꿔요", () => {
    expect(changeQuantity(initialCart, "porri", 50)[0].quantity).toBe(20);
    expect(changeQuantity(initialCart, "zucca", 1, "companion-1")[1].quantity).toBe(2);
    expect(orderText(demoBoard, []).italian).toBe("");
  });
  it("주문을 복원하고 손상된 저장 데이터는 버려요", () => {
    const session = { board: demoBoard, cart: changeQuantity(initialCart, "porri", 1), category: "soup", tip: false, tipRate: 15, request: "치즈는 빼주세요" };
    saveSession(session); expect(readSession()).toMatchObject(session);
    localStorage.setItem("meide.order.v1", "broken"); expect(readSession().cart).toEqual(initialCart);
  });
});
