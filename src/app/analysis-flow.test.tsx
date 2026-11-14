import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
beforeEach(() => { window.history.replaceState(null, "", "/"); });
describe("메뉴판부터 영수증까지의 화면 범위", () => {
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
