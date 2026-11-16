/* global document */
import { URL } from "node:url";
// Explicit live check: no route interception, mocked providers, or bundled menu.
import { chromium } from '@playwright/test';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const photoPath = process.argv[2];
if (!photoPath) throw new Error('사용법: npm run check:live -- /절대/경로/메뉴판.jpg');
await access(photoPath);
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const report = { input: resolve(photoPath), requests: [], errors: [], board: null, photoResults: [], status: [], receipt: '', restored: false };
try {
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  const pending = [];
  page.on('response', response => {
    if (!response.url().includes('/api/')) return;
    pending.push((async () => {
      const endpoint = new URL(response.url()).pathname;
      report.requests.push({ endpoint, status: response.status() });
      const data = await response.json();
      if (endpoint.endsWith('/analyze-menu')) report.board = data.board;
      if (endpoint.endsWith('/menu-photos')) report.photoResults.push(...(data.photos ?? []));
      console.log(endpoint, response.status(), data.photos?.map(photo => ({ id: photo.id, status: photo.status })) ?? { items: data.board?.items.length });
    })());
  });
  await page.goto(process.env.MEIDE_TEST_URL || 'http://127.0.0.1:5173');
  await page.locator('input[type=file]').setInputFiles(photoPath);
  await page.getByRole('button', { name: '메뉴판 분석하기', exact: true }).click();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find(button => button.textContent === '메뉴판 분석하기');
    return button && !button.disabled;
  }, {}, { timeout: 400000 });
  await Promise.all(pending);
  report.status = await page.getByRole('status').allTextContents();
  assert.equal(report.board?.source, 'gemini', '실제 분석 응답이 필요해요');
  assert.ok(report.board.items.length);
  await page.getByRole('button', { name: '개인 메뉴판 열기', exact: true }).click();
  const item = report.board.items[0];
  await page.getByRole('button', { name: `${item.name} 상세 보기`, exact: true }).click();
  await page.getByRole('button', { name: `장바구니에 담기 · EUR ${item.priceEur.toFixed(2)}`, exact: true }).click();
  await page.getByRole('button', { name: `장바구니 보기 · EUR ${item.priceEur.toFixed(2)}`, exact: true }).click();
  await page.getByRole('button', { name: '주문 문장 만들기', exact: true }).click();
  assert.ok((await page.locator('.order-italian').innerText()).toLowerCase().includes(item.originalName.toLowerCase()));
  await page.getByLabel('요청사항', { exact: true }).fill('양파를 따로 작은 접시에 담아 주세요');
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(button => button.textContent === '영수증 보기')?.disabled, {}, { timeout: 90000 });
  await page.getByRole('button', { name: '영수증 보기', exact: true }).click();
  report.receipt = await page.locator('.receipt-total').innerText();
  assert.ok(report.receipt.includes(item.priceEur.toFixed(2)));
  await page.reload();
  assert.ok((await page.locator('.receipt-total').innerText()).includes(item.priceEur.toFixed(2)));
  report.restored = true;
  assert.deepEqual(report.errors, []);
  await Promise.all(pending);
  console.log(JSON.stringify({ menus: report.board.items.map(item => ({ name: item.originalName, price: item.priceEur })), status: report.status, receipt: report.receipt, restored: report.restored }, null, 2));
  if (report.photoResults.some(photo => ['failed', 'limited'].includes(photo.status))) process.exitCode = 1;
} finally {
  await mkdir('outputs', { recursive: true });
  await writeFile('outputs/live-api-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
