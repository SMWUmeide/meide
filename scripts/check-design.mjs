import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : `${dir}/${entry.name}`))).flat();
}
const errors = [];
const files = (await walk("src")).filter(file => /\.(tsx?|css)$/.test(file) && !file.endsWith("tokens.css"));
let primaryCount = 0;
for (const file of files) {
  const source = await readFile(file, "utf8");
  if (/#[\da-f]{6}\b|\brgba?\s*\(/i.test(source)) errors.push(`${file}: 직접 쓴 색 값`);
  if (/from\s+["'][^"']*\byj\//.test(source)) errors.push(`${file}: 이전 앱 import`);
  if (file.endsWith(".css")) {
    for (const declaration of source.matchAll(/(?:^|[;{])\s*((?:margin|padding|gap|row-gap|column-gap)(?:-[\w-]+)?)\s*:\s*([^;}]+)/gm)) {
      if (/(?<![\w-])(?:\d*\.)?\d+px/.test(declaration[2])) errors.push(`${file}: ${declaration[1]}의 여백은 spacing 변수를 사용해 주세요`);
    }
    for (const match of source.matchAll(/font-size\s*:\s*([\d.]+)px/g)) if (Number(match[1]) < 13) errors.push(`${file}: 13px 미만 글자`);
  }
  if (file.startsWith("src/app/") && file.endsWith(".tsx")) {
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let count = 0;
    function visit(node) {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(ast) === "Button") {
        const variant = node.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.getText(ast) === "variant");
        if (!variant || (variant.initializer && ts.isStringLiteral(variant.initializer) && variant.initializer.text === "primary")) count++;
      }
      ts.forEachChild(node, visit);
    }
    visit(ast); primaryCount += count;
    if (count > 1) errors.push(`${file}: primary 버튼 ${count}개 (기본 variant 포함)`);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`검사 통과: ${files.length}개 파일, 직접 색 값 0건, 토큰 밖 여백 0건, 13px 미만 글자 0건, 화면 primary 총 ${primaryCount}개(파일당 최대 1개).\n의미 검토: brand는 알약·담김·안내 아이콘, AI 효과는 AICard에만 사용. AI 메뉴 사진 생성 없음.`);
