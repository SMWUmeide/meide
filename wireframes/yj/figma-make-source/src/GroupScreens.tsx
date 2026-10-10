import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import DishImg from "./DishImg";
import { dishes, eurFmt, initialParty, krw, RESTAURANT, sections, type Dish, type Person } from "./data";
import OrderScreen from "./OrderScreen";
import type { Cart } from "./MenuScreen";
import { FlagSheet, type Flag } from "./DietChips";
import { CoverNote, Detail, LunchBanner, MenuCard, OriginalViewer, SectionHead, useFavorites } from "./MenuParts";

const icBack = "/assets/7449f.svg";
const icCart = "/assets/5af10.svg";
const icOriginal = "/assets/890d5.svg";

/* ---------- Shared state ---------- */

export type PhoneScreen = "idle" | "menu" | "cart" | "order";
export type GItem = { key: string; dishId: string; owner: string; qty: number; addedBy: string };
export type Group = {
  restaurant: string;
  photo?: string; // first menu photo, for 원본 보기
  generic?: boolean; // user said the detected restaurant was wrong
  members: string[]; // companions in this meal
  seen: string[]; // companions who opened the notification
  later: string[]; // companions who tapped 나중에
  host: string;
  items: GItem[];
  done: Record<string, boolean>;
  screens: Record<string, PhoneScreen>;
  toasts: Record<string, { id: number; text: string } | undefined>;
};
type SetG = Dispatch<SetStateAction<Group | null>>;

export const party: Person[] = initialParty;
export const ME = party.find((p) => p.isMe)!.id;
const person = (id: string) => party.find((p) => p.id === id)!;
const initial = (id: string, viewer: string) => (id === viewer ? "나" : person(id).name[0]);
const nameOf = (id: string, viewer: string) => (id === viewer ? "나" : `${person(id).name}님`);

export function createGroup(cart: Cart, companions: string[], host: string): Group {
  const items = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([dishId, qty]) => ({ key: `${host}-${dishId}`, dishId, owner: host, qty, addedBy: host }));
  return {
    restaurant: RESTAURANT,
    members: companions,
    seen: [],
    later: [],
    host,
    items,
    done: {},
    screens: { [host]: "menu", ...Object.fromEntries(companions.map((c) => [c, "idle" as PhoneScreen])) },
    toasts: {},
  };
}

let toastSeq = 1;
const toast = (g: Group, pid: string, text: string): Group => ({ ...g, toasts: { ...g.toasts, [pid]: { id: toastSeq++, text } } });
export const members = (g: Group) => [g.host, ...g.members];

function changeQty(g: Group, viewer: string, dishId: string, owner: string, delta: number): Group {
  const key = `${owner}-${dishId}`;
  const ex = g.items.find((i) => i.key === key);
  let items: GItem[];
  if (ex) items = g.items.map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0);
  else if (delta > 0) items = [...g.items, { key, dishId, owner, qty: delta, addedBy: viewer }];
  else items = g.items;
  // Any change by a person sends them back to "고르는 중".
  return { ...g, items, done: { ...g.done, [viewer]: false } };
}

export function mergedCart(g: Group): Cart {
  const c: Cart = {};
  for (const i of g.items) c[i.dishId] = (c[i.dishId] ?? 0) + i.qty;
  return c;
}

/* ---------- Conflicts (allergy / dislike) ---------- */

type Conflict = { pid: string; kind: "allergy" | "dislike"; key: string };
function conflicts(dish: Dish, pids: string[]): Conflict[] {
  const out: Conflict[] = [];
  for (const kind of ["allergy", "dislike"] as const)
    for (const ing of dish.ingredients) {
      if (!ing.key) continue;
      for (const pid of pids) {
        const p = person(pid);
        if ((kind === "allergy" ? p.allergies : p.dislikes).includes(ing.key)) out.push({ pid, kind, key: ing.key });
      }
    }
  return out;
}
const jong = (w: string) => {
  const c = w.charCodeAt(w.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};
const ga = (w: string) => w + (jong(w) ? "이" : "가");
const eul = (w: string) => w + (jong(w) ? "을" : "를");

function conflictLines(cs: Conflict[], viewer: string) {
  return cs.map((c) => {
    const verb = c.kind === "allergy" ? "들어가요" : "올라가요";
    if (c.pid === viewer)
      return c.kind === "allergy"
        ? `${c.key} 알레르기가 있으시죠. 이 요리에 ${ga(c.key)} ${verb}.`
        : `${eul(c.key)} 못 드시죠. 이 요리에 ${ga(c.key)} ${verb}.`;
    const n = `${person(c.pid).name}님이`;
    return c.kind === "allergy" ? `${n} ${c.key} 알레르기가 있어요. 이 요리에 ${ga(c.key)} ${verb}.` : `${n} ${eul(c.key)} 못 드세요. 이 요리에 ${ga(c.key)} ${verb}.`;
  });
}

function WarnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
function WarnChip({ c }: { c: Conflict }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#FDECEA] text-[#B3261E] border border-[#F4C7C3]">
      <WarnIcon />
      <span className="font-b text-[13px]">{c.key} {c.kind === "allergy" ? "알레르기" : "못 먹음"} · {person(c.pid).name}</span>
    </span>
  );
}

