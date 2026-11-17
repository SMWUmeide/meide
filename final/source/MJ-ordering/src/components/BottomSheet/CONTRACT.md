# BottomSheet — CONTRACT

## 가져오는 위치
`import { BottomSheet } from "@/components/BottomSheet"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| open | `boolean` | — |
| dismissible | `boolean` | `true` |
| onClose | `() => void` | — |
| children | 내용 | — |

- 배경 `--color-surface`, 위 모서리 `--rounded-lg`, 그림자 `--shadow-md`.
- 안쪽 좌우 `--space-xl`, 위 `--space-md` (손잡이 40×5 `--color-border`), 아래 `--space-2xl`.
- 열고 닫을 때 아래에서 위로 200ms.

## 사용 규칙
- 시트 안 주요 버튼은 Button primary 하나.
- 시트 위에 또 시트를 열지 않는다.
- dismissible=false면 바깥 탭·아래로 끌기로 닫히지 않는다 (금액 확인처럼 꼭 봐야 할 때만).

## 정상 예시
```tsx
<BottomSheet open dismissible={false}>
  … 예상 총액 …
  <Button variant="primary">주문 문장 만들기</Button>
</BottomSheet>
```
