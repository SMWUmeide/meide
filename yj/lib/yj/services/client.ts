"use client";
import type {
  Account,
  CartSession,
  ExchangeRate,
  KoreanCategory,
  KoreanRanking,
  KoreanRating,
  Location,
  MenuBoard,
  MenuImage,
  MenuPhoto,
  Taste,
  Trip,
  User,
} from "../model";
import {
  fixtureAccount,
  fixtureBoard,
  fixtureCart,
  fixtureRanking,
  fixtureRate,
  fixtureRestaurants,
  fixtureTrips,
} from "../fixtures";
import { readPhoto } from "../storage";
export const seedState = () => ({
  account: fixtureAccount(),
  board: structuredClone(fixtureBoard),
  cart: structuredClone(fixtureCart),
  rate: { ...fixtureRate },
});
export function fixtureMode() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("fixture")
  );
}
export class ClientServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
async function rpc<T>(
  action: string,
  body: unknown = {},
  signal?: AbortSignal,
): Promise<T> {
  let r: Response;
  try {
    r = await fetch("/api/yj/" + action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ClientServiceError(
      "NETWORK",
      "연결이 불안정해요. 다시 시도해 주세요.",
    );
  }
  const result = (await r.json()) as { code?: string; error?: string };
  if (!r.ok)
    throw new ClientServiceError(
      result.code ?? "UPSTREAM",
      result.error ?? "서비스에 연결하지 못했어요.",
    );
  return result as T;
}
export async function bootstrap() {
  if (fixtureMode())
    return {
      ...seedState(),
      capabilities: { analysis: "fixture", model: "fixture" },
    };
  return rpc<{
    account: Account;
    cart: CartSession;
    capabilities: { analysis: string; model: string };
  }>("bootstrap");
}
export const currentUser = () => rpc<User>("currentUser");
export const saveAccount = (account: Account) =>
  fixtureMode()
    ? Promise.resolve(account)
    : rpc<Account>("saveAccount", { account });
export const eraseData = () => {
  if (fixtureMode()) {
    const account = fixtureAccount();
    account.records = [];
    account.ratings = [];
    account.friends = [];
    account.recentMenuBoardId = undefined;
    return Promise.resolve(account);
  }
  return rpc<Account>("eraseData");
};
export const saveMenuBoard = (board: MenuBoard) =>
  fixtureMode()
    ? Promise.resolve(board)
    : rpc<MenuBoard>("saveMenuBoard", { board });
export const cartSession = (id: string) =>
  rpc<CartSession>("cartSession", { id });
export const updateCart = (cart: CartSession) =>
  fixtureMode()
    ? Promise.resolve(cart)
    : rpc<CartSession>("updateCart", { cart });
export async function analyzeMenu(
  photos: MenuPhoto[],
  taste: Taste[],
  onPhase: (phase: "uploading" | "analyzing" | "organizing") => void,
  signal?: AbortSignal,
): Promise<{ board: MenuBoard; mode: string }> {
  onPhase("uploading");
  const data = await Promise.all(
    photos.map(async (p) => {
      const src = await readPhoto(p.localKey);
      if (!src)
        throw new ClientServiceError(
          "NO_PHOTO",
          "사진을 찾지 못했어요. 다시 찍어 주세요.",
        );
      const match = src.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if (!match)
        throw new ClientServiceError("NO_PHOTO", "사진 형식을 확인해 주세요.");
      return {
        id: p.id,
        localKey: p.localKey,
        mimeType: match[1],
        data: match[2],
      };
    }),
  );
  let response: Response;
  try {
    response = await fetch("/api/yj/analyzeMenu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photos: data,
        taste: taste.map((t) => ({ allergens: t.allergens })),
      }),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ClientServiceError(
      "NETWORK",
      "연결이 불안정해요. 사진은 보관했으니 다시 시도해 주세요.",
    );
  }
  if (!response.ok) {
    const error = (await response.json()) as { code?: string; error?: string };
    throw new ClientServiceError(
      error.code ?? "UPSTREAM",
      error.error ?? "메뉴판을 분석하지 못했어요.",
    );
  }
  const reader = response.body?.getReader();
  if (!reader) throw new ClientServiceError("NETWORK", "분석 응답이 없어요.");
  const decoder = new TextDecoder();
  let pending = "",
    result: { board: MenuBoard; mode: string } | undefined;
  function event(line: string) {
    if (!line.trim()) return;
    const data = JSON.parse(line);
    if (data.phase) onPhase(data.phase);
    if (data.error) throw new ClientServiceError(data.code, data.error);
    if (data.board) result = { board: data.board, mode: data.mode };
  }
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      pending += decoder.decode(chunk.value, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) event(line);
    }
    pending += decoder.decode();
    event(pending);
  } catch (e) {
    if (e instanceof ClientServiceError || signal?.aborted) throw e;
    throw new ClientServiceError(
      "NETWORK",
      "분석 중 연결이 끊겼어요. 사진은 그대로 있으니 다시 시도해 주세요.",
    );
  } finally {
    reader.releaseLock();
  }
  if (!result)
    throw new ClientServiceError("INVALID_OUTPUT", "분석 결과가 없어요.");
  return result;
}
export const findRestaurantOnMenu = (name: string, location: Location) =>
  fixtureMode()
    ? Promise.resolve(
        fixtureRestaurants.filter(
          (r) => !name || r.name.toLowerCase().includes(name.toLowerCase()),
        ),
      )
    : rpc<RestaurantResult>("findRestaurantOnMenu", { name, location });
