import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { analyzePhotos } from "@/lib/analyze-menu";
import { normalizeAnalysis } from "@/data/menu-schema";
import { analysisFixture } from "../../server/analysis-fixture";
vi.mock("@/lib/analyze-menu", () => ({ analyzePhotos: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); window.history.replaceState(null, "", "/#/capture"); });
async function selectPhoto() {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("메뉴판 사진 파일 선택"), new File(["photo"], "menu.jpg", { type: "image/jpeg" }));
  await screen.findByRole("img", { name: "선택한 메뉴판 사진" }); return user;
}
describe("Gemini 결과가 화면까지 이어져요", () => {
  it("실제 메뉴와 빈 장바구니로 전환하고 실제 가격으로 담아요", async () => {
    vi.mocked(analyzePhotos).mockResolvedValueOnce(normalizeAnalysis(analysisFixture)); render(<App />); const user = await selectPhoto();
    await user.click(screen.getByRole("button", { name: "메뉴판 분석하기" }));
    expect(await screen.findByRole("heading", { name: "Trattoria Test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "파스타 1", pressed: true })).toBeInTheDocument();
    expect(screen.queryByText("서양 대파와 감자 크림 수프")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "3개 보기" })).not.toBeInTheDocument();
    expect(screen.getByText("사진 준비 중")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "토마토 파스타 상세 보기" }));
    expect(screen.getByText("AI가 한국 음식에 빗대어 설명했어요. 실제와 다를 수 있어요")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "장바구니에 담기 · EUR 12.50" })); await user.click(screen.getByRole("button", { name: "장바구니 보기 · EUR 12.50" }));
    expect(screen.getByRole("region", { name: "예상 결제 금액" })).toHaveTextContent("12.50"); expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.queryByText(/예시 메뉴판에는 1인당/)).not.toBeInTheDocument();
  });
  it("실패하면 예시 메뉴와 지속 안내·재시도 버튼을 보여 줘요", async () => {
    vi.mocked(analyzePhotos).mockRejectedValueOnce(new Error("failed")); render(<App />); const user = await selectPhoto();
    await user.click(screen.getByRole("button", { name: "메뉴판 분석하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("분석에 실패했어요");
    expect(screen.getByRole("heading", { name: "Osteria La Solita Zuppa" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 촬영하기" })); expect(screen.getByRole("button", { name: "메뉴판 분석하기" })).toBeEnabled();
  });
  it("중복 분석을 막고 뒤로 나간 뒤 늦은 응답은 무시해요", async () => {
    let resolve: ((board: ReturnType<typeof normalizeAnalysis>) => void) | undefined;
    vi.mocked(analyzePhotos).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    render(<App />); const user = await selectPhoto();
    const button = screen.getByRole("button", { name: "메뉴판 분석하기" }); await user.click(button); expect(button).toBeDisabled();
    expect(screen.getByText("메뉴판을 읽고 있어요. 잠시 기다려 주세요")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "촬영 닫기" })); expect(vi.mocked(analyzePhotos).mock.calls[0][1].aborted).toBe(true);
    await act(async () => resolve?.(normalizeAnalysis(analysisFixture)));
    expect(screen.getByRole("heading", { name: /메뉴판을 찍으면/ })).toBeInTheDocument(); expect(screen.queryByRole("heading", { name: "Trattoria Test" })).not.toBeInTheDocument(); expect(analyzePhotos).toHaveBeenCalledTimes(1);
  });
});
