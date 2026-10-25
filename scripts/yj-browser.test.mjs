/** Run with PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs and optional CHROME_PATH, YJ_BASE_URL. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { screenCatalog } from "../lib/yj/model.ts";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.YJ_BASE_URL || "http://127.0.0.1:5173";
const out = fileURLToPath(new URL("../docs/yj-screens/", import.meta.url));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const errors = [],
  network = [];
const results = [];
async function open(path, width = 390, height = 844) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "ko-KR",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push({ path, error: e.message }));
  page.on("request", (r) => {
    if (!r.url().startsWith(base) && !r.url().startsWith("data:"))
      network.push(r.url());
  });
  await page.goto(base + path);
  await page.waitForSelector("main[aria-busy=false]");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => i.decode().catch(() => {})),
    );
    await new Promise(requestAnimationFrame);
  });
  await page.waitForTimeout(120);
  return { context, page };
}
const entries = [
  ...screenCatalog.filter(([id]) => id !== "home"),
  ...["morning", "late-morning", "lunch", "evening"].map((period) => [
    "home-" + period,
    "홈 " + period,
    "/?period=" + period,
  ]),
];
try {
  for (const [id, name, path] of entries) {
    const home = id.startsWith("home-");
    const width = home ? 402 : 390,
      height = home ? 874 : 844;
    const { context, page } = await open(path, width, height);
    const actual = await page.locator("main").getAttribute("data-screen");
    assert.equal(actual, home ? "home" : id, `${id}: ${path}`);
    const broken = await page.evaluate(() =>
      [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src),
    );
    assert.deepEqual(broken, [], `${id}: missing assets`);
    const metrics = await page.evaluate(() => {
      const styles = (selector) =>
        Array.from(document.querySelectorAll(selector), (e) => {
          const s = getComputedStyle(e);
          return {
            className: e.className,
            small: e.classList.contains("button--small"),
            flush: e.classList.contains("flush"),
            font: s.fontSize,
            line: s.lineHeight,
            weight: s.fontWeight,
            padding: [
              s.paddingTop,
              s.paddingRight,
              s.paddingBottom,
              s.paddingLeft,
            ],
            height: s.minHeight,
            width: s.width,
            smoothing: e.dataset.smoothing,
          };
        });
      return {
        buttons: styles(".button"),
        chips: styles(".chip,.inline-tag"),
        cards: styles(".card,.surface"),
        sheets: styles(".bottom-sheet"),
        rows: styles(".list-row"),
        cardTitles: styles(".card h2"),
        cardItems: styles(".card h3,.card .row-content strong"),
        cardCaptions: styles(
          ".card .row-content small,.card .menu-card-body>small,.card .cart-item .original,.card .rank-body>small",
        ),
      };
    });
    for (const b of metrics.buttons) {
      assert.equal(
        b.font,
        b.small ? "14px" : "16px",
        `${id} ${b.className}: button font`,
      );
      assert.equal(b.line, "24px", id);
      assert.equal(b.height, b.small ? "48px" : "60px", id);
      assert.deepEqual(
        b.padding,
        b.small
          ? ["12px", "22px", "12px", "22px"]
          : ["16px", "22px", "16px", "22px"],
        `${id} ${b.className}: button padding`,
      );
      assert.equal(b.smoothing, "0.8", id);
    }
    for (const chip of metrics.chips) {
      assert.equal(chip.font, "14px", `${id} ${chip.className}: chip font`);
      assert.equal(chip.line, "18px", id);
      assert.deepEqual(
        chip.padding,
        ["12px", "22px", "12px", "22px"],
        `${id} ${chip.className}: chip padding`,
      );
      assert.equal(chip.smoothing, "0.8", id);
    }
    for (const card of metrics.cards) {
      assert.equal(card.font, "15px", `${id} ${card.className}: card font`);
      assert.equal(card.line, "22px", id);
      assert.deepEqual(
        card.padding,
        Array(4).fill(card.flush ? "0px" : "24px"),
        `${id} ${card.className}: card padding`,
      );
      assert.equal(card.smoothing, "0.8", id);
    }
    for (const sheet of metrics.sheets) {
      assert.deepEqual(
        sheet.padding,
        ["24px", "24px", "24px", "24px"],
        `${id}: sheet padding`,
      );
      assert.equal(sheet.smoothing, "0.8", id);
    }
    for (const row of metrics.rows) {
      assert.equal(row.font, "15px", `${id}: row font`);
      assert.deepEqual(
        row.padding,
        ["16px", "24px", "16px", "24px"],
        `${id}: row padding`,
      );
    }
    for (const title of metrics.cardTitles) {
      assert.equal(title.font, "18px", `${id}: card section title`);
      assert.equal(title.line, "26px", id);
    }
    for (const title of metrics.cardItems) {
      assert.equal(title.font, "15px", `${id}: card item title`);
      assert.equal(title.line, "22px", id);
    }
    for (const caption of metrics.cardCaptions) {
      assert.equal(caption.font, "13px", `${id}: card caption`);
      assert.equal(caption.line, "20px", id);
    }
    const screen = await page.locator("main").boundingBox();
    assert.equal(screen.width, width);
    assert.equal(screen.height, height);
    if (["16", "44", "45"].includes(id)) {
      const mic = await page.locator(".my-mic").boundingBox();
      assert.equal(mic.width, 80);
      assert.equal(mic.height, 80);
      const staff = await page.locator(".staff-half").boundingBox(),
        customer = await page.locator(".customer-half").boundingBox();
      assert.equal(staff.height, height / 2);
      assert.equal(customer.height, height / 2);
      assert.equal(
        await page
          .locator(".staff-half")
          .evaluate((e) => getComputedStyle(e).transform),
        "matrix(-1, 0, 0, -1, 0, 0)",
      );
    }
    if (id === "05-2")
      assert.equal(await page.locator(".map-pin.selected").count(), 1);
    if (home) {
      assert.equal(await page.locator(".home-orb").count(), 0);
      const tab = await page.locator(".tabbar").boundingBox();
      assert.equal(Math.round(tab.y), height - 98);
      assert.equal(await page.locator(".home-shortcut").count(), 2);
    }
    assert.equal(
      await page
        .locator(".squircle-host")
        .evaluateAll((nodes) =>
          nodes.every(
            (e) => e.dataset.smoothing === "0.8" || e.dataset.smoothing === "0",
          ),
        ),
      true,
      `${id}: shape path not measured`,
    );
    await page.screenshot({ path: out + `app-${id}.png` });
    const reference = await sharp(out + `figma-${id}.png`)
      .resize({ width })
      .extend({
        bottom: Math.max(
          0,
          height - (await sharp(out + `figma-${id}.png`).metadata()).height,
        ),
        background: "#f6f6f7",
      })
      .toBuffer();
    const left = await sharp(reference)
      .extract({ left: 0, top: 0, width, height })
      .png()
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${width * 2 + 12}" height="30"><rect width="100%" height="100%" fill="#111"/><text x="12" y="21" font-size="14" fill="white">${id} · Figma Page 2</text><text x="${width + 24}" y="21" font-size="14" fill="white">Implementation · ${width} × ${height}</text></svg>`,
    );
    await sharp({
      create: {
        width: width * 2 + 12,
        height: height + 30,
        channels: 4,
        background: "#dcdcde",
      },
    })
      .composite([
        { input: left, left: 0, top: 30 },
        {
          input: await sharp(out + `app-${id}.png`).toBuffer(),
          left: width + 12,
          top: 30,
        },
        { input: label, left: 0, top: 0 },
      ])
      .png()
      .toFile(out + `compare-${id}.png`);
    if (["04", "06-2", "31", "25", "26"].includes(id)) {
      const scroll = page.locator(".detail-scroll,.screen-content").first();
      await scroll.evaluate((e) => (e.scrollTop = e.scrollHeight));
      await page.screenshot({ path: out + `app-${id}-bottom.png` });
    }
    results.push({ id, name, path, width, height, pass: true });
    console.log("CAPTURE", id);
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(network, [], "UI must not call external APIs");
  await writeFile(
    out + "verification.json",
    JSON.stringify(
      {
        base,
        viewports: "390×844; home 402×874",
        commonMetrics: {
          smoothing: 0.8,
          button: { font: 16, minHeight: 60, padding: [16, 22] },
          smallButton: { font: 14, minHeight: 48, padding: [12, 22] },
          chip: { font: 14, lineHeight: 18, padding: [12, 22] },
          card: { font: 15, lineHeight: 22, padding: 24, flushPadding: 0 },
          sheetPadding: 24,
          rowPadding: [16, 24],
        },
        screens: results,
        errors,
        externalRequests: network,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS ${results.length} screens, no runtime errors or external requests`,
  );
} finally {
  await browser.close();
}
