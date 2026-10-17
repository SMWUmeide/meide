# 한입 유럽 — 공개 프로토타입 소스

2026-10-11 공개 사이트에 사용한 소스를 2026-10-13에 이 폴더로 복사했습니다.

공개 주소: https://hanip-europe-menu.alswn2963.chatgpt.site/

## GitHub Pages 정적 프로토타입

주소: https://smwumeide.github.io/meide/wireframes/yj/hanip-europe-v2/prototype/

`prototype/` 폴더는 `public/`을 서버 없이 열리도록 변환한 결과물입니다. 서버 API는 `scripts/static-prototype/api-shim.mjs`가 브라우저 안에서 대신 처리합니다.

- 메뉴: 고정 메뉴(Osteria La Solita Zuppa) 그대로 사용
- 함께 담기: 같은 기기·같은 브라우저 안에서만 공유됨 (서로 다른 폰끼리는 연결되지 않음)
- 환율: 실시간 조회 실패 시 고정 환율 사용

`public/`을 고친 뒤에는 이 폴더에서 `node scripts/static-prototype/build.mjs`를 실행해 `prototype/`을 다시 만들고 함께 커밋하세요.

## 주요 파일

- `public/app.js`, `public/style.css`, `public/index.html`: 화면과 사용자 흐름
- `public/test-menu.js`: 사진 내용과 관계없이 표시하는 고정 메뉴 30개
- `public/italian-order.js`: 주문 문장과 한글 읽는 방법
- `public/assets/`: 음식 및 문화 이미지
- `public/cities/`, `lib/cloud-cities.ts`: 여행지 데이터와 검색
- `lib/cloud-api.ts`, `lib/shared-cart.mjs`, `db/`, `drizzle/`: 클라우드 API와 공유 장바구니
- `lib/menus/`: 공식 메뉴 원본 및 한국어 검토 데이터

## 실행

Node.js 22.13 이상에서 이 폴더로 이동한 뒤 실행합니다.

```sh
npm ci
npm run dev
```

개발 서버 기본 주소는 http://localhost:5173 입니다. 빌드는 `npm run build`로 실행합니다. 공유 장바구니를 개발 환경에서 사용하려면 README의 로컬 D1 마이그레이션 안내를 따라 데이터베이스를 준비하세요.

`.openai/hosting.json`은 공개 사이트의 프로젝트 및 데이터베이스 연결 설정입니다. 이 GitHub 폴더 수정만으로 공개 사이트가 자동 업데이트되지는 않습니다. 별도 배포가 필요합니다.

이 소스에는 패키지 잠금 파일과 실행에 필요한 정적 데이터가 포함되어 있습니다. 설치된 의존성, 빌드 결과, 개인 환경 변수 및 로컬 데이터베이스는 포함하지 않습니다.

기존 Node 서버 방식 프로토타입과 자동 테스트는 옆의 `../gourmet-app/`에 있습니다. 2026-10-13 업로드 준비 시 해당 테스트 59개가 모두 통과했습니다.
