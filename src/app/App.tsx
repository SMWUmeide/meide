import { useEffect, useRef, useState } from "react";
import { Home } from "./screens/Home";
import { Capture } from "./screens/Capture";
import { Menu } from "./screens/Menu";
import { Detail } from "./screens/Detail";
import { Cart } from "./screens/Cart";
import { initialCart, changeQuantity, type CartLine } from "./cart";
import { demoBoard } from "@/data/mock-menu";
import type { Category, MenuBoard } from "@/data/menu-schema";
import { analyzePhotos } from "@/lib/analyze-menu";
import { photoFile } from "@/lib/native-camera";
import { Order } from "./screens/Order";
import { Receipt } from "./screens/Receipt";
import { readSession, saveSession } from "./session";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
function readRoute() { return window.location.hash.slice(2) || "home"; }
export function App() {
  const [saved] = useState(readSession);
  const [request, setRequest] = useState(saved.request);
  const [tipRate, setTipRate] = useState(saved.tipRate);
  const [route, setRoute] = useState(readRoute);
  const [board, setBoard] = useState<MenuBoard>(saved.board);
  const [cart, setCart] = useState<CartLine[]>(saved.cart);
  const [category, setCategory] = useState<Category>(saved.category);
  const [files, setFiles] = useState<File[]>([]);
  const [tip, setTip] = useState(saved.tip);
  const [notice, setNotice] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => { const sync = () => setRoute(readRoute()); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  useEffect(() => { window.scrollTo(0, 0); if (route !== "capture") activeRequest.current?.abort(); }, [route]);
  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { saveSession({ board, cart, category, tip, tipRate, request }); }, [board, cart, category, tip, tipRate, request]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener("backButton", () => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (dialog) { dialog.dispatchEvent(new Event("cancel", { cancelable: true })); if (dialog.open) dialog.close(); return; }
      if (route === "home") { void NativeApp.minimizeApp(); return; }
      const parent = route.startsWith("detail/") ? "menu" : route === "receipt" ? "order" : route === "order" ? "cart" : route === "cart" ? "menu" : "home";
      window.location.hash = `/${parent}`;
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, [route]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener("appRestoredResult", async result => {
      if (result.pluginId !== "Camera" || !result.success) return;
      try {
        const results = result.methodName === "chooseFromGallery" ? result.data.results : [result.data];
        if (!Array.isArray(results)) return;
        const restored = await Promise.all(results.slice(0, 6).map(photoFile));
        setFiles(restored); window.location.hash = "/capture";
      } catch { setNotice("사진을 다시 선택해 주세요"); }
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, []);
  function go(next: string) { if (next !== "capture") activeRequest.current?.abort(); setNotice(""); window.location.hash = `/${next}`; setRoute(next); }
  function openDemo() { setBoard(demoBoard); setCart(initialCart); setCategory("soup"); setTip(true); setTipRate(10); setRequest(""); setAnalysisFailed(false); go("menu"); }
  async function analyze() {
    if (activeRequest.current || !files.length) return;
    const controller = new AbortController(); activeRequest.current = controller; setAnalyzing(true); setAnalysisFailed(false);
    try {
      const result = await analyzePhotos(files, AbortSignal.any([controller.signal, AbortSignal.timeout(80_000)]));
      if (controller.signal.aborted) return;
      setBoard(result); setCart([]); setCategory(result.categories[0].id); setTip(false); setRequest(""); go("menu");
    } catch {
      if (controller.signal.aborted) return;
      setBoard(demoBoard); setCart(initialCart); setCategory("soup"); setTip(true); setAnalysisFailed(true); go("menu");
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setAnalyzing(false); }
    }
  }
  function toggle(id: string) {
    const existing = cart.find(line => line.menuId === id);
    setCart(current => existing ? current.filter(line => line.menuId !== id) : [...current, { menuId: id, person: "me", quantity: 1 }]);
  }
  const item = route.startsWith("detail/") ? board.items.find(item => item.id === route.split("/")[1]) : undefined;
  const home = <Home go={go} notify={setNotice} recentName={board.restaurantName} onRanking={id => board.source === "demo" ? go(`detail/${id}`) : setNotice("이 랭킹은 예시예요. 방금 본 메뉴판에서 실제 메뉴를 확인해 주세요")} />;
  return <div className={`app-shell ${["menu", "cart", "order", "receipt"].includes(route) || route.startsWith("detail/") ? "figma-flow" : ""}`}>
    {route === "home" ? home : route === "capture" ? <Capture files={files} setFiles={setFiles} onBack={() => go("home")} onContinue={analyze} onDemo={openDemo} analyzing={analyzing} notify={setNotice} /> : route === "menu" ? <Menu board={board} analysisFailed={analysisFailed} cart={cart} category={category} setCategory={setCategory} go={go} onToggle={toggle} /> : route === "cart" ? <Cart board={board} cart={cart} tip={tip} setTip={setTip} tipRate={tipRate} setTipRate={setTipRate} onQuantity={(id, delta, person) => setCart(current => changeQuantity(current, id, delta, person))} go={go} /> : route === "order" ? <Order board={board} cart={cart} request={request} setRequest={setRequest} go={go} /> : route === "receipt" ? <Receipt board={board} cart={cart} tip={tip} tipRate={tipRate} go={go} /> : item ? <Detail key={item.id} item={item} source={board.source} added={cart.some(line => line.menuId === item.id)} onAdd={() => { toggle(item.id); setNotice("장바구니에 담았어요"); }} go={go} /> : home}
    <div className="toast t-body-sm" role="status" aria-live="polite" data-visible={!!notice}>{notice}</div>
  </div>;
}
