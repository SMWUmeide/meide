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