/* ---------- Small UI pieces ---------- */

function Badge({ pid, viewer, size = 28 }: { pid: string; viewer: string; size?: number }) {
  const mine = pid === viewer;
  return (
    <span style={{ width: size, height: size }} className={`grid place-items-center shrink-0 rounded-full font-b text-[12px] text-white border-2 border-white ${mine ? "bg-[#e96027]" : "bg-[#8a5a3c]"}`}>
      {initial(pid, viewer)}
    </span>
  );
}
function Dots() {
  return (
    <span className="inline-flex gap-1 ml-1" aria-hidden>
      {[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-[#b94618] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
    </span>
  );
}
function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <>
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5] bg-[#fffdf9]">
        {onBack ? <button aria-label="뒤로 가기" onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={icBack} alt="" width={24} height={24} /></button> : <span />}
        <p className="font-b text-[18px] text-center">{title}</p>
        {right ?? <span />}
      </header>
    </>
  );
}
function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/45" onClick={onClose}>
      <div role="dialog" onClick={(e) => e.stopPropagation()} className="rounded-t-[24px] bg-white px-5 pt-3 pb-[34px] animate-[sheet_0.22s_ease-out]">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#d9d3c9] mb-4" />
        {children}
      </div>
    </div>
  );
}
function Toast({ g, viewer, setG }: { g: Group; viewer: string; setG: SetG }) {
  const t = g.toasts[viewer];
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setG((x) => (x && x.toasts[viewer]?.id === t.id ? { ...x, toasts: { ...x.toasts, [viewer]: undefined } } : x)), 2200);
    return () => clearTimeout(h);
  }, [t, viewer, setG]);
  if (!t) return null;
  return (
    <div className="pointer-events-none absolute inset-x-5 top-[84px] z-40 flex justify-center">
      <p key={t.id} className="rounded-full bg-[rgba(32,29,25,0.9)] px-4 py-2.5 font-b text-[15px] text-white shadow-lg">{t.text}</p>
    </div>
  );
}

function statusText(g: Group, pid: string) {
  if (pid !== g.host && !g.seen.includes(pid)) return "알림 확인 전";
  return g.done[pid] ? "다 골랐어요 ✓" : "고르는 중";
}

/* ---------- Group menu ---------- */

