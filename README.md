# meide

`src` 브랜치의 실제 앱 코드와 실행 설정, 관련 문서는 [`yj/`](./yj/)에 모았습니다.

## 실행

```sh
cd yj
npm ci
npm run dev
```

이미 의존성이 설치되어 있으면 `npm ci`는 생략할 수 있습니다.

## 기본 검증

아래 명령은 `yj/`에서 실행합니다.

```sh
npm run build
npx eslint <변경한 파일>
node scripts/yj-flow.test.mjs
```

앱 구조와 실행 환경에 대한 자세한 내용은 [앱 README](./yj/README.md), 저장소 작업 규칙은 [AGENTS.md](./AGENTS.md)를 확인하세요.
