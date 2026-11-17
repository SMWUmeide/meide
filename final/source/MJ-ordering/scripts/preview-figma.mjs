/* global document, innerWidth */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const directory = 'outputs/figma-review';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 412, height: 917 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
for (const route of ['menu', 'detail/zucca', 'cart', 'order', 'receipt']) {
  await page.goto(`http://127.0.0.1:5173/#/${route}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${directory}/${route.replace('/', '-')}.png`, fullPage: true });
  console.log(route, await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.getAttribute('src')),
    assets: [...document.images].map(image => ({ src: image.getAttribute('src'), width: image.width, height: image.height })),
  })));
}
console.log({ errors });
await browser.close();
