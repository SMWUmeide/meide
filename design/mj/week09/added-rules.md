# 검토 후 추가·교정한 규칙

- D13: 아바타·수량 기호 행간과 flex 가운데 정렬을 분리. 기존 12/21·12/24·18/18을 12/18·18/27로 교정.
- D14: 360/390/440×844 및 기본 글자 배율이라는 검수 조건을 명시. 실제 기기/확대모드 검수는 별도.
- D15: 비텍스트3:1, 아이콘 버튼 이름, Tab 포커스 확인 기준 추가.
- D16: 로딩/빈/오류의 행동·문구와 실제 장애 재현 여부 구분.
- D17: 그라데이션 시작/끝 양쪽 대비 확인. Light secondary를 #62626C → #55545E로 수정(끝색3.757 → 4.647:1).
- 구현 교정: cart-items의 임의2px padding을 xs=4px로 변경.

초기 리뷰 원문은 independent-review.md로 보존한다. 수정 후 증거는 responsive-audit.json, functional-checks.json, scroll-focus-check.json, final-evaluation.md를 본다. 초기 리뷰에서 미검증으로 판단한 범위가 이후 전부 해결됐다고 주장하지 않는다.
