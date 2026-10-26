# 한입 유럽 · MJ 프로토타입

## 최신 디자인 프로토타입 · 2026-10-27

현재 디자인 검토용 결과물은 **[hanip-design-journey](hanip-design-journey/)** 입니다.

- [누구나 접속할 수 있는 공개 사이트](https://hanip-design-journey.alswn2963.chatgpt.site/)
- 로컬 실행: `cd wireframes/mj/hanip-design-journey` → `npm start` → `http://localhost:4173`
- 갤럭시 S26 비율, 통일된 크림·피치 그라데이션과 흑백·회색, 글래스 하단 탭을 적용했습니다.
- 실제 도시 검색과 브라우저 내 저장을 지원하며, 나머지 서비스 연결은 화면 흐름 확인을 위한 시연입니다.
- 기존 `gourmet-app`과 `hanip-europe-site`는 이전 기능 검증·두 사람 동기화 버전으로 보존했습니다. 새 디자인 버전과 실제 API 연동 수준이 다릅니다.

**아래의 기존 사이트·실행 안내는 이전 버전 기준입니다.**


2026-10-17 최신 디자인과 기능을 반영한 **공개 사이트 버전 25**입니다. 박성호·김미영 화면은 별도 앱 두 개가 아니라, 같은 코드에서 역할을 바꾸어 접속하는 두 시점입니다.

## 바로 사용하기

- [공개 홈](https://hanip-europe-menu.alswn2963.chatgpt.site/)
- [박성호 시점](https://hanip-europe-menu.alswn2963.chatgpt.site/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=seongho)
- [김미영 시점](https://hanip-europe-menu.alswn2963.chatgpt.site/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=miyeong)

두 링크를 각각 다른 브라우저 또는 기기에서 열면 같은 메뉴판과 장바구니에 연결됩니다. 각자 고른 수량은 따로 표시됩니다. 동일한 `prototype` UUID가 같은 방을 의미하므로, 다른 테스트에는 새 UUID를 양쪽 링크에 똑같이 사용하세요. 로컬 서버와 공개 서버의 장바구니는 서로 연결되지 않습니다.

## 코드 구성

| 폴더 | 용도 |
| --- | --- |
| [gourmet-app](gourmet-app/) | **가장 쉽게 실행하는 로컬 버전.** Node.js만 필요하고 패키지 설치 없이 실행합니다. 두 시점·공유 장바구니·최신 UI를 포함합니다. |
| [hanip-europe-site](hanip-europe-site/) | **현재 공개 사이트 전체 소스이자 UI 수정의 기준.** Vinext/React + Cloudflare D1 구성입니다. |
| [gourmet-prd](gourmet-prd/) | 기존 기획 페이지와 기능명세 기록. 현재 화면·동작은 위 코드와 최신 README를 기준으로 합니다. |

## 빠른 로컬 실행

Node.js 22.13 이상(권장 24 이상)에서 저장소 루트를 기준으로 실행합니다.

```sh
git clone --branch wireframes --single-branch https://github.com/SMWUmeide/meide.git
cd meide/wireframes/mj/gourmet-app
npm start
```

- 홈: <http://localhost:3000/>
- 박성호: <http://localhost:3000/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=seongho>
- 김미영: <http://localhost:3000/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=miyeong>

API 키 없이 기본 프로토타입을 실행할 수 있습니다. 첫 실행 시 포함된 도시 데이터 압축을 풀고 체크섬을 검사합니다. `index.html`을 직접 열거나 GitHub 파일 화면으로 실행하지 말고 로컬 서버를 사용하세요.

## 화면 수정

1. `hanip-europe-site/public/app.js`에서 화면 구성과 동작을 수정합니다.
2. `hanip-europe-site/public/style.css`에서 색·폰트·여백·아이콘 배치를 수정합니다.
3. MJ 폴더에서 `node scripts/sync-prototypes.mjs`를 실행해 같은 UI와 메뉴 데이터를 로컬 버전에 반영합니다.
4. `node scripts/sync-prototypes.mjs --check`로 두 코드의 공유 파일이 일치하는지 확인합니다.

백엔드는 서로 다릅니다. 로컬 API는 `gourmet-app/server.mjs`, 클라우드 API는 `hanip-europe-site/lib/cloud-api.ts`입니다. 공유 UI 동기화 명령은 백엔드를 덮어쓰지 않습니다.

현재 디자인은 화이트·벽돌빛 레드·아이보리 포인트, Pretendard, 하단 글래스 메뉴, 어두운 마주보기 대화 화면입니다. 메뉴는 한 줄 요약, 자세한 설명은 상세 화면에 표시합니다. 주문 확대 아이콘 위치·확대 화면 상단 정렬 및 안내 문구 제거까지 반영했습니다.

번역 연결, 음성 입력, 촬영 테스트 방식, 수정할 파일과 검증 방법은 각 폴더 README를 참고하세요. `.env`, 개인 주문 기록, 설치 의존성, 로컬 DB와 빌드 산출물은 공유하지 않습니다. 이 GitHub 코드를 수정해도 기존 공개 사이트에는 자동 배포되지 않습니다.
