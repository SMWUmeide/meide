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
