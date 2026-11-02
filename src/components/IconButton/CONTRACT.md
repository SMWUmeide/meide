# IconButton — CONTRACT

## 가져오는 위치
`import { IconButton } from "@/components/IconButton"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| icon | `"back"` · `"close"` · `"add"` · `"added"` · `"camera"` · `"flash"` | — |
| tone | `"surface"` · `"neutral"` · `"glass"` · `"brand"` | `"surface"` |
| label | 스크린리더용 문구 (필수) | — |
| state | `"default"` · `"pressed"` · `"disabled"` | `"default"` |

- 크기 44×44 고정, `--rounded-full`. 아이콘 20(back·close) / 22(add·added).
- surface: 흰 원 (neutral 배경 위). neutral: 회색 원 (흰 패널 위).
- glass: 사진·카메라 화면 위 (흰 16% + 블러).
- brand: 담긴 상태 (`--color-brand` + 흰 ✓).
- 담기 전 `icon="add" tone="surface"`, 담은 뒤 `icon="added" tone="brand"`.

## 사용 규칙
- 뒤로 버튼은 화면 왼쪽 위 상단바 안. 꺾쇠 아이콘만.
- 44보다 작게 만들지 않는다.

## 확인 방법
- 렌더된 크기 44×44, `aria-label` 있음.

## 정상 예시
```tsx
<IconButton icon="back" label="뒤로 가기" />
<IconButton icon="added" tone="brand" label="담김" />
```

## 반례
```tsx
<IconButton icon="add" style={{ width: 36, height: 36 }} />  // 44 미만, label 없음
```
