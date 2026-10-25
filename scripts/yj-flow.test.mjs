import test from "node:test";
import assert from "node:assert/strict";
import { modules } from "./yj-test-module.mjs";
import { getSvgPath } from "figma-squircle";
const m = await modules();
const {
  fixtureBoard: board,
  fixtureAccount,
  totals,
  updateQuantity,
  orderSentences,
  homePeriod,
  CameraController,
  captureDimensions,
  validateAnalysis,
  analysisPrivacy,
  analyzeMenu,
  ServiceStore,
  ServiceError,
  createLocalId,
  screenCatalog,
  fixtureScreen,
  isFlowPath,
} = m;
const account = fixtureAccount(),
  lines = account.records[0].lines;
const input = (data = "YWJj") => ({
  photos: [{ id: "photo1", localKey: "photo1", data, mimeType: "image/jpeg" }],
  taste: [{ allergens: [1, 7] }],
});
const output = () => ({
  language: "it",
  currency: "EUR",
  restaurantNameOnMenu: "Osteria",
  coperto: board.coperto,
  photos: [{ index: 0, readable: "ok" }],
  sections: board.sections.map(({ id, original, korean }) => ({
    id,
    original,
    korean,
  })),
  items: board.items.map(
    ({
      sectionId,
      original,
      korean,
      price,
      confirmed,
      ai,
      readConfidence,
    }) => ({
      sectionId,
      original,
      korean,
      price,
      confirmed,
      ai,
      readConfidence,
      photoIndex: 0,
    }),
  ),
});
const reply = (value) =>
  Response.json({
    candidates: [
      {
        content: {
          parts: [
            { text: typeof value === "string" ? value : JSON.stringify(value) },
          ],
        },
      },
    ],
  });
