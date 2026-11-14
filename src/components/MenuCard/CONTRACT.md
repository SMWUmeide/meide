# MenuCard — CONTRACT

## 가져오는 위치
`import { MenuCard } from "@/components/MenuCard"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| originalName | 원어 메뉴명 ("ZUPPA DI ZUCCA E FARRO") | — |
| name | 한국어 메뉴명 | — |
| priceEur | `number` | — |
| priceKrw | `number` | — |
| photoUrl | `string` 또는 `null` | `null` |
| addedBy | `"me"` · `"companion-1"` · `"companion-2"` · `"companion-3"` · `null` | `null` |
| onToggle | `() => void` | — |
| onOpen | `() => void` (메뉴 상세로) | — |

## 구조
1. 사진: 높이 150, 카드 위쪽. 없으면 `--color-neutral` 면 + "사진 준비 중"(body-sm·secondary)
2. 담은 사람 태그: 사진 왼쪽 위 (addedBy 있을 때). 흰 92% 알약 + 작은 Avatar + "미영님이 담았어요"(body-sm)
3. 담기 IconButton: 사진 오른쪽 아래, 안쪽 `--space-md`
4. 원어명: body-sm·secondary, 한 줄 말줄임
5. 한국어 이름: body-md·on-surface, 최대 2줄
6. 가격: `EUR`(body-sm·secondary) + 숫자(label-md) / `약 ○○원`(body-sm·secondary)
- 카드: `--color-surface`, `--rounded-lg`, 정보 영역 안쪽 `--space-lg`.

## 동작
- addedBy 있음 → 사진 위에 해당 `--color-person-*` 55% 오버레이 + IconButton `added`.
- 사진·이름 탭 → onOpen. 담기 버튼 탭 → onToggle (상세로 넘어가지 않게 이벤트 전파 막기).

## 사용 규칙
- 2열 그리드, 사이 `--space-md`.
- 메뉴 사진을 AI로 생성하지 않는다.

## 확인 방법
- addedBy별 오버레이 색이 `--color-person-1~4`와 일치.

## 정상 예시
```tsx
<MenuCard originalName="ZUPPA DI PORRI E PATATE" name="서양 대파와 감자 크림 수프"
  priceEur={10} priceKrw={14990} photoUrl={url} addedBy="companion-1" />
```

## 반례
```tsx
<MenuCard … addedBy="me" style={{ outline: "3px solid green" }} />  // 담김을 테두리로 표시
```

## 894 화면 확장 · 2026-11-14

- `presentation="figma"`는 사람 오버레이·태그 없이 검정 담김 버튼을 표시해요. 기본값은 기존 `default`예요.
- `allergenLabel?: string`은 메뉴판에서 확인한 성분 배지를 표시해요. Figma 예시 문구를 실제 성분으로 간주하지 않아요.
- Figma 화면의 색·간격·글자는 `.figma-flow` 범위의 토큰을 사용해요. 이번 사용자 지시에 따라 기존 DESIGN.md보다 Figma를 우선해요.

## 첨부 그리드 확인 · 2026-11-14

- Figma 메뉴판은 화면 좌우 24px, 열 사이 16px이에요.
- 정보 영역은 사방 16px, 원어명–한국어명 4px, 한국어명–가격 16px, 가격–환산액 4px이에요.
- 담기 버튼은 사진 오른쪽·아래에서 각각 12px이에요. 한국어명은 Body 16 M 두 줄 영역을 유지해요.
- 320·360·412px에서도 같은 여백을 유지해요.

- 실시간 공유에서 `companionLabel`은 사진 위에 담은 동반인의 이름을 표시해요. `toggleDisabled`는 담기만 막고 상세 보기는 유지해요.
