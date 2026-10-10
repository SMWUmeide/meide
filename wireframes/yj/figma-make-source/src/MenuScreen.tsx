import { useState } from "react";
import { dishes, sections, type Dish, type Person } from "./data";
import { FlagSheet, type Flag } from "./DietChips";
import { CoverNote, Detail, LunchBanner, MenuCard, OriginalViewer, Qty, SectionHead, useFavorites } from "./MenuParts";

const icBack = "/assets/7449f.svg";
const icOriginal = "/assets/890d5.svg";
const icCart = "/assets/5af10.svg";

export type Cart = Record<string, number>;

export default function MenuScreen({ generic, cart, setCart, photo, onBack, onCart, party }: { generic: boolean; cart: Cart; setCart: (c: Cart) => void; photo?: string; onBack: () => void; onCart: () => void; party: Person[] }) {
  const [open, setOpen] = useState<Dish | null>(null);
  const [showOrig, setShowOrig] = useState(false);
  const [flag, setFlag] = useState<Flag | null>(null);
  const { fav, toggle } = useFavorites();
  const setQty = (id: string, n: number) => setCart({ ...cart, [id]: Math.max(0, n) });
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="뒤로 가기" onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={icBack} alt="" width={24} height={24} /></button>
        <p className="font-b text-[18px] text-center">메뉴</p>
        <button aria-label="촬영한 메뉴판 원본 보기" onClick={() => setShowOrig(true)} className="grid place-items-center size-12 rounded-full"><img src={icOriginal} alt="" width={24} height={24} /></button>
      </header>


      <main className="no-scrollbar flex-1 overflow-y-auto pt-[13px] pb-[130px]">
        <LunchBanner generic={generic} />
        {sections.map((sec) => (
          <section key={sec.id}>
            <SectionHead sec={sec} />
            <div className="bg-white px-4">
              {dishes.filter((d) => d.section === sec.id).map((d) => {
                const n = cart[d.id] ?? 0;
                return (
                  <MenuCard key={d.id} d={d} generic={generic} party={party} onPick={setFlag} onOpen={() => setOpen(d)} fav={fav.includes(d.id)} onFav={() => toggle(d.id)}
                    action={n > 0 ? (
                      <div className="absolute left-[3px] bottom-[6px]"><Qty n={n} onChange={(v) => setQty(d.id, v)} /></div>
                    ) : (
                      <button aria-label={`${d.name} 담기`} onClick={() => setQty(d.id, 1)} className="absolute right-[7px] bottom-[7px] grid place-items-center size-[42px] rounded-full bg-white shadow-[0_3px_10px_rgba(32,29,25,0.2)] font-r text-[27px] text-[#b94618] leading-none">+</button>
                    )} />
                );
              })}
            </div>
          </section>
        ))}
        <CoverNote />
      </main>

      <div className="absolute inset-x-0 bottom-0 px-4 pt-2 pb-[34px] bg-[rgba(255,253,249,0.98)] border-t border-[#e5dfd5]">
        <p className="pb-1.5 text-center font-r text-[10px] text-[#716d65]">AI 정보는 실제와 다를 수 있어요. 알레르기 성분은 직원에게 확인해주세요.</p>
        <button disabled={!count} onClick={onCart} className="relative w-full min-h-14 rounded-[15px] bg-[#e96027] shadow-[0_5px_14px_rgba(233,96,39,0.2)] font-xb text-[18px] text-white disabled:opacity-40">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <img src={icCart} alt="" width={20} height={24} />
            <span className="rounded-full bg-white/20 px-[7px] py-[3px] text-[13px]">{count}개</span>
          </span>
          장바구니 보기
        </button>
      </div>

      {open && <Detail dish={open} generic={generic} n={cart[open.id] ?? 0} setN={(v) => setQty(open.id, v)} onClose={() => setOpen(null)} party={party} onPick={setFlag} fav={fav.includes(open.id)} onFav={() => toggle(open.id)} />}
      {flag && <FlagSheet f={flag} party={party} onClose={() => setFlag(null)} />}
      {showOrig && <OriginalViewer photo={photo} onClose={() => setShowOrig(false)} />}
    </div>
  );
}
