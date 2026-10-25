"use client";
/** Compatibility at the presentation boundary only: no formatted UI value is sent to the server. */
import * as api from "./client";
import {
  state,
  refreshViews,
  projectAccount,
  canonicalAccount,
  canonicalLines,
  displayLines,
  type Account,
  type Draft,
} from "../view-model";
import { readBoard, saveBoard, savePhoto, photoSources } from "../storage";
import type { MenuBoard } from "../model";
export async function restoreDisplay() {
  const boot = await api.bootstrap();
  state.account = boot.account;
  state.cart = boot.cart;
  const local = api.fixtureMode() ? undefined : await readBoard();
  state.board =
    local ??
    boot.account.boards.find((b) => b.id === boot.cart.menuBoardId) ??
    state.board;
  refreshViews();
  const sources = await photoSources(state.board.photos);
  return {
    account: projectAccount(state.account),
    draft: {
      photos: (local?.photos ?? []).map((p) => ({
        id: p.id,
        src: sources[p.localKey],
        readable: p.readable === "ok",
      })),
      lines: displayLines(state.cart.lines),
      tip: !!state.cart.tipPercent,
      restaurant:
        state.account.restaurants.find((r) => r.id === state.board.restaurantId)
          ?.name ?? null,
      partial: state.board.status === "partial",
      analyzed: !!state.board.items.length,
      request: state.cart.request,
      answers: {},
      ordered: false,
    } as Draft,
    capabilities: boot.capabilities,
  };
}
let draftWrites: Promise<unknown> = Promise.resolve();
export function storeDraft(draft: Draft) {
  const job = draftWrites.catch(() => {}).then(() => writeDraft(draft));
  draftWrites = job;
  return job;
}
async function writeDraft(draft: Draft) {
  if (api.fixtureMode()) return;
  const photos = await Promise.all(
    draft.photos.map(async (p) => {
      const previous = state.board.photos.find((x) => x.id === p.id);
      const localKey = previous?.localKey ?? p.id;
      if (p.src) await savePhoto(localKey, p.src);
      return {
        id: p.id,
        localKey,
        readable: p.readable ? ("ok" as const) : ("blurry" as const),
        itemIds: previous?.itemIds ?? [],
      };
    }),
  );
  const demoOnly =
    !draft.photos.length &&
    state.board.photos.some((p) => p.localKey.startsWith("fixture:"));
  if (!demoOnly) {
    state.board = {
      ...state.board,
      photos,
      status: draft.partial ? "partial" : draft.analyzed ? "done" : "analyzing",
      restaurantId: state.account.restaurants.find(
        (r) => r.name === draft.restaurant,
      )?.id,
    };
    await saveBoard(state.board);
  }
  const next = {
    ...state.cart,
    menuBoardId: state.board.id,
    lines: canonicalLines(draft.lines),
    request: draft.request,
    tipPercent: draft.tip ? 10 : 0,
  };
  try {
    state.cart = await api.updateCart(next);
  } catch (e) {
    if (e instanceof api.ClientServiceError && e.code === "CONFLICT") {
      state.cart = await api.cartSession(next.id);
      throw e;
    }
    throw e;
  }
}
export async function storeAccount(account: Account) {
  const next = canonicalAccount(account);
  next.boards = [
    state.board,
    ...next.boards.filter((b) => b.id !== state.board.id),
  ];
  state.account = await api.saveAccount(next);
  refreshViews();
}
export function applyBoard(board: MenuBoard) {
  state.board = board;
  state.account.boards = [
    board,
    ...state.account.boards.filter((b) => b.id !== board.id),
  ];
  state.account.recentMenuBoardId = board.id;
  refreshViews();
}
export { api };
