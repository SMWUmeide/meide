import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const base = process.env.YJ_BASE_URL || "http://127.0.0.1:5173";
const errors = [],
  api = [];
const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ko-KR",
  }),
  page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (new URL(r.url()).pathname.startsWith("/api/")) api.push(r.url());
});
const screen = async (id) =>
  page.waitForSelector(`main[data-screen="${id}"][aria-busy=false]`);
const click = async (name, id) => {
  await page.getByRole("button", { name, exact: true }).first().click();
  if (id) await screen(id);
};
const open = async (path, id) => {
  await page.goto(base + path);
  await screen(id);
};
try {
  await open("/", "home");
  await click("메뉴판 찍기 찍으면 한국 음식에 빗대어 풀어드려요", "08");
  await click("셔터", "09");
  await click("셔터", "09");
  await click("사진 2장 펼쳐보기", "10");
  await click("1번째 사진 확대", "11");
  await click("닫기", "10");
  await click("메뉴판 2장 해석하기", "39");
  await screen("40");
  await click("읽은 메뉴만 먼저 보기", "13");
  await click("다른 식당이에요", "14");
  await click("이 식당으로 할게요", "01");
  await page.locator(".cart-button").click();
  await screen("22");
  await click("메뉴 보러 가기", "01");
  await click("호박과 고대 밀 수프 상세 보기", "06-2");
  await click("직원에게 확인하는 문장 보기", "18");
  await click("안 들어가요");
  await click("실시간 대화로 묻기", "16");
  await click("대화 마치기", "18");
  await click("메뉴 상세로 돌아가기", "06-2");
  await click("장바구니에 담기", "01");
  await page.locator(".cart-button").click();
  await screen("02");
  await click("주문 문장 만들기", "03");
  await page.locator("textarea").fill("치즈 빼고 주세요");
  assert.match(
    await page.locator(".sentence-italian").innerText(),
    /Senza formaggio/,
  );
  await click("크게 보여주기", "17");
  await click("닫기", "03");
  await click("직원이 되물었어요", "15");
  await click("주문 문장 먼저 보여주기", "17");
  await click("닫기", "16");
  await click("탄산수요");
  assert.match(await page.locator(".staff-italian").innerText(), /frizzante/);
  await click("한국어로 말하기", "45");
  await screen("16");
  await click("대화 마치기", "03");
  await click("주문했어요", "04");
  assert.match(
    await page.locator(".receipt-card").innerText(),
    /호박과 고대 밀 수프/,
  );
  await click("홈으로 가기", "home");
  await page
    .locator(".tabbar")
    .getByRole("button", { name: "주문 내역" })
    .click();
  await screen("19");
  await click("평가하기", "20");
  while (await page.locator('[data-screen="20"]').count())
    await click("또 먹고 싶어요 한국인 평점에 반영돼요");
  await screen("19");
  console.log(
    "PASS capture → partial analysis → empty cart → ingredient question → talk → order → receipt → history → ratings",
  );
  await page
    .locator(".tabbar")
    .getByRole("button", { name: "둘러보기" })
    .click();
  await screen("31");
  await page
    .getByRole("button", { name: "전체 보기", exact: true })
    .first()
    .click();
  await screen("33");
  await click("뒤로 가기", "31");
  await click("지도로 크게 보기", "05-2");
  await click("Osteria del Ponte 마커");
  assert.match(
    await page.locator(".restaurant-sheet").innerText(),
    /Osteria del Ponte/,
  );
  await click("식당 목록 펼치기", "05-3");
  await page.locator(".restaurant-open").first().click();
  await screen("32");
  assert.equal(await page.locator(".bottom-actions").count(), 0);
  await click("뒤로 가기", "05-3");
  await click("지도 보기", "05-2");
  await click("해산물", "42");
  await click("1km로 넓혀서 찾기", "05-2");
  console.log(
    "PASS explore → ranking → map marker → list → restaurant → no-results → wider radius",
  );
  await open("/", "home");
  await click("이탈리아", "07");
  await page.getByRole("textbox").fill("로마나");
  await screen("43");
  await page
    .getByRole("button", { name: /이탈리아.*로마/ })
    .last()
    .click();
  await screen("home");
  await click("함께 여행하는 사람", "23");
  await page.getByRole("switch", { name: "박정숙님과 함께 여행" }).click();
  assert.equal(
    await page
      .getByRole("switch", { name: "박정숙님과 함께 여행" })
      .getAttribute("aria-checked"),
    "true",
  );
  await page.getByRole("switch", { name: "김영수님과 함께 여행" }).click();
  await screen("27");
  await click("QR 코드 보여주기 옆에 있는 동행자 폰으로 찍게 해요");
  await page.getByAltText("동행자 초대 링크 QR 코드").waitFor();
  await click("닫기");
  await click("뒤로 가기", "23");
  await click("새 친구 추가", "26");
  await page.locator(".field-label input").fill("여행친구");
  await click("담백한 맛");
  await click("친구 등록하기", "23");
  assert.match(await page.locator("main").innerText(), /여행친구님/);
  await open("/my", "28");
  await click("프로필 수정", "29");
  await page.getByRole("textbox", { name: "이름" }).fill("새이름");
  await click("저장하기", "28");
  assert.match(await page.locator("main").innerText(), /새이름님/);
  await click("개인정보와 저장", "30");
  await click("저장된 기록 지우기 지운 기록은 되돌릴 수 없어요", "46");
  await click("그대로 두기", "30");
  await click("저장된 기록 지우기 지운 기록은 되돌릴 수 없어요", "46");
  await click("기록 지우기", "30");
  await click("확인했어요", "28");
  await page
    .locator(".tabbar")
    .getByRole("button", { name: "주문 내역" })
    .click();
  await screen("21");
  await click("메뉴판 찍으러 가기", "08");
  console.log(
    "PASS destinations → companions/toggles/invite QR/new friend → MY edit → deletion → empty history",
  );
  await open("/talk?talk=failure", "16");
  await click("한국어로 말하기", "45");
  await screen("44");
  await click("주문 문장 보여주기", "17");
  await click("닫기", "16");
  assert.deepEqual(errors, []);
  assert.deepEqual(api, []);
  console.log("PASS error fallback and all interactions without API requests");
} finally {
  await context.close();
  await browser.close();
}
