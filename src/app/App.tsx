import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { Menu } from "./screens/Menu";
import { Detail } from "./screens/Detail";
import { Cart } from "./screens/Cart";
import { Order } from "./screens/Order";
import { Receipt } from "./screens/Receipt";
import { changeQuantity, type CartLine } from "./cart";
import { CompanionNotice } from "@/components/CompanionNotice";
import { MenuTools } from "./MenuTools";
import { useSharedOrder } from "./use-shared-order";
import { sharedView } from "@/lib/shared-order";
import type { Category } from "@/data/menu-schema";
import { readSession, saveSession } from "./session";

// This release starts at the menu board. Older home/camera links also land here.
function readRoute() {
  const route = window.location.hash.slice(2);
  return ["menu", "cart", "order", "receipt"].includes(route) || /^detail\/[^/]+$/.test(route) ? route : "menu";
}
export function App() {
  const [saved] = useState(readSession);
  const [localBoard, setBoard] = useState(saved.board);
  const shared = useSharedOrder();
  const view = shared.snapshot ? sharedView(shared.snapshot, shared.userId) : null;
  const board = shared.snapshot?.board ?? localBoard;
  const [invite, setInvite] = useState(() => /^#\/join\/([a-f0-9]{64})$/.exec(window.location.hash)?.[1] ?? "");
  const [request, setRequest] = useState(saved.request);
  const [tipRate, setTipRate] = useState(saved.tipRate);
  const [route, setRoute] = useState(readRoute);
  const [localCart, setCart] = useState<CartLine[]>(saved.cart);
  const cart = view?.cart ?? (shared.roomId ? [] : localCart);
  const [category, setCategory] = useState<Category>(saved.category);
  const [tip, setTip] = useState(saved.tip);
  const [notice, setNotice] = useState("");
  const item = route.startsWith("detail/") ? board.items.find(item => item.id === route.split("/")[1]) : undefined;
  const activeRoute = route.startsWith("detail/") && !item ? "menu" : route;

  useEffect(() => { const sync = () => { setRoute(readRoute()); setInvite(/^#\/join\/([a-f0-9]{64})$/.exec(window.location.hash)?.[1] ?? ""); }; window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!invite && window.location.hash !== `#/${activeRoute}`) window.history.replaceState(null, "", `#/${activeRoute}`);
  }, [activeRoute, invite]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { saveSession({ board: localBoard, cart: localCart, category, tip, tipRate, request }); }, [localBoard, localCart, category, tip, tipRate, request]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener("backButton", () => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (dialog) { const close = dialog.dispatchEvent(new Event("cancel", { cancelable: true })); if (close && dialog.open) dialog.close(); return; }
      if (activeRoute === "menu") { void NativeApp.minimizeApp(); return; }
      const parent = activeRoute === "receipt" ? "order" : activeRoute === "order" ? "cart" : "menu";
      window.location.hash = `/${parent}`;
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, [activeRoute]);
  function go(next: string) { setNotice(""); window.location.hash = `/${next}`; setRoute(next); }
  async function sharedChange(id: string, action: 'add' | 'remove' | 'increase' | 'decrease') {
    try { await shared.mutate(id, action); }
    catch(error) { setNotice(error instanceof Error ? error.message : "저장하지 못했어요"); }
  }
  function toggle(id: string) {
    if (shared.roomId) { void sharedChange(id, cart.some(line=>line.menuId===id && line.person==='me') ? 'remove' : 'add'); return; }
    setCart(current => current.some(line => line.menuId === id) ? current.filter(line => line.menuId !== id) : [...current, { menuId: id, person: "me", quantity: 1 }]);
  }
  const tools = <MenuTools key={invite || "tools"} board={board} roomId={shared.roomId} invite={invite} notify={setNotice} onPhotos={setBoard} onRoom={id=>{ shared.open(id); setInvite(""); go("menu"); }} onBoard={next=>{ setBoard(next); setCart([]); setCategory(next.categories[0].id); setRequest(""); go("menu"); }} />;
  return <div className="app-shell figma-flow">
    {activeRoute === "cart" ? <Cart people={view?.people} shared={Boolean(shared.roomId)} disabled={Boolean(shared.roomId) && (!shared.connected || shared.pending)} board={board} cart={cart} tip={tip} setTip={setTip} tipRate={tipRate} setTipRate={setTipRate} onQuantity={(id, delta, person) => { if(shared.roomId) { if(person==='me') void sharedChange(id,delta>0?'increase':'decrease'); } else setCart(current => changeQuantity(current, id, delta, person)); }} go={go} />
      : activeRoute === "order" ? <Order board={board} cart={cart} request={request} setRequest={setRequest} go={go} />
      : activeRoute === "receipt" ? <Receipt board={board} cart={cart} tip={tip} tipRate={tipRate} go={go} />
      : item && activeRoute.startsWith("detail/") ? <Detail key={item.id} item={item} source={board.source} added={cart.some(line => line.menuId === item.id && (!shared.roomId || line.person === "me"))} disabled={Boolean(shared.roomId) && (!shared.connected || shared.pending)} onAdd={() => { toggle(item.id); if (!shared.roomId) setNotice("장바구니에 담았어요"); }} go={go} />
      : <Menu tools={tools} people={view?.people} shared={Boolean(shared.roomId)} disabled={Boolean(shared.roomId) && (!shared.connected || shared.pending)} syncMessage={shared.status || (shared.roomId ? shared.connected ? "동반인과 실시간으로 함께 고르고 있어요" : "동반인과 연결하고 있어요" : "")} board={board} cart={cart} category={category} setCategory={setCategory} go={go} onToggle={toggle} />}
    {(activeRoute === "menu" || activeRoute.startsWith("detail/")) && <CompanionNotice activity={shared.activity} />}
    <div className="toast t-body-sm" role="status" aria-live="polite" data-visible={!!notice}>{notice}</div>
  </div>;
}
