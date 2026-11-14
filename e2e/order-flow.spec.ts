import { test, expect } from '@playwright/test';

for (const width of [320, 360, 412]) {
  test(`다섯 화면은 ${width}px에서 넘치지 않고 이미지가 보여요`, async ({ page }) => {
    await page.setViewportSize({ width, height: 917 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    for (const route of ['menu', 'detail/zucca', 'cart', 'order', 'receipt']) {
      await page.goto(`/#/${route}`);
      await expect(page.locator('main')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByText('9:41', { exact: true })).toHaveCount(0);
      await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
      expect(await page.locator('button[data-variant="primary"]').count()).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
  });
}

test('장바구니 → 요청사항 → 확대 → 영수증 → 추가 주문과 새로고침', async ({ page }) => {
  await page.goto('/#/cart');
  await page.getByRole('button', { name: '서양 대파와 감자 크림 수프 수량 늘리기' }).click();
  await expect(page.getByRole('region', { name: '예상 결제 금액' })).toContainText('52.80');
  await page.getByRole('button', { name: '주문 문장 만들기' }).click();
  await expect(page.locator('.order-sentence')).toContainText('서양 대파와 감자 크림 수프 2개');
  await page.getByLabel('요청사항', { exact: true }).fill('치즈는 빼주세요');
  await page.getByRole('button', { name: '주문 문장 확대' }).click();
  await expect(page.getByRole('dialog')).toContainText('Senza formaggio, per favore.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '주문 문장 확대' })).toBeFocused();
  await page.getByRole('button', { name: '영수증 보기' }).click();
  await expect(page.locator('.receipt-total')).toContainText('57.80');
  await page.getByRole('button', { name: '추가 주문하기' }).click();
  await page.reload();
  await page.getByRole('button', { name: '4개 보기' }).click();
  await expect(page.getByRole('region', { name: '예상 결제 금액' })).toContainText('52.80');
});

test('번역 실패·재시도와 요청사항 수정 시 오래된 번역을 표시하지 않아요', async ({ page }) => {
  let fail = true;
  await page.route('**/api/translate-request', async route => {
    await route.fulfill({ status: fail ? 503 : 200, contentType: 'application/json', body: JSON.stringify(fail ? { error: 'CONFIG' } : { translation: 'Senza cipolla, per favore.' }) });
  });
  await page.goto('/#/order');
  await page.getByLabel('요청사항', { exact: true }).fill('양파는 빼주세요');
  await expect(page.getByRole('button', { name: '영수증 보기' })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('번역하지 못했어요');
  fail = false;
  await page.getByRole('button', { name: '다시 번역하기' }).click();
  await expect(page.locator('.order-italian')).toContainText('Senza cipolla');
  await expect(page.getByRole('button', { name: '영수증 보기' })).toBeEnabled();
  await page.getByLabel('요청사항', { exact: true }).fill('치즈는 빼주세요');
  await expect(page.locator('.order-italian')).not.toContainText('cipolla');
  await expect(page.locator('.order-italian')).toContainText('Senza formaggio');
});

test('장바구니 마지막 항목에 접근하고 빈 장바구니의 주문을 막아요', async ({ page }) => {
  await page.goto('/#/cart');
  for (const name of ['서양 대파와 감자 크림 수프', '호박과 고대 밀 수프', '뼈가 붙은 소고기 요리와 으깬 감자']) {
    await page.getByRole('button', { name: `${name} 수량 줄이기` }).click();
  }
  await expect(page.getByText('아직 담은 메뉴가 없어요')).toBeVisible();
  await expect(page.getByRole('button', { name: '주문 문장 만들기' })).toBeDisabled();
});
