# meide · 한입

새 앱은 저장소 최상위의 React + TypeScript + Vite 프로젝트예요. 소스는 `src/`, 이전 앱은 `yj/`에 있어요. 현재 단계는 토큰과 공용 컴포넌트이며 화면과 API는 아직 연결하지 않았어요.

```sh
npm ci
npm run dev
```

Node.js 22.13 이상이 필요해요. 기본 주소는 `http://127.0.0.1:5173`이며 아직 화면을 만들지 않아 빈 페이지가 보여요.

```sh
npm run build
npm run lint
npm test
npm run check:design
```

컴포넌트는 `src/components/index.md`의 import 경로를 사용해요. API 키는 필요 없어요. 개발 환경과 이전 앱 실행 방법은 `AGENTS.md`의 '개발 환경'을 참고해 주세요.
