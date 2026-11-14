import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { Capture } from "./screens/Capture";
import { useState } from "react";
function CapturePreview() { const [files, setFiles] = useState<File[]>([]); const [notice, notify] = useState(""); return <><Capture files={files} setFiles={setFiles} onBack={() => {}} onContinue={() => {}} onDemo={() => {}} analyzing={false} notify={notify} /><p>{notice}</p></>; }
import { changeQuantity, initialCart, totals } from "./cart";
import { menuItems, categories } from "@/data/mock-menu";

beforeEach(() => { window.history.replaceState(null, "", "/"); });
describe("1단계 화면 흐름", () => {
  it("메뉴판에서 시작해 상세와 장바구니로 연결해요", async () => {
    const user = userEvent.setup(); render(<App />);
    expect(screen.getByRole("heading", { name: "Osteria La Solita Zuppa" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "병아리콩과 포르치니 버섯 수프 상세 보기" }));
    expect(screen.getByRole("heading", { name: "병아리콩과 포르치니 버섯 수프" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "장바구니에 담기 · EUR 11.00" }));
    await user.click(screen.getByRole("button", { name: "장바구니 보기 · EUR 11.00" }));
    expect(screen.getByRole("heading", { name: "함께 담은 장바구니" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "내 메뉴 · 2개" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "예상 결제 금액" })).toHaveTextContent("53.90");
  });
  it("카테고리는 한 개만 선택하고 뒤로 가도 선택·담기를 유지해요", async () => {
    window.history.replaceState(null, "", "/#/menu"); const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole("button", { name: "메인 요리 3" }));
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "후추 향의 토스카나 소고기 스튜 담기" }));
    await user.click(screen.getByRole("button", { name: "후추 향의 토스카나 소고기 스튜 상세 보기" }));
    await user.click(screen.getByRole("button", { name: "메뉴 고르기로 돌아가기" }));
    expect(screen.getByRole("button", { name: "메인 요리 3", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "후추 향의 토스카나 소고기 스튜 담기 취소" })).toBeInTheDocument();
  });
  it("장바구니 수량과 팁을 실제 합계로 계산해요", async () => {
    window.history.replaceState(null, "", "/#/cart"); const user = userEvent.setup(); render(<App />);
    const checkout = screen.getByRole("region", { name: "예상 결제 금액" }); expect(checkout).toHaveTextContent("41.80");
    await user.click(screen.getByRole("button", { name: "서양 대파와 감자 크림 수프 수량 늘리기" })); expect(checkout).toHaveTextContent("52.80");
    await user.click(screen.getByRole("checkbox", { name: "선택 팁 10% 포함" })); expect(checkout).toHaveTextContent("48.00");
    await user.click(screen.getByRole("button", { name: "서양 대파와 감자 크림 수프 수량 줄이기" }));
    await user.click(screen.getByRole("button", { name: "서양 대파와 감자 크림 수프 수량 줄이기" }));
    expect(screen.queryByRole("heading", { name: /내 메뉴/ })).not.toBeInTheDocument(); expect(checkout).toHaveTextContent("28.00");
  });
  it("함께 담은 메뉴도 목록에서 취소할 수 있어요", async () => {
    window.history.replaceState(null, "", "/#/menu"); const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole("button", { name: "호박과 고대 밀 수프 담기 취소" }));
    expect(screen.getByRole("button", { name: "호박과 고대 밀 수프 담기" })).toBeInTheDocument(); expect(screen.getByRole("button", { name: "2개 보기" })).toBeInTheDocument();
  });
  it("분석하기를 누르기 전에는 사진을 전송하지 않아요", async () => {
    window.history.replaceState(null, "", "/#/capture"); const request = vi.spyOn(window, "fetch").mockRejectedValue(new Error("외부 전송 금지"));
    try {
      const user = userEvent.setup(); render(<CapturePreview />); const file = new File(["image"], "menu.jpg", { type: "image/jpeg" });
      await user.upload(screen.getByLabelText("메뉴판 사진 파일 선택"), file);
      expect(await screen.findByRole("img", { name: "선택한 메뉴판 사진" })).toBeInTheDocument();
      expect(screen.getByText("1장")).toBeInTheDocument(); expect(screen.getByRole("button", { name: "메뉴판 분석하기" })).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
    } finally { request.mockRestore(); }
  });
  it("용량이 너무 큰 사진은 거부해요", () => {
    window.history.replaceState(null, "", "/#/capture"); render(<CapturePreview />);
    const file = new File(["image"], "huge.jpg", { type: "image/jpeg" }); Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
    fireEvent.change(screen.getByLabelText("메뉴판 사진 파일 선택"), { target: { files: [file] } }); expect(screen.getByText("사진은 한 장에 10MB 이하로 선택해 주세요")).toBeInTheDocument(); expect(screen.getByText("0장")).toBeInTheDocument();
  });
  it("AI 확인 시트는 닫을 수 있고 확인된 정보와 구분돼요", async () => {
    window.history.replaceState(null, "", "/#/detail/zucca"); const user = userEvent.setup(); render(<App />);
    expect(screen.getByRole("heading", { name: "메뉴판에 적힌 정보" })).toBeInTheDocument(); expect(screen.getByText("AI 설명의 예시예요. 실제 분석 결과는 아니에요")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "직원에게 확인하는 문장 보기" }));
    const dialog = screen.getByRole("dialog"); expect(within(dialog).getByText("Questo piatto contiene latte o formaggio?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "확인했어요" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("브라우저 뒤로 가기의 hashchange를 반영해요", () => {
    render(<App />); act(() => { window.history.replaceState(null, "", "/#/menu"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(screen.getByRole("heading", { name: "Osteria La Solita Zuppa" })).toBeInTheDocument();
  });
  it("각 화면의 실제 primary 버튼은 하나 이하예요", () => {
    const { container, unmount } = render(<App />); expect(container.querySelectorAll('button[data-variant="primary"]')).toHaveLength(0); unmount();
    for (const route of ["menu", "detail/zucca", "cart", "order", "receipt"]) {
      window.history.replaceState(null, "", `/#/${route}`); const result = render(<App />);
      expect(result.container.querySelectorAll('button[data-variant="primary"]:not(:disabled)').length).toBeLessThanOrEqual(1); result.unmount();
    }
  });
});
describe("가짜 메뉴와 계산", () => {
  it("Figma 카테고리의 메뉴 개수가 4·3·6이에요", () => { expect(categories.map(category => menuItems.filter(item => item.category === category.id).length)).toEqual([4, 3, 6]); });
  it("10% 팁·삭제·빈 장바구니를 계산해요", () => {
    expect(totals(initialCart, true)).toEqual({ food: 38, tip: 3.8, total: 41.8, count: 3 });
    expect(changeQuantity(initialCart, "porri", -1)).toHaveLength(2); expect(totals([], true)).toEqual({ food: 0, tip: 0, total: 0, count: 0 });
  });
});
