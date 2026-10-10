#!/usr/bin/env bash
# 프로토타입 빌드 스크립트: 소스를 빌드해서 ../figma-make-prototype 에 덮어씁니다.
# 사용법: 이 폴더에서  pnpm install && bash build.sh
set -euo pipefail
OUT=../figma-make-prototype
mkdir -p public/assets
cp -rn "$OUT"/assets/* public/assets/ 2>/dev/null || true   # 사진/아이콘 에셋 (프로토타입 폴더에서 가져옴)
rm -f public/assets/index-*
FIGMA_PUBLIC_URL=. pnpm exec vite build
cd dist
# file:// 와 하위 경로(GitHub Pages)에서도 열리도록 경로 보정 + 클래식 스크립트로 변환
sed -i 's#`/assets/#`./assets/#g; s#=`/assets`#=`./assets`#g' assets/*.js
sed -i 's#url(/assets/#url(./assets/#g' assets/*.css
JS=$(ls assets/index-*.js); CSS=$(ls assets/index-*.css)
python3 - "$JS" "$CSS" <<'PY'
import sys,re
js,css=sys.argv[1:]
h=open('index.html').read()
h=re.sub(r'<script type="module"[^>]*></script>','',h)
h=re.sub(r'<link rel="stylesheet"[^>]*>','<link rel="stylesheet" href="./%s">'%css,h)
h=h.replace('</body>','<script defer src="./%s"></script>\n</body>'%js)
h=h.replace('Figma Make App','메이드 – 유럽 미식 가이드')
open('index.html','w').write(h)
PY
cd ..
rm -f "$OUT"/assets/index-*
cp dist/index.html "$OUT"/
cp dist/assets/index-* "$OUT"/assets/
echo "완료: $OUT 에 반영됨"
