import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { normalizeAnalysis } from "@/data/menu-schema";
import { analysisFixture } from "../../server/analysis-fixture";
beforeEach(() => { window.history.replaceState(null, "", "/"); });
describe("메뉴판부터 영수증까지의 화면 범위", () => {
  it("HTTPS 초대 경로로 들어와 닫으면 초대를 다시 열지 않아요", async () => {
    window.history.replaceState(null, '', `/join/${'a'.repeat(64)}`);
    render(<App />);
    expect(screen.getByRole('dialog', {name:'함께 메뉴를 골라요'})).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', {name:'닫기'}));
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it("실제 촬영 입력을 제공하고 분석 전에는 예시 메뉴나 금액을 표시하지 않아요", () => {
    render(<App />);
    expect(screen.getByRole('button', { name: '메뉴판 촬영하기' })).toBeEnabled();
    expect(screen.getByLabelText('메뉴판 사진 촬영')).toHaveAttribute('capture', 'environment');
    expect(screen.queryByText(/1,499|미영|Osteria|예시 메뉴판으로 시작/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메뉴판 분석하기' })).toBeDisabled();
  });
  it("검증된 환율 없이 원화 금액이나 가정한 추가 요금을 만들지 않아요", () => {
    window.history.replaceState(null, "", "/#/receipt");
    render(<App initialBoard={normalizeAnalysis(analysisFixture)} />);
    expect(screen.queryByText(/약 .*원|EUR 2.50|EUR 3.00/)).not.toBeInTheDocument();
    expect(screen.queryByText(/자리 준비 비용과 물값/)).not.toBeInTheDocument();
  });
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
  it.each(["", "home", "capture", "unknown", "detail/missing"])("%s 주소에서 분석 전에는 사진 선택으로 연결해요", route => {
    window.history.replaceState(null, "", `/#/${route}`);
    render(<App />);
    expect(screen.getByRole("heading", { name: "메뉴판 불러오기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "메뉴판 찍기" })).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/setup");
  });
  it("영수증의 돌아가기 버튼이 기존 홈 대신 메뉴판으로 연결돼요", async () => {
    window.history.replaceState(null, "", "/#/receipt");
    render(<App initialBoard={normalizeAnalysis(analysisFixture)} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "메뉴판으로 돌아가기" }));
    expect(screen.getByRole("heading", { name: "Trattoria Test" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/menu");
  });
});
