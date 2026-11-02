import { useEffect, useRef } from "react";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { InfoNote } from "@/components/InfoNote";
import type { MenuBoard } from "@/data/menu-schema";
import { totals, subtotal, type CartLine } from "../cart";
import { Toolbar, Price, Photo, Divider } from "../shared";
export function Cart({ board, cart, tip, setTip, onQuantity, go, notify }: { board: MenuBoard; cart: CartLine[]; tip: boolean; setTip: (value: boolean) => void; onQuantity: (id: string, delta: number) => void; go: (route: string) => void; notify: (text: string) => void }) {
  const menuItems = board.items;
  const total = totals(cart, tip, menuItems);
  const pageRef = useRef<HTMLElement>(null), checkoutRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const checkout = checkoutRef.current, page = pageRef.current;
    if (!checkout || !page) return;
    const measure = () => page.style.setProperty("--checkout-height", `${checkout.getBoundingClientRect().height}px`);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure); observer.observe(checkout);
    return () => observer.disconnect();
  }, []);
  return <main ref={pageRef} className="page cart-page" data-screen="cart"><Toolbar title="함께 담은 장바구니" onBack={() => go("menu")} /><div className="page-content stack-lg">{total.count === 0 ? <Card className="stack-lg"><h2 className="t-headline-md">아직 담은 메뉴가 없어요</h2><Button variant="secondary" onClick={() => go("menu")}>메뉴 고르러 가기</Button></Card> : (["me", "companion-1"] as const).map(person => {
    const lines = cart.filter(line => line.person === person); if (!lines.length) return null;
    return <Card key={person} className="stack-lg"><header className="inline"><Avatar person={person} initial={person === "me" ? "나" : "김"} /><h2 className="t-title-md">{person === "me" ? "내 메뉴" : "미영님 메뉴"} · {lines.reduce((sum, line) => sum + line.quantity, 0)}개</h2></header>{lines.map(line => {
      const item = menuItems.find(item => item.id === line.menuId)!;
      return <div className="cart-item" key={line.menuId}><button className="cart-photo-button" aria-label={`${item.name} 상세 보기`} onClick={() => go(`detail/${item.id}`)}><Photo src={item.detailPhotoUrl ?? item.photoUrl} name={item.name} /></button><div className="stack-xs cart-item-info"><p className="t-body-sm muted">{item.originalName}</p><p>{item.name}</p><Price eur={item.priceEur} />{person === "me" ? <div className="quantity"><button className="quantity-minus" aria-label={`${item.name} 수량 줄이기`} onClick={() => onQuantity(item.id, -1)}><img src="/figma/5b5f5.svg" alt="" /></button><output aria-label={`${item.name} 수량`} className="t-label-md">{line.quantity}</output><IconButton icon="add" iconSrc="/figma/23913.svg" tone="neutral" label={`${item.name} 수량 늘리기`} disabled={line.quantity >= 20} onClick={() => onQuantity(item.id, 1)} /></div> : <p className="t-body-sm muted">수량 {line.quantity}개</p>}</div></div>;
    })}<Divider /><div className="section-heading"><span className="t-body-sm muted">{person === "me" ? "내 합계" : "미영님 합계"}{tip ? " (팁 포함)" : " (팁 제외)"}</span><Price eur={subtotal(lines, menuItems) * (tip ? 1.1 : 1)} /></div></Card>;
  })}<InfoNote>{board.source === "demo" ? <>코페르토는 자리 준비 비용이에요. 예시 메뉴판에는 1인당 EUR 2.50(약 3,748원)이 적혀 있어요. 아래 합계에는 포함하지 않았어요.</> : <>자리 준비 비용이나 물값 등 추가 요금은 직원에게 확인해 주세요. 아래 합계는 선택한 음식과 팁만 포함해요.</>}</InfoNote><p className="t-body-sm muted">{board.source === "demo" ? "동반인 메뉴와 팁 10%는 화면 확인용 예시예요." : "팁 10%는 선택 사항이며 환율은 예시예요."} 실제 결제나 주문은 이루어지지 않아요.</p></div>
    <section ref={checkoutRef} className="cart-checkout stack-md" aria-label="예상 결제 금액"><label className="tip-toggle"><input type="checkbox" checked={tip} onChange={event => setTip(event.currentTarget.checked)} /><span className="checkbox-art" aria-hidden="true">{tip && <img src="/figma/4b0a0.svg" alt="" />}</span><span>선택 팁 10% 포함</span></label><div className="section-heading t-body-sm muted"><span>음식 EUR {total.food.toFixed(2)}</span><span>예상 팁 {tip ? "10%" : "0%"} · EUR {total.tip.toFixed(2)}</span></div><Divider wide /><div className="section-heading"><div><h2 className="t-title-md">예상 총액</h2><p className="t-body-sm muted">음식+팁 · 총 {total.count}개</p></div><Price eur={total.total} large /></div><Button variant="primary" disabled={!total.count} onClick={() => notify("주문 문장 만들기는 다음 단계에서 준비할게요")}>주문 문장 만들기</Button></section>
  </main>;
}
