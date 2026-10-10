import { useState, type ReactNode } from "react";
import { ALLERGEN, eurFmt, krw, NON_LEGAL, parseAllergens, type Dish, type Person } from "./data";
import { DietChips, getFlags, type Flag } from "./DietChips";
import DishImg from "./DishImg";

const icClose = "/assets/dc365.svg";

export function Heart({ on, onToggle, name, light }: { on: boolean; onToggle: () => void; name: string; light?: boolean }) {
  return (
    <button aria-label={on ? `${name} 찜 해제` : `${name} 찜하기`} aria-pressed={on} onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`grid place-items-center size-12 rounded-full ${light ? "" : "bg-white shadow-[0_3px_6px_rgba(0,0,0,0.22)]"}`}>
      <span className={`grid place-items-center size-8 rounded-full ${light ? "bg-[rgba(34,31,27,0.68)]" : ""}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? "#e96027" : "none"} stroke={on ? "#e96027" : light ? "#fff" : "#292722"} strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
        </svg>
      </span>
    </button>
  );
}

const FAV_KEY = "favorite-dishes";
export function useFavorites() {
  const [fav, setFav] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"); } catch { return []; }
  });
  const toggle = (id: string) => {
    const next = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
    setFav(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  };
  return { fav, toggle };
}

export function Qty({ n, onChange, bordered }: { n: number; onChange: (n: number) => void; bordered?: boolean }) {
  return (
    <div className={`grid grid-cols-[32px_26px_32px] items-center h-[39px] px-[3px] rounded-full bg-white ${bordered ? "border border-[#e5dfd5]" : "shadow-[0_3px_10px_rgba(32,29,25,0.2)]"}`}>
      <button aria-label="수량 줄이기" onClick={() => onChange(n - 1)} className="h-[34px] font-xb text-[22px] text-[#b94618]">−</button>
      <span className="font-b text-[14px] text-center">{n}</span>
      <button aria-label="수량 늘리기" onClick={() => onChange(n + 1)} className="h-[34px] font-xb text-[22px] text-[#b94618]">+</button>
    </div>
  );
}

export function Price({ d }: { d: Dish }) {
  if (d.noPrice) return <span className="mt-2 font-r text-[13px] text-[#716d65]">가격은 메뉴판에 없어요</span>;
  return (
    <span className="mt-2 font-b text-[15px]">
      {d.oldEur != null && <s className="font-r text-[13px] text-[#8a847a] mr-1.5">{eurFmt(d.oldEur)}</s>}
      {eurFmt(d.eur)} <span className="font-r text-[11px] text-[#716d65] ml-1.5">{krw(d.eur)}</span>
    </span>
  );
}

export function Notes({ d }: { d: Dish }) {
  return (
    <>
      {d.unlisted && <p className="mt-2 rounded-[10px] bg-[#FDECEA] px-3 py-2 font-b text-[13px] leading-[19px] text-[#B3261E]">메뉴판 표시에 없는 재료가 있어요. 직원에게 확인해주세요</p>}
      {d.memo && <p className="mt-2 rounded-[10px] bg-[#f4eee6] px-3 py-2 font-r text-[13px] leading-[19px] text-[#5E4A3A]">{d.memo}</p>}
    </>
  );
}

export function Detail({ dish, generic, n, setN, onClose, party, onPick, fav, onFav }: { dish: Dish; n: number; setN: (n: number) => void; onClose: () => void; generic: boolean; party: Person[]; onPick: (f: Flag) => void; fav: boolean; onFav: () => void }) {
  const flags = getFlags(dish, party);
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6" onClick={onClose}>
      <div role="dialog" aria-label={`${dish.name} 상세 정보`} onClick={(e) => e.stopPropagation()} className="relative w-full max-h-[738px] overflow-y-auto no-scrollbar rounded-[21px] bg-white shadow-[0_14px_40px_rgba(0,0,0,0.32)]">
        <div className="h-[280px] bg-[#ece9e3]"><DishImg d={dish} fit="contain" className="size-full" /></div>
        <div className="px-[18px] pt-5 pb-5">
          <p className="font-r text-[13px] text-[#716d65] pr-10">{dish.orig}</p>
          <h2 className="font-r text-[21px] leading-[29px] mt-0.5">{dish.name}</h2>
          <p className="font-r text-[15px] leading-[23px] text-[#716d65] mt-2">{dish.desc}</p>
          <p className="mt-1.5"><Source generic={generic} className="text-[12px]" /></p>
          <Notes d={dish} />
          <DietChips flags={flags} party={party} onPick={onPick} />
          <dl className="mt-[18px] border-t border-[#e5dfd5]">
            <div className="py-[11px] border-b border-[#e5dfd5]">
              <dt className="font-b text-[12px] text-[#716d65]">주요 재료</dt>
              <dd className="mt-[3px] font-r text-[14px] leading-[20px]">
                {dish.ingredients.map((g, k) => (
                  <span key={g.text} className={flags.some((f) => f.key === g.key && f.kind === "allergy") ? "text-[#B3261E] font-b" : ""}>{g.text}{k < dish.ingredients.length - 1 && <span className="text-[#292722]">, </span>}</span>
                ))}
              </dd>
            </div>
            <div className="py-[11px] border-b border-[#e5dfd5]">
              <dt className="font-b text-[12px] text-[#716d65]">메뉴판 알레르기 표시</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {parseAllergens(dish.allergens).length ? parseAllergens(dish.allergens).map((x) => (
                  <span key={x.n} className="inline-flex items-center gap-1">
                    <span className={`inline-flex items-center h-7 px-2.5 rounded-full font-b text-[13px] ${x.maybe ? "bg-white border border-dashed border-[#c9c2b7] text-[#5f5a52]" : "bg-[#F4EEE6] text-[#5E4A3A]"}`}>{x.n} {ALLERGEN[x.n]}</span>
                    {x.maybe && <span className="font-r text-[12px] text-[#716d65] mr-1">들어갈 수 있음</span>}
                  </span>
                )) : <span className="font-r text-[14px] text-[#716d65]">{dish.allergens === "-" ? "표시 없음" : "메뉴판에 알레르기 정보가 없어요"}</span>}
              </dd>
              {dish.ingredients.some((g) => g.key && NON_LEGAL.includes(g.key)) && (
                <p className="mt-2 font-r text-[13px] leading-[19px] text-[#716d65]">
                  {dish.ingredients.filter((g) => g.key && NON_LEGAL.includes(g.key)).map((g) => g.key).filter((k, j, arr) => arr.indexOf(k) === j).join(", ")}: 메뉴판엔 표시되지 않는 재료예요. 재료 목록 기준으로 알려드려요.
                </p>
              )}
            </div>
            {dish.recipe && (
              <div className="py-[11px] border-b border-[#e5dfd5]">
                <dt className="font-r text-[14px] text-black">조리법</dt>
                <dd className="mt-[3px] font-r text-[14px] leading-[20px]">{dish.recipe}</dd>
              </div>
            )}
          </dl>
          <div className="flex items-center justify-between pt-[18px] min-h-14">
            <span className="font-xb text-[16px]">수량</span>
            {dish.soldOut ? <span className="font-b text-[15px] text-[#B3261E]">오늘은 주문할 수 없어요</span> : n > 0 ? <Qty n={n} onChange={setN} bordered /> : (
              <button onClick={() => setN(1)} className="min-h-11 px-4 rounded-full bg-[#e96027] font-xb text-[15px] text-white">담기</button>
            )}
          </div>
          <button disabled={n === 0} onClick={onClose} className="mt-4 w-full min-h-14 rounded-[15px] bg-[#e96027] shadow-[0_5px_14px_rgba(233,96,39,0.2)] font-xb text-[18px] text-white transition disabled:bg-[#e5dfd5] disabled:text-[#8a847a] disabled:shadow-none">
            담기 완료
          </button>
        </div>
        <div className="absolute left-2.5 top-2.5"><Heart on={fav} onToggle={onFav} name={dish.name} /></div>
        <button aria-label="상세 정보 닫기" onClick={onClose} className="absolute right-2.5 top-2.5 grid place-items-center size-[46px] rounded-full bg-white shadow-[0_3px_6px_rgba(0,0,0,0.22)]">
          <img src={icClose} alt="" width={24} height={24} />
        </button>
      </div>
    </div>
  );
}


export const Source = ({ generic, className = "" }: { generic: boolean; className?: string }) => (
  <span className={`font-r text-[11px] text-[#8a847a] ${className}`}>{generic ? "일반 정보 기준" : "식당 메뉴판 기준"}</span>
);

export function LunchBanner({ generic }: { generic: boolean }) {
  return (
    <>
      <div className="mx-4 mb-3 rounded-[12px] bg-[#fff1e7] px-3.5 py-2.5 font-r text-[13px] leading-[19px] text-[#b94618]">점심에는 수프 3가지 반 그릇 세트 26유로도 있어요 (자릿세·물·커피 포함)</div>
      {generic && <p className="mx-4 mb-3 rounded-[12px] bg-[#f4eee6] px-3.5 py-3 font-r text-[15px] leading-[22px] text-[#5E4A3A]">식당 정보 없이 일반적인 음식 설명으로 보여드려요</p>}
    </>
  );
}

export const CoverNote = () => <p className="px-4 pt-4 font-r text-[13px] text-[#716d65]">자릿세(빵 포함) 1인 2.50유로가 따로 붙어요</p>;

export function SectionHead({ sec }: { sec: { it: string; ko: string; note?: string } }) {
  return (
    <div className="bg-[#efefed] px-4 py-2.5">
      <p className="font-xb text-[15px] text-[#56524c]">{sec.it} · {sec.ko}</p>
      {sec.note && <p className="mt-0.5 font-r text-[13px] leading-[19px] text-[#716d65]">{sec.note}</p>}
    </div>
  );
}

export function OriginalViewer({ photo, onClose }: { photo?: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 bg-black/85 grid place-items-center p-6" onClick={onClose}>
      {photo && photo !== "sample" ? <img src={photo} alt="촬영한 메뉴판" className="max-h-full rounded-[12px]" /> : <p className="font-r text-[15px] text-white">샘플 메뉴판이에요. 화면을 누르면 닫혀요.</p>}
    </div>
  );
}

// One menu row. `action` is the add/qty control in the photo corner; `extra` sits under the chips.
export function MenuCard({ d, generic, party, onPick, onOpen, fav, onFav, action, extra, badge }: {
  d: Dish; generic: boolean; party: Person[]; onPick: (f: Flag) => void; onOpen: () => void; fav: boolean; onFav: () => void;
  action?: ReactNode; extra?: ReactNode; badge?: number;
}) {
  return (
    <article className="grid grid-cols-[1fr_104px] gap-2.5 min-h-[190px] py-[17px] border-b border-[#e5dfd5]">
      <div className="flex flex-col justify-center min-w-0">
        <button onClick={onOpen} className="flex flex-col text-left">
          <span className="font-r text-[12px] text-[#716d65]">{d.orig}</span>
          <span className="font-r text-[17px] leading-[24px] mt-[3px]">{d.name}</span>
          <span className="font-r text-[13px] leading-[19px] text-[#716d65] mt-1.5">{d.desc}</span>
          <Price d={d} />
          {d.soldOut && <span className="mt-1 font-b text-[13px] text-[#B3261E]">오늘은 주문할 수 없어요</span>}
          <Source generic={generic} className="mt-1" />
        </button>
        <Notes d={d} />
        <DietChips flags={getFlags(d, party)} party={party} onPick={onPick} />
        {extra}
      </div>
      <div className={`relative self-center h-[145px] w-[104px] rounded-[13px] bg-[#eee] overflow-hidden ${d.soldOut ? "opacity-60" : ""}`}>
        <button onClick={onOpen} aria-label={`${d.name} 상세 정보`} className="size-full">
          <DishImg d={d} className="size-full" />
        </button>
        <div className="absolute -left-0.5 -top-0.5"><Heart light on={fav} onToggle={onFav} name={d.name} /></div>
        {!d.soldOut && action}
        {!!badge && !d.soldOut && <span className="pointer-events-none absolute right-[1px] bottom-[40px] grid place-items-center min-w-[26px] h-[26px] px-1.5 rounded-full bg-[#e96027] border-2 border-white font-b text-[13px] leading-none text-white">{badge}</span>}
      </div>
    </article>
  );
}
