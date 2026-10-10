import { RESTAURANT, RESTAURANT_ADDR } from "./data";

const icBack = "/assets/7449f.svg";
const icPin = "/assets/462bd.svg";

export default function PlaceScreen({ onBack, onYes, onNo }: { onBack: () => void; onYes: () => void; onNo: () => void }) {
  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="뒤로 가기" onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={icBack} alt="" width={24} height={24} /></button>
        <p className="font-b text-[18px] text-center">이 식당 맞나요?</p>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-6 pb-[150px] flex flex-col gap-5">
        <section>
          <h1 className="font-r text-[22px] leading-[30px] tracking-[-0.8px]">메뉴판에서 식당 이름을 찾았어요</h1>
          <p className="mt-2 font-r text-[16px] leading-[24px] text-[#5f5a52]">맞는 식당이면 메뉴판 기준으로 자세히 알려드려요.</p>
        </section>
        <section className="rounded-[18px] bg-white border border-[#e5dfd5] p-4 shadow-[0_4px_12px_rgba(54,46,35,0.06)]">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center size-10 shrink-0 rounded-[12px] bg-[#ffddc6]"><img src={icPin} alt="" width={19} height={24} /></span>
            <div className="min-w-0">
              <p className="font-b text-[18px] leading-[25px]">{RESTAURANT}</p>
              <p className="mt-0.5 font-r text-[15px] leading-[22px] text-[#5f5a52]">{RESTAURANT_ADDR}</p>
              <span className="mt-2 inline-flex items-center h-7 px-2.5 rounded-full bg-[#FDECEA] border border-[#F4C7C3] font-b text-[13px] text-[#B3261E]">미쉐린 빕 구르망 2026</span>
            </div>
          </div>
          <iframe
            title={`${RESTAURANT} 지도`}
            src="https://www.google.com/maps?q=Osteria+La+Solita+Zuppa+Chiusi&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="mt-4 w-full h-[180px] rounded-[14px] border-0 bg-[#ece9e3]"
          />
        </section>
      </main>
      <div className="absolute inset-x-0 bottom-0 px-5 pt-3 pb-[34px] flex flex-col gap-2 bg-gradient-to-b from-[rgba(255,253,249,0)] via-[#fffdf9] via-[12%] to-[#fffdf9]">
        <button onClick={onYes} className="min-h-14 rounded-[15px] bg-[#e96027] shadow-[0_5px_14px_rgba(233,96,39,0.25)] font-xb text-[18px] text-white">맞아요</button>
        <button onClick={onNo} className="min-h-12 rounded-[15px] bg-white border border-[#c9c2b7] font-b text-[17px] text-[#5f5a52]">다른 식당이에요</button>
      </div>
    </div>
  );
}
