/** Server-only dispatcher. Imported by the Worker, never by a client component. */
import { z } from "zod";
import type { Account, CartSession, MenuBoard, User } from "../model";
import {
  fixtureAccount,
  fixtureBoard,
  fixtureCart,
  fixtureRanking,
} from "../fixtures";
import { createLocalId } from "../id";
import { ServiceError, ServiceStore, type ServiceEnv } from "./store";
import {
  analyzeMenu,
  translateRequest,
  translateTalk,
  DEFAULT_GEMINI_MODEL,
} from "./gemini";
import * as external from "./external";
const boardMemory = new Map<string, MenuBoard>();
const writes = new Map<string, Promise<unknown>>();
export async function currentUser(
  userId: string,
  env: ServiceEnv,
): Promise<User> {
  return (await loadAccount(userId, env)).user;
}
export async function loadAccount(
  userId: string,
  env: ServiceEnv,
): Promise<Account> {
  const store = new ServiceStore(env);
  const saved = await store.get<Account>("account:" + userId);
  if (saved) return saved;
  const account = fixtureAccount();
  account.user.id = userId;
  account.records = account.records.map((r) => ({
    ...r,
    lines: r.lines.map((l) => ({
      ...l,
      ownerUserId: l.ownerUserId === "demo-me" ? userId : l.ownerUserId,
    })),
  }));
  await store.put("account:" + userId, account, 365 * 86400000);
  return account;
}
export async function saveAccount(
  value: Account,
  userId: string,
  env: ServiceEnv,
) {
  if (value.user.id !== userId)
    throw new ServiceError("FORBIDDEN", "다른 계정을 바꿀 수 없어요.", 403);
  z.object({
    user: z.object({
      id: z.string(),
      name: z.string().trim().min(1).max(10),
      taste: z.object({
        allergens: z.array(z.number().int().min(1).max(14)).max(14),
        dislikes: z.array(z.string().max(80)).max(50),
        likes: z.array(z.string().max(80)).max(50),
      }),
    }),
    friends: z
      .array(
        z.object({
          id: z.string().max(100),
          name: z.string().min(1).max(10),
          travelingWith: z.boolean(),
          taste: z.object({
            allergens: z.array(z.number().int().min(1).max(14)),
            dislikes: z.array(z.string().max(80)),
            likes: z.array(z.string().max(80)),
          }),
        }),
      )
      .max(100),
    records: z
      .array(
        z.object({
          id: z.string(),
          orderedAt: z.string().datetime({ offset: true }),
          menuBoardId: z.string(),
          lines: z.array(
            z.object({
              itemId: z.string(),
              ownerUserId: z.string(),
              quantity: z.number().int().positive().max(99),
            }),
          ),
        }),
      )
      .max(1000),
    ratings: z
      .array(
        z.object({
          itemId: z.string(),
          mealRecordId: z.string(),
          value: z.enum(["again", "once", "notForMe"]),
          at: z.string().datetime({ offset: true }),
        }),
      )
      .max(10000),
  }).parse(value);
  await new ServiceStore(env).put("account:" + userId, value, 365 * 86400000);
  return value;
}
export async function saveMenuBoard(
  board: MenuBoard,
  userId: string,
  env: ServiceEnv,
) {
  const store = new ServiceStore(env);
  await store.put("board:" + board.id, board, 365 * 86400000);
  boardMemory.set(board.id, board);
  const account = await loadAccount(userId, env);
  account.boards = [
    board,
    ...account.boards.filter((b) => b.id !== board.id),
  ].slice(0, 100);
  account.recentMenuBoardId = board.id;
  await store.put("account:" + userId, account, 365 * 86400000);
  return board;
}
export async function cartSession(
  id: string,
  userId: string,
  env: ServiceEnv,
): Promise<CartSession> {
  const store = new ServiceStore(env);
  const saved = await store.get<CartSession>("cart:" + id);
  if (saved) {
    if (!saved.members.some((m) => m.userId === userId))
      throw new ServiceError(
        "FORBIDDEN",
        "이 장바구니의 초대 링크로 연결해 주세요.",
        403,
      );
    return saved;
  }
  const account = await loadAccount(userId, env);
  const cart = structuredClone(fixtureCart);
  cart.id = id || createLocalId();
  cart.menuBoardId = account.recentMenuBoardId ?? fixtureBoard.id;
  cart.members[0] = { ...cart.members[0], userId, name: account.user.name };
  await store.put("cart:" + cart.id, cart, 30 * 86400000);
  return cart;
}
export async function updateCart(
  next: CartSession,
  userId: string,
  env: ServiceEnv,
) {
  z.object({
    id: z.string().min(1).max(100),
    version: z.number().int().min(0),
    request: z.string().max(1000),
    tipPercent: z.number().min(0).max(30).optional(),
    lines: z
      .array(
        z.object({
          itemId: z.string().max(100),
          ownerUserId: z.string().max(100),
          quantity: z.number().int().positive().max(99),
        }),
      )
      .max(100),
  }).parse(next);
  const job = (writes.get(next.id) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const previous = await cartSession(next.id, userId, env);
      if (next.version !== previous.version)
        throw new ServiceError(
          "CONFLICT",
          "장바구니가 바뀌었어요. 다시 불러왔습니다.",
          409,
        );
      const peers = (lines: CartSession["lines"]) =>
        JSON.stringify(lines.filter((l) => l.ownerUserId !== userId));
      if (peers(next.lines) !== peers(previous.lines))
        throw new ServiceError(
          "FORBIDDEN",
          "수량은 담은 사람만 바꿀 수 있어요.",
          403,
        );
      const updated = {
        ...previous,
        menuBoardId: next.menuBoardId,
        tipPercent: next.tipPercent,
        request: next.request,
        lines: next.lines,
        version: previous.version + 1,
      };
      await new ServiceStore(env).put(
        "cart:" + next.id,
        updated,
        30 * 86400000,
      );
      return updated;
    });
  writes.set(next.id, job);
  try {
    return (await job) as CartSession;
  } finally {
    if (writes.get(next.id) === job) writes.delete(next.id);
  }
}
export async function koreanRanking(region: string) {
  return fixtureRanking.map((row) => ({
    ...row,
    region: row.region || region,
  }));
}
export async function koreanRating(
  restaurantId: string,
  env: ServiceEnv,
  userId: string,
) {
  return (
    (await loadAccount(userId, env)).restaurants.find(
      (r) => r.id === restaurantId,
    )?.koreanRating ?? null
  );
}
const location = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export async function handleYjRequest(
  request: Request,
  env: ServiceEnv & { ASSETS?: { fetch(request: Request): Promise<Response> } },
) {
  const url = new URL(request.url);
  const action = url.pathname.slice("/api/yj/".length);
  if (request.method !== "POST")
    return Response.json(
      { error: "POST만 사용할 수 있어요." },
      { status: 405 },
    );
  const origin = request.headers.get("origin");
  const publicHost = request.headers.get("host");
  const sameHost = origin && new URL(origin).host === publicHost;
  if (origin && origin !== url.origin && !sameHost)
    return Response.json(
      { error: "다른 출처의 요청을 허용하지 않아요." },
      { status: 403 },
    );
  const cookie = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)yj_session=([a-f0-9-]{36})(?:;|$)/)?.[1];
  const userId = cookie ?? createLocalId();
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (!cookie)
    headers.set(
      "Set-Cookie",
      `yj_session=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol === "https:" ? "; Secure" : ""}`,
    );
  try {
    const bodyText = await request.text();
    if (bodyText.length > 16000000)
      throw new ServiceError("TOO_LARGE", "사진 수나 크기를 줄여 주세요.", 413);
    const body = JSON.parse(bodyText || "{}");
    if (action === "analyzeMenu") {
      const encoder = new TextEncoder();
      const abort = new AbortController();
      const stream = new ReadableStream({
        start(controller) {
          let closed = false;
          const emit = (event: unknown) => {
            if (!closed)
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          };
          void analyzeMenu(
            body,
            userId,
            env,
            (phase) => emit({ phase }),
            fetch,
            abort.signal,
          )
            .then(async (board) => {
              await saveMenuBoard(board, userId, env);
              emit({ board, mode: env.GEMINI_API_KEY ? "gemini" : "mock" });
            })
            .catch((e) =>
              emit({
                error:
                  e instanceof ServiceError
                    ? e.message
                    : "메뉴판 결과를 확인하지 못했어요. 사진을 보관했으니 다시 시도해 주세요.",
                code: e instanceof ServiceError ? e.code : "INVALID_OUTPUT",
              }),
            )
            .finally(() => {
              if (!abort.signal.aborted) {
                closed = true;
                controller.close();
              }
            });
        },
        cancel() {
          abort.abort();
        },
      });
      headers.set("Content-Type", "application/x-ndjson");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(stream, { headers });
    }
    let result: unknown;
    switch (action) {
      case "bootstrap":
        result = {
          account: await loadAccount(userId, env),
          cart: await cartSession("personal-" + userId, userId, env),
          capabilities: {
            analysis: env.GEMINI_API_KEY ? "gemini" : "mock",
            model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
          },
        };
        break;
      case "currentUser":
        result = await currentUser(userId, env);
        break;
      case "saveAccount":
        result = await saveAccount(body.account, userId, env);
        break;
      case "eraseData": {
        const a = await loadAccount(userId, env);
        a.records = [];
        a.ratings = [];
        a.friends = [];
        a.boards = [];
        a.recentMenuBoardId = undefined;
        a.user.taste = { allergens: [], dislikes: [], likes: [] };
        result = await saveAccount(a, userId, env);
        break;
      }
      case "saveMenuBoard":
        result = await saveMenuBoard(body.board, userId, env);
        break;
      case "cartSession":
        result = await cartSession(
          z.string().max(100).parse(body.id),
          userId,
          env,
        );
        break;
      case "updateCart":
        result = await updateCart(body.cart, userId, env);
        break;
      case "findRestaurantOnMenu":
        result = await external.findRestaurantOnMenu(
          z.string().max(160).parse(body.name),
          location.parse(body.location),
          env,
        );
        break;
      case "nearbyRestaurants":
        result = await external.nearbyRestaurants(
          location.parse(body.location),
          z.number().min(100).max(5000).parse(body.radius),
          z
            .enum([
              "국물 요리",
              "밥·죽",
              "면 요리",
              "고기 구이",
              "해산물",
              "빵·피자",
            ])
            .optional()
            .parse(body.category),
          env,
        );
        break;
      case "menuImage":
        result =
          (await external.menuImage(
            z.string().max(200).parse(body.original),
            z.string().max(200).parse(body.korean),
            env,
          )) ?? null;
        break;
      case "exchangeRate":
        result = await external.exchangeRate(
          z.string().parse(body.base),
          z.string().parse(body.quote),
          env,
        );
        break;
      case "searchDestinations":
        result = await external.searchDestinations(
          z.string().max(100).parse(body.query),
          env,
          url.origin,
        );
        break;
      case "translateRequest":
        result = await translateRequest(
          z.string().max(1000).parse(body.korean),
          z
            .string()
            .regex(/^[a-zA-Z-]{2,12}$/)
            .parse(body.language),
          env,
        );
        break;
      case "translateTalk":
        result = await translateTalk(
          z.string().max(1000).parse(body.text),
          z
            .string()
            .regex(/^[a-zA-Z-]{2,12}$/)
            .parse(body.from),
          z
            .string()
            .regex(/^[a-zA-Z-]{2,12}$/)
            .parse(body.to),
          env,
        );
        break;
      case "koreanRanking":
        result = await koreanRanking(z.string().max(100).parse(body.region));
        break;
      case "koreanRating":
        result = await koreanRating(
          z.string().parse(body.restaurantId),
          env,
          userId,
        );
        break;
      default:
        throw new ServiceError("NOT_FOUND", "서비스를 찾을 수 없어요.", 404);
    }
    return Response.json(result, { headers });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof ServiceError
            ? e.message
            : e instanceof z.ZodError
              ? "입력 형식을 확인해 주세요."
              : "서비스에 연결하지 못했어요.",
        code: e instanceof ServiceError ? e.code : "INVALID_INPUT",
      },
      { status: e instanceof ServiceError ? e.status : 400, headers },
    );
  }
}
