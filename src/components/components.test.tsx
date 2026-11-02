import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Chip } from "@/components/Chip";
import { Card } from "@/components/Card";
import { MenuCard, type MenuCardProps } from "@/components/MenuCard";
import { Avatar, AvatarGroup } from "@/components/Avatar";
import { CartBar } from "@/components/CartBar";
import { AICard } from "@/components/AICard";
import { InfoNote } from "@/components/InfoNote";
import { BottomSheet } from "@/components/BottomSheet";

const menu: MenuCardProps = { originalName: "ZUPPA", name: "호박 수프", priceEur: 10, priceKrw: 14990, onToggle: vi.fn(), onOpen: vi.fn() };

describe("앱과 공용 액션", () => {
  it("brand는 pill만 허용해요", () => {
    render(<Button variant="brand" size="pill">3개 보기</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "pill");
  });
  it("키보드로 버튼을 실행해요", async () => {
    const click = vi.fn(); render(<Button onClick={click}>확인해요</Button>);
    await userEvent.tab(); await userEvent.keyboard("{Enter}"); expect(click).toHaveBeenCalledTimes(1);
  });
  it("loading 중 원래 라벨 공간을 보존하고 중복 실행을 막아요", async () => {
    const click = vi.fn(); render(<Button state="loading" onClick={click}>담아 주세요</Button>);
    const button = screen.getByRole("button"); expect(button).toHaveAccessibleName("담아 주세요"); expect(button).toBeDisabled(); expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("담아 주세요")).toHaveClass("is-loading"); await userEvent.click(button); expect(click).not.toHaveBeenCalled();
  });
  it("아이콘 버튼에 이름과 비활성 상태를 전달해요", async () => {
    const click = vi.fn(); render(<IconButton icon="add" label="수프 담기" state="disabled" onClick={click} />);
    await userEvent.click(screen.getByRole("button", { name: "수프 담기" })); expect(click).not.toHaveBeenCalled();
  });
  it("Chip의 선택과 개수를 읽고 부모가 선택을 바꿔요", async () => {
    function Group() { const [selected, setSelected] = useState("수프"); return <>{["수프", "메인"].map(name => <Chip key={name} selected={selected === name} count={0} onSelect={() => setSelected(name)}>{name}</Chip>)}</>; }
    render(<Group />); await userEvent.click(screen.getByRole("button", { name: "메인 0" }));
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1); expect(screen.getByRole("button", { name: "메인 0" })).toHaveAttribute("aria-pressed", "true");
  });
  it("Card는 section 또는 disabled 가능한 버튼이에요", () => {
    render(<><Card>메뉴판 정보예요</Card><Card as="button" state="disabled">상세 보기</Card></>);
    expect(screen.getByText("메뉴판 정보예요").tagName).toBe("SECTION"); expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("메뉴와 사람·장바구니", () => {
  it("사진이 없거나 실패하면 대체 문구와 두 통화를 표시해요", () => {
    const { rerender } = render(<MenuCard {...menu} photoUrl="/actual-photo.jpg" />);
    fireEvent.error(screen.getByRole("img")); expect(screen.getByText("사진 준비 중")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument(); expect(screen.getByText("약 14,990원")).toBeInTheDocument();
    rerender(<MenuCard {...menu} photoUrl="/another-photo.jpg" />); expect(screen.getByRole("img")).toHaveAttribute("src", "/another-photo.jpg");
  });
  it("담기는 상세를 열지 않고 사진·이름만 상세를 열어요", async () => {
    const onToggle = vi.fn(), onOpen = vi.fn(); render(<MenuCard {...menu} onToggle={onToggle} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button", { name: "호박 수프 담기" })); expect(onToggle).toHaveBeenCalledTimes(1); expect(onOpen).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "호박 수프 상세 보기" })); await userEvent.click(screen.getByText("ZUPPA")); expect(onOpen).toHaveBeenCalledTimes(2);
  });
  it.each(["me", "companion-1", "companion-2", "companion-3"] as const)("%s 색과 담김 표시를 일치시켜요", person => {
    const { container } = render(<MenuCard {...menu} addedBy={person} addedByName="미영" />);
    expect(container.querySelector(".menu-overlay")).toHaveAttribute("data-person", person);
    expect(screen.getByText("미영님이 담았어요")).toBeInTheDocument(); expect(screen.getByRole("button", { name: "호박 수프 담기 취소" })).toHaveAttribute("data-tone", "brand");
  });
  it("AvatarGroup 크기가 모든 아이에게 적용돼요", () => {
    render(<AvatarGroup size={40}><Avatar person="me" initial="나" /><Avatar person="companion-1" initial="김" /></AvatarGroup>);
    for (const avatar of screen.getAllByRole("img")) expect(avatar).toHaveAttribute("data-size", "40");
  });
  it("장바구니 0개는 숨기고 양수일 때 열 수 있어요", async () => {
    const onOpen = vi.fn(); const { rerender } = render(<CartBar count={0} onOpen={onOpen} />); expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    rerender(<CartBar count={3} onOpen={onOpen} />); await userEvent.click(screen.getByRole("button", { name: "3개 보기" })); expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("AI·안내·바텀시트", () => {
  it("AI 제목·아이콘·출처와 선택적 확인 버튼을 표시해요", async () => {
    const confirm = vi.fn(); render(<AICard kind="estimated" source="AI가 추정했어요. 실제와 다를 수 있어요" onConfirm={confirm}>확인이 필요해요</AICard>);
    expect(screen.getByRole("heading", { name: "AI가 추정한 정보" })).toBeInTheDocument(); expect(screen.getByRole("img", { name: "AI" })).toBeInTheDocument();
    expect(screen.getByText("AI가 추정했어요. 실제와 다를 수 있어요")).toBeInTheDocument(); await userEvent.click(screen.getByRole("button")); expect(confirm).toHaveBeenCalledTimes(1);
  });
  it("빈 AI 출처를 거부해요", () => { expect(() => render(<AICard kind="estimated" source=" ">설명이에요</AICard>)).toThrow("출처"); });
  it("InfoNote가 안내 문구를 표시해요", () => { render(<InfoNote>자리 준비 비용이에요</InfoNote>); expect(screen.getByRole("complementary")).toHaveTextContent("자리 준비 비용이에요"); });
  it("제어형 시트는 취소 요청 후 open 변경으로 닫혀요", () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn(); const { rerender } = render(<BottomSheet open onClose={onClose} label="예상 금액이에요"><Button>확인해요</Button></BottomSheet>);
      const dialog = screen.getByRole("dialog", { name: "예상 금액이에요" }); expect(within(dialog).getByRole("button")).toBeInTheDocument();
      fireEvent(dialog, new Event("cancel", { cancelable: true })); expect(onClose).toHaveBeenCalledTimes(1);
      rerender(<BottomSheet open={false} onClose={onClose}>닫혀요</BottomSheet>); act(() => vi.advanceTimersByTime(200)); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
  it("dismissible=false는 Escape·바깥 클릭으로 닫히지 않아요", () => {
    const onClose = vi.fn(); render(<BottomSheet open dismissible={false} onClose={onClose}>금액을 확인해 주세요</BottomSheet>);
    const dialog = screen.getByRole("dialog"); fireEvent(dialog, new Event("cancel", { cancelable: true })); fireEvent.click(dialog, { clientX: -1, clientY: -1 }); expect(onClose).not.toHaveBeenCalled();
  });
  it("dismissible 시트는 바깥 클릭만 닫기 요청해요", () => {
    const onClose = vi.fn(); render(<BottomSheet open onClose={onClose}>금액을 확인해 주세요</BottomSheet>);
    const dialog = screen.getByRole("dialog"); fireEvent.click(screen.getByText("금액을 확인해 주세요")); expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog, { clientX: -1, clientY: -1 }); expect(onClose).toHaveBeenCalledTimes(1);
  });
  it.each([true, false])("끌어 닫기는 dismissible=%s를 따라요", dismissible => {
    const onClose = vi.fn(); const { container } = render(<BottomSheet open dismissible={dismissible} onClose={onClose}>금액을 확인해 주세요</BottomSheet>);
    const handle = container.querySelector(".sheet-drag-area")!;
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 }); fireEvent.pointerUp(handle, { clientY: 160, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(dismissible ? 1 : 0);
  });
  it("열린 시트 위에 시트 중첩을 거부해요", () => {
    expect(() => render(<><BottomSheet open>첫 시트예요</BottomSheet><BottomSheet open>둘째 시트예요</BottomSheet></>)).toThrow("다른 시트");
  });
});
