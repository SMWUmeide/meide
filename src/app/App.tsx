import { useEffect, useState } from "react";
import { Home } from "./screens/Home";
import { Capture } from "./screens/Capture";
import { Menu } from "./screens/Menu";
import { Detail } from "./screens/Detail";
import { Cart } from "./screens/Cart";
import { initialCart, changeQuantity, type CartLine } from "./cart";
import { menuItems, type Category } from "@/data/mock-menu";
function readRoute() { return window.location.hash.slice(2) || "home"; }
export function App() {
  const [route, setRoute] = useState(readRoute);
  const [cart, setCart] = useState<CartLine[]>(initialCart);
  const [category, setCategory] = useState<Category>("soup");
  const [files, setFiles] = useState<File[]>([]);
  const [tip, setTip] = useState(true);
  const [notice, setNotice] = useState("");
  useEffect(() => { const sync = () => setRoute(readRoute()); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [route]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);
  function go(next: string) { setNotice(""); window.location.hash = `/${next}`; setRoute(next); }
  function toggle(id: string) {
    const existing = cart.find(line => line.menuId === id);
    if (existing?.person === "companion-1") { setNotice("미영님이 담은 메뉴예요. 동반인 메뉴는 바꿀 수 없어요"); return; }
    setCart(current => existing ? current.filter(line => line.menuId !== id) : [...current, { menuId: id, person: "me", quantity: 1 }]);
  }
  const item = route.startsWith("detail/") ? menuItems.find(item => item.id === route.split("/")[1]) : undefined;
  return <div className="app-shell">
    {route === "home" ? <Home go={go} notify={setNotice} /> : route === "capture" ? <Capture files={files} setFiles={setFiles} onBack={() => go("home")} onContinue={() => go("menu")} notify={setNotice} /> : route === "menu" ? <Menu cart={cart} category={category} setCategory={setCategory} go={go} onToggle={toggle} /> : route === "cart" ? <Cart cart={cart} tip={tip} setTip={setTip} onQuantity={(id, delta) => setCart(current => changeQuantity(current, id, delta))} go={go} notify={setNotice} /> : item ? <Detail key={item.id} item={item} added={cart.some(line => line.menuId === item.id)} onAdd={() => { toggle(item.id); setNotice("장바구니에 담았어요"); }} go={go} /> : <Home go={go} notify={setNotice} />}
    <div className="toast t-body-sm" role="status" aria-live="polite" data-visible={!!notice}>{notice}</div>
  </div>;
}
