import type { ReactNode } from "react";

const icHome = "/assets/96ef5.svg";
const icOrders = "/assets/0ca44.svg";
const icMy = "/assets/75427.svg";
const icHeart = "/assets/5d822.svg";

export type TabKey = "home" | "fav" | "companion" | "orders" | "my";

export function CompanionIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#6b665d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.8 14.6c2.3.1 4 1.5 4.6 4.4" />
    </svg>
  );
}

function Tab({ label, active, onClick, children }: { label: string; active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px]" aria-current={active ? "page" : undefined}>
      <span className={`grid place-items-center h-8 w-12 rounded-[12px] ${active ? "bg-[#ffddc6]" : ""}`}>{children}</span>
      <span className={`text-[12px] leading-4 tracking-[-0.3px] ${active ? "font-xb text-[#b94618]" : "font-r text-[#5f5a52]"}`}>{label}</span>
    </button>
  );
}

export default function TabBar({ active, onNav }: { active: TabKey; onNav: (t: TabKey) => void }) {
  return (
    <nav className="shrink-0 bg-white/95 border-t border-[#e5dfd5] shadow-[0_-5px_16px_rgba(53,45,34,0.06)]">
      <div className="flex px-1 pt-1.5">
        <Tab label="홈" active={active === "home"} onClick={() => onNav("home")}><img src={icHome} alt="" width={21} height={21} /></Tab>
        <Tab label="찜한 음식" active={active === "fav"} onClick={() => onNav("fav")}><img src={icHeart} alt="" width={21} height={21} /></Tab>
        <Tab label="동반인 탭" active={active === "companion"} onClick={() => onNav("companion")}><CompanionIcon /></Tab>
        <Tab label="주문 내역" active={active === "orders"} onClick={() => onNav("orders")}><img src={icOrders} alt="" width={21} height={21} /></Tab>
        <Tab label="마이페이지" active={active === "my"} onClick={() => onNav("my")}><img src={icMy} alt="" width={21} height={21} /></Tab>
      </div>
      <div className="h-[14px]" />
    </nav>
  );
}
