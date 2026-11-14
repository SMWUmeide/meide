# CartBar — CONTRACT

## 가져오는 위치
`import { CartBar } from "@/components/CartBar"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| count | `number` (0이면 숨김) | — |
| onOpen | `() => void` (장바구니 화면으로) | — |

## 구조
- 화면 아래 떠 있는 바. 좌우 `--space-xl`, 아래 `--space-2xl`, 높이 64, `--rounded-full`.
- 배경 `--color-primary`, 그림자 `--shadow-md`.
- 왼쪽: 장바구니 아이콘 22 + "함께 담은 장바구니" (body-md·on-primary).
- 오른쪽: `<Button variant="brand" size="pill">{count}개 보기</Button>`.
- 바 뒤에 투명 → neutral 페이드를 깔아 아래 콘텐츠와 겹침을 정리.

## 사용 규칙
- 메뉴 고르기 화면에서만.
- 글래스 효과를 쓰지 않는다 (글래스는 홈 하단 내비 전용).

## 정상 예시
```tsx
<CartBar count={3} onOpen={goCart} />
```

## 반례
```tsx
<CartBar count={3} style={{ backdropFilter: "blur(24px)", background: "rgba(20,20,20,.55)" }} />
```

## 최신 플로팅 기준

849:1082·849:1093에 따라 메뉴/상세 바는 반투명 차콜 70%, 초록 #176B38 버튼, 높이 64, 좌우 24, 하단 32로 고정해요. 해당 색은 tokens.css에서 참조해요. 임시 상태바 공간은 두지 않고 실제 safe-area만 반영해요.