function GroupMenu({ g, setG, viewer }: { g: Group; setG: SetG; viewer: string }) {
  const target = viewer;
  const [pending, setPending] = useState<{ dish: Dish; cs: Conflict[] } | null>(null);
  const count = g.items.reduce((a, i) => a + i.qty, 0);
  const add = (dish: Dish) => {
    setG((x) => x && toast(changeQty(x, viewer, dish.id, target, 1), viewer, "장바구니에 담았어요"));
    setPending(null);
  };
  const tryAdd = (dish: Dish) => {
    const cs = conflicts(dish, [viewer]);
    if (cs.length) setPending({ dish, cs });
    else add(dish);
  };
  const go = (s: PhoneScreen) => setG((x) => x && { ...x, screens: { ...x.screens, [viewer]: s } });
  const [open, setOpen] = useState<Dish | null>(null);
  const [flag, setFlag] = useState<Flag | null>(null);
  const [showOrig, setShowOrig] = useState(false);
  const { fav, toggle } = useFavorites();
  const gParty: Person[] = members(g).map((pid) => ({ ...person(pid), isMe: pid === viewer }));
  const generic = !!g.generic;
  const myQty = (id: string) => g.items.find((i) => i.key === `${viewer}-${id}`)?.qty ?? 0;
  // Detail qty only touches the viewer's own slot; the first add goes through the conflict check.
  const setMine = (dish: Dish, v: number) => {
    const cur = myQty(dish.id);
    if (v > cur && cur === 0) tryAdd(dish);
    else if (v !== cur) setG((x) => x && changeQty(x, viewer, dish.id, viewer, v - cur));
  };

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <Header title="메뉴" onBack={() => go("cart")} right={
        <button aria-label="촬영한 메뉴판 원본 보기" onClick={() => setShowOrig(true)} className="grid place-items-center size-12 rounded-full"><img src={icOriginal} alt="" width={24} height={24} /></button>
      } />
      <div className="shrink-0 flex items-center gap-2 h-10 px-4" aria-live="polite">
        <span className="flex -space-x-2">{members(g).map((pid) => <Badge key={pid} pid={pid} viewer="" size={26} />)}</span>
        <span className="font-r text-[15px] text-[#5f5a52]">{members(g).filter((id) => id !== viewer).map((id) => `${person(id).name}님`).join(", ")}과 함께 고르는 중</span>
      </div>
      <main className="no-scrollbar flex-1 overflow-y-auto pt-[13px] pb-[110px]">
        <LunchBanner generic={generic} />
        {sections.map((sec) => (
          <section key={sec.id}>
            <SectionHead sec={sec} />
            <div className="bg-white px-4">
              {dishes.filter((d) => d.section === sec.id).map((d) => {
                const byPerson = members(g).map((pid) => ({ pid, qty: g.items.find((i) => i.key === `${pid}-${d.id}`)?.qty ?? 0 })).filter((x) => x.qty > 0);
                const totalQty = byPerson.reduce((a, x) => a + x.qty, 0);
                return (
                  <MenuCard key={d.id} d={d} generic={generic} party={gParty} onPick={setFlag} onOpen={() => setOpen(d)} fav={fav.includes(d.id)} onFav={() => toggle(d.id)} badge={totalQty}
                    extra={totalQty > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="누가 몇 개 담았는지">
                        {byPerson.map((x) => (
                          <span key={x.pid} className="inline-flex items-center gap-1.5 h-8 pl-1 pr-3 rounded-full bg-[#fff1e7] font-b text-[14px] text-[#b94618]">
                            <Badge pid={x.pid} viewer={viewer} size={24} />
                            {nameOf(x.pid, viewer)} {x.qty}개
                          </span>
                        ))}
                      </div>
                    )}
                    action={
                      <button aria-label={`${d.name} 담기`} onClick={() => tryAdd(d)} className="absolute right-1 bottom-1 grid place-items-center size-12 rounded-full">
                        <span className="grid place-items-center size-[42px] rounded-full bg-white shadow-[0_3px_10px_rgba(32,29,25,0.2)] font-r text-[27px] leading-none text-[#b94618]">+</span>
                      </button>
                    } />
                );
              })}
            </div>
          </section>
        ))}
        <CoverNote />
      </main>
      <div className="absolute inset-x-0 bottom-0 px-4 pt-2 pb-[34px] bg-[rgba(255,253,249,0.98)] border-t border-[#e5dfd5]">
        <button onClick={() => go("cart")} className="flex w-full items-center gap-2 min-h-12 px-4 rounded-[14px] bg-[#292722] text-white">
          <img src={icCart} alt="" width={20} height={24} className="invert" />
          <span className="font-b text-[16px]">함께 담은 장바구니 · {count}개</span>
          <span className="ml-auto font-b text-[18px]">›</span>
        </button>
      </div>
      {open && <Detail dish={open} generic={generic} n={myQty(open.id)} setN={(v) => setMine(open, v)} onClose={() => setOpen(null)} party={gParty} onPick={setFlag} fav={fav.includes(open.id)} onFav={() => toggle(open.id)} />}
      {flag && <FlagSheet f={flag} party={gParty} onClose={() => setFlag(null)} />}
      {showOrig && <OriginalViewer photo={g.photo} onClose={() => setShowOrig(false)} />}
      {pending && (
        <Sheet onClose={() => setPending(null)}>
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#FDECEA] text-[#B3261E] border border-[#F4C7C3] font-b text-[15px]"><WarnIcon /> 확인이 필요해요</span>
          <p className="mt-3 font-b text-[17px]">{pending.dish.name}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {conflictLines(pending.cs, viewer).map((l) => <p key={l} className="font-r text-[17px] leading-[27px]">{l}</p>)}
          </div>
          <p className="mt-2 font-b text-[17px]">그래도 담을까요?</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => setPending(null)} className="min-h-14 rounded-[15px] border border-[#c9c2b7] font-b text-[17px] text-[#5f5a52]">다른 메뉴 보기</button>
            <button onClick={() => add(pending.dish)} className="min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[17px] text-white">그래도 담기</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ---------- Group cart ---------- */

function Row({ item, viewer, editable, setG }: { g: Group; item: GItem; viewer: string; editable: boolean; setG: SetG }) {
  const d = dishes.find((x) => x.id === item.dishId)!;
  const cs = conflicts(d, [item.owner]);
  const set = (delta: number) => setG((x) => x && changeQty(x, viewer, item.dishId, item.owner, delta));
  return (
    <div className="py-3.5 border-b border-[#efe9df] last:border-0">
      <div className="grid grid-cols-[56px_1fr] gap-3">
        <DishImg d={d} className="size-14 rounded-[12px]" />
        <div className="min-w-0">
          <p className="font-b text-[16px] leading-[23px]">{d.name}</p>
          <p className="font-r text-[15px] text-[#5f5a52] truncate">{d.orig}</p>
        </div>
      </div>
      {cs.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5 pl-[68px]">{cs.map((c) => <WarnChip key={c.pid + c.key + c.kind} c={c} />)}</div>}
      <div className="mt-2 flex items-center justify-between pl-[68px]">
        <p><span className="font-b text-[15px]">{eurFmt(d.eur * item.qty)}</span> <span className="font-r text-[15px] text-[#5f5a52]">{krw(d.eur * item.qty)}</span></p>
        {editable ? (
          <div className="grid grid-cols-[48px_32px_48px] items-center h-12 rounded-full border border-[#e5dfd5] bg-white">
            <button aria-label="수량 줄이기" onClick={() => set(-1)} className="h-12 font-xb text-[22px] text-[#b94618]">−</button>
            <span className="text-center font-b text-[16px]">{item.qty}</span>
            <button aria-label="수량 늘리기" onClick={() => set(1)} className="h-12 font-xb text-[22px] text-[#b94618]">+</button>
          </div>
        ) : (
          <span className="font-b text-[16px] text-[#5f5a52]">{item.qty}개</span>
        )}
      </div>
    </div>
  );
}

function GroupCart({ g, setG, viewer }: { g: Group; setG: SetG; viewer: string }) {
  const [confirm, setConfirm] = useState(false);
  const others = members(g).filter((id) => id !== viewer).map(person);
  const total = g.items.reduce((a, i) => a + dishes.find((d) => d.id === i.dishId)!.eur * i.qty, 0);
  const waiting = others.filter((p) => !g.done[p.id]);
  const ready = !!g.done[viewer] && waiting.length === 0;
  const go = (s: PhoneScreen) => setG((x) => x && { ...x, screens: { ...x.screens, [viewer]: s } });
  const toggleDone = () =>
    setG((x) => {
      if (!x) return x;
      const on = !x.done[viewer];
      let n: Group = { ...x, done: { ...x.done, [viewer]: on } };
      if (on) for (const pid of members(x)) if (pid !== viewer) n = toast(n, pid, `${person(viewer).name}님이 다 골랐어요`);
      return n;
    });
  // Opens the same order screen on everyone's phone.
  const make = () => setG((x) => x && { ...x, screens: Object.fromEntries(members(x).map((pid) => [pid, "order" as PhoneScreen])) });

  const Section = ({ owner }: { owner: string }) => {
    const items = g.items.filter((i) => i.owner === owner);
    const n = items.reduce((a, i) => a + i.qty, 0);
    const mine = owner === viewer;
    const nm = mine ? "내 메뉴" : `${person(owner).name}님 메뉴`;
    return (
      <section className="rounded-[18px] bg-white border border-[#e5dfd5] px-4 pt-4 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge pid={owner} viewer={viewer} />
          <span className="font-b text-[17px]">{nm}</span>
          <span className="font-r text-[15px] text-[#5f5a52]">· {n}개</span>
          {<span className={`font-b text-[15px] ${g.done[owner] ? "text-[#3f6a26]" : "text-[#b94618]"}`}>· {statusText(g, owner)}</span>}
        </div>
        <div className="mt-1">
          {items.map((i) => <Row key={i.key} g={g} item={i} viewer={viewer} setG={setG} editable={mine} />)}
        </div>
        {items.length === 0 && (
          <p className="py-4 font-r text-[15px] text-[#5f5a52] flex items-center">
            {mine ? "아직 담은 메뉴가 없어요" : g.seen.includes(owner) ? <>{person(owner).name}님이 고르고 있어요<Dots /></> : <>{person(owner).name}님이 알림을 아직 확인하지 않았어요</>}
          </p>
        )}
        {mine && (
          <button onClick={() => go("menu")} className="mb-3 w-full min-h-12 rounded-[14px] bg-[#fff5ee] font-b text-[15px] text-[#b94618]">+ 메뉴 더 담기</button>
        )}
      </section>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <Header
        title="함께 담은 장바구니"
        onBack={() => go("menu")}
      />
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-3 pb-[210px] flex flex-col gap-3">
        <button className="self-start min-h-12 font-b text-[17px]">{g.restaurant} ›</button>
        <div className="flex items-center gap-3 flex-wrap">
          {[viewer, ...others.map((p) => p.id)].map((pid, i) => (
            <span key={pid} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#c9c2b7]">·</span>}
              <Badge pid={pid} viewer={viewer} />
              <span className={`font-b text-[15px] ${g.done[pid] ? "text-[#3f6a26]" : "text-[#5f5a52]"}`}>{statusText(g, pid)}</span>
            </span>
          ))}
        </div>
        <Section owner={viewer} />
        {others.map((p) => <Section key={p.id} owner={p.id} />)}
      </main>

      <div className="absolute inset-x-0 bottom-0 px-5 pt-3 pb-[34px] bg-white/98 border-t border-[#e5dfd5] shadow-[0_-5px_16px_rgba(54,46,35,0.06)]">
        <button onClick={toggleDone} aria-pressed={!!g.done[viewer]} className={`w-full min-h-12 rounded-[14px] font-b text-[16px] border ${g.done[viewer] ? "bg-[#eef3e6] border-[#cbd4bf] text-[#3f6a26]" : "bg-white border-[#e96027] text-[#b94618]"}`}>
          {g.done[viewer] ? "다 골랐어요 ✓  (누르면 다시 고르기)" : "다 골랐어요"}
        </button>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="font-b text-[20px] leading-[26px]">{eurFmt(total)}</p>
            <p className="font-r text-[15px] text-[#5f5a52]">{krw(total)}</p>
          </div>
          <button disabled={!g.items.length} onClick={() => (ready ? make() : setConfirm(true))} className={`min-h-14 px-5 rounded-[15px] font-xb text-[17px] text-white disabled:opacity-40 ${ready ? "bg-[#e96027] shadow-[0_5px_14px_rgba(233,96,39,0.25)]" : "bg-[#e96027]/55"}`}>
            주문 문장 만들기
          </button>
        </div>
      </div>

      {confirm && (
        <Sheet onClose={() => setConfirm(false)}>
          <p className="font-b text-[19px] leading-[28px]">
            {[...(!g.done[viewer] ? ["내가"] : []), ...waiting.map((p) => `${p.name}님이`)].join(", ")} 아직 고르고 있어요. 지금 주문 문장을 만들까요?
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirm(false)} className="min-h-14 rounded-[15px] border border-[#c9c2b7] font-b text-[17px] text-[#5f5a52]">기다리기</button>
            <button onClick={() => { setConfirm(false); make(); }} className="min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[17px] text-white">지금 만들기</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ---------- Phone ---------- */

export default function GroupPhone({ g, setG, viewer, onOrdered }: { g: Group; setG: SetG; viewer: string; onOrdered: () => void }) {
  const screen = g.screens[viewer] ?? "idle";
  return (
    <div className="relative h-full">
      {screen === "menu" && <GroupMenu g={g} setG={setG} viewer={viewer} />}
      {screen === "cart" && <GroupCart g={g} setG={setG} viewer={viewer} />}
      {screen === "order" && (
        <OrderScreen cart={mergedCart(g)} onBack={() => setG((x) => x && { ...x, screens: { ...x.screens, [viewer]: "cart" } })} onOrdered={onOrdered} />
      )}
      {<Toast g={g} viewer={viewer} setG={setG} />}
    </div>
  );
}
