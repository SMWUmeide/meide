import { useState } from "react";
import { AICard } from "@/components/AICard";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { BottomSheet } from "@/components/BottomSheet";
import type { MenuItem } from "@/data/mock-menu";
import { Divider, Photo, Price } from "../shared";
export function Detail({ item, source, added, onAdd, go }: { item: MenuItem; source: "demo" | "gemini"; added: boolean; onAdd: () => void; go: (route: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  return <main className="detail-page" data-screen="detail"><div className="detail-hero"><Photo key={item.id} src={item.detailPhotoUrl ?? item.photoUrl} name={item.name} /><IconButton className="detail-back" icon="back" iconSrc="/figma/81eb2.svg" label="메뉴 고르기로 돌아가기" onClick={() => go("menu")} />{(item.detailPhotoUrl || item.photoUrl) && <span className="photo-caption t-body-sm">대표 예시 이미지 · 실제 음식과 다를 수 있어요</span>}</div>
    <div className="detail-content stack-lg"><div className="stack-sm"><p className="t-body-sm muted">{item.originalName}</p><h1 className="t-headline-md">{item.name}</h1><Price eur={item.priceEur} /></div>
      <AICard kind="korean-analogy" source={source === "demo" ? "AI 설명의 예시예요. 실제 분석 결과는 아니에요" : "AI가 한국 음식에 빗대어 설명했어요. 실제와 다를 수 있어요"} iconSrc="/figma/4f017.svg"><div className="stack-sm"><strong className="t-title-md">{item.analogy}</strong><p className="muted">{item.description}</p></div></AICard>
      <Card className="stack-lg"><header className="verified-heading"><span className="verified-icon"><img src="/figma/4ba71.svg" alt="" /></span><div><h2 className="t-title-md">메뉴판에 적힌 정보</h2><p className="t-body-sm muted">{source === "demo" ? "예시 메뉴판 원문 기준이에요" : "메뉴판에서 읽었어요. 원문과 함께 확인해 주세요"}</p></div></header><Divider /><div className="stack-sm"><h3 className="t-body-sm muted">재료</h3>{item.ingredients.length ? item.ingredients.map(ingredient => <div key={ingredient.original}><span>{ingredient.name}</span> <span className="t-body-sm muted">{ingredient.original}</span>{ingredient.original === "farro" && <p className="t-body-sm muted">보리처럼 톡톡 씹히는 고대 밀이에요</p>}</div>) : <p>메뉴 이름 외 재료는 직원에게 확인해 주세요</p>}</div><Divider /><div className="stack-sm"><h3 className="t-body-sm muted">알레르기</h3><p>{item.allergen}</p>{source === "demo" && item.id === "zucca" && <p className="t-body-sm muted">파로(밀)가 예시 메뉴판에 적혀 있어요</p>}</div></Card>
      <AICard kind="estimated" source={source === "demo" ? "일반 레시피를 바탕으로 한 예시라 다를 수 있어요" : "AI가 일반 레시피로 추정했어요. 식당의 조리법과 다를 수 있어요"} iconSrc="/figma/4f017.svg" onConfirm={() => setConfirm(true)}><div className="stack-xl"><div className="stack-sm"><h3 className="ai-section-label">들어갔을 수 있는 재료</h3><div className="ingredient-tags">{item.estimated.length ? item.estimated.map(name => <span className="ingredient-tag t-body-sm" key={name}>{name}</span>) : <p>상세 재료는 직원에게 확인해 주세요</p>}</div></div><div className="stack-sm"><h3 className="ai-section-label">조리법</h3><p>{item.method}</p></div><div className="stack-sm"><h3 className="ai-section-label">알레르기 가능성</h3><p>{item.possibleAllergen}</p></div></div></AICard>
      <p className="t-body-sm muted demo-note">재료와 조리법은 식당마다 다를 수 있어요.</p>
    </div><div className="fixed-action"><Button variant="primary" onClick={added ? () => go("cart") : onAdd}>{added ? "장바구니 보기" : "장바구니에 담기"} · EUR {item.priceEur.toFixed(2)}</Button></div>
    <BottomSheet open={confirm} onClose={() => setConfirm(false)} label="직원에게 재료를 확인해 주세요"><div className="stack-lg"><h2 className="t-headline-md">직원에게 확인해 주세요</h2><p>이 메뉴에 우유나 치즈가 들어가나요?</p><p lang={source === "demo" ? "it" : "en"} className="t-title-md">{source === "demo" ? "Questo piatto contiene latte o formaggio?" : "Does this dish contain milk or cheese?"}</p><p className="t-body-sm muted">미리 작성한 예시 문장이에요. 다른 알레르기는 따로 확인해 주세요.</p><Button variant="secondary" onClick={() => setConfirm(false)}>확인했어요</Button></div></BottomSheet>
  </main>;
}
