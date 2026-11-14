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
      for (const content of await page.locator('.page-content,.detail-content,.cart-dock,.fixed-action,.order-footer').all()) {
        await expect(content).toHaveCSS('padding-left', '24px');
        await expect(content).toHaveCSS('padding-right', '24px');
      }
      if (route === 'menu') {
        const card = page.locator('.menu-card').first();
        await expect(card.locator('.menu-details')).toHaveCSS('padding', '16px');
        await expect(card.locator('.menu-toggle')).toHaveCSS('right', '12px');
        await expect(card.locator('.menu-toggle')).toHaveCSS('bottom', '12px');
        const gaps = await card.evaluate(element => {
          const rect = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
          return [rect('.menu-name').top - rect('.menu-original').bottom, rect('.menu-price').top - rect('.menu-name').bottom, rect('.menu-conversion').top - rect('.menu-price').bottom];
        });
        expect(gaps).toEqual([4, 16, 4]);
      }
      if (route === 'detail/zucca') {
        await expect(page.locator('.detail-content h1')).toHaveCSS('font-size', '22px');
        await expect(page.locator('.detail-content h1')).toHaveCSS('line-height', '28.6px');
        await expect(page.locator('.detail-content .ai-content').first()).toHaveCSS('line-height', '23.2px');
      }
      if (route === 'order') {
        const text = await page.locator('.order-italian').boundingBox();
        const actions = await page.locator('.order-actions').boundingBox();
        expect(actions!.y).toBeGreaterThanOrEqual(text!.y + text!.height + 15.9);
      }
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

for (const width of [320, 360, 412]) {
  test(`네 수프 상세의 글자 토큰·실제 카드 여백·하단 순서를 ${width}px에서 확인해요`, async ({ page }) => {
    await page.setViewportSize({ width, height: 917 });
    for (const id of ['ceci', 'porri', 'zucca', 'melanzane']) {
      await page.goto(`/#/detail/${id}`);
      await page.evaluate(() => document.fonts.ready);
      const measurements = await page.locator('.detail-content').evaluate(content => {
        const children = [...content.children];
        const cards = [...content.querySelectorAll(':scope > .ai-card,:scope > .card')];
        const tokenStyles = [[11,500,14.3,0],[13,400,18.85,-.13],[14,500,19.6,-.14],[16,500,23.2,-.16],[17,700,23.8,-.17],[22,500,28.6,-.44]];
        const mismatches = [...content.querySelectorAll('*')].filter(el => [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) && !el.closest('.sr-only')).flatMap(el => {
          const s = getComputedStyle(el);
          const values = [parseFloat(s.fontSize), Number(s.fontWeight), parseFloat(s.lineHeight), parseFloat(s.letterSpacing) || 0];
          return tokenStyles.some(token => token.every((v,i) => Math.abs(v-values[i]) < .02)) ? [] : [{text: el.textContent, values}];
        });
        return {
          mismatches,
          cardInsets: cards.map(card => card.firstElementChild!.getBoundingClientRect().left - card.getBoundingClientRect().left),
          sectionGaps: children.slice(1).map((child,i) => child.getBoundingClientRect().top - children[i].getBoundingClientRect().bottom),
          dockPosition: getComputedStyle(document.querySelector('.detail-dock')!).position,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(measurements.mismatches, id).toEqual([]);
      expect(measurements.cardInsets, id).toEqual([24,24,24]);
      expect(measurements.sectionGaps, id).toEqual([24,24,24]);
      expect(measurements.dockPosition).toBe('fixed');
      expect(measurements.overflow).toBe(false);
      const initialDock = await page.locator('.detail-dock').boundingBox();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const scrolledDock = await page.locator('.detail-dock').boundingBox();
      expect(scrolledDock!.y).toBeCloseTo(initialDock!.y, 1);
      const lastCard = await page.locator('.detail-content > .ai-card').last().boundingBox();
      const bar = await page.locator('.detail-dock .cart-bar').boundingBox();
      expect(lastCard!.y + lastCard!.height).toBeLessThanOrEqual(bar!.y);
      await expect(page.locator('.detail-dock button')).toBeInViewport();
    }
  });
}

test('전체 메뉴를 연속 표시하고 탭 이동·스크롤 선택·상세 복귀를 연결해요', async ({ page }) => {
  await page.goto('/#/menu');
  await expect(page.locator('.menu-card')).toHaveCount(13);
  await expect(page.getByRole('region', { name: '수프 메뉴', exact: true })).toBeAttached();
  await expect(page.getByRole('region', { name: '메인 요리 메뉴', exact: true })).toBeAttached();
  await expect(page.getByRole('region', { name: '주류 메뉴', exact: true })).toBeAttached();
  await page.getByRole('button', { name: '메인 요리 3', exact: true }).click();
  await expect(page.getByRole('button', { name: '메인 요리 3' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.locator('#menu-section-main').evaluate(e => Math.abs(e.getBoundingClientRect().top - 72))).toBeLessThan(2);
  await expect(page.locator('.menu-category-nav')).toBeInViewport();
  await page.getByRole('button', { name: '후추 향의 토스카나 소고기 스튜 상세 보기' }).click();
  await page.getByRole('button', { name: '메뉴 고르기로 돌아가기' }).click();
  await expect.poll(() => page.locator('#menu-section-main').evaluate(e => Math.abs(e.getBoundingClientRect().top - 72))).toBeLessThan(2);
  await page.locator('#menu-section-wine').evaluate(e => window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 72));
  await expect(page.getByRole('button', { name: '주류 6' })).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByRole('button', { name: '수프 4' })).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '주류 6' }).click();
  await expect.poll(() => page.locator('#menu-section-wine').evaluate(e => Math.abs(e.getBoundingClientRect().top - 72))).toBeLessThan(2);
});
