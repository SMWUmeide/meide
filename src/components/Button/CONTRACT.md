# Button — CONTRACT

## 가져오는 위치
`import { Button } from "@/components/Button"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| variant | `"primary"` · `"secondary"` · `"brand"` | `"primary"` |
| size | `"lg"` · `"pill"` | `"lg"` |
| state | `"default"` · `"pressed"` · `"focus"` · `"disabled"` · `"loading"` | `"default"` |
| fullWidth | `boolean` | lg는 `true`, pill은 `false` |
| children | 글자 (한 줄) | — |

- `lg`: 높이 56, `--rounded-md`, 글자 `.t-title-md`.
- `pill`: 상하 `--space-md` 좌우 `--space-xl`, `--rounded-full`, 글자 `.t-title-md` (brand 위 흰 글자 대비 때문에 17 Bold 고정).
- primary: 배경 `--color-primary`, 글자 `--color-on-primary`. pressed → `--color-primary-pressed`.
- secondary: 배경 `--color-surface`(neutral 위) 또는 `--color-neutral`(surface 위), 글자 `--color-on-surface`.
- brand: 배경 `--color-brand`, 글자 흰색. pressed → `--color-brand-pressed`. **pill에서만** 쓴다.
- disabled: 배경 `--color-neutral`, 글자 `--color-disabled`.
- loading: 글자 대신 점 3개, 버튼 폭은 그대로.
- focus: 2px `--color-brand` 외곽선.

## 사용 규칙
- 한 화면에 `variant="primary"`는 하나만.
- brand는 장바구니·담기처럼 '핵심 행동' 알약에만.

## 확인 방법
- Button 파일에 HEX 값 0건, 모든 색이 `var(--color-…)`.
- 화면 파일마다 `variant="primary"` 개수가 1 이하.

## 정상 예시
```tsx
<Button variant="primary">홈으로 가기</Button>
<Button variant="secondary">추가 주문하기</Button>
<Button variant="brand" size="pill">3개 보기</Button>
```

## 반례
```tsx
<button style={{ background: "#28A745", borderRadius: 12 }}>주문</button>  // 컴포넌트 우회, HEX·임의 radius
<Button variant="brand">주문 문장 만들기</Button>                            // brand를 주요 버튼으로 사용
```
