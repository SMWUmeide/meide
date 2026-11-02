import { Button } from "../Button";
import { Icon } from "../_shared/Icon";
export type CartBarProps = { count: number; onOpen: () => void; disabled?: boolean; loading?: boolean; iconSrc?: string };
export function CartBar({ count, onOpen, disabled, loading, iconSrc }: CartBarProps) {
  if (count <= 0) return null;
  return <aside className="cart-dock" aria-label="함께 담은 장바구니"><div className="cart-bar">
    <span className="cart-label t-body-md">{iconSrc ? <img src={iconSrc} alt="" /> : <Icon name="cart" />}함께 담은 장바구니</span>
    <Button variant="brand" size="pill" onClick={onOpen} disabled={disabled} state={loading ? "loading" : "default"}>{count}개 보기</Button>
  </div></aside>;
}
