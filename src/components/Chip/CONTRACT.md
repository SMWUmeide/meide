# Chip — CONTRACT

## 가져오는 위치
`import { Chip } from "@/components/Chip"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| selected | `boolean` | `false` |
| count | `number` (선택) | — |
| onSelect | `() => void` | — |
| children | 카테고리 이름 | — |

- 높이 44 (상하 `--space-md`), 좌우 `--space-lg`, `--rounded-full`, 글자 `.t-label-md`.
- selected: 배경 `--color-primary`, 글자 `--color-on-primary`.
- 기본: 배경 `--color-surface`, 글자 `--color-on-surface`.
- 한 줄 가로 스크롤, 칩 사이 `--space-sm`.

## 사용 규칙
- 한 그룹에서 selected는 하나만.
- 메뉴 카테고리는 "이름 + 개수" ("수프 4").

## 확인 방법
- 그룹 안 selected 개수 = 1.

## 정상 예시
```tsx
<Chip selected count={4}>수프</Chip>
<Chip count={3}>메인 요리</Chip>
```

## 반례
```tsx
<Chip selected style={{ background: "var(--color-brand)" }}>수프</Chip>  // 선택 색을 brand로
```
