import { useState } from "react";

const icBack = "/assets/7449f.svg";
export default function ReviewScreen({ shots, onBack, onMore, onConfirm }: { shots: string[]; onBack: () => void; onMore: () => void; onConfirm: () => void }) {
  const [i, setI] = useState(Math.max(0, shots.length - 1));
  const shot = shots[i];

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="뒤로 가기" onClick={onBack} className="grid place-items-center size-12 rounded-full">
          <img src={icBack} alt="" width={24} height={24} />
        </button>
        <p className="font-b text-[18px] text-center">메뉴판 확인</p>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-4 pb-[120px] flex flex-col gap-6">
        {/* Photo preview */}
        <div className="relative h-[340px] shrink-0 rounded-[18px] bg-[#e9e5de] overflow-hidden grid place-items-center">
          {shot && <img src={shot} alt="촬영한 메뉴판" className="size-full object-cover" />}
          {shots.length > 0 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center rounded-full bg-[rgba(32,29,25,0.78)] text-white">
              <button aria-label="이전 사진" disabled={i === 0} onClick={() => setI(i - 1)} className="size-12 text-[20px] disabled:opacity-30">‹</button>
              <span className="font-r text-[15px] min-w-12 text-center">{i + 1}/{shots.length}</span>
              <button aria-label="다음 사진" disabled={i >= shots.length - 1} onClick={() => setI(i + 1)} className="size-12 text-[20px] disabled:opacity-30">›</button>
            </div>
          )}
        </div>

        <section>
          <h1 className="font-r text-[22px] leading-[30px] tracking-[-0.8px]">이 사진들로 메뉴판 해석을 시작할까요?</h1>
          <p className="font-r text-[16px] leading-[24px] text-[#5f5a52] mt-2">메뉴 이름과 가격이 잘 보이는지 확인해주세요.</p>
        </section>


      </main>

      <div className="absolute inset-x-0 bottom-0 px-5 pt-3 pb-[34px] grid grid-cols-[1fr_1.8fr] gap-2 bg-gradient-to-b from-[rgba(255,253,249,0)] via-[#fffdf9] via-[12%] to-[#fffdf9]">
        <button onClick={onMore} className="min-h-14 rounded-[15px] bg-white border border-[#e96027] font-xb text-[18px] text-[#b94618]">더 찍기</button>
        <button onClick={onConfirm} className="min-h-14 rounded-[15px] bg-[#e96027] shadow-[0_5px_14px_rgba(233,96,39,0.25)] font-xb text-[18px] text-white">메뉴판 해석하기</button>
      </div>
    </div>
  );
}
