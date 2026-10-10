import { dishes, eurFmt, krw } from "./data";
import DishImg from "./DishImg";
import type { Cart } from "./MenuScreen";

const icBack = "/assets/7449f.svg";
const TIP = 0.1;

export default function CartScreen({ cart, setCart, onBack, onOrder }: { cart: Cart; setCart: (c: Cart) => void; onBack: () => void; onOrder: () => void }) {
  const items = dishes.filter((d) => (cart[d.id] ?? 0) > 0);
  const count = items.reduce((a, d) => a + cart[d.id], 0);
  const food = items.reduce((a, d) => a + d.eur * cart[d.id], 0);
  const total = food * (1 + TIP);
  const setQty = (id: string, n: number) => setCart({ ...cart, [id]: Math.max(0, n) });

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="메뉴로 돌아가기" onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={icBack} alt="" width={24} height={24} /></button>
        <p className="font-b text-[18px] text-center">장바구니</p>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-[17px] pt-1 pb-[230px]">
        {items.length === 0 && <p className="py-16 text-center font-r text-[15px] text-[#716d65]">담은 메뉴가 없어요.</p>}
        {items.map((d) => (
          <article key={d.id} className="grid grid-cols-[90px_1fr] gap-[13px] py-[18px] border-b border-[#e5dfd5]">
            <DishImg d={d} className="mt-0.5 h-[108px] w-[90px] rounded-[13px]" />
            <div>
              <p className="font-r text-[12px] text-[#716d65]">{d.orig}</p>
              <h2 className="font-r text-[17px] leading-[23px] mt-0.5">{d.name}</h2>
              <p className="mt-[7px] flex items-center gap-2">
                <span className="font-b text-[15px]">{d.noPrice ? "가격은 직원에게 확인" : eurFmt(d.eur)}</span>
                {!d.noPrice && <span className="rounded-[6px] bg-[#e2ead7] px-1.5 py-0.5 font-b text-[11px] text-[#52623a]">{krw(d.eur)}</span>}
              </p>
              <div className="mt-2.5 inline-grid grid-cols-[43px_40px_43px] items-center h-11 rounded-full bg-white border border-[#cbd4bf]">
                <button aria-label="수량 줄이기" onClick={() => setQty(d.id, cart[d.id] - 1)} className="h-[41px] font-r text-[23px] text-[#52623a]">−</button>
                <span className="font-b text-[15px] text-center">{cart[d.id]}</span>
                <button aria-label="수량 늘리기" onClick={() => setQty(d.id, cart[d.id] + 1)} className="h-[41px] font-r text-[23px] text-[#52623a]">+</button>
              </div>
            </div>
          </article>
        ))}
      </main>

      <div className="absolute inset-x-0 bottom-0 px-[17px] pt-[13px] pb-[34px] bg-white/98 border-t border-[#e5dfd5] shadow-[0_-5px_16px_rgba(54,46,35,0.06)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-b"><span className="text-[16px]">예상 총액</span><span className="text-[12px]">(음식+팁)</span></p>
            <p className="font-r text-[12px] text-[#716d65] mt-px">총 {count}개</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="font-b text-[23px] leading-[28px] text-[#52623a]">{eurFmt(total)}</p>
            <span className="mt-1 rounded-[7px] bg-[#e2ead7] px-1.5 py-1 font-b text-[12px] text-[#52623a]">{krw(total)}</span>
          </div>
        </div>
        <p className="pt-2 pb-2.5 text-center font-r text-[11px] text-[#716d65]">팁 10%를 포함한 참고 금액이에요. 실제 금액은 식당에서 확인해주세요.</p>
        <button disabled={!count} onClick={onOrder} className="w-full min-h-14 rounded-[15px] bg-[#52623a] shadow-[0_5px_14px_rgba(82,98,58,0.2)] font-xb text-[18px] text-white disabled:opacity-40">주문하기</button>
      </div>
    </div>
  );
}
