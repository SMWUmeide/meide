import test from "node:test";
import assert from "node:assert/strict";
import {
  homePeriod,
  initialDraft,
  orderSentences,
  screenForPath,
  sharedLines,
  totals,
  updateQuantity,
} from "../lib/yj/model.ts";

test("shared cart, individual subtotals, tip and receipt agree in cents", () => {
  assert.deepEqual(totals(sharedLines, true), {
    food: 38,
    tip: 3.8,
    cart: 41.8,
    receipt: 46.8,
    count: 3,
  });
  assert.equal(
    totals(
      sharedLines.filter((line) => line.owner === "companion"),
      true,
    ).cart,
    30.8,
  );
  assert.equal(totals(sharedLines, false).receipt, 43);
});
test("zero removes only my line; the companion quantity is never changed", () => {
  const ownAndPeer = [
    ...sharedLines,
    { menuId: "zucca", owner: "me", quantity: 1 },
  ];
  const result = updateQuantity(ownAndPeer, "zucca", -1);
  assert.equal(result.filter((line) => line.menuId === "zucca").length, 1);
  assert.equal(
    result.find((line) => line.menuId === "zucca").owner,
    "companion",
  );
  assert.deepEqual(updateQuantity([], "porri", -1), []);
  assert.deepEqual(
    updateQuantity(updateQuantity([], "porri", 1), "porri", -1),
    [],
  );
});
test("order sentence merges owners and reflects quantity and known request immediately", () => {
  const result = orderSentences(
    [...sharedLines, { menuId: "zucca", owner: "me", quantity: 1 }],
    "치즈 빼고 주세요",
  );
  assert.match(result.italian, /2 porzioni di ZUPPA DI ZUCCA E FARRO/);
  assert.match(result.italian, /Senza formaggio/);
  assert.equal(result.untranslated, false);
  const unknown = orderSentences(sharedLines, "창가에 앉고 싶어요");
  assert.match(unknown.korean, /창가에 앉고 싶어요/);
  assert.equal(unknown.untranslated, true);
});
test("home boundaries use Italy local time, including early morning", () => {
  for (const [time, period] of [
    ["03:59", "evening"],
    ["04:00", "morning"],
    ["08:00", "late-morning"],
    ["10:00", "lunch"],
    ["15:00", "evening"],
  ]) {
    assert.equal(homePeriod(new Date(`2026-06-01T${time}:00Z`)), period);
  }
});
test("same-address states are resolved from actual draft content", () => {
  assert.equal(screenForPath("/cart", initialDraft), "22");
  assert.equal(
    screenForPath("/cart", { ...initialDraft, lines: sharedLines }),
    "02",
  );
  assert.equal(screenForPath("/capture", initialDraft), "08");
  assert.equal(
    screenForPath("/capture", {
      ...initialDraft,
      photos: [{ id: "1", readable: true }],
    }),
    "09",
  );
  assert.equal(screenForPath("/menu/zucca/ask", initialDraft), "18");
});