type RestaurantResult = typeof fixtureRestaurants;
export const nearbyRestaurants = (
  location: Location,
  radius: number,
  category?: KoreanCategory,
) =>
  fixtureMode()
    ? Promise.resolve(
        fixtureRestaurants.filter(
          (r) =>
            r.id !== "solita" &&
            r.kind === "local" &&
            (!category || r.category.includes(category)),
        ),
      )
    : rpc<RestaurantResult>("nearbyRestaurants", {
        location,
        radius,
        category,
      });
export const menuImage = (original: string, korean: string) =>
  fixtureMode()
    ? Promise.resolve(undefined)
    : rpc<MenuImage | null>("menuImage", { original, korean }).then(
        (r) => r ?? undefined,
      );
export const exchangeRate = (base: string, quote: string) =>
  fixtureMode()
    ? Promise.resolve(fixtureRate)
    : rpc<ExchangeRate>("exchangeRate", { base, quote });
export const searchDestinations = (query: string) =>
  fixtureMode()
    ? Promise.resolve(
        fixtureTrips.filter((d) =>
          `${d.country} ${d.city} ${d.detail}`.includes(query),
        ),
      )
    : rpc<Trip[]>("searchDestinations", { query });
export async function translateRequest(korean: string, language: string) {
  if (fixtureMode()) {
    const translations: Record<string, string> = {
      "치즈 빼고 주세요": "Senza formaggio, per favore.",
      "우유 빼고 주세요": "Senza latte, per favore.",
      "맵지 않게 해주세요": "Non piccante, per favore.",
      "물 주세요": "Un’acqua, per favore.",
    };
    return {
      local: translations[korean] ?? "",
      ok: !korean.trim() || Boolean(translations[korean]),
    };
  }
  return rpc<{ local: string; ok: boolean }>("translateRequest", {
    korean,
    language,
  });
}
export const translateTalk = (text: string, from: string, to: string) =>
  rpc<{ text: string; ok: boolean }>("translateTalk", { text, from, to });
export const koreanRanking = (region: string) =>
  fixtureMode()
    ? Promise.resolve(fixtureRanking)
    : rpc<KoreanRanking[]>("koreanRanking", { region });
export const koreanRating = (restaurantId: string) =>
  rpc<KoreanRating | null>("koreanRating", { restaurantId });
