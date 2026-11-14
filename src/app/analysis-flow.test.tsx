import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { normalizeAnalysis } from "@/data/menu-schema";
import { analysisFixture } from "../../server/analysis-fixture";
beforeEach(() => { window.history.replaceState(null, "", "/"); });
describe("메뉴판부터 영수증까지의 화면 범위", () => {
  it("앞 화면의 분석 결과와 뒤로가기 동작을 받고 새 장바구니로 시작해요", async () => {
    const onBack = vi.fn();
    render(<App initialBoard={normalizeAnalysis(analysisFixture)} onBackToPrevious={onBack} />);
    expect(screen.getByRole('heading', { name: 'Trattoria Test' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '함께 담은 장바구니' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '토마토 파스타 담기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '메뉴판 불러오기와 동반인 공유' })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
  it.each(["", "home", "capture", "unknown", "detail/missing"])("%s 주소도 메뉴판으로 연결해요", route => {
    window.history.replaceState(null, "", `/#/${route}`);
    render(<App />);
    expect(screen.getByRole("heading", { name: "Osteria La Solita Zuppa" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "메뉴판 찍기" })).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/menu");
  });
  it("영수증의 돌아가기 버튼이 기존 홈 대신 메뉴판으로 연결돼요", async () => {
    window.history.replaceState(null, "", "/#/receipt");
    render(<App />);
    await userEvent.setup().click(screen.getByRole("button", { name: "메뉴판으로 돌아가기" }));
    expect(screen.getByRole("heading", { name: "Osteria La Solita Zuppa" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/menu");
  });
});
