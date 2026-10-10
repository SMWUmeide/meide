import { useState, type ReactNode } from "react";
import DishImg from "./DishImg";
import { dishes } from "./data";
import type { OrderRecord } from "./ArticleScreens";

export type Verdict = "good" | "ok" | "bad";
const VERDICTS: { id: Verdict; label: string; mouth: string }[] = [
  { id: "good", label: "맛있었어요", mouth: "M8 14.5c1.1 1.6 2.4 2.4 4 2.4s2.9-.8 4-2.4" },
  { id: "ok", label: "보통이에요", mouth: "M8.5 15.5h7" },
  { id: "bad", label: "아쉬웠어요", mouth: "M8 16.6c1.1-1.6 2.4-2.4 4-2.4s2.9.8 4 2.4" },
];
const TAGS: Record<Verdict, string[]> = {
  good: ["또 먹고 싶어요", "간이 딱 좋았어요", "양이 넉넉했어요", "설명대로 맛있었어요"],
  ok: ["조금 짰어요", "조금 싱거웠어요", "양이 적었어요", "생각했던 맛과 달랐어요"],
  bad: ["너무 짰어요", "너무 느끼했어요", "설명과 맛이 달랐어요", "다시는 안 시킬래요"],
};

function Face({ mouth, on }: { mouth: string; on: boolean }) {
  const c = on ? "#fff" : "#b94618";
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="9" cy="10" r="0.6" fill={c} />
      <circle cx="15" cy="10" r="0.6" fill={c} />
      <path d={mouth} />
    </svg>
  );
}

/** Dishes this viewer rates: only their own picks (companions rate theirs on their phones). */
export const rateItems = (o: OrderRecord, viewer: string) => o.byOwner[viewer] ?? [];

/** Shared glass-style floating card that sits 8px above the tab bar. */
export function FloatCard({ visual, title, sub, primary, onPrimary, onLater }: { visual: ReactNode; title: string; sub: string; primary: string; onPrimary: () => void; onLater: () => void }) {
  return (
    <div
      className="absolute inset-x-5 bottom-[105px] z-10 rounded-[20px] p-4 flex flex-col gap-3 animate-[floatup_0.32s_ease-out]"
      style={{
        background: "rgba(255, 250, 243, 0.78)",
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        border: "1px solid rgba(255, 255, 255, 0.7)",
        boxShadow: "0 8px 24px rgba(80, 40, 10, 0.12)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 size-12">{visual}</span>
        <div className="min-w-0">
          <p className="font-b text-[16px] leading-[22px] text-[#292722]">{title}</p>
          <p className="font-r text-[15px] leading-[21px] text-[#4f4a43]">{sub}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onLater} className="h-12 rounded-[14px] border border-[#bdb5a8] bg-transparent font-b text-[16px] text-[#4f4a43]">나중에</button>
        <button onClick={onPrimary} className="h-12 rounded-[14px] bg-[#e96027] font-xb text-[16px] text-white">{primary}</button>
      </div>
    </div>
  );
}

export function RateCard({ order, viewer, onRate, onDismiss }: { order: OrderRecord; viewer: string; onRate: () => void; onDismiss: () => void }) {
  const first = dishes.find((d) => d.id === rateItems(order, viewer)[0]?.id);
  return (
    <FloatCard
      visual={first ? <DishImg d={first} className="size-12 rounded-full" /> : <span className="block size-12 rounded-full bg-[#ffddc6]" />}
      title="식사는 맛있게 하셨나요?"
      sub="평가하면 다음 추천이 더 정확해져요"
      primary="평가하기"
      onPrimary={onRate}
      onLater={onDismiss}
    />
  );
}

export function RateSheet({ order, viewer, onClose, onDone }: { order: OrderRecord; viewer: string; onClose: () => void; onDone: (r: { dishId: string; verdict: Verdict; tags: string[] }[]) => void }) {
  const [verdict, setVerdict] = useState<Record<string, Verdict>>({});
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const items = rateItems(order, viewer);
  const toggle = (id: string, t: string) => setTags((x) => ({ ...x, [id]: x[id]?.includes(t) ? x[id].filter((y) => y !== t) : [...(x[id] ?? []), t] }));

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/45" onClick={onClose}>
      <div role="dialog" onClick={(e) => e.stopPropagation()} className="max-h-[88%] flex flex-col rounded-t-[24px] bg-white animate-[sheet_0.22s_ease-out]">
        <div className="px-5 pt-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-[#d9d3c9] mb-4" />
          <p className="font-b text-[20px] leading-[28px]">{order.restaurant}에서 드신 메뉴는 어땠나요?</p>
          {order.people.length > 1 && <p className="mt-1 font-r text-[15px] text-[#5f5a52]">함께하신 분의 메뉴는 각자 폰에서 평가해요.</p>}
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pt-4 pb-4 flex flex-col gap-3">
          {items.map((it) => {
            const d = dishes.find((x) => x.id === it.id)!;
            const v = verdict[it.id];
            return (
              <article key={it.id} className="rounded-[18px] border border-[#e5dfd5] bg-[#fffdf9] p-4">
                <div className="flex items-center gap-3">
                  <DishImg d={d} className="size-12 rounded-[12px]" />
                  <div className="min-w-0">
                    <p className="font-b text-[16px] leading-[22px]">{d.name}</p>
                    <p className="font-r text-[15px] text-[#5f5a52] truncate">{d.orig}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label={`${d.name} 평가`}>
                  {VERDICTS.map((x) => {
                    const on = v === x.id;
                    return (
                      <button key={x.id} role="radio" aria-checked={on} onClick={() => { if (v !== x.id) setTags((t) => ({ ...t, [it.id]: [] })); setVerdict((s) => ({ ...s, [it.id]: x.id })); }}
                        className={`flex flex-col items-center justify-center gap-1 min-h-[72px] rounded-[14px] border ${on ? "bg-[#e96027] border-[#e96027] text-white" : "bg-white border-[#e5dfd5] text-[#292722]"}`}>
                        <Face mouth={x.mouth} on={on} />
                        <span className="font-b text-[15px]">{x.label}</span>
                      </button>
                    );
                  })}
                </div>
                {v && (
                  <>
                  <p className="mt-4 font-b text-[15px] text-[#5f5a52]">어떤 점이 그랬나요? (선택)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TAGS[v].map((t) => {
                      const on = tags[it.id]?.includes(t);
                      return (
                        <button key={t} aria-pressed={on} onClick={() => toggle(it.id, t)} className="py-2 -my-2">
                          <span className={`inline-flex items-center h-8 px-3 rounded-full font-b text-[15px] border ${on ? "bg-[#fff1e7] border-[#e96027] text-[#b94618]" : "bg-white border-[#e5dfd5] text-[#5f5a52]"}`}>{t}</span>
                        </button>
                      );
                    })}
                  </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
        <div className="px-5 pt-3 pb-[34px] border-t border-[#e5dfd5]">
          <button disabled={!Object.keys(verdict).length} onClick={() => onDone(Object.entries(verdict).map(([dishId, v]) => ({ dishId, verdict: v, tags: tags[dishId] ?? [] })))} className="w-full min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[18px] text-white disabled:opacity-40">평가 마치기</button>
        </div>
      </div>
    </div>
  );
}

export function SimpleToast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-5 top-[84px] z-40 flex justify-center">
      <p className="rounded-[16px] bg-[rgba(32,29,25,0.92)] px-4 py-3 text-center font-b text-[15px] leading-[22px] text-white shadow-lg">{text}</p>
    </div>
  );
}
