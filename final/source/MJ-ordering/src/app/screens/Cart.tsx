import type { SharedPerson } from "@/lib/shared-order";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { defaultDining, diningTotals, regions } from "../dining";
import type { Dining, MenuBoard } from "@/data/menu-schema";
import { subtotal, type CartLine } from "../cart";
import { Toolbar, Price, Photo, Divider } from "../shared";

export function Cart({ board, cart, tip, setTip, tipRate, setTipRate, onQuantity, go, people, onDining, shared = false, disabled = false }: {
  onDining?: (setting: keyof Dining, value: Dining[keyof Dining]) => void;
  people?: SharedPerson[]; shared?: boolean; disabled?: boolean;
  board: MenuBoard; cart: CartLine[]; tip: boolean; setTip: (value: boolean) => void;
  tipRate: number; setTipRate: (value: number) => void;
  onQuantity: (id: string, delta: number, person: CartLine["person"]) => void; go: (route: string) => void;
}) {
  const total = diningTotals(board, cart, tip, tipRate);
  const dining = board.dining ?? defaultDining;
  return <main className="page cart-page" data-screen="cart">
    <Toolbar title="함께 담은 장바구니" onBack={() => go("menu")} />
    <div className="page-content cart-scroll">
      {total.count === 0 ? <Card className="stack-lg"><h2 className="t-headline-md">아직 담은 메뉴가 없어요</h2><Button variant="secondary" onClick={() => go("menu")}>메뉴 고르러 가기</Button></Card> : (["me", "companion-1", "companion-2", "companion-3"] as const).map(person => {
        const name = people?.find(member=>member.person===person)?.name ?? "동반인";
        const lines = cart.filter(line => line.person === person);
        if (!lines.length) return null;
        return <Card key={person} className="cart-group">
          <header className="inline"><Avatar person={person} initial={person === "me" ? "나" : name} /><h2 className="t-title-md">{person === "me" ? "내 메뉴" : `${name}님 메뉴`} · {lines.reduce((sum, line) => sum + line.quantity, 0)}개</h2></header>
          {lines.map(line => {
            const item = board.items.find(item => item.id === line.menuId);
            if (!item) return null;
            return <div className="cart-item" key={item.id}>
              <button className="cart-photo-button" aria-label={`${item.name} 상세 보기`} onClick={() => go(`detail/${item.id}`)}><Photo src={item.detailPhotoUrl ?? item.photoUrl} name={item.name} /></button>
              <div className="stack-xs cart-item-info"><p className="tiny muted">{item.originalName}</p><p>{item.name}</p><Price eur={item.priceEur} />
                <div className="quantity"><IconButton disabled={disabled || (shared && person!=="me")} icon="close" iconSrc="/figma/bec33.svg" tone="neutral" label={`${item.name} 수량 줄이기`} onClick={() => onQuantity(item.id, -1, person)} /><output aria-label={`${item.name} 수량`} className="t-label-md">{line.quantity}</output><IconButton icon="add" iconSrc="/figma/e41e7.svg" tone="neutral" label={`${item.name} 수량 늘리기`} disabled={disabled || (shared && person!=="me") || line.quantity >= 20} onClick={() => onQuantity(item.id, 1, person)} /></div>
              </div>
            </div>;
          })}
          <Divider src="/figma/d2d4f.svg" /><div className="section-heading cart-subtotal"><span className="t-body-sm muted">{person === "me" ? "내 합계" : `${name}님 합계`}{tip ? " (팁 포함)" : " (팁 제외)"}</span><Price eur={Math.round(subtotal(lines, board.items) * (tip ? 1 + tipRate / 100 : 1) * 100) / 100} /></div>
        </Card>;
      })}
      {onDining && total.count > 0 && <Card className="stack-lg">
        <h2 className="t-title-md">식사 정보를 확인해 주세요</h2>
        <label className="stack-sm"><span>식사 인원</span><select className="request-input" aria-label="식사 인원" disabled={disabled} value={dining.partySize ?? ''} onChange={event => onDining('partySize', event.target.value ? Number(event.target.value) : null)}><option value="">인원을 선택해 주세요</option>{Array.from({length:30}, (_,i) => <option key={i+1} value={i+1}>{i+1}명</option>)}</select></label>
        <label className="stack-sm"><span>여행 지역</span><select className="request-input" aria-label="여행 지역" disabled={disabled} value={dining.region} onChange={event => onDining('region', event.target.value as Dining['region'])}>{Object.entries(regions).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {board.coverCharge && <p className="t-body-sm">메뉴판 원문: {board.coverCharge.evidence}</p>}
        {board.coverCharge && board.coverCharge.priceEur !== 0 && total.cover === 0 && <p className="t-body-sm">자릿세의 금액·부과 단위와 식사 인원이 확인되어야 합계에 넣어요. 조건이 모호하면 직원에게 확인해 주세요.</p>}
        <p className="t-body-sm muted">실제로 식사하는 인원을 선택해 주세요. 여행 지역은 식문화 설명에만 사용하고 요금을 추가하지 않아요. 물은 메뉴판에서 담은 수량만 계산해요.</p>
      </Card>}
      <p className="tiny muted demo-note">확인된 환율이 없어 EUR 가격만 표시해요. 실제 주문·결제는 이루어지지 않아요.</p>
    </div>
    <section className="cart-checkout" aria-label="예상 결제 금액">
      <div className="section-heading"><label className="tip-toggle"><input type="checkbox" checked={tip} aria-label={`선택 팁 ${tipRate}% 포함`} onChange={event => setTip(event.currentTarget.checked)} /><span className="checkbox-art" aria-hidden="true">{tip && <img src="/figma/8ae2f.svg" alt="" />}</span><span>선택 팁 포함</span></label><label className="tip-rate"><span className="sr-only">팁 비율</span><select value={tipRate} disabled={!tip} onChange={event => setTipRate(Number(event.target.value))}>{[5, 10, 15, 20].map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select><img src="/figma/59c52.svg" alt="" /></label></div>
      {total.cover > 0 && <div className="section-heading"><span>자리 준비 요금</span><Price eur={total.cover} /></div>}
      <Divider wide /><div className="section-heading"><div><h2 className="t-title-md">예상 총액</h2><p className="t-body-sm muted">메뉴+팁{total.cover > 0 ? "+자리 준비 요금" : ""} · 총 {total.count}개</p></div><Price eur={total.total} large /></div>
      <Button variant="primary" disabled={!total.count || (Boolean(board.coverCharge?.priceEur) && board.coverCharge?.basis === 'per_person' && !dining.partySize)} onClick={() => go("order")}>주문 문장 만들기</Button>
    </section>
  </main>;
}
