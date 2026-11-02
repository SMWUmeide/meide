# MJ · 9주차 디자인 규칙과 적용 검증

- 기준 문서: [루트 DESIGN.md](../../../DESIGN.md), [AGENTS.md](../../../AGENTS.md)
- [원자료](raw-value-inventory.json) · [실제 적용 전 값](before-dom-audit.json) · [결정표](decisions.md)
- [25개 토큰](tokens.json) · [Figma 실제 변수 export](figma-variables-export.json) · [스타일/바인딩 증거](figma-styles-and-bindings.json)
- [공식 형식 검사](official-lint.json) · [검증 실행](verify.py) · [검증 결과](verification.json)
- [3개 화면 전후 캡처](screenshots/) · [모바일 9가지 조건](responsive-audit.json)
- [독립 평가 원문](independent-review.md) · [최종 6항목 평가](final-evaluation.md) · [추가 규칙](added-rules.md)
- [실행 가능한 앱 스냅샷](app/)

Figma: https://www.figma.com/design/8LZ8hgBkYEi8fFa2U96F2L?node-id=87-2

## 과제 단계와 증거

1. 먼저 기존 값을 추출하고 적용 전 홈·메뉴·장바구니를 390×844로 캡처했다. 과거 CSS 선언 원자료와 현재 계산된 DOM 값을 구분했다.
2. [결정표](decisions.md)에 통합/유지/추가/예외를 남겼다. 별도 팀 회의가 있었다고 쓰지 않았다.
3. Primitive30개를 먼저 생성하고 Semantic25개를 Light/Dark에 alias했다. Type5 Text Style과 Light shadow2 Effect Style도 생성했다. Shadow는 STRING이 effect에 직접 바인딩되는 기능이 아니다. Dark shadow 값은 STRING 모드 값으로 제공하며 별도 Dark Effect Style 미등록은 남은 작업이다.
4. 첫 새 대화에서 DESIGN.md를 읽고 핵심3개 override를 작성했다. 다음 새 대화에서 별도 평가했고 발견한 대비·행간·격자 오류를 수정했다. 두 대화 ID는 submission-manifest.json에 기록한다.
5. 공식 Google CLI 0.4.0 검사에서 errors0/warnings0. 그림자 키는 공식 schema가 아닌 문서화한 프로젝트 확장이다.
6. 실제 로컬 앱의 담기·수량변경·삭제·팁·빈상태, 별도 고정데이터 화면의 폭/레이아웃/스크롤을 확인했다. 캡처는 동일 시연 데이터이며 개인 평점 상태가 있는 공개 앱과 순위가 다를 수 있다.

## Figma 화면 해석

기존 홈·메뉴·장바구니는 원래 페이지에 보존했다. 과제 페이지에는 원본 복제와 토큰을 연결한 편집 가능한 적용본이 있다. 이는 원본 Figma 프레임에 타입/색/반경/간격 바인딩을 적용한 비교본으로, 최종 웹 CSS 레이아웃과 픽셀 단위 완전 동기화본이라고 주장하지 않는다. 실행 결과는 screenshots 및 DOM 수치가 기준이다. 전체 UI를 한 장 이미지로 붙이지 않았다.

## 적용 범위

홈·메뉴판·장바구니의 디자인 토큰과 화면 규칙을 적용했다. 빈 장바구니와 비활성 주문 버튼은 실제 실행으로 확인했다.
- 음식 카드의 상세 버튼 안 추가 버튼이라는 기존 중첩 인터랙션 구조는 접근성 검토가 필요하다. 이번에는 JS 이벤트를 보존했다.
- COMPASS1.0.15는 설치를 확인하지 못했고 임의 설치/업데이트하지 않았다.

날짜: 2026-11-03 KST.
