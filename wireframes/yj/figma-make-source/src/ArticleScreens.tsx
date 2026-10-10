import { articles, dishArticles, type Article } from "./articles";
import { dishes } from "./data";
import TabBar, { type TabKey } from "./TabBar";

const icBack = "/assets/7449f.svg";

export type OrderedDish = { id: string; qty: number };

function Photo({ a, className }: { a: Article; className: string }) {
  return a.img ? (
    <img src={a.img} alt="" className={`${className} object-cover`} />
  ) : (
    <div className={className} style={{ backgroundImage: a.tint }} aria-hidden />
  );
}

function ArticleCard({ a, big, onOpen }: { a: Article; big?: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left rounded-[18px] bg-white border border-[#e5dfd5] overflow-hidden shadow-[0_4px_12px_rgba(54,46,35,0.06)]">
      <Photo a={a} className="w-full aspect-video" />
      <div className={big ? "p-5" : "p-4"}>
        <p className={`font-b ${big ? "text-[19px] leading-[27px]" : "text-[17px] leading-[25px]"}`}>{a.title}</p>
        <p className="mt-1 font-r text-[15px] leading-[22px] text-[#5f5a52]">{a.summary}</p>
        <p className="mt-2 font-b text-[15px] text-[#b94618]">{a.minutes}분이면 읽어요</p>
      </div>
    </button>
  );
}

export default function ArticleListScreen({
  entry, orderedDishes, banner, onBack, onOpen, onReopenOrder, onNav,
}: {
  entry: "home" | "order";
  orderedDishes?: OrderedDish[];
  banner: boolean;
  onBack: () => void;
  onOpen: (a: Article) => void;
  onReopenOrder: () => void;
  onNav: (t: TabKey) => void;
}) {
  const isOrder = entry === "order" && !!orderedDishes?.length;
  return (
    <div className="flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="홈으로 돌아가기" onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={icBack} alt="" width={24} height={24} /></button>
        <p className="font-b text-[18px] text-center">토스카나 음식 이야기</p>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-4 pb-8 flex flex-col gap-6">
        {isOrder && (
          <>
            {banner && (
              <button onClick={onReopenOrder} className="flex items-center gap-2 h-14 px-4 rounded-[16px] bg-[#fff1e7] text-[#b94618]">
                <span className="grid place-items-center size-6 rounded-full bg-[#e96027]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                <span className="font-b text-[15px]">주문 내역에 저장했어요</span>
                <span className="ml-auto font-b text-[15px]">주문 문장 다시 보기 ›</span>
              </button>
            )}
            <section className="flex flex-col gap-3">
              <h2 className="font-b text-[18px] leading-[26px]">음식 나오기 전에 읽어보세요</h2>
              <p className="-mt-2 font-r text-[15px] text-[#5f5a52]">주문하신 메뉴</p>
              {orderedDishes!.map((o) => {
                const a = dishArticles[o.id];
                return a ? <ArticleCard key={o.id} a={a} big onOpen={() => onOpen(a)} /> : null;
              })}
              <div className="rounded-[18px] bg-white border border-[#e5dfd5] p-5">
                <p className="font-b text-[15px] text-[#b94618]">다 드시고 나면 이렇게 말하세요</p>
                <p className="mt-2 font-xb text-[24px] leading-[32px]">Il conto, per favore</p>
                <p className="mt-1 font-r text-[16px] text-[#5f5a52]">일 콘토, 페르 파보레</p>
                <p className="mt-3 pt-3 border-t border-[#e5dfd5] font-r text-[16px]">뜻 · 계산서 주세요</p>
              </div>
            </section>
            <hr className="border-[#e5dfd5]" />
          </>
        )}
        <section className="flex flex-col gap-3">
          {isOrder && <h2 className="font-b text-[18px] leading-[26px]">토스카나 음식 더 알아보기</h2>}
          {articles.map((a) => <ArticleCard key={a.id} a={a} onOpen={() => onOpen(a)} />)}
        </section>
      </main>

      <TabBar active="home" onNav={onNav} />
    </div>
  );
}

export function ArticleDetailScreen({ a, onBack }: { a: Article; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="grid grid-cols-[48px_1fr_48px] items-center h-14 px-3 shrink-0 border-b border-[#e5dfd5]">
        <button aria-label="목록으로 돌아가기" onClick={onBack} className="grid place-items-center size-12 rounded-full"><img src={icBack} alt="" width={24} height={24} /></button>
        <p className="font-b text-[18px] text-center">토스카나 음식 이야기</p>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto pb-[60px]">
        <Photo a={a} className="w-full aspect-[4/3]" />
        <div className="px-5 pt-6">
          <p className="font-b text-[15px] text-[#b94618]">{a.minutes}분이면 읽어요</p>
          <h1 className="mt-2 font-b text-[24px] leading-[34px] tracking-[-0.5px]">{a.title}</h1>
          <div className="mt-5 flex flex-col gap-5">
            {a.body.map((p, i) => <p key={i} className="font-r text-[17px] leading-[30px] text-[#3a3731]">{p}</p>)}
          </div>
        </div>
      </main>
    </div>
  );
}

export type OrderRecord = { id: string; date: Date; restaurant: string; items: OrderedDish[]; people: string[]; byOwner: Record<string, OrderedDish[]>; ratedBy: string[]; dismissedBy: string[] };

export function OrdersScreen({ orders, viewer, onOpen, onNav, onRate }: { orders: OrderRecord[]; viewer: string; onOpen: (o: OrderRecord) => void; onNav: (t: TabKey) => void; onRate: (o: OrderRecord) => void }) {
  return (
    <div className="flex flex-col h-full bg-[#fffdf9] text-[#292722]">
      <div className="h-[16px] shrink-0" />
      <header className="flex items-center justify-center h-14 shrink-0 border-b border-[#e5dfd5]">
        <p className="font-b text-[18px]">주문 내역</p>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pt-4 pb-8 flex flex-col gap-3">
        {orders.length === 0 && (
          <p className="py-20 text-center font-r text-[16px] leading-[26px] text-[#5f5a52]">아직 저장한 주문이 없어요.<br />주문 문장 화면에서 ‘주문했어요’를 누르면 여기에 쌓여요.</p>
        )}
        {orders.map((o) => (
          <div key={o.id} className="rounded-[18px] bg-white border border-[#e5dfd5] overflow-hidden">
          <button onClick={() => onOpen(o)} className="w-full text-left p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-r text-[15px] text-[#5f5a52]">
                {o.date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} · {o.date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })}
              </p>
              <p className="mt-1 font-b text-[17px]">{o.restaurant}</p>
              <ul className="mt-2 flex flex-col gap-0.5">
                {o.items.map((it) => {
                  const d = dishes.find((x) => x.id === it.id)!;
                  return <li key={it.id} className="font-r text-[15px] leading-[22px]">{d.orig} {it.qty}인분 <span className="text-[#5f5a52]">· {d.name}</span></li>;
                })}
              </ul>
            </div>
            <span className="mt-1 font-b text-[18px] text-[#b94618]">›</span>
          </button>
          <div className="px-4 pb-4">
            {!o.byOwner[viewer]?.length ? null : o.ratedBy.includes(viewer) ? (
              <p className="flex items-center justify-center min-h-12 rounded-[14px] bg-[#f4f1ec] font-b text-[15px] text-[#5f5a52]">평가 완료 ✓</p>
            ) : (
              <button onClick={() => onRate(o)} className="w-full min-h-12 rounded-[14px] border border-[#e96027] font-b text-[16px] text-[#b94618]">메뉴 평가하기</button>
            )}
          </div>
          </div>
        ))}
      </main>
      <TabBar active="orders" onNav={onNav} />
    </div>
  );
}
