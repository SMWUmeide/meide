import { useEffect, useRef } from "react";
import { Avatar, AvatarGroup } from "@/components/Avatar";
import { Chip } from "@/components/Chip";
import { MenuCard } from "@/components/MenuCard";
import { CartBar } from "@/components/CartBar";
import type { SharedPerson } from "@/lib/shared-order";
import { restaurant } from "@/data/mock-menu";
import type { Category, MenuBoard } from "@/data/menu-schema";
import type { CartLine } from "../cart";
import { Toolbar } from "../shared";
export function Menu({ board, cart, category, setCategory, go, onToggle, onBack, people, shared = false, disabled = false, syncMessage }: { onBack: () => void; people?: SharedPerson[]; shared?: boolean; disabled?: boolean; syncMessage?: string; board: MenuBoard; cart: CartLine[]; category: Category; setCategory: (category: Category) => void; go: (route: string) => void; onToggle: (id: string) => void }) {
  const { categories, items: menuItems } = board;
  const navigation = useRef<HTMLDivElement>(null);
  const sections = useRef(new Map<Category, HTMLElement>());
  const frame = useRef(0);
  const syncing = useRef(0);
  const navigating = useRef(false);
  const initialCategory = useRef(category);
  const jump = useRef<(id: Category) => void>(() => {});

  useEffect(() => {
    const topInset = () => parseFloat(getComputedStyle(navigation.current!).top) || 0;
    const offset = () => topInset() + (navigation.current?.offsetHeight ?? 0) + 16;
    const target = (id: Category) => {
      const section = sections.current.get(id);
      return section ? Math.max(0, Math.min(window.scrollY + section.getBoundingClientRect().top - offset(), document.documentElement.scrollHeight - window.innerHeight)) : 0;
    };
    const sync = () => {
      syncing.current = 0;
      if (!navigation.current?.offsetHeight) return;
      navigation.current.dataset.stuck = String(navigation.current.getBoundingClientRect().top <= topInset() + 1);
      if (navigating.current) return;
      let current = categories[0].id;
      for (const item of categories) {
        if ((sections.current.get(item.id)?.getBoundingClientRect().top ?? Infinity) <= offset() + 1) current = item.id;
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = categories.at(-1)!.id;
      setCategory(current);
    };
    const scheduleSync = () => { if (!syncing.current) syncing.current = requestAnimationFrame(sync); };
    const interrupt = () => { cancelAnimationFrame(frame.current); navigating.current = false; scheduleSync(); };
    const onKey = (event: KeyboardEvent) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) interrupt(); };
    jump.current = id => {
      cancelAnimationFrame(frame.current);
      setCategory(id);
      navigating.current = true;
      const start = window.scrollY;
      const end = target(id);
      const duration = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 240;
      const began = performance.now();
      const animate = (now: number) => {
        const progress = duration ? Math.min(1, (now - began) / duration) : 1;
        window.scrollTo(0, start + (end - start) * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame.current = requestAnimationFrame(animate);
        else { navigating.current = false; sync(); }
      };
      frame.current = requestAnimationFrame(animate);
    };
    // Restore the selected section after returning from a menu detail.
    frame.current = requestAnimationFrame(() => {
      if (initialCategory.current !== categories[0].id) window.scrollTo(0, target(initialCategory.current));
      sync();
    });
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame.current); cancelAnimationFrame(syncing.current); syncing.current = 0; navigating.current = false;
      window.removeEventListener("scroll", scheduleSync); window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("wheel", interrupt); window.removeEventListener("touchstart", interrupt); window.removeEventListener("keydown", onKey);
    };
  }, [categories, setCategory]);
  return <><main className="page menu-page" data-screen="menu"><Toolbar title={board.restaurantName} onBack={onBack} /><div className="page-content stack-xl"><div className="people-heading"><AvatarGroup size={40}>{people ? people.map(person=><Avatar key={person.id} person={person.person} initial={person.name} />) : board.source === "demo" ? [<Avatar key="me" person="me" initial="나" />, <Avatar key="companion" person="companion-1" initial="김" />] : <Avatar person="me" initial="나" />}</AvatarGroup><p className="t-title-md">{people ? `${people.filter(person=>person.person!=="me").map(person=>person.name).join(", ") || "동반인"}님과 함께 고르는 중` : board.source === "demo" ? "미영님과 함께 고르는 중" : "메뉴를 골라 주세요"}</p></div>

    <div className="menu-category-nav" ref={navigation}><div className="chip-group" aria-label="메뉴 카테고리">{categories.map(item => <Chip key={item.id} selected={category === item.id} count={menuItems.filter(menu => menu.category === item.id).length} aria-controls={`menu-section-${item.id}`} onSelect={() => jump.current(item.id)}>{item.name}</Chip>)}</div></div>
    {categories.map(selectedCategory => { const items = menuItems.filter(item => item.category === selectedCategory.id); return <section key={selectedCategory.id} id={`menu-section-${selectedCategory.id}`} ref={element => { if (element) sections.current.set(selectedCategory.id, element); else sections.current.delete(selectedCategory.id); }} className="menu-category-section stack-lg" aria-label={`${selectedCategory.name} 메뉴`}><div className="section-heading"><div className="inline"><h2 className="t-title-md">{selectedCategory.name}</h2><span className="t-body-sm muted">{selectedCategory.original}</span></div><span className="t-body-sm muted">{items.length}개 메뉴</span></div><div className="menu-grid">{items.map(item => { const added = cart.find(line => line.menuId === item.id && (!shared || line.person === "me")); return <MenuCard cutout={Boolean(item.photo?.cutoutUrl)} toggleDisabled={disabled} companionLabel={shared ? people?.filter(person=>person.person!=="me" && cart.some(line=>line.menuId===item.id && line.person===person.person)).map(person=>`${person.name}님`).join(", ") || undefined : undefined} presentation="figma" allergenLabel={item.allergen.startsWith("글루텐") ? "글루텐 포함" : undefined} key={item.id} {...item} priceKrw={item.priceEur * restaurant.exchangeRate} addedBy={added?.person} addedByName={added?.person === "companion-1" ? "미영" : undefined} onToggle={() => onToggle(item.id)} onOpen={() => go(`detail/${item.id}`)} />; })}</div></section>; })}
    {syncMessage && <p className="t-body-sm muted" role="status">{syncMessage}</p>}
    {board.items.some(item=>item.photo) && <p className="t-body-sm muted">대표 이미지 · 실제 음식과 다를 수 있어요 · <a href="https://www.pexels.com" target="_blank" rel="noreferrer">사진 제공 Pexels</a></p>}
    <p className="t-body-sm muted">재료와 조리법은 식당마다 다를 수 있어요.<br />{board.source === "demo" ? "예시 메뉴와 환율이에요" : "Gemini로 읽은 메뉴예요. 원문과 가격을 확인해 주세요. 사진은 검색한 대표 이미지예요"}<br />환율은 예시예요 · 1 EUR = 1,499원{board.skipped > 0 && <><br />가격을 읽지 못한 메뉴 {board.skipped}개는 표시하지 않았어요</>}</p>
  </div></main><CartBar count={cart.reduce((sum, line) => sum + line.quantity, 0)} onOpen={() => go("cart")} iconSrc="/figma/ec2c3.svg" /></>;
}
