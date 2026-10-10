import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

// Two 393×852 phones, 48px apart, with a 32px name label above each.
const STAGE_W = 393 * 2 + 48;
const STAGE_H = 852 + 32;
const PAD = 24;
function useStageScale() {
  const calc = () => Math.min(1, (window.innerWidth - PAD * 2) / STAGE_W, (window.innerHeight - PAD * 2) / STAGE_H);
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const on = () => setScale(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return scale;
}
import TabBar, { CompanionIcon, type TabKey } from "./TabBar";
import ArticleListScreen, { ArticleDetailScreen, OrdersScreen, type OrderRecord, type OrderedDish } from "./ArticleScreens";
import type { Article } from "./articles";
import GroupPhone, { createGroup, members, mergedCart, type Group } from "./GroupScreens";
import CompanionScreen, { TasteScreen, type PendingInvite } from "./CompanionScreen";
import { dishes, initialParty, type Favorite, type Person } from "./data";
import { FloatCard, RateCard, RateSheet, SimpleToast } from "./Rating";
import CameraScreen from "./CameraScreen";
import ReviewScreen from "./ReviewScreen";
import PlaceScreen from "./PlaceScreen";
import DestinationScreen from "./DestinationScreen";
import MenuScreen, { type Cart } from "./MenuScreen";
import CartScreen from "./CartScreen";
import OrderScreen from "./OrderScreen";
import { destinations, type Destination } from "./data";
const a = "/assets";
const icCamera = `${a}/6f9c6.svg`;
const icGallery = `${a}/9c496.svg`;
const icSparkle = `${a}/cc4b1.svg`;
const icArrow = `${a}/0f640.svg`;
const icBook = `${a}/92e5a.svg`;
const icChevron = `${a}/68978.svg`;
const icDish = `${a}/8afca.svg`;
const icPin = `${a}/462bd.svg`;

const recent: RecentItem[] = [
  { name: "Osteria La Solita Zuppa", when: "오늘 · 12:40", dishes: 38, tint: "#f7d9c4" },
  { name: "Trattoria da Enzo", when: "3일 전 · 로마", dishes: 14, tint: "#efe9e0" },
  { name: "Roscioli", when: "4일 전 · 로마", dishes: 22, tint: "#e2ead7" },
  { name: "Pizzeria Ai Marmi", when: "5일 전 · 로마", dishes: 9, tint: "#f3e3c3" },
];

type RecentItem = { name: string; when: string; dishes: number; tint: string; onClick?: () => void; badge?: string };

function Home({ onCapture, onDestination, dest, onArticles, onNav, floating, initial, companionTitle, companionSub, recentExtra, onCompanion }: {
  onCapture: () => void; onDestination: () => void; dest: Destination; onArticles: () => void; onNav: (t: TabKey) => void; floating?: ReactNode;
  initial: string; companionTitle: string; companionSub: string; recentExtra?: RecentItem; onCompanion: () => void;
}) {
  const recentList: RecentItem[] = recentExtra ? [recentExtra, ...recent] : recent;
  const city = dest.label.split(" · ")[1] ?? dest.label;
  return (
    <>
      <div className="relative flex flex-col h-full bg-[#fffdf9] text-[#292722]">
        {/* Status bar spacer */}
        <div className="h-[16px] shrink-0" />

        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between px-5 border-b border-[#e5dfd5]/70">
          <button onClick={onDestination} aria-label="여행지 선택" className="flex items-center gap-1.5 min-h-12 -ml-1 px-1">
            <img src={icPin} alt="" width={19} height={24} />
            <span className="font-xb text-[18px] leading-[26px]">{dest.label}</span>
            <span className="font-xb text-[16px] text-[#5f5a52] -mt-1.5">⌄</span>
          </button>
          <button aria-label="프로필" className="grid place-items-center size-12">
            <span className="grid place-items-center size-9 rounded-full bg-[#e2ead7] border-2 border-[#fffdf9] font-xb text-[14px] text-[#52623a]">{initial}</span>
          </button>
        </header>

        {/* Scrollable content */}
        <main className={`no-scrollbar flex-1 overflow-y-auto px-5 pt-4 flex flex-col gap-6 ${floating ? "pb-[168px]" : "pb-6"}`}>
          {/* Main CTA */}
          <section
            className="rounded-[24px] p-5 text-white shadow-[0_10px_24px_rgba(193,68,21,0.25)]"
            style={{ backgroundImage: "linear-gradient(158deg, #df5722 4%, #ed783d 96%)" }}
          >
            <p className="font-b text-[15px] leading-[22px] text-white/90">모르는 메뉴도 걱정 마세요</p>
            <h1 className="font-r text-[26px] leading-[36px] mt-1">메뉴판을 촬영해보세요</h1>
            <p className="font-r text-[15px] leading-[22px] text-white/90 mt-1">한국어 번역과 음식 설명을 바로 보여드려요</p>
            <button onClick={onCapture} className="mt-5 flex w-full h-16 items-center justify-center gap-2.5 rounded-[16px] bg-white shadow-[0_4px_10px_rgba(120,40,10,0.15)] active:scale-[0.99] transition">
              <img src={icCamera} alt="" width={21} height={24} />
              <span className="font-xb text-[20px] text-[#b94618]">메뉴판 찍기</span>
            </button>
            <button className="mt-2 flex w-full h-12 items-center justify-center gap-2 rounded-[14px] bg-white/15">
              <img src={icGallery} alt="" width={19} height={24} />
              <span className="font-b text-[16px]">사진에서 선택</span>
            </button>
          </section>

          {/* Recent menus */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-b text-[18px] leading-[26px]">최근 찍은 메뉴판</h2>
              <button className="font-b text-[15px] text-[#b94618] min-h-12 px-1">전체 보기</button>
            </div>
            <div className="no-scrollbar -mx-5 px-5 flex gap-3 overflow-x-auto">
              {recentList.map((r) => (
                <button key={r.name + r.when} onClick={r.onClick} className={`relative shrink-0 w-[148px] text-left rounded-[18px] bg-white border overflow-hidden shadow-[0_4px_12px_rgba(54,46,35,0.06)] ${r.badge ? "border-[#e96027]" : "border-[#e5dfd5]"}`}>
                  {r.badge && <span className="absolute right-2 top-2 grid place-items-center size-7 rounded-full bg-[#8a5a3c] border-2 border-white font-b text-[12px] text-white">{r.badge}</span>}
                  <div className="h-[80px] p-3 flex flex-col gap-1.5" style={{ background: r.tint }}>
                    <span className="h-1.5 w-16 rounded bg-black/15" />
                    <span className="h-1.5 w-24 rounded bg-black/10" />
                    <span className="h-1.5 w-20 rounded bg-black/10" />
                    <span className="h-1.5 w-14 rounded bg-black/10" />
                  </div>
                  <div className="p-3">
                    <p className="font-b text-[15px] leading-[22px] truncate">{r.name}</p>
                    <p className="font-r text-[13px] leading-[20px] text-[#5f5a52]">{r.when} · {r.dishes}개</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Companion allergy summary */}
          <button onClick={onCompanion} className="flex w-full items-center gap-3 rounded-[18px] bg-[#f4f7ef] border border-[#dfe7d3] px-4 py-3 min-h-16 text-left">
            <span className="grid place-items-center size-10 shrink-0 rounded-[12px] bg-[#e2ead7]"><CompanionIcon /></span>
            <span className="flex-1 min-w-0">
              <span className="block font-b text-[15px] leading-[22px]">{companionTitle}</span>
              <span className="block font-r text-[15px] leading-[22px] text-[#52623a] truncate">{companionSub}</span>
            </span>
            <img src={icChevron} alt="" width={18} height={24} />
          </button>

          {/* Restaurant recommendation */}
          <section className="rounded-[20px] bg-white border border-[#e5dfd5] p-4 shadow-[0_4px_12px_rgba(54,46,35,0.06)]">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center size-10 shrink-0 rounded-[12px] bg-[#ffddc6]">
                <img src={icSparkle} alt="" width={21} height={24} />
              </span>
              <div className="min-w-0">
                <h2 className="font-r text-[19px] leading-[27px]">{city}에서 뭐 먹지?</h2>
                <p className="font-r text-[15px] leading-[22px] text-[#5f5a52]">현재 위치를 기준으로 식당을 추천해줄게요</p>
              </div>
            </div>
            <button className="mt-3 flex w-full h-12 items-center justify-center gap-1 rounded-[14px] bg-[#fff1e7]">
              <span className="font-xb text-[16px] text-[#b94618]">식당 추천 받기</span>
              <img src={icArrow} alt="" width={15} height={24} />
            </button>
          </section>

          {/* Explore */}
          <section>
            <h2 className="font-b text-[18px] leading-[26px] mb-3">토스카나 미식 가이드</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: icBook, title: "현지 문화 알아보기", sub: "식사 예절과 식당 이용법" },
                { icon: icDish, title: "대표 음식 둘러보기", sub: "토스카나에서 만날 음식" },
              ].map((c) => (
                <button key={c.title} onClick={onArticles} className="flex flex-col items-start text-left rounded-[18px] bg-white border border-[#e5dfd5] p-4 min-h-[132px]">
                  <span className="grid place-items-center size-10 rounded-[12px] bg-[#ffddc6]">
                    <img src={c.icon} alt="" width={24} height={24} />
                  </span>
                  <span className="mt-3 font-b text-[16px] leading-[23px]">{c.title}</span>
                  <span className="mt-0.5 font-r text-[15px] leading-[21px] text-[#5f5a52]">{c.sub}</span>
                </button>
              ))}
            </div>
          </section>
        </main>

        {/* Bottom tab bar + home indicator */}
        {floating}
        <TabBar active="home" onNav={onNav} />
      </div>
    </>
  );
}

type Screen = "home" | "destination" | "camera" | "review" | "place" | "menu" | "cart" | "order" | "articles" | "article" | "orderView" | "orders" | "companion" | "taste";
type ArticleCtx = { entry: "home" | "order"; orderedDishes?: OrderedDish[]; banner: boolean };
type Connections = Record<string, string[]>;

import { RESTAURANT } from "./data";
const toItems = (c: Cart): OrderedDish[] => Object.entries(c).filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty }));
const toCart = (items: OrderedDish[]): Cart => Object.fromEntries(items.map((i) => [i.id, i.qty]));
const personOf = (id: string) => initialParty.find((p) => p.id === id)!;

