import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { register } from 'node:module';
import { test } from 'node:test';

const state = { files: new Map(), storage: new Map() };
globalThis.menuAnalysisTest = state;
const modules = {
  '@react-native-async-storage/async-storage': `export default {
    async getItem(key) { return globalThis.menuAnalysisTest.storage.get(key) ?? null; },
    async setItem(key, value) { globalThis.menuAnalysisTest.storage.set(key, value); },
  };`,
  'expo-crypto': `import { createHash } from 'node:crypto';
    export const CryptoDigestAlgorithm = { SHA256: 'sha256' };
    export async function digestStringAsync(algorithm, value) { return createHash(algorithm).update(value).digest('hex'); }`,
  'expo-image-manipulator': `export const SaveFormat = { JPEG: 'jpeg' };
    export const ImageManipulator = { manipulate(uri) {
      return { async renderAsync() { return {
        async saveAsync() { return { base64: globalThis.menuAnalysisTest.files.get(uri) }; },
      }; } };
    } };`,
};
const loader = `
  const modules = ${JSON.stringify(modules)};
  export function resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(modules, specifier)) {
      return { url: 'data:text/javascript,' + encodeURIComponent(modules[specifier]), shortCircuit: true };
    }
    if (specifier === './menu-schema' || specifier === './menu-photo') {
      return nextResolve(specifier + '.ts', context);
    }
    return nextResolve(specifier, context);
  }`;
register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url);
const { analyzePhotos } = await import('../src/features/order/analyze.ts');
const { normalizeAnalysis } = await import('../src/features/order/menu-schema.ts');

const board = normalizeAnalysis({
  isMenu: true, restaurantName: 'Roma', currency: 'EUR',
  items: [{ categoryName: '파스타', categoryOriginal: 'Pasta', originalName: 'Pasta', name: '파스타', priceEur: 9,
    analogy: '면 요리예요', description: '파스타예요', ingredients: [], allergen: '확인해 주세요',
    estimated: [], method: '삶아요', possibleAllergen: '확인해 주세요' }],
});
const photo = uri => ({ uri, id: uri, width: 600, height: 800 });
const signal = new AbortController().signal;

test('파일을 다시 선택해도 사진 내용이 같으면 저장된 분석을 사용해요', async t => {
  state.storage.clear();
  state.files = new Map([['file:first', 'aGVsbG8='], ['file:again', 'aGVsbG8='], ['file:different', 'd29ybGQ=']]);
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ board }));
  assert.deepEqual(await analyzePhotos([photo('file:first')], signal), board);
  assert.deepEqual(await analyzePhotos([photo('file:again')], signal), board);
  assert.equal(fetch.mock.callCount(), 1);
  assert.deepEqual(await analyzePhotos([photo('file:different')], signal), board);
  assert.equal(fetch.mock.callCount(), 2);
});

test('손상된 저장 결과는 교체하고 한도 오류는 저장하지 않아요', async t => {
  state.storage.clear();
  state.files = new Map([['file:again', 'aGVsbG8=']]);
  const origin = process.env.EXPO_PUBLIC_MEIDE_API_URL || 'https://meide-meide1.vercel.app';
  const endpoint = new URL('/api/analyze-menu', origin);
  const body = JSON.stringify({ images: [{ mediaType: 'image/jpeg', data: 'aGVsbG8=' }] });
  const digest = createHash('sha256').update(`${endpoint.href}\n${body}`).digest('hex');
  const key = `meide.menu-analysis.v1.${digest}`;
  state.storage.set(key, 'broken');
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ board }));
  fetch.mock.mockImplementationOnce(async () => Response.json({ message: '호출 한도' }, { status: 429 }));
  await assert.rejects(analyzePhotos([photo('file:again')], signal), /호출 한도/);
  assert.equal(state.storage.get(key), 'broken');
  assert.deepEqual(await analyzePhotos([photo('file:again')], signal), board);
  assert.deepEqual(JSON.parse(state.storage.get(key)), board);
  assert.equal(fetch.mock.callCount(), 2);
});
