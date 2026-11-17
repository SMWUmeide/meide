# Card — CONTRACT

## 가져오는 위치
`import { Card } from "@/components/Card"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| padding | `"xl"` · `"none"` | `"xl"` |
| as | `"section"` · `"button"` | `"section"` |
| children | 내용 | — |

- 배경 `--color-surface`, `--rounded-lg`, 그림자 없음.
- 카드 사이 간격은 부모가 `--space-lg`로 준다.
- `as="button"`이면 카드 전체가 눌린다. pressed 시 배경 `--color-border`.

## 사용 규칙
- neutral 배경 위에만 둔다.
- 카드 안에 Card를 다시 넣지 않는다. 안쪽 박스가 필요하면 InfoNote 또는 neutral 면.

## 확인 방법
- Card 자식에 Card 없음, box-shadow 없음.

## 정상 예시
```tsx
<Card>
  <h2 className="t-title-md">메뉴판에 적힌 정보</h2>
  …
</Card>
```

## 반례
```tsx
<Card style={{ boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}><Card>…</Card></Card>
```
