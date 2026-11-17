import test from 'node:test';
import assert from 'node:assert/strict';
import { searchAllergens } from '../src/features/allergies/search.ts';
import { allergens } from '../src/features/allergies/catalog.ts';
import { initialProgress, parseProgress } from '../src/state/model.ts';
test('prefix suggestions support Korean, aliases and normalized English', () => {
  assert.deepEqual(searchAllergens('사').map(x=>x.name), ['사과', '사탕무씨', '사프란']);
  assert.ok(searchAllergens('계란').some(x=>x.name==='달걀'));
  assert.deepEqual(searchAllergens(' APP ').map(x=>x.name), ['사과']);
  assert.deepEqual(searchAllergens('과'), []);
  assert.deepEqual(searchAllergens('   '), []);
  assert.deepEqual(searchAllergens('없는식품'), []);
});
test('catalog has unique identities and traceable food sources', () => {
  assert.equal(allergens.length, 206);
  assert.equal(new Set(allergens.map(x=>x.id)).size,allergens.length);
  assert.ok(allergens.every(x=>x.sourceUrl.startsWith('https://www.thermofisher.com/') && x.name && x.english));
});
test('selected allergies and explicit none survive reload; old profiles migrate', () => {
  const base={...initialProgress,stage:'preferences',name:'테스트'};
  assert.equal(parseProgress(JSON.stringify(base)).stage,'preferences');
  assert.deepEqual(parseProgress(JSON.stringify({...base,allergyStatus:'selected',allergyIds:['food-f49','food-f49',3]})).allergyIds,['food-f49']);
  assert.deepEqual(parseProgress(JSON.stringify({...base,allergyStatus:'none',allergyIds:['food-f49']})).allergyIds,[]);
});
