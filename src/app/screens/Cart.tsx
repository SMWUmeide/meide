import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import type { MenuBoard } from "@/data/menu-schema";
import { totals, subtotal, type CartLine } from "../cart";
import { Toolbar, Price, Photo, Divider } from "../shared";

export function Cart({ board, cart, tip, setTip, tipRate, setTipRate, onQuantity, go }: {
  board: MenuBoard; cart: CartLine[]; tip: boolean; setTip: (value: boolean) => void;
  tipRate: number; setTipRate: (value: number) => void;
  onQuantity: (id: string, delta: number, person: CartLine["person"]) => void; go: (route: string) => void;
}) {
  const total = totals(cart, tip, board.items, tipRate);
  return <main className="page cart-page" data-screen="cart">
    <Toolbar title="함께 담은 장바구니" onBack={() => go("menu")} />
    <div className="page-content cart-scroll">
      {total.count === 0 ? <Card className="stack-lg"><h2 className="t-headline-md">아직 담은 메뉴가 없어요</h2><Button variant="secondary" onClick={() => go("menu")}>메뉴 고르러 가기</Button></Card> : (["me", "companion-1"] as const).map(person => {
        const lines = cart.filter(line => line.person === person);
        if (!lines.length) return null;
        return <Card key={person} className="cart-group">
          <header className="inline"><Avatar person={person} initial={person === "me" ? "나" : "김"} /><h2 className="t-title-md">{person === "me" ? "내 메뉴" : "미영님 메뉴"} · {lines.reduce((sum, line) => sum + line.quantity, 0)}개</h2></header>
          {lines.map(line => {
            const item = board.items.find(item => item.id === line.menuId);
            if (!item) return null;
            return <div className="cart-item" key={item.id}>
              <button className="cart-photo-button" aria-label={`${item.name} 상세 보기`} onClick={() => go(`detail/${item.id}`)}><Photo src={item.detailPhotoUrl ?? item.photoUrl} name={item.name} /></button>
              <div className="stack-xs cart-item-info"><p className="tiny muted">{item.originalName}</p><p>{item.name}</p><Price eur={item.priceEur} />
                <div className="quantity"><IconButton icon="close" iconSrc="/figma/bec33.svg" tone="neutral" label={`${item.name} 수량 줄이기`} onClick={() => onQuantity(item.id, -1, person)} /><output aria-label={`${item.name} 수량`} className="t-label-md">{line.quantity}</output><IconButton icon="add" iconSrc="/figma/e41e7.svg" tone="neutral" label={`${item.name} 수량 늘리기`} disabled={line.quantity >= 20} onClick={() => onQuantity(item.id, 1, person)} /></div>
              </div>
            </div>;
          })}
          <Divider src="/figma/d2d4f.svg" /><div className="section-heading cart-subtotal"><span className="t-body-sm muted">{person === "me" ? "내 합계" : "미영님 합계"}{tip ? " (팁 포함)" : " (팁 제외)"}</span><Price eur={Math.round(subtotal(lines, board.items) * (tip ? 1 + tipRate / 100 : 1) * 100) / 100} /></div>
        </Card>;
      })}
      <p className="tiny muted demo-note">{board.source === "demo" ? "동반인 메뉴와 환율은 예시예요." : "환율은 예시예요."} 실제 주문·결제는 이루어지지 않아요.</p>
    </div>
    <section className="cart-checkout" aria-label="예상 결제 금액">
      <div className="section-heading"><label className="tip-toggle"><input type="checkbox" checked={tip} aria-label={`선택 팁 ${tipRate}% 포함`} onChange={event => setTip(event.currentTarget.checked)} /><span className="checkbox-art" aria-hidden="true">{tip && <img src="/figma/8ae2f.svg" alt="" />}</span><span>선택 팁 포함</span></label><label className="tip-rate"><span className="sr-only">팁 비율</span><select value={tipRate} disabled={!tip} onChange={event => setTipRate(Number(event.target.value))}>{[5, 10, 15, 20].map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select><img src="/figma/59c52.svg" alt="" /></label></div>
      <Divider wide /><div className="section-heading"><div><h2 className="t-title-md">예상 총액</h2><p className="t-body-sm muted">음식+팁 · 총 {total.count}개</p></div><Price eur={total.total} large /></div>
      <Button variant="primary" disabled={!total.count} onClick={() => go("order")}>주문 문장 만들기</Button>
    </section>
  </main>;
}
