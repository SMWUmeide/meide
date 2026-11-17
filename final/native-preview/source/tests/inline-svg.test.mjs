import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
test('내장 아이콘은 원본 SVG와 같고 안드로이드에서 직접 읽을 수 있어요', async () => {
  const icons = JSON.parse(await readFile(new URL('src/assets/inline-svg.json', root), 'utf8'));
  assert.ok(Object.keys(icons).length > 0);
  for (const [path, uri] of Object.entries(icons)) {
    assert.ok(uri.startsWith('data:image/svg+xml;utf8,'), path);
    assert.equal(decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length)), await readFile(new URL(path, root), 'utf8'), path);
  }
});
