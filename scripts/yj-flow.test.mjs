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

import {
  fixtureScreen,
  screenCatalog,
  isFlowPath,
  makeAccount,
  pendingRatings,
  searchDestinations,
} from "../lib/yj/model.ts";
import { getSvgPath } from "figma-squircle";

test("every published screen URL resolves to its screen, including same-path fixtures", () => {
  for (const [number, , path] of screenCatalog) {
    const url = new URL(path, "http://localhost");
    const draft = {
      ...initialDraft,
      lines: url.searchParams.get("fixture") === "shared" ? sharedLines : [],
    };
    assert.equal(isFlowPath(url.pathname), true, path);
    assert.equal(
      fixtureScreen(url.pathname, url.searchParams, draft),
      number,
      path,
    );
  }
  assert.equal(isFlowPath("/settings"), false);
  assert.equal(
    fixtureScreen("/talk", new URLSearchParams("fixture=46"), initialDraft),
    "16",
    "fixtures cannot jump to another route",
  );
});
test("pending ratings count unique menus in each order and advance without changing order data", () => {
  const account = makeAccount();
  assert.equal(pendingRatings(account.records).length, 3);
  const before = structuredClone(account.records[0].lines);
  const first = pendingRatings(account.records)[0];
  account.records[0].ratings[first.menuId] = "또 먹고 싶어요";
  assert.equal(pendingRatings(account.records).length, 2);
  assert.deepEqual(account.records[0].lines, before);
  assert.equal(pendingRatings([]).length, 0);
});
test("destination search and time period are local, including a destination timezone change", () => {
  assert.equal(searchDestinations("로마").length, 4);
  assert.equal(searchDestinations("로마나").length, 0);
  const date = new Date("2026-10-25T10:00:00Z");
  assert.equal(homePeriod(date, "Europe/Rome"), "late-morning");
  assert.equal(homePeriod(date, "Asia/Seoul"), "evening");
});
test("squircle geometry preserves Figma smoothing at narrow and wide sizes", () => {
  for (const [width, height, radius] of [
    [350, 60, 22],
    [362, 226, 38],
    [88, 88, 32],
    [80, 40, 17.6],
  ]) {
    const path = getSvgPath({
      width,
      height,
      cornerRadius: radius,
      cornerSmoothing: 0.8,
    });
    assert.match(path, /c/i);
    assert.doesNotMatch(path, /NaN|Infinity/);
    assert.notEqual(
      path,
      getSvgPath({ width, height, cornerRadius: radius, cornerSmoothing: 0 }),
    );
  }
});
