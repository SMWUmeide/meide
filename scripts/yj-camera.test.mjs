/** Browser integration: actual getUserMedia/canvas/IndexedDB + server no-key analysis. */
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.YJ_BASE_URL || "http://localhost:5173";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ["camera"],
  locale: "ko-KR",
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const screen = (id) =>
  page.waitForSelector(`main[data-screen="${id}"][aria-busy=false]`);
const click = async (name, id) => {
  await page.getByRole("button", { name, exact: true }).first().click();
  if (id) await screen(id);
};
await page.route("**/api/yj/findRestaurantOnMenu", (r) =>
  r.fulfill({ json: [] }),
);
try {
  await page.goto(base + "/capture");
  await screen("08");
  await page.waitForFunction(
    () => document.querySelector("video")?.videoWidth > 0,
  );
  assert.equal(await page.evaluate(() => window.isSecureContext), true);
  assert.equal(await page.locator(".menu-paper").count(), 0);
  assert.equal(await page.locator("video").getAttribute("playsinline"), "");
  await page.evaluate(() => {
    window.testTrack = document
      .querySelector("video")
      .srcObject.getVideoTracks()[0];
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForFunction(() => window.testTrack.readyState === "ended");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForFunction(
    () =>
      document.querySelector("video")?.srcObject?.getVideoTracks()[0]
        ?.readyState === "live",
  );
  await page.waitForFunction(
    () =>
      document.querySelector("video")?.videoWidth > 0 &&
      document.querySelector("video")?.readyState >= 2,
  );
  await click("셔터", "09");
  await click("셔터", "09");
  const src = await page.locator(".photo-stack img").getAttribute("src");
  assert.ok(src.startsWith("data:image/jpeg;base64,"));
  const dimensions = await page
    .locator(".photo-stack img")
    .evaluate((i) => ({ width: i.naturalWidth, height: i.naturalHeight }));
  assert.ok(Math.max(dimensions.width, dimensions.height) <= 1600);
  await page.evaluate(() => {
    window.testTrack = document
      .querySelector("video")
      .srcObject.getVideoTracks()[0];
  });
  await click("사진 2장 펼쳐보기", "10");
  assert.equal(await page.evaluate(() => window.testTrack.readyState), "ended");
  await click("1번째 사진 확대", "11");
  await click("다시 찍기", "08");
  await page.waitForFunction(
    () => document.querySelector("video")?.videoWidth > 0,
  );
  await click("교체 사진 촬영", "09");
  await click("사진 2장 펼쳐보기", "10");
  await click("2번째 사진 삭제");
  await click("닫기", "09");
  await page.waitForTimeout(500);
  await page.reload();
  await screen("09");
  assert.equal(
    await page
      .locator(".photo-stack img")
      .getAttribute("src")
      .then((s) => s?.startsWith("data:image/jpeg;base64,")),
    true,
  );
  const limited = (route) =>
    route.fulfill({
      status: 429,
      json: {
        code: "RATE_LIMIT",
        error: "오늘 분석 가능 횟수를 다 썼어요. 내일 다시 시도해 주세요.",
      },
    });
  await page.route("**/api/yj/analyzeMenu", limited);
  await click("메뉴판 1장 해석하기", "39");
  await screen("40");
  assert.match(
    await page.locator(".failure").innerText(),
    /오늘 분석 가능 횟수/,
  );
  assert.equal(
    await page.locator(".failed-photos .photo-preview img").count(),
    1,
  );
  await page.unroute("**/api/yj/analyzeMenu", limited);
  await click("같은 사진으로 다시 시도하기", "39");
  await screen("13");
  await click("네, 이 식당이에요", "01");
  assert.equal(await page.locator(".menu-card").count(), 4);
  await click("호박과 고대 밀 수프 상세 보기", "06-2");
  await click("장바구니에 담기", "01");
  await page.locator(".cart-button").click();
  await screen("02");
  assert.match(await page.locator("main").innerText(), /호박과 고대 밀 수프/);
  await page.goto(base + "/talk");
  await screen("16");
  await page.evaluate(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });
  await click("한국어로 말하기", "45");
  await page.getByRole("textbox", { name: "대화 직접 입력" }).waitFor();
  const denied = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await denied.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("denied", "NotAllowedError");
    };
  });
  const deniedPage = await denied.newPage();
  await deniedPage.goto(base + "/capture");
  await deniedPage.waitForSelector('main[data-screen="41"][aria-busy=false]');
  assert.match(
    await deniedPage.locator(".permission").innerText(),
    /사이트.*설정|Safari/,
  );
  await denied.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS camera capture/retake/delete/background/teardown/IndexedDB/no-key analysis/menu/cart/manual speech/permission denial",
    base,
  );
} finally {
  await browser.close();
}
