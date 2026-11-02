// public/ 소스를 GitHub Pages에서 열리는 정적 프로토타입(prototype/)으로 변환합니다.
// 실행: hanip-europe-v2 폴더에서  node scripts/static-prototype/build.mjs
// 무거운 이미지(public/assets)와 여행지 데이터(public/cities)는 복사하지 않고 ../public/ 경로로 참조합니다.
import {readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pub = join(root, 'public'), lib = join(root, 'lib'), out = join(root, 'prototype');
const here = dirname(fileURLToPath(import.meta.url));

rmSync(out, {recursive: true, force: true});
mkdirSync(join(out, 'lib'), {recursive: true});
mkdirSync(join(out, 'data'), {recursive: true});

// 루트 기준 경로(/style.css, /assets/...)를 Pages 하위 폴더에서 동작하는 경로로 바꿉니다.
const rewrite = text => text
  .replace(/(["'`(])\/(assets|cities)\//g, '$1../public/$2/')
  .replace(/(["'`(])\/([\w-]+\.(?:js|mjs|css|svg|png))/g, '$1./$2')
  .replace(/\^\\\/assets\\\//g, '^\\.\\.\\/public\\/assets\\/')
  .replace(/location\.origin\+'\/#/g, "location.origin+location.pathname+'#");

for (const name of readdirSync(pub)) {
  const src = join(pub, name);
  if (statSync(src).isDirectory()) continue;
  if (/\.(js|css|html)$/.test(name)) writeFileSync(join(out, name), rewrite(readFileSync(src, 'utf8')));
  else copyFileSync(src, join(out, name));
}

// index.html: 서버 API 대신 브라우저 안에서 응답하는 shim을 app.js보다 먼저 불러옵니다.
const html = readFileSync(join(out, 'index.html'), 'utf8');
if (!html.includes('<script type="module" src="./app.js')) throw Error('index.html 구조가 바뀌었어요. build.mjs를 확인해주세요.');
writeFileSync(join(out, 'index.html'), html.replace('<script type="module" src="./app.js', '<script type="module" src="./api-shim.js"></script><script type="module" src="./app.js'));
copyFileSync(join(here, 'api-shim.mjs'), join(out, 'api-shim.js'));

// 서버 쪽 모듈을 브라우저용으로 복사합니다.
const fromLib = (name, transform = s => s) => writeFileSync(join(out, 'lib', name.replace(/\.mjs$/, '.js')), transform(readFileSync(join(lib, name), 'utf8')).replaceAll("'../public/", "'../"));
fromLib('shared-cart.mjs');
fromLib('destination-search.mjs');
fromLib('exchange-rates.mjs');
// cloud-cities.ts → 타입 표기만 걷어낸 JS
writeFileSync(join(out, 'lib', 'cloud-cities.js'), readFileSync(join(lib, 'cloud-cities.ts'), 'utf8')
  .replaceAll("'../public/", "'../")
  .replace(':Promise<any>|undefined', '')
  .replace('codePointAt(0)!', 'codePointAt(0)')
  .replace('r.body!.', 'r.body.')
  .replace('const matches:any[]=[]', 'const matches=[]')
  .replace(/\((\w+):(?:string|any|Response)\)/g, '($1)')
  .replace(/\((\w+):(?:string|any),(\w+):(?:string|null|string\|null)\)/g, '($1,$2)')
  .replace(/(\w+):string\|null/g, '$1')
  .replace(/(\w+):(?:string|any)(?=[,)])/g, '$1'));

// 고정 메뉴 데이터는 미리 계산해 JSON으로 저장합니다.
const tmp = join(lib, '.static-catalog.tmp.mjs');
writeFileSync(tmp, readFileSync(join(lib, 'restaurant-catalog.mjs'), 'utf8').replace(/(import \w+ from "\.\/menus\/[\w-]+\.json")/g, "$1 with {type:'json'}"));
try {
  const m = await import(pathToFileURL(tmp).href);
  const fix = obj => JSON.parse(JSON.stringify(obj).replaceAll('"/assets/', '"../public/assets/'));
  writeFileSync(join(out, 'data', 'restaurant-catalog.json'), JSON.stringify(fix(m.getRestaurantCatalog())));
  writeFileSync(join(out, 'data', 'usability-menu.json'), JSON.stringify(fix(m.getUsabilityMenu())));
} finally { rmSync(tmp, {force: true}); }

console.log('prototype/ 생성 완료');

// 브라우저·Pages 캐시가 옛 화면을 붙잡지 않도록, 파일 내용이 바뀔 때마다 index.html의 버전 값도 바뀌게 합니다.
{
  const files = ['app.js', 'style.css', 'api-shim.js', join('lib', 'shared-cart.js')];
  const v = createHash('sha1').update(files.map(f => readFileSync(join(out, f))).join('\n')).digest('hex').slice(0, 8);
  const page = readFileSync(join(out, 'index.html'), 'utf8')
    .replace(/(href="\.\/style\.css)(\?v=[^"]*)?"/, `$1?v=${v}"`)
    .replace(/(src="\.\/api-shim\.js)(\?v=[^"]*)?"/, `$1?v=${v}"`)
    .replace(/(src="\.\/app\.js)(\?v=[^"]*)?"/, `$1?v=${v}"`);
  writeFileSync(join(out, 'index.html'), page);
}