test("canonical money, owner IDs and coperto give exact integer totals", () => {
  assert.deepEqual(totals(lines, 10, board.items, board.coperto, 2), {
    food: { amount: 3800, currency: "EUR" },
    tip: { amount: 380, currency: "EUR" },
    cart: { amount: 4180, currency: "EUR" },
    receipt: { amount: 4680, currency: "EUR" },
    count: 3,
  });
  assert.ok(lines.every((l) => l.itemId && l.ownerUserId && !("owner" in l)));
  assert.ok(
    board.items.every(
      (i) =>
        Number.isInteger(i.price.amount) &&
        i.confirmed &&
        i.ai &&
        !("allergy" in i),
    ),
  );
});
test("only my quantity changes and requests use adapter output", () => {
  const all = [
    ...lines,
    { itemId: "zucca", ownerUserId: account.user.id, quantity: 1 },
  ];
  const next = updateQuantity(all, "zucca", -1, account.user.id);
  assert.deepEqual(next, lines);
  const s = orderSentences(all, "치즈 빼고 주세요", board.items, {
    local: "Senza formaggio, per favore.",
    ok: true,
  });
  assert.match(s.local, /2 porzioni di ZUPPA DI ZUCCA/);
  assert.match(s.local, /Senza formaggio/);
  assert.equal(s.requestTranslated, true);
  assert.equal(
    orderSentences(lines, "요청", board.items).requestTranslated,
    false,
  );
});
test("every published route and fixture resolves only within its path", () => {
  for (const [id, , path] of screenCatalog) {
    const url = new URL(path, "http://localhost");
    const snapshot = {
      photos: [],
      lines: url.searchParams.get("fixture") === "shared" ? lines : [],
    };
    assert.ok(isFlowPath(url.pathname));
    assert.equal(
      fixtureScreen(url.pathname, url.searchParams, snapshot),
      id,
      path,
    );
  }
  assert.equal(isFlowPath("/settings"), false);
  assert.equal(
    fixtureScreen("/talk", new URLSearchParams("fixture=46"), {
      photos: [],
      lines: [],
    }),
    "16",
  );
});
test("home uses destination timezone", () => {
  const d = new Date("2026-10-25T10:00:00Z");
  assert.equal(homePeriod(d, "Europe/Rome"), "late-morning");
  assert.equal(homePeriod(d, "Asia/Seoul"), "evening");
});
test("squircle smoothing is the shared 0.8 path and local UUID works over HTTP", () => {
  const p = getSvgPath({
    width: 350,
    height: 60,
    cornerRadius: 22,
    cornerSmoothing: 0.8,
  });
  assert.match(p, /c/i);
  assert.notEqual(
    p,
    getSvgPath({
      width: 350,
      height: 60,
      cornerRadius: 22,
      cornerSmoothing: 0,
    }),
  );
  const id = createLocalId({
    getRandomValues: (a) => {
      a.set(Array.from({ length: 16 }, (_, i) => i));
      return a;
    },
  });
  assert.equal(id, "00010203-0405-4607-8809-0a0b0c0d0e0f");
});
test("photo resize caps long side and rejects unready camera", () => {
  assert.deepEqual(captureDimensions(4032, 3024), {
    width: 1600,
    height: 1200,
  });
  assert.deepEqual(captureDimensions(300, 600), { width: 300, height: 600 });
  assert.throws(() => captureDimensions(0, 0));
});
function cameraStream() {
  let stopped = 0;
  const constraints = [];
  const track = {
    stop: () => stopped++,
    getCapabilities: () => ({ torch: true }),
    applyConstraints: async (c) => {
      constraints.push(c);
    },
  };
  return {
    stream: { getTracks: () => [track], getVideoTracks: () => [track] },
    constraints,
    get stopped() {
      return stopped;
    },
  };
}
test("camera environment constraint, torch and teardown", async () => {
  const fake = cameraStream();
  let requested;
  const c = new CameraController(async (q) => {
    requested = q;
    return fake.stream;
  });
  const video = { play: async () => {} };
  assert.equal(await c.start(video), true);
  assert.equal(requested.video.facingMode.ideal, "environment");
  assert.equal(video.muted, true);
  assert.equal(video.playsInline, true);
  assert.equal(c.torchAvailable(), true);
  await c.torch(true);
  assert.equal(fake.constraints[0].advanced[0].torch, true);
  c.stop();
  assert.equal(fake.stopped, 1);
  assert.equal(c.stream, null);
});
test("late permission response after route leave stops every new track", async () => {
  const fake = cameraStream();
  let resolve;
  const c = new CameraController(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const request = c.start({ play: async () => {} });
  c.stop();
  resolve(fake.stream);
  assert.equal(await request, false);
  assert.equal(fake.stopped, 1);
  assert.equal(c.stream, null);
});
test("schema rejects decimal money, wrong photo/section/currency and confidence", () => {
  assert.equal(validateAnalysis(output(), 1).success, true);
  for (const mutate of [
    (o) => (o.items[0].price.amount = 10.5),
    (o) => (o.items[0].sectionId = "unknown"),
    (o) => (o.items[0].photoIndex = 4),
    (o) => (o.items[0].price.currency = "USD"),
    (o) => (o.photos[0].readable = "blurry"),
    (o) => o.photos.push({ index: 0, readable: "ok" }),
  ]) {
    const o = structuredClone(output());
    mutate(o);
    assert.equal(validateAnalysis(o, 1).success, false);
  }
});
test("analysis sends only photos and EU codes, never user names or tastes", async () => {
  let body;
  const phases = [];
  const b = await analyzeMenu(
    input("cHJpdmFjeQ=="),
    "privacy-user",
    { GEMINI_API_KEY: "test-key" },
    (p) => phases.push(p),
    async (_url, init) => {
      body = JSON.parse(init.body);
      assert.equal(init.headers["x-goog-api-key"], "test-key");
      return reply(output());
    },
  );
  assert.equal(b.status, "done");
  assert.deepEqual(phases, ["analyzing", "organizing"]);
  assert.deepEqual(
    analysisPrivacy([{ allergens: [7], likes: ["name"], dislikes: ["PII"] }]),
    [{ allergens: [7] }],
  );
  const sent = JSON.stringify(body.contents);
  assert.doesNotMatch(sent, /privacy-user|likes|dislikes|PII/);
  assert.ok(body.generationConfig.responseJsonSchema);
});
test("invalid output retries exactly once and partial confidence stays low", async () => {
  let calls = 0;
  const b = await analyzeMenu(
    input("cmV0cnk="),
    "retry-user",
    { GEMINI_API_KEY: "test" },
    () => {},
    async () => {
      calls++;
      return reply(calls === 1 ? "{broken" : output());
    },
  );
  assert.equal(calls, 2);
  assert.equal(b.status, "done");
  let badCalls = 0;
  await assert.rejects(
    analyzeMenu(
      input("ZmFpbA=="),
      "bad-user",
      { GEMINI_API_KEY: "test" },
      () => {},
      async () => {
        badCalls++;
        return reply({ bad: true });
      },
    ),
    (e) => e.code === "INVALID_OUTPUT",
  );
  assert.equal(badCalls, 2);
  const partial = output();
  partial.photos[0].readable = "blurry";
  partial.items.forEach((i) => (i.readConfidence = "low"));
  assert.equal(
    (
      await analyzeMenu(
        input("bG93"),
        "low-user",
        { GEMINI_API_KEY: "test" },
        () => {},
        async () => reply(partial),
      )
    ).status,
    "partial",
  );
});
test("photo hash cache precedes quota; new photo exceeds daily quota", async () => {
  let calls = 0;
  const env = { GEMINI_API_KEY: "test", GEMINI_DAILY_LIMIT: "1" };
  const fake = async () => {
    calls++;
    return reply(output());
  };
  await analyzeMenu(input("Y2FjaGU="), "quota-user", env, () => {}, fake);
  await analyzeMenu(input("Y2FjaGU="), "quota-user", env, () => {}, fake);
  assert.equal(calls, 1);
  await assert.rejects(
    analyzeMenu(input("bmV3"), "quota-user", env, () => {}, fake),
    (e) => e.code === "RATE_LIMIT" && e.status === 429,
  );
  assert.equal(calls, 1);
});
test("provider 429 and network failure preserve typed errors without retries", async () => {
  for (const [code, fetcher] of [
    ["RATE_LIMIT", async () => new Response("", { status: 429 })],
    [
      "NETWORK",
      async () => {
        throw Error("offline");
      },
    ],
  ]) {
    let calls = 0;
    await assert.rejects(
      analyzeMenu(
        input(btoa(code)),
        "user-" + code,
        { GEMINI_API_KEY: "test" },
        () => {},
        async (...args) => {
          calls++;
          return fetcher(...args);
        },
      ),
      (e) => e instanceof ServiceError && e.code === code,
    );
    assert.equal(calls, 1);
  }
});
test("daily quota resets, cache expiry expires and keyless mode is canonical", async () => {
  let now = Date.parse("2026-10-25T00:00Z");
  const s = new ServiceStore({}, () => now);
  await s.put("expiry-test", { ok: 1 }, 100);
  assert.deepEqual(await s.get("expiry-test"), { ok: 1 });
  assert.equal(await s.consume("day-user", 1), true);
  assert.equal(await s.consume("day-user", 1), false);
  now += 86400000;
  assert.equal(await s.get("expiry-test"), undefined);
  assert.equal(await s.consume("day-user", 1), true);
  const result = await analyzeMenu(
    input(),
    "keyless",
    {},
    () => {},
    async () => {
      throw Error("must not call");
    },
  );
  assert.equal(result.status, "done");
  assert.equal(result.photos[0].localKey, "photo1");
  assert.ok(result.items[0].price.currency);
});
test("display projection round trips canonical IDs, allergen codes and all rating enums", () => {
  const a = fixtureAccount();
  const previous = structuredClone(m.view.state.account);
  m.view.state.account = a;
  const ui = m.view.projectAccount(a);
  for (const index of [0, 1, 2]) {
    const item = a.boards[0].items[index];
    ui.records[0].ratings[item.id] = [
      "또 먹고 싶어요",
      "한 번이면 충분해요",
      "입맛에 안 맞았어요",
    ][index];
  }
  const result = m.view.canonicalAccount(ui);
  assert.deepEqual(
    result.friends[0].taste.allergens,
    a.friends[0].taste.allergens,
  );
  assert.equal(result.friends[0].travelingWith, a.friends[0].travelingWith);
  assert.ok(result.ratings.some((r) => r.value === "notForMe"));
  assert.ok(result.friends.every((f) => !("kind" in f) && !("allergies" in f)));
  assert.ok(
    result.records.every(
      (r) => !("restaurant" in r) && !("ratings" in r) && r.menuBoardId,
    ),
  );
  const peers = [
    { itemId: "zucca", ownerUserId: "peer-1", quantity: 1 },
    { itemId: "zucca", ownerUserId: "peer-2", quantity: 2 },
  ];
  assert.deepEqual(m.view.canonicalLines(m.view.displayLines(peers)), peers);
  m.view.state.account = previous;
});
test("OSM preserves real IDs and raw hours; cache avoids requests and overload falls back to bounded Nominatim", async () => {
  let calls = 0;
  const times = [];
  const fetcher = async (url, init) => {
    calls++;
    times.push(Date.now());
    assert.match(init.headers["User-Agent"], /MEIDE-YJ/);
    if (String(url).includes("overpass"))
      return Response.json({
        elements: [
          {
            id: 42,
            type: "node",
            lat: 42.0001,
            lon: 12,
            tags: {
              name: "Zuppa",
              cuisine: "soup",
              opening_hours: "Mo-Su 12:00-22:00",
            },
          },
        ],
      });
    throw Error("unexpected");
  };
  const first = await m.external.nearbyRestaurants(
    { lat: 42, lng: 12 },
    500,
    undefined,
    {},
    fetcher,
  );
  assert.equal(first[0].id, "osm:node/42");
  assert.equal(first[0].openingHours, "Mo-Su 12:00-22:00");
  assert.equal(first[0].walk, undefined);
  await m.external.nearbyRestaurants(
    { lat: 42, lng: 12 },
    500,
    undefined,
    {},
    fetcher,
  );
  assert.equal(calls, 1);
  const fallback = await m.external.nearbyRestaurants(
    { lat: 43.8, lng: 14 },
    500,
    undefined,
    {},
    async (url, init) => {
      times.push(Date.now());
      assert.match(init.headers["User-Agent"], /MEIDE/);
      if (String(url).includes("overpass"))
        return new Response("", { status: 503 });
      assert.equal(new URL(url).searchParams.get("bounded"), "1");
      return Response.json([
        {
          osm_type: "way",
          osm_id: 123,
          lat: "43.8001",
          lon: "14",
          name: "Real restaurant",
          display_name: "Real restaurant, Street",
          extratags: null,
        },
      ]);
    },
  );
  assert.equal(fallback[0].id, "osm:way/123");
  for (let i = 1; i < times.length; i++)
    assert.ok(times[i] - times[i - 1] >= 1000);
});
test("exchange rate is dated and cached once per UTC day", async () => {
  let calls = 0;
  const fake = async () => {
    calls++;
    return Response.json({ rate: 1900, date: "2026-10-23" });
  };
  const first = await m.external.exchangeRate("GBP", "KRW", {}, fake);
  assert.deepEqual(first, {
    base: "GBP",
    quote: "KRW",
    rate: 1900,
    date: "2026-10-23",
  });
  assert.deepEqual(
    await m.external.exchangeRate("GBP", "KRW", {}, fake),
    first,
  );
  assert.equal(calls, 1);
});
