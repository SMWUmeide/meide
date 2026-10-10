import { useState } from "react";
import { dishes } from "./data";
import type { Cart } from "./MenuScreen";

const icPeople = "/assets/b4d04.svg";
const icBack = "/assets/7449f.svg";
const icClose = "/assets/dc365.svg";

const IT_NUM = ["", "una", "due", "tre", "quattro", "cinque", "sei"];
const KO_NUM = ["", "우나", "두에", "트레", "콰트로", "친퀘", "세이"];
const num = (n: number) =>
  n === 1 ? { it: "una porzione di", ko: "우나 포르치오네 디" } : { it: `${IT_NUM[n] ?? n} porzioni di`, ko: `${KO_NUM[n] ?? n} 포르치오니 디` };

export default function OrderScreen({ cart, onBack, onOrdered, readOnly }: { cart: Cart; onBack: () => void; onOrdered?: () => void; readOnly?: boolean }) {
  const [show, setShow] = useState(false);
  const items = dishes.filter((d) => (cart[d.id] ?? 0) > 0);
  const join = (arr: string[], sep: string) => (arr.length > 1 ? arr.slice(0, -1).join(", ") + sep + arr[arr.length - 1] : arr[0] ?? "");
  const it = `Vorremmo ordinare ${join(items.map((d) => `${num(cart[d.id]).it} ${d.orig}`), " e ")}, per favore.`;
  const ko = `보렘모 오르디나레 ${join(items.map((d) => `${num(cart[d.id]).ko} ${d.say}`), " 에 ")}, 페르 파보레.`;
  const meaning = `${join(items.map((d) => `${d.name} ${cart[d.id]}인분`), ", ")} 주세요.`;

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label={readOnly ? "닫기" : "장바구니로 돌아가기"} onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={readOnly ? icClose : icBack} alt="" width={24} height={24} /></button>
        <p className="font-b text-[18px] text-center">이렇게 주문하세요</p>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-[17px] pt-[22px] pb-[120px]">
        <section className="flex gap-[13px] items-start pb-5">
          <span className="grid place-items-center size-12 shrink-0 rounded-[15px] bg-[#e2ead7]"><img src={icPeople} alt="" width={24} height={24} /></span>
          <div>
            <h1 className="font-r text-[22px] leading-[31px] tracking-[-0.8px]">직원에게 보여주거나,<br />아래 발음을 읽어주세요.</h1>
            <p className="font-b text-[13px] text-[#52623a] mt-1">이탈리아어 · 토스카나</p>
          </div>
        </section>
        <article className="rounded-[18px] bg-white border border-[#e5dfd5] px-[17px] py-5">
          <p className="font-xb text-[21px] leading-[32.5px] tracking-[-0.3px]">{it}</p>
          <div className="mt-4 border-t border-[#e5dfd5] pt-[13px]">
            <p className="font-xb text-[12px] text-[#52623a]">읽는 방법</p>
            <p className="font-r text-[16px] leading-[25.6px] text-[#716d65] mt-1">{ko}</p>
          </div>
          <div className="pt-3">
            <p className="font-xb text-[12px] text-[#52623a]">뜻</p>
            <p className="font-r text-[16px] leading-[25.6px] text-[#716d65] mt-1">{meaning}</p>
          </div>
        </article>
        <p className="px-0.5 pt-[11px] pb-[17px] font-r text-[13px] text-[#716d65]">한글 발음은 읽기 위한 참고예요.</p>
        {!readOnly && (
          <button onClick={() => setShow(true)} className="w-full min-h-14 rounded-[15px] bg-white border border-[#52623a] font-xb text-[18px] text-[#52623a]">직원에게 보여주기</button>
        )}
      </main>

      <div className="absolute inset-x-0 bottom-0 px-[17px] pt-[11px] pb-[34px] bg-white/98 border-t border-[#e5dfd5]">
        {readOnly ? (
          <button onClick={() => setShow(true)} className="w-full min-h-14 rounded-[15px] bg-[#52623a] shadow-[0_5px_14px_rgba(82,98,58,0.2)] font-xb text-[18px] text-white">직원에게 보여주기</button>
        ) : (
          <button onClick={onOrdered} className="w-full min-h-14 rounded-[15px] bg-[#52623a] shadow-[0_5px_14px_rgba(82,98,58,0.2)] font-xb text-[18px] text-white">주문했어요</button>
        )}
      </div>

      {show && (
        <div className="absolute inset-0 z-20 flex flex-col bg-[#fffefa]">
          <div className="h-[16px] shrink-0" />
          <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
            <button aria-label="닫기" onClick={() => setShow(false)} className="grid place-items-center size-12 rounded-full"><img src={icClose} alt="" width={24} height={24} /></button>
            <p className="font-b text-[17px] text-center">직원에게 보여주세요</p>
          </header>
          <div className="flex-1 overflow-y-auto px-[22px] pt-[34px] pb-[120px]">
            <p className="py-[25px] font-xb text-[32.7px] leading-[49px]">{it}</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-[18px] pt-[11px] pb-[34px] bg-white border-t border-[#e5dfd5]">
            <button onClick={() => setShow(false)} className="w-full min-h-14 rounded-[15px] bg-[#52623a] font-xb text-[18px] text-white">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
