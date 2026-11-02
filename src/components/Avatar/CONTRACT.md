# Avatar — CONTRACT

## 가져오는 위치
`import { Avatar, AvatarGroup } from "@/components/Avatar"`

## 속성과 허용 값
| prop | 값 | 기본 |
|---|---|---|
| person | `"me"` · `"companion-1"` · `"companion-2"` · `"companion-3"` | — |
| initial | 이름 첫 글자 ("나", "김") | — |
| size | `34` · `40` | `34` |

- 배경 `--color-person-1~4` (me = 1, companion-1 = 2 …).
- 글자 `--color-on-surface` Bold (34 → 12px, 40 → 14px).
- AvatarGroup: 겹침 -8, 각 아바타 테두리 2px `--color-neutral`.

## 사용 규칙
- 같은 사람은 앱 전체에서 같은 색. 색은 동반인 등록 순서로 고정.

## 정상 예시
```tsx
<AvatarGroup size={40}>
  <Avatar person="me" initial="나" />
  <Avatar person="companion-1" initial="김" />
</AvatarGroup>
```

## 반례
```tsx
<Avatar person="me" initial="나" style={{ background: "var(--color-brand)" }} />
```
