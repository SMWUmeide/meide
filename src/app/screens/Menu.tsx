import { Avatar, AvatarGroup } from "@/components/Avatar";
import { Chip } from "@/components/Chip";
import { MenuCard } from "@/components/MenuCard";
import { CartBar } from "@/components/CartBar";
import { restaurant } from "@/data/mock-menu";
import type { Category, MenuBoard } from "@/data/menu-schema";
import { Button } from "@/components/Button";
import type { CartLine } from "../cart";
import { Toolbar } from "../shared";
export function Menu({ board, analysisFailed, cart, category, setCategory, go, onToggle }: { board: MenuBoard; analysisFailed: boolean; cart: CartLine[]; category: Category; setCategory: (category: Category) => void; go: (route: string) => void; onToggle: (id: string) => void }) {
  const { categories, items: menuItems } = board;
  const selectedCategory = categories.find(item => item.id === category)!;
  const items = menuItems.filter(item => item.category === category);
  return <><main className="page menu-page" data-screen="menu"><Toolbar title={board.restaurantName} onBack={() => go("home")} /><div className="page-content stack-xl"><div className="people-heading"><AvatarGroup size={40}>{board.source === "demo" ? [<Avatar key="me" person="me" initial="나" />, <Avatar key="companion" person="companion-1" initial="김" />] : <Avatar person="me" initial="나" />}</AvatarGroup><p className="t-title-md">{board.source === "demo" ? "미영님과 함께 고르는 중" : "메뉴를 골라 주세요"}</p></div>
    {analysisFailed && <div className="stack-sm"><p role="alert" className="analysis-error t-body-md">분석에 실패했어요</p><p className="t-body-sm muted">예시 메뉴를 보여 드려요. 사진을 다시 촬영해 주세요.</p><Button variant="secondary" onClick={() => go("capture")}>다시 촬영하기</Button></div>}
    <div className="chip-group" aria-label="메뉴 카테고리">{categories.map(item => <Chip key={item.id} selected={category === item.id} count={menuItems.filter(menu => menu.category === item.id).length} onSelect={() => setCategory(item.id)}>{item.name}</Chip>)}</div>
    <section className="stack-lg" aria-label={`${selectedCategory.name} 메뉴`}><div className="section-heading"><div className="inline"><h2 className="t-title-md">{selectedCategory.name}</h2><span className="t-body-sm muted">{selectedCategory.original}</span></div><span className="t-body-sm muted">{items.length}개 메뉴</span></div><div className="menu-grid">{items.map(item => { const added = cart.find(line => line.menuId === item.id); return <MenuCard presentation="figma" allergenLabel={item.allergen.startsWith("글루텐") ? "글루텐 포함" : undefined} key={item.id} {...item} priceKrw={item.priceEur * restaurant.exchangeRate} addedBy={added?.person} addedByName={added?.person === "companion-1" ? "미영" : undefined} onToggle={() => onToggle(item.id)} onOpen={() => go(`detail/${item.id}`)} />; })}</div></section>
    <p className="t-body-sm muted">재료와 조리법은 식당마다 다를 수 있어요.<br />{board.source === "demo" ? "예시 메뉴와 환율이에요" : "Gemini로 읽은 메뉴예요. 원문과 가격을 확인해 주세요. 사진은 준비 중이에요"}<br />환율은 예시예요 · 1 EUR = 1,499원{board.skipped > 0 && <><br />가격을 읽지 못한 메뉴 {board.skipped}개는 표시하지 않았어요</>}</p>
  </div></main><CartBar count={cart.reduce((sum, line) => sum + line.quantity, 0)} onOpen={() => go("cart")} iconSrc="/figma/ec2c3.svg" /></>;
}