type Shared = {
  group: Group | null;
  setGroup: Dispatch<SetStateAction<Group | null>>;
  orders: OrderRecord[];
  setOrders: Dispatch<SetStateAction<OrderRecord[]>>;
  connections: Connections; // this-trip companions
  setConnections: Dispatch<SetStateAction<Connections>>;
  friends: Connections;
  setFriends: Dispatch<SetStateAction<Connections>>;
  favorites: Record<string, Favorite[]>;
  setFavorites: Dispatch<SetStateAction<Record<string, Favorite[]>>>;
  placeOrder: (cart: Cart, by: string) => void;
};

/** One phone running the full app for `viewer`; everything shared lives in App. */
function useIsPhone() {
  const calc = () => new URLSearchParams(location.search).has("phone") || window.matchMedia("(max-width: 600px)").matches;
  const [v, setV] = useState(calc);
  useEffect(() => {
    const on = () => setV(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

function Phone({ viewer, shared }: { viewer: string; shared: Shared }) {
  const { group, setGroup, orders, setOrders, connections, setConnections, friends, setFriends, favorites, setFavorites, placeOrder } = shared;
  const me = personOf(viewer);
  const companionIds = connections[viewer] ?? [];
  const companions = companionIds.map(personOf).filter(Boolean);
  // Party as seen from this phone: the viewer is "나".
  const party = [viewer, ...companionIds].map((id) => ({ ...personOf(id), isMe: id === viewer }));

  const [screen, setScreen] = useState<Screen>("home");
  const [shots, setShots] = useState<string[]>([]);
  const [dest, setDest] = useState<Destination>(destinations[0]);
  const [generic, setGeneric] = useState(false);
  const toMenu = (gen: boolean) => { setGeneric(gen); if (companionIds.length) setGroup({ ...createGroup(cart, companionIds, viewer), generic: gen, photo: shots[0] }); else setScreen("menu"); };
  const [cart, setCart] = useState<Cart>({});
  const [ctx, setCtx] = useState<ArticleCtx>({ entry: "home", banner: false });
  const [article, setArticle] = useState<Article | null>(null);
  // Becomes true once the viewer comes back home after an order (meal finished).
  const [mealDone, setMealDone] = useState(false);
  const [rating, setRating] = useState<OrderRecord | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [taste, setTaste] = useState<Person | null>(null);
  const friendList = (friends[viewer] ?? []).filter((id) => !companionIds.includes(id)).map(personOf);
  // Trip membership is mutual: both people see each other as this trip's companion.
  const addTrip = (ids: string[]) =>
    setConnections((c) => {
      const n = { ...c, [viewer]: Array.from(new Set([...(c[viewer] ?? []), ...ids])) };
      for (const id of ids) n[id] = Array.from(new Set([...(c[id] ?? []), viewer]));
      return n;
    });
  const removeTrip = (id: string) =>
    setConnections((c) => ({ ...c, [viewer]: (c[viewer] ?? []).filter((x) => x !== id), [id]: (c[id] ?? []).filter((x) => x !== viewer) }));

  const myOrders = orders.filter((o) => o.people.includes(viewer));
  const patchOrder = (id: string, f: (o: OrderRecord) => Partial<OrderRecord>) => setOrders((os) => os.map((o) => (o.id === id ? { ...o, ...f(o) } : o)));
  const pendingRate = myOrders.find((o) => o.byOwner[viewer]?.length && !o.ratedBy.includes(viewer));
  const showRate = mealDone && pendingRate && !pendingRate.dismissedBy.includes(viewer);

  // Group the viewer was asked to join but hasn't opened yet.
  const joinable = group && group.host !== viewer && group.members.includes(viewer) && !group.seen.includes(viewer) ? group : null;
  const showJoin = joinable && !joinable.later.includes(viewer);
  const join = () => setGroup((g) => g && { ...g, seen: [...g.seen, viewer], screens: { ...g.screens, [viewer]: "menu" } });

  const openArticles = (c: ArticleCtx) => { setCtx(c); setScreen("articles"); };

  // When an order including this viewer is placed (on either phone), jump to the post-order articles.
  const seenOrder = useRef(orders[0]?.id);
  useEffect(() => {
    const o = orders[0];
    if (!o || o.id === seenOrder.current) return;
    seenOrder.current = o.id;
    if (!o.people.includes(viewer)) return;
    setCart({});
    setShots([]);
    setMealDone(false);
    openArticles({ entry: "order", orderedDishes: o.items, banner: true });
  }, [orders, viewer]);

  const goHome = () => {
    if (screen === "articles" || screen === "article") setMealDone(true);
    setScreen("home");
  };
  const onNav = (t: TabKey) => {
    if (t === "home") goHome();
    if (t === "orders") setScreen("orders");
    if (t === "companion") setScreen("companion");
  };
  const finishRating = (r: { dishId: string; verdict: string; tags: string[] }[]) => {
    if (!rating) return;
    const liked = r.filter((x) => x.verdict === "good" || x.tags.includes("또 먹고 싶어요"));
    if (liked.length)
      setFavorites((f) => ({ ...f, [viewer]: [...liked.map((x) => ({ dishId: x.dishId, restaurant: rating.restaurant, city: dest.sub, date: new Date() })), ...(f[viewer] ?? [])] }));
    patchOrder(rating.id, (o) => ({ ratedBy: [...o.ratedBy, viewer] }));
    setRating(null);
    setToastText("평가해주셔서 고마워요. 다음 추천에 반영할게요");
    setTimeout(() => setToastText(null), 2600);
  };
  const invite = (name: string) => {
    const id = `p${Date.now()}`;
    setPending((x) => [...x, { id, name }]);
    // Prototype: the invitee accepts a few seconds later.
    setTimeout(() => {
      initialParty.push({ id, name, allergies: [], dislikes: [] });
      setPending((x) => x.filter((p) => p.id !== id));
      setFriends((c) => ({ ...c, [viewer]: [...(c[viewer] ?? []), id] }));
    }, 4000);
  };

  const inGroup = group && group.screens[viewer] && group.screens[viewer] !== "idle";
  if (inGroup) return <GroupPhone g={group} setG={setGroup} viewer={viewer} onOrdered={() => placeOrder(mergedCart(group), viewer)} />;

  const restrict = Array.from(new Set(companions.flatMap((p) => [...p.allergies, ...p.dislikes])));
  const floating = showJoin ? (
    <FloatCard
      visual={<span className="grid place-items-center size-12 rounded-full bg-[#8a5a3c] font-b text-[18px] text-white">{personOf(joinable.host).name[0]}</span>}
      title={`${personOf(joinable.host).name}님이 메뉴판을 찍었어요`}
      sub={`${joinable.restaurant} · 같이 골라볼까요?`}
      primary="같이 고르기"
      onPrimary={join}
      onLater={() => setGroup((g) => g && { ...g, later: [...g.later, viewer] })}
    />
  ) : showRate ? (
    <RateCard order={pendingRate} viewer={viewer} onRate={() => setRating(pendingRate)} onDismiss={() => patchOrder(pendingRate.id, (o) => ({ dismissedBy: [...o.dismissedBy, viewer] }))} />
  ) : undefined;

  return (
    <>
      {screen === "home" && (
        <Home
          dest={dest}
          onNav={onNav}
          floating={floating}
          initial={me.name[0]}
          companionTitle={companions.length ? `동반인 ${companions.length}명 · ${companions.map((p) => p.name + "님").join(", ")}` : "동반인을 연결해보세요"}
          companionSub={restrict.length ? `${restrict.join(", ")}는 메뉴에서 표시해드려요` : "알레르기와 못 먹는 음식을 함께 확인해요"}
          onCompanion={() => setScreen("companion")}
          recentExtra={joinable ? { name: joinable.restaurant, when: `방금 · ${personOf(joinable.host).name}님`, dishes: dishes.length, tint: "#ffe2cf", onClick: join, badge: personOf(joinable.host).name[0] } : undefined}
          onArticles={() => openArticles({ entry: "home", banner: false })}
          onDestination={() => setScreen("destination")}
          onCapture={() => { setShots([]); setScreen("camera"); }}
        />
      )}
      {screen === "destination" && <DestinationScreen current={dest} onBack={() => setScreen("home")} onSelect={(d) => { setDest(d); setScreen("home"); }} />}
      {screen === "camera" && (
        <CameraScreen
          count={shots.length}
          onClose={() => setScreen(shots.length ? "review" : "home")}
          onShot={(img) => { setShots((s) => [...s, img]); setScreen("review"); }}
        />
      )}
      {screen === "review" && (
        <ReviewScreen
          shots={shots}
          onBack={() => setScreen("home")}
          onMore={() => setScreen("camera")}
          onConfirm={() => setScreen("place")}
        />
      )}
      {screen === "place" && (
        <PlaceScreen onBack={() => setScreen("review")} onYes={() => toMenu(false)} onNo={() => toMenu(true)} />
      )}
      {screen === "menu" && <MenuScreen generic={generic} party={party} cart={cart} setCart={setCart} photo={shots[0]} onBack={() => setScreen("place")} onCart={() => setScreen("cart")} />}
      {screen === "cart" && <CartScreen cart={cart} setCart={setCart} onBack={() => setScreen("menu")} onOrder={() => setScreen("order")} />}
      {screen === "order" && <OrderScreen cart={cart} onBack={() => setScreen("cart")} onOrdered={() => placeOrder(cart, viewer)} />}
      {screen === "articles" && (
        <ArticleListScreen
          {...ctx}
          onBack={goHome}
          onOpen={(a) => { setArticle(a); setScreen("article"); }}
          onReopenOrder={() => setScreen("orderView")}
          onNav={onNav}
        />
      )}
      {screen === "article" && article && <ArticleDetailScreen a={article} onBack={() => setScreen("articles")} />}
      {screen === "orderView" && ctx.orderedDishes && <OrderScreen readOnly cart={toCart(ctx.orderedDishes)} onBack={() => setScreen("articles")} />}
      {screen === "companion" && (
        <CompanionScreen me={me} trip={companions} friends={friendList} pending={pending} onInvite={invite} onAddTrip={addTrip} onRemoveTrip={removeTrip} onTaste={(p) => { setTaste(p); setScreen("taste"); }} onNav={onNav} />
      )}
      {screen === "taste" && taste && <TasteScreen p={taste} favorites={favorites[taste.id] ?? []} onBack={() => setScreen("companion")} />}
      {screen === "orders" && <OrdersScreen orders={myOrders} viewer={viewer} onNav={onNav} onRate={setRating} onOpen={(o) => openArticles({ entry: "order", orderedDishes: o.items, banner: false })} />}
      {rating && <RateSheet order={rating} viewer={viewer} onClose={() => setRating(null)} onDone={finishRating} />}
      {toastText && <SimpleToast text={toastText} />}
    </>
  );
}

export default function App() {
  const scale = useStageScale();
  const isPhone = useIsPhone();
  const [group, setGroup] = useState<Group | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  // Companions connected in the 동반인 tab; 성호 and 미영 start connected.
  const [connections, setConnections] = useState<Connections>({ me: ["miyoung"], miyoung: ["me"] });
  // Friend list (superset of trip companions).
  const [friends, setFriends] = useState<Connections>({ me: ["miyoung", "park", "kim"], miyoung: ["me", "park", "kim"] });
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
  const [favorites, setFavorites] = useState<Record<string, Favorite[]>>({
    miyoung: [
      { dishId: "maiale", restaurant: "Trattoria da Enzo", city: "Roma", date: daysAgo(1) },
      { dishId: "guancia", restaurant: "Roscioli", city: "Roma", date: daysAgo(2) },
    ],
    me: [{ dishId: "cinghiale", restaurant: "Roscioli", city: "Roma", date: daysAgo(2) }],
    park: [{ dishId: "baccala", restaurant: "Da Teo", city: "Roma", date: daysAgo(5) }],
  });

  const placeOrder = (cart: Cart, by: string) => {
    const g = group && group.screens[by] && group.screens[by] !== "idle" ? group : null;
    const people = g ? members(g) : [by];
    const byOwner: Record<string, OrderedDish[]> = g
      ? Object.fromEntries(people.map((pid) => [pid, g.items.filter((i) => i.owner === pid).map((i) => ({ id: i.dishId, qty: i.qty }))]))
      : { [by]: toItems(cart) };
    setOrders((o) => [{ id: String(Date.now()), date: new Date(), restaurant: g ? g.restaurant : RESTAURANT, items: toItems(cart), people, byOwner, ratedBy: [], dismissedBy: [] }, ...o]);
    if (g) setGroup(null);
  };
  const shared: Shared = { group, setGroup, orders, setOrders, connections, setConnections, friends, setFriends, favorites, setFavorites, placeOrder };

  // Phone test mode: 미영 is scripted. She opens the invite, picks fixed dishes, and says she's done.
  const hasGroup = !!group;
  useEffect(() => {
    if (!isPhone || !hasGroup) return;
    const MIYOUNG_PICKS = [{ dishId: "maiale", qty: 1 }, { dishId: "cacio", qty: 1 }];
    const upd = (f: (g: Group) => Group) => setGroup((g) => (g && g.members.includes("miyoung") ? f(g) : g));
    const timers = [
      setTimeout(() => upd((g) => (g.seen.includes("miyoung") ? g : { ...g, seen: [...g.seen, "miyoung"], screens: { ...g.screens, miyoung: "menu" } })), 2500),
      setTimeout(() => upd((g) => (g.items.some((i) => i.owner === "miyoung") ? g : { ...g, items: [...g.items, ...MIYOUNG_PICKS.map((x) => ({ key: `miyoung-${x.dishId}`, dishId: x.dishId, owner: "miyoung", qty: x.qty, addedBy: "miyoung" }))] })), 5500),
      setTimeout(() => upd((g) => ({ ...g, done: { ...g.done, miyoung: true }, toasts: { ...g.toasts, me: { id: Date.now(), text: "미영님이 다 골랐어요" } } })), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isPhone, hasGroup]);

  // Test mode: on a real phone (narrow screen or ?phone), show only 성호's screen full-bleed.
  if (isPhone) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-[#fffdf9] isolate">
        <Phone viewer="me" shared={shared} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-[#e9e6df]">
      <div style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className="flex items-start gap-12 origin-top-left" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
          {[{ id: "me", label: "성호" }, { id: "miyoung", label: "미영" }].map((ph) => (
            <div key={ph.id}>
              <p className="h-8 text-center font-b text-[17px] text-[#5f5a52]">{ph.label}</p>
              <div className="relative w-[393px] h-[852px] overflow-hidden bg-[#fffdf9] shadow-xl rounded-[28px] isolate">
                <Phone viewer={ph.id} shared={shared} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
