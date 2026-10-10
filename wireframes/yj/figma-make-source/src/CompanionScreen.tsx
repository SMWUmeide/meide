import { useState, type ReactNode } from "react";
import DishImg from "./DishImg";
import TabBar, { type TabKey } from "./TabBar";
import { dishes, type Favorite, type Person } from "./data";

export type PendingInvite = { id: string; name: string };

const icBack = "/assets/7449f.svg";

function Initial({ p, size }: { p: Person; size: number }) {
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.38 }} className="grid place-items-center shrink-0 rounded-full bg-[#8a5a3c] font-b text-white">
      {p.name[0]}
    </span>
  );
}

function AllergyChip({ t }: { t: string }) {
  return <span className="inline-flex h-8 items-center rounded-full bg-[#FDECEA] border border-[#F4C7C3] px-3 font-b text-[15px] text-[#B3261E]">{t}</span>;
}
function DislikeChip({ t }: { t: string }) {
  return <span className="inline-flex h-8 items-center rounded-full bg-[#F4EEE6] px-3 font-b text-[15px] text-[#5E4A3A]">{t}</span>;
}

function Summary({ p }: { p: Person }) {
  if (!p.allergies.length && !p.dislikes.length) return <p className="mt-3 font-r text-[15px] text-[#5f5a52]">등록된 알레르기·못 먹는 음식이 없어요</p>;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {p.allergies.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-[60px] font-r text-[15px] text-[#5f5a52]">알레르기</span>
          {p.allergies.map((t) => <AllergyChip key={t} t={t} />)}
        </div>
      )}
      {p.dislikes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-[60px] font-r text-[15px] text-[#5f5a52]">못 먹음</span>
          {p.dislikes.map((t) => <DislikeChip key={t} t={t} />)}
        </div>
      )}
    </div>
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

export default function CompanionScreen({
  me, trip, friends, pending, onInvite, onAddTrip, onRemoveTrip, onTaste, onNav,
}: {
  me: Person;
  trip: Person[];
  friends: Person[];
  pending: PendingInvite[];
  onInvite: (name: string) => void;
  onAddTrip: (ids: string[]) => void;
  onRemoveTrip: (id: string) => void;
  onTaste: (p: Person) => void;
  onNav: (t: TabKey) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState<Person | null>(null);
  const [picking, setPicking] = useState(false);
  const [sel, setSel] = useState<string[]>([]);

  const send = async () => {
    const n = name.trim();
    if (!n) return;
    try {
      await navigator.share?.({ title: "친구 추가", text: `${me.name}님이 메뉴판 번역·미식 가이드에서 친구로 연결하고 싶어해요.` });
    } catch { /* share cancelled */ }
    onInvite(n);
    setName("");
    setAdding(false);
  };
  const addFromFriends = (
    <button onClick={() => { setSel([]); setPicking(true); }} className="w-full min-h-12 rounded-[14px] border border-[#e96027] bg-white font-b text-[16px] text-[#b94618]">
      + 친구 목록에서 추가
    </button>
  );

  return (
    <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="flex items-center justify-center h-14 shrink-0 border-b border-[#e5dfd5]">
        <p className="font-b text-[18px]">동반인</p>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-5 pb-8 flex flex-col gap-8">
        {/* Section 1 */}
        <section>
          <h2 className="font-b text-[18px] leading-[26px]">이번 여행 동반인</h2>
          <p className="mt-1 font-r text-[15px] leading-[22px] text-[#5f5a52]">식당에서 메뉴판을 같이 고르고, 알레르기도 메뉴에 함께 표시돼요.</p>
          <div className="mt-3 flex flex-col gap-3">
            {trip.length === 0 && (
              <div className="rounded-[18px] border border-dashed border-[#d9d3c9] px-4 py-6 text-center">
                <p className="font-b text-[16px] text-[#5f5a52]">혼자 여행 중이에요</p>
              </div>
            )}
            {trip.map((p) => (
              <article key={p.id} className="rounded-[18px] bg-white border border-[#e5dfd5] p-4">
                <div className="flex items-center gap-3">
                  <Initial p={p} size={48} />
                  <p className="flex-1 font-b text-[18px]">{p.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1e7] px-2.5 py-1 font-b text-[15px] text-[#b94618]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 17h20M5 17l2-9h10l2 9M9 8V5h6v3" /></svg>
                    함께 여행 중
                  </span>
                </div>
                <Summary p={p} />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => onTaste(p)} className="h-12 rounded-[14px] bg-[#fff5ee] font-b text-[16px] text-[#b94618]">입맛 보기</button>
                  <button onClick={() => setRemoving(p)} className="h-12 rounded-[14px] border border-[#d9d3c9] font-b text-[16px] text-[#5f5a52]">이번 여행에서 빼기</button>
                </div>
              </article>
            ))}
            {addFromFriends}
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="font-b text-[18px] leading-[26px]">친구 목록</h2>
          <p className="mt-1 font-r text-[15px] leading-[22px] text-[#5f5a52]">연결된 친구의 입맛을 볼 수 있어요. 여행에 함께하면 위로 올려주세요.</p>
          <ul className="mt-2">
            {friends.map((p) => (
              <li key={p.id} className="border-b border-[#e5dfd5]">
                <button onClick={() => onTaste(p)} className="flex w-full items-center gap-3 min-h-[72px] text-left">
                  <Initial p={p} size={40} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-b text-[16px]">{p.name}</span>
                    <span className="block font-r text-[15px] text-[#5f5a52] truncate">{p.taste ?? "아직 입맛 정보가 없어요"}</span>
                  </span>
                  <span className="flex items-center min-h-12 font-b text-[15px] text-[#b94618]">입맛 보기 ›</span>
                </button>
              </li>
            ))}
            {pending.map((p) => (
              <li key={p.id} className="flex items-center gap-3 min-h-[72px] border-b border-[#e5dfd5]">
                <span className="grid place-items-center size-10 rounded-full bg-[#e5dfd5] font-b text-[15px] text-[#5f5a52]">{p.name[0]}</span>
                <span className="flex-1 font-b text-[16px]">{p.name}</span>
                <span className="font-r text-[15px] text-[#b94618]">수락 기다리는 중…</span>
              </li>
            ))}
            {friends.length === 0 && pending.length === 0 && <li className="py-6 text-center font-r text-[15px] text-[#5f5a52]">아직 친구가 없어요</li>}
          </ul>
          <button onClick={() => setAdding(true)} className="mt-5 w-full min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[18px] text-white">친구 추가</button>
        </section>
      </main>
      <TabBar active="companion" onNav={onNav} />

      {adding && (
        <Sheet onClose={() => setAdding(false)}>
          <p className="font-b text-[20px] leading-[28px]">친구를 초대해요</p>
          <p className="mt-1 font-r text-[15px] text-[#5f5a52]">초대 링크를 카카오톡이나 문자로 보내고, 상대가 수락하면 친구 목록에 추가돼요.</p>
          <label className="mt-4 block">
            <span className="font-b text-[15px] text-[#5f5a52]">이름</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 민수" className="mt-1.5 w-full min-h-14 rounded-[14px] border border-[#c9c2b7] px-4 font-r text-[17px] outline-none focus:border-[#e96027]" />
          </label>
          <button disabled={!name.trim()} onClick={send} className="mt-4 w-full min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[18px] text-white disabled:opacity-40">초대 링크 보내기</button>
        </Sheet>
      )}

      {removing && (
        <Sheet onClose={() => setRemoving(null)}>
          <p className="font-b text-[20px] leading-[28px]">{removing.name}님을 이번 여행에서 뺄까요?</p>
          <p className="mt-1 font-r text-[15px] text-[#5f5a52]">친구 목록에는 그대로 남아요.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => setRemoving(null)} className="min-h-14 rounded-[15px] border border-[#c9c2b7] font-b text-[17px] text-[#5f5a52]">취소</button>
            <button onClick={() => { onRemoveTrip(removing.id); setRemoving(null); }} className="min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[17px] text-white">빼기</button>
          </div>
        </Sheet>
      )}

      {picking && (
        <Sheet onClose={() => setPicking(false)}>
          <p className="font-b text-[20px] leading-[28px]">이번 여행에 함께할 친구를 골라주세요</p>
          <div className="mt-4 flex flex-col gap-2">
            {friends.length === 0 && <p className="py-4 font-r text-[15px] text-[#5f5a52]">추가할 수 있는 친구가 없어요. 먼저 친구를 추가해주세요.</p>}
            {friends.map((p) => {
              const on = sel.includes(p.id);
              return (
                <button key={p.id} role="checkbox" aria-checked={on} onClick={() => setSel(on ? sel.filter((x) => x !== p.id) : [...sel, p.id])} className={`flex items-center gap-3 min-h-14 px-4 rounded-[14px] border ${on ? "border-[#e96027] bg-[#fff3e7]" : "border-[#e5dfd5]"}`}>
                  <span className={`grid place-items-center size-6 rounded-[7px] border-2 ${on ? "bg-[#e96027] border-[#e96027]" : "border-[#c9c2b7]"}`}>
                    {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                  </span>
                  <Initial p={p} size={32} />
                  <span className="flex-1 text-left font-b text-[16px]">{p.name}</span>
                </button>
              );
            })}
          </div>
          <button disabled={!sel.length} onClick={() => { onAddTrip(sel); setPicking(false); }} className="mt-5 w-full min-h-14 rounded-[15px] bg-[#e96027] font-xb text-[18px] text-white disabled:opacity-40">이번 여행에 추가</button>
        </Sheet>
      )}
    </div>
  );
}

export function TasteScreen({ p, favorites, onBack }: { p: Person; favorites: Favorite[]; onBack: () => void }) {
  const Block = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="rounded-[18px] bg-white border border-[#e5dfd5] p-4">
      <h2 className="font-b text-[16px]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
  const none = <p className="font-r text-[15px] text-[#5f5a52]">없어요</p>;
  return (
    <div className="flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="뒤로 가기" onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={icBack} alt="" width={24} height={24} /></button>
        <p className="font-b text-[18px] text-center">{p.name}님의 입맛</p>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-6 pb-10 flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2 pb-3">
          <Initial p={p} size={64} />
          <p className="font-b text-[20px]">{p.name}</p>
        </div>
        <Block title="알레르기">{p.allergies.length ? <div className="flex flex-wrap gap-2">{p.allergies.map((t) => <AllergyChip key={t} t={t} />)}</div> : none}</Block>
        <Block title="못 먹는 음식">{p.dislikes.length ? <div className="flex flex-wrap gap-2">{p.dislikes.map((t) => <DislikeChip key={t} t={t} />)}</div> : none}</Block>
        <Block title="좋아하는 맛">
          {p.likes?.length ? (
            <div className="flex flex-wrap gap-2">
              {p.likes.map((t) => <span key={t} className="inline-flex h-8 items-center rounded-full bg-[#fff1e7] px-3 font-b text-[15px] text-[#b94618]">{t}</span>)}
            </div>
          ) : none}
        </Block>
        <Block title="최근 맛있게 먹은 메뉴">
          {favorites.length ? (
            <ul className="flex flex-col divide-y divide-[#efe9df]">
              {favorites.map((f, i) => {
                const d = dishes.find((x) => x.id === f.dishId)!;
                return (
                  <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <DishImg d={d} className="size-14 rounded-[12px]" />
                    <div className="min-w-0">
                      <p className="font-b text-[16px] leading-[23px]">{d.name}</p>
                      <p className="font-r text-[15px] text-[#5f5a52]">{f.restaurant} · {f.city}</p>
                      <p className="font-r text-[15px] text-[#5f5a52]">{f.date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="font-r text-[15px] text-[#5f5a52]">아직 평가한 메뉴가 없어요</p>}
        </Block>
        <p className="pt-2 text-center font-r text-[15px] text-[#5f5a52]">친구가 공개한 정보만 보여요.</p>
      </main>
    </div>
  );
}
