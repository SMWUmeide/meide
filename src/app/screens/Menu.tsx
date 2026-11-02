import { Avatar, AvatarGroup } from "@/components/Avatar";
import { Chip } from "@/components/Chip";
import { MenuCard } from "@/components/MenuCard";
import { CartBar } from "@/components/CartBar";
import { categories, menuItems, restaurant } from "@/data/mock-menu";
import type { Category } from "@/data/mock-menu";
import type { CartLine } from "../cart";
import { Toolbar } from "../shared";
export function Menu({ cart, category, setCategory, go, onToggle }: { cart: CartLine[]; category: Category; setCategory: (category: Category) => void; go: (route: string) => void; onToggle: (id: string) => void }) {
  const selectedCategory = categories.find(item => item.id === category)!;
  const items = menuItems.filter(item => item.category === category);
  return <><main className="page menu-page" data-screen="menu"><Toolbar title={restaurant.name} onBack={() => go("home")} /><div className="page-content stack-xl"><div className="people-heading"><AvatarGroup size={40}><Avatar person="me" initial="나" /><Avatar person="companion-1" initial="김" /></AvatarGroup><p className="t-title-md">미영님과 함께 고르는 중이에요</p></div>
    <div className="chip-group" aria-label="메뉴 카테고리">{categories.map(item => <Chip key={item.id} selected={category === item.id} count={menuItems.filter(menu => menu.category === item.id).length} onSelect={() => setCategory(item.id)}>{item.name}</Chip>)}</div>
    <section className="stack-lg" aria-label={`${selectedCategory.name} 메뉴`}><div className="section-heading"><div className="inline"><h2 className="t-title-md">{selectedCategory.name}</h2><span className="t-body-sm muted">{selectedCategory.original}</span></div><span className="t-body-sm muted">{items.length}개 메뉴</span></div><div className="menu-grid">{items.map(item => { const added = cart.find(line => line.menuId === item.id); return <MenuCard key={item.id} {...item} priceKrw={item.priceEur * restaurant.exchangeRate} addedBy={added?.person} addedByName={added?.person === "companion-1" ? "미영" : undefined} onToggle={() => onToggle(item.id)} onOpen={() => go(`detail/${item.id}`)} />; })}</div></section>
    <p className="t-body-sm muted">재료와 조리법은 식당마다 다를 수 있어요.<br />예시 메뉴와 환율이에요 · 1 EUR = 1,499원</p>
  </div></main><CartBar count={cart.reduce((sum, line) => sum + line.quantity, 0)} onOpen={() => go("cart")} iconSrc="/figma/fbd41.svg" /></>;
}
