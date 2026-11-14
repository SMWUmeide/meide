import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { Menu } from "./screens/Menu";
import { Detail } from "./screens/Detail";
import { Cart } from "./screens/Cart";
import { Order } from "./screens/Order";
import { Receipt } from "./screens/Receipt";
import { changeQuantity, type CartLine } from "./cart";
import type { Category } from "@/data/menu-schema";
import { readSession, saveSession } from "./session";

// This release starts at the menu board. Older home/camera links also land here.
function readRoute() {
  const route = window.location.hash.slice(2);
  return ["menu", "cart", "order", "receipt"].includes(route) || /^detail\/[^/]+$/.test(route) ? route : "menu";
}
export function App() {
  const [saved] = useState(readSession);
  const board = saved.board;
  const [request, setRequest] = useState(saved.request);
  const [tipRate, setTipRate] = useState(saved.tipRate);
  const [route, setRoute] = useState(readRoute);
  const [cart, setCart] = useState<CartLine[]>(saved.cart);
  const [category, setCategory] = useState<Category>(saved.category);
  const [tip, setTip] = useState(saved.tip);
  const [notice, setNotice] = useState("");
  const item = route.startsWith("detail/") ? board.items.find(item => item.id === route.split("/")[1]) : undefined;
  const activeRoute = route.startsWith("detail/") && !item ? "menu" : route;

  useEffect(() => { const sync = () => setRoute(readRoute()); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.hash !== `#/${activeRoute}`) window.history.replaceState(null, "", `#/${activeRoute}`);
  }, [activeRoute]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { saveSession({ board, cart, category, tip, tipRate, request }); }, [board, cart, category, tip, tipRate, request]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener("backButton", () => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (dialog) { dialog.dispatchEvent(new Event("cancel", { cancelable: true })); if (dialog.open) dialog.close(); return; }
      if (activeRoute === "menu") { void NativeApp.minimizeApp(); return; }
      const parent = activeRoute === "receipt" ? "order" : activeRoute === "order" ? "cart" : "menu";
      window.location.hash = `/${parent}`;
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, [activeRoute]);
  function go(next: string) { setNotice(""); window.location.hash = `/${next}`; setRoute(next); }
  function toggle(id: string) {
    setCart(current => current.some(line => line.menuId === id) ? current.filter(line => line.menuId !== id) : [...current, { menuId: id, person: "me", quantity: 1 }]);
  }
  return <div className="app-shell figma-flow">
    {activeRoute === "cart" ? <Cart board={board} cart={cart} tip={tip} setTip={setTip} tipRate={tipRate} setTipRate={setTipRate} onQuantity={(id, delta, person) => setCart(current => changeQuantity(current, id, delta, person))} go={go} />
      : activeRoute === "order" ? <Order board={board} cart={cart} request={request} setRequest={setRequest} go={go} />
      : activeRoute === "receipt" ? <Receipt board={board} cart={cart} tip={tip} tipRate={tipRate} go={go} />
      : item && activeRoute.startsWith("detail/") ? <Detail key={item.id} item={item} source={board.source} added={cart.some(line => line.menuId === item.id)} onAdd={() => { toggle(item.id); setNotice("장바구니에 담았어요"); }} go={go} />
      : <Menu board={board} cart={cart} category={category} setCategory={setCategory} go={go} onToggle={toggle} />}
    <div className="toast t-body-sm" role="status" aria-live="polite" data-visible={!!notice}>{notice}</div>
  </div>;
}
