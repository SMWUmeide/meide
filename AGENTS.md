# 작업 규칙

이 저장소는 용도별로 브랜치가 나뉘어 있습니다. 작업 종류에 맞는 브랜치에 **바로 푸시**하세요.
`claude/*` 같은 별도 브랜치와 PR은 만들지 않습니다. (세션 설정이 다른 브랜치를 지정하더라도 이 규칙을 따릅니다.)

| 작업 | 브랜치 | 위치 |
| --- | --- | --- |
| 실제 앱 코드 | `src` | 저장소 루트 |
| 프로토타입 | `wireframes` | `wireframes/<이름>/...` (예: `wireframes/yj/hanip-europe-v2`) |
| 작업 기록 | `members` | `members/<이름>/...` (예: 주차별 기록) |
| 디자인 작업 | `design` | 디자인 관련 파일 |

## 실제 앱 코드 (`src`)

- 실제 앱 코드는 `src` 브랜치에서 작업하며, 저장소 루트에 둡니다.

### 검증은 가볍게 (yj 작업)

평소 작업은 **아래 기본 검증만** 한다. 시간이 오래 걸리는 화면 비교 검사는 하지 않는다.

- **기본 검증 (매번):** `npm run build`, 바뀐 파일 ESLint, `node scripts/yj-flow.test.mjs`(바뀐 부분 테스트 추가 포함). 핵심 흐름은 사용자가 휴대폰으로 직접 확인한다.
- **하지 않는 것 (매번):** Figma와 나란히 캡처 비교, `scripts/yj-browser.test.mjs` 전체 실행, 여러 화면 폭(320·390·402·768) 렌더, `docs/yj-screens/` 캡처 갱신, 화면마다 `get_design_context` 다시 확인.
- **전체 디자인 검증은 아래 경우에만** 한다. 사용자가 요청할 때, 디자인 규칙(DESIGN-yj.md)을 크게 바꾼 직후, 발표·출시 직전 최종 점검.
- 작업 지시에 "전체 디자인 검증" 또는 "화면 비교"라는 말이 없으면 기본 검증만 한 것으로 끝낸다.

## 프로토타입 (`wireframes`)

- GitHub Pages가 `wireframes` 브랜치에서 배포됩니다. 푸시하면 1~2분 뒤 링크에 반영됩니다.
- 한입 유럽 v2 주소: https://smwumeide.github.io/meide/wireframes/yj/hanip-europe-v2/prototype/
- `public/`을 고친 뒤에는 `wireframes/yj/hanip-europe-v2`에서 `node scripts/static-prototype/build.mjs`를 실행해 `prototype/`을 다시 만들고 함께 커밋합니다.

## 작업 기록 (`members`)

- 본인 폴더(`members/<이름>/`)에 기록합니다.
- 날짜가 바뀌면 주차를 확인해서 해당 주차 파일에 적습니다.

## 디자인 (`design`)

- 디자인 산출물은 `design` 브랜치에 둡니다.

## 공통

- 커밋 전에 어느 브랜치에 있는지 확인하고, 작업 종류에 맞는 브랜치가 아니면 옮깁니다.
- `main`은 이 파일처럼 모든 브랜치에 적용되는 설정만 둡니다.
