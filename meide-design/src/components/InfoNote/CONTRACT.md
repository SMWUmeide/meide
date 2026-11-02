# InfoNote — CONTRACT

## 가져오는 위치
`import { InfoNote } from "@/components/InfoNote"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| children | 안내 문구 (1~2문장) | — |

- 배경 `--color-info-bg`, `--rounded-sm`, 상하 `--space-md` 좌우 `--space-lg`.
- ⓘ 아이콘 16 `--color-brand` + 문구 body-sm `--color-info-text`.

## 사용 규칙
- 현지 관습·추가 요금처럼 "몰라서 당황할 수 있는 것" 설명에만.
- 경고·오류에는 쓰지 않는다 (오류는 `--color-error`).

## 정상 예시
```tsx
<InfoNote>빵·식기·자리 준비 비용이에요. 1인당 받는 정상 요금이라 바가지가 아니에요.</InfoNote>
```
