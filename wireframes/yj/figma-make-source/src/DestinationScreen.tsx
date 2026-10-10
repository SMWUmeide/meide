import { useState } from "react";
import { destinations, type Destination } from "./data";

const icCheck = "/assets/aba33.svg";
const icSearch = "/assets/308b4.svg";
const icBack = "/assets/7449f.svg";

export default function DestinationScreen({ current, onBack, onSelect }: { current: Destination; onBack: () => void; onSelect: (d: Destination) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Destination>(current);
  const popular = destinations.filter((d) => d.label !== current.label).slice(0, 6);
  const list = q.trim()
    ? destinations.filter((d) => (d.label + d.sub).toLowerCase().includes(q.trim().toLowerCase()))
    : popular;
  const changed = picked.label !== current.label;

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="뒤로 가기" onClick={onBack} className="grid place-items-center size-12 rounded-full">
          <img src={icBack} alt="" width={24} height={24} />
        </button>
        <p className="font-b text-[18px] text-center">여행지 선택</p>
      </header>

      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-[#e5dfd5]">
        <h1 className="font-r text-[21px] leading-[29px] tracking-[-0.8px]">어느 나라, 어느 도시로 떠나시나요?</h1>
        <label className="mt-3.5 flex items-center gap-2 min-h-14 pl-3.5 pr-2 rounded-[16px] bg-white border border-[#c9c2b7] shadow-[0_3px_5px_rgba(54,46,35,0.05)]">
          <img src={icSearch} alt="" width={21} height={24} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="국가 또는 도시 검색" className="flex-1 bg-transparent outline-none font-r text-[17px] placeholder:text-[#292722]/50" />
        </label>
      </div>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-5 pb-[160px] flex flex-col gap-6">
        {!q && (
          <section>
            <h2 className="font-r text-[18px] leading-[25px] mb-3">현재 여행지</h2>
            <button onClick={() => setPicked(current)} className={`w-full grid grid-cols-[40px_1fr_28px] items-center gap-2.5 min-h-[68px] px-3 py-2.5 rounded-[15px] text-left ${picked.label === current.label ? "bg-[#fff3e7]" : "bg-white border border-[#e5dfd5]"}`}>
              <span className="text-[27px] leading-none">{current.flag}</span>
              <span>
                <span className={`block font-b text-[17px] ${picked.label === current.label ? "text-[#b94618]" : ""}`}>{current.label}</span>
                <span className="block font-r text-[15px] text-[#5f5a52]">{current.sub}</span>
              </span>
              {picked.label === current.label && (
                <span className="grid place-items-center size-[25px] rounded-full bg-[#e96027]"><img src={icCheck} alt="" width={17} height={24} /></span>
              )}
            </button>
          </section>
        )}
        <section>
          <h2 className="font-r text-[18px] leading-[25px] mb-3">{q ? "검색 결과" : "인기 여행지"}</h2>
          {list.length === 0 && <p className="font-r text-[15px] text-[#5f5a52]">검색 결과가 없어요.</p>}
          <div className="grid grid-cols-2 gap-2.5">
            {list.map((d) => {
              const on = picked.label === d.label;
              return (
                <button key={d.label} onClick={() => setPicked(d)} className={`relative flex flex-col items-start min-h-[104px] p-3.5 rounded-[15px] text-left border ${on ? "bg-[#fff3e7] border-[#e96027]" : "bg-white border-[#e5dfd5]"}`}>
                  <span className="text-[24px] leading-6">{d.flag}</span>
                  <span className={`mt-2 font-b text-[15px] ${on ? "text-[#b94618]" : ""}`}>{d.label}</span>
                  <span className="font-r text-[15px] text-[#5f5a52]">{d.sub}</span>
                  {on && <span className="absolute right-3 top-3 grid place-items-center size-[25px] rounded-full bg-[#e96027]"><img src={icCheck} alt="" width={17} height={24} /></span>}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <div className="absolute inset-x-0 bottom-0 px-5 pt-2.5 pb-[34px] bg-white/98 border-t border-[#e5dfd5] shadow-[0_-5px_16px_rgba(54,46,35,0.06)]">
        <div className="flex items-center justify-between pb-2">
          <span className="font-r text-[15px] text-[#5f5a52]">선택한 여행지</span>
          <span className="font-b text-[15px]">{picked.label}</span>
        </div>
        <button disabled={!changed} onClick={() => onSelect(picked)} className="w-full min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[18px] text-white disabled:opacity-35">
          이 여행지로 설정
        </button>
      </div>
    </div>
  );
}
