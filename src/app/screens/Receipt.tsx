import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { InfoNote } from "@/components/InfoNote";
import type { MenuBoard } from "@/data/menu-schema";
import { totals, type CartLine } from "../cart";
import { orderLines } from "../order";
import { Toolbar, Price, Divider } from "../shared";

function Amount({ value, extra = false }: { value: number; extra?: boolean }) {
  return <span className="receipt-amount"><span className="tiny muted">{extra ? "+EUR" : "EUR"}</span><span className="t-label-md">{value.toFixed(2)}</span></span>;
}
export function Receipt({ board, cart, tip, tipRate, go }: { board: MenuBoard; cart: CartLine[]; tip: boolean; tipRate: number; go: (route: string) => void }) {
  const [createdAt] = useState(() => new Date());
  const total = totals(cart, tip, board.items, tipRate);
  const lines = orderLines(board, cart);
  const people = Math.max(1, new Set(cart.map(line => line.person)).size);
  const coperto = board.source === "demo" && total.count ? 2.5 * people : 0;
  const date = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(createdAt).replaceAll("-", ".");
  return <main className="page receipt-page" data-screen="receipt">
    <Toolbar title="영수증 미리보기" onBack={() => go("order")} />
    <div className="page-content">
      <h2 className="t-headline-md">계산서에 붙을 금액을<br />미리 정리했어요</h2>
      <Card className="receipt-card"><header className="stack-xs"><h3 className="t-title-md">{board.restaurantName}</h3><p className="t-body-sm muted">{date} · {people}명</p></header>
        <Divider src="/figma/50326.svg" />
        <div className="stack-sm">{lines.map(({ item, quantity, person }) => <div className="receipt-row" key={`${person}-${item.id}`}><p>{item.name}{quantity > 1 && ` × ${quantity}`}</p><Amount value={item.priceEur * quantity} /></div>)}{!lines.length && <p>아직 담은 메뉴가 없어요</p>}</div>
        <Divider src="/figma/50326.svg" />
        {board.source === "demo" ? <><div className="stack-xs"><div className="receipt-row"><p>코페르토 · {people}명</p><Amount value={coperto} /></div><InfoNote iconSrc="/figma/99474.svg">빵·식기·자리 준비 비용이에요. 예시 메뉴판의 1인당 EUR 2.50을 반영했어요.</InfoNote></div>
          <div className="stack-xs"><div className="receipt-row"><p>물 (시켰다면)</p><Amount value={3} extra /></div><InfoNote iconSrc="/figma/99474.svg">병 물 1병에 EUR 3.00을 가정한 예시예요. 실제 물값은 직원에게 확인해 주세요.</InfoNote></div></> : <InfoNote>자리 준비 비용과 물값은 직원에게 확인해 주세요. 확인되지 않은 추가 요금은 합계에 넣지 않았어요.</InfoNote>}
        <div className="receipt-row"><p>선택 팁 {tip ? tipRate : 0}%</p><Amount value={total.tip} /></div>
        <Divider src="/figma/3b0ad.svg" />
        <div className="section-heading receipt-total"><div className="stack-xs"><h3 className="t-title-md">예상 합계</h3><p className="t-body-sm muted">{board.source === "demo" ? "물 제외" : "추가 요금 제외"}</p></div><Price eur={Math.round((total.total + coperto) * 100) / 100} large /></div>
      </Card>
      <p className="receipt-disclaimer tiny muted">식당이 발행한 영수증이 아니에요. 실제 계산서와 다를 수 있어요.</p>
      <div className="receipt-actions stack-sm"><Button variant="primary" onClick={() => go("menu")}>메뉴판으로 돌아가기</Button><Button variant="secondary" onClick={() => go("menu")}>추가 주문하기</Button></div>
    </div>
  </main>;
}
