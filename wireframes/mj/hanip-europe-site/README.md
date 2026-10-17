# 한입 유럽 · 공개 사이트 전체 소스

2026-10-17 **공개 버전 25**의 화면·클라우드 API·메뉴 데이터입니다. 원본 소스 커밋은 `7095d13d06038639e1d32753e5628f69bd55a1a9`입니다.

- [공개 사이트](https://hanip-europe-menu.alswn2963.chatgpt.site/)
- [박성호 시점](https://hanip-europe-menu.alswn2963.chatgpt.site/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=seongho)
- [김미영 시점](https://hanip-europe-menu.alswn2963.chatgpt.site/?prototype=1ec56f09-d5ed-475c-872b-1849267969c8&person=miyeong)

**쉽게 실행·수정하려면 [../gourmet-app/](../gourmet-app/)을 먼저 사용하세요.** 두 시점의 화면은 하나의 앱에서 `person`으로 구분하며 `prototype` UUID가 같으면 같은 공유 장바구니에 연결됩니다. UI 구조와 수정 안내는 [MJ 안내](../README.md)에 있습니다.

## 이 폴더 실행

Node.js 22.13 이상(권장 24)에서:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_shallow_doctor_spectrum.sql
npm run dev
```

기본 주소는 <http://localhost:5173/>입니다. 최초 실행에는 위 D1 테이블 준비가 필요합니다. SQL은 처음 한 번만 실행하세요. `npm run dev`와 `npm start`는 같은 `.wrangler/state`의 로컬 DB를 사용합니다. 두 시점 링크의 서버 주소를 `http://localhost:5173`으로 바꾸면 로컬에서 테스트할 수 있습니다.

프레임워크의 설치·빌드·D1 상세는 [FRAMEWORK.md](FRAMEWORK.md)에 있습니다. `app/page.tsx`는 프레임워크 기본 페이지이며, 실제 앱 화면은 Worker가 `/`에서 제공하는 **`public/index.html`과 `public/app.js`**입니다.

## 주요 파일

- `public/app.js`, `public/style.css`: 공통 UI와 시점별 동작
- `public/korean-dining.js`: 쉬운 음식명·한 줄 요약과 한식 비교
- `public/live-translation.js`: 요청사항·대화 번역
- `public/assets/`: 음식·식문화 이미지
- `public/cities/`, `lib/cloud-cities.ts`: 여행지 검색 자료
- `lib/cloud-api.ts`: API 라우팅
- `lib/shared-cart.mjs`, `db/schema.ts`, `drizzle/`: D1 공유 장바구니
- `lib/menus/`: 원문 메뉴·한국어 검토·사진 연결
- `scripts/*test.mjs`: 메뉴 해석·번역·동반인 동기화 검증

```sh
node --test scripts/*test.mjs
node ../scripts/sync-prototypes.mjs --check
```

## 협업·배포

`public/`와 메뉴 데이터를 수정한 뒤 MJ 폴더에서 `node scripts/sync-prototypes.mjs`를 실행하면 로컬 실행 버전에 같은 UI가 반영됩니다. 백엔드 파일은 자동 덮어쓰지 않습니다.

`.openai/hosting.json`은 원본 공개 사이트의 식별자와 D1 바인딩 선언이며 비밀 키가 아닙니다. 이 저장소를 수정하거나 GitHub에 올려도 기존 사이트가 자동 배포되지는 않습니다. 자신의 사이트로 배포할 때는 본인 프로젝트를 등록하고 해당 식별자로 설정하세요. 기존 사이트 배포에는 그 사이트에 대한 권한이 필요합니다.

실행 시 외부 서비스 사용 범위는 [로컬 버전 README](../gourmet-app/README.md#동작-범위)와 같습니다. `.env`, 설치 의존성, 빌드 결과, 세션 정보·로컬 DB는 포함하지 않습니다.
