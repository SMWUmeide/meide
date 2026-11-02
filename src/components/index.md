# 컴포넌트 목차

UI를 만들 때 아래 컴포넌트를 import해서 쓴다. 쓰기 전에 해당 `CONTRACT.md`를 읽는다.
import 경로가 실제 레포와 다르면 이 표를 먼저 고친다.

| 컴포넌트 | import | 쓰는 곳 | 계약서 |
|---|---|---|---|
| Button | `@/components/Button` | 주요·보조 버튼, 그린 알약 | `Button/CONTRACT.md` |
| IconButton | `@/components/IconButton` | 뒤로, 닫기, 담기(+/✓), 카메라 | `IconButton/CONTRACT.md` |
| Chip | `@/components/Chip` | 카테고리 탭, 필터 | `Chip/CONTRACT.md` |
| Card | `@/components/Card` | 흰 카드 묶음 | `Card/CONTRACT.md` |
| MenuCard | `@/components/MenuCard` | 메뉴 고르기 그리드 | `MenuCard/CONTRACT.md` |
| Avatar | `@/components/Avatar` | 나·동반인 표시 | `Avatar/CONTRACT.md` |
| CartBar | `@/components/CartBar` | 메뉴 고르기 하단 장바구니 바 | `CartBar/CONTRACT.md` |
| AICard | `@/components/AICard` | 메뉴 상세의 AI 정보 | `AICard/CONTRACT.md` |
| InfoNote | `@/components/InfoNote` | 현지 관습 안내 박스 | `InfoNote/CONTRACT.md` |
| BottomSheet | `@/components/BottomSheet` | 장바구니 결제 시트, 되물음 시트 | `BottomSheet/CONTRACT.md` |

## 화면 → 컴포넌트

| 화면 | 쓰는 컴포넌트 |
|---|---|
| 홈 | Card, Avatar, Button(brand 구슬은 홈 내비 전용 마크업) |
| 메뉴판 촬영 | IconButton |
| 메뉴 고르기 | IconButton, Avatar, Chip, MenuCard, CartBar |
| 메뉴 상세 | IconButton, Card, AICard, Button |
| 함께 담은 장바구니 | IconButton, Card, Avatar, BottomSheet, Button |
| 주문 문장 | IconButton, Card, InfoNote, Button |

## 구현과 상태

- 각 폴더의 `index.tsx`에서 named export해요. `AvatarGroup`도 `@/components/Avatar`에서 가져와요.
- 상태가 있는 컴포넌트는 네이티브 키보드 포커스·눌림·disabled를 지원해요. Button·IconButton·Chip·버튼 Card는 `state`로 loading도 지정할 수 있어요. MenuCard·CartBar·AICard 확인 버튼은 `loading`을 받아요.
- Chip 그룹은 부모에 `className="chip-group"`, 메뉴 2열은 `className="menu-grid"`를 붙여요. 선택 하나·화면당 primary 하나는 화면을 만들 때 검증해요.
- MenuCard의 선택적 `addedByName`으로 표시 이름을 전달해요. 미전달 시 나/동반인 순서를 사용해요. 사진 로딩 실패도 “사진 준비 중”으로 처리해요.
- AICard의 `onConfirm`을 전달하면 “직원에게 확인하는 문장 보기” 버튼을 표시해요. 내용의 섹션 라벨에는 `className="ai-section-label"`을 사용해요.
- BottomSheet는 네이티브 dialog로 포커스 제한·복귀를 처리해요. `label`로 접근 가능한 제목을 지정해요. 닫기를 허용할 때 `onClose`에서 부모의 `open`을 false로 바꿔요. 다른 시트가 열려 있으면 중첩을 거부해요.
- 기준 충돌: Avatar 34의 12px 글자는 DESIGN.md의 최소 글자 규칙에 맞춰 13px로 조정했어요.
