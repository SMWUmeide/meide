import test from 'node:test';
import assert from 'node:assert/strict';
import { addFood, searchFoods } from '../src/features/foods/catalog.ts';
import { initialProgress, parseProgress, destination } from '../src/state/model.ts';
test('common food prefixes and aliases',()=>{
 assert.ok(searchFoods('고').includes('고수'));
 assert.deepEqual(searchFoods('계란'),['달걀']);
 assert.deepEqual(searchFoods(''),[]);
});
test('custom names trim, reject blanks, deduplicate and canonicalize aliases',()=>{
 assert.deepEqual(addFood([], '  민트 초콜릿  '),['민트 초콜릿']);
 assert.deepEqual(addFood(['민트 초콜릿'],'민트초콜릿'),['민트 초콜릿']);
 assert.deepEqual(addFood(['달걀'],'계란'),['달걀']);
 assert.deepEqual(addFood([],'  '),[]);
 assert.equal(addFood([],'가'.repeat(100))[0].length,40);
});
test('both allergy answers reach foods; saved custom choices restore independently',()=>{
 for (const allergyStatus of ['none','selected']) {
  const p={...initialProgress,name:'테스트',stage:'foods',allergyStatus,allergyIds:allergyStatus==='selected'?['food-f49']:[],avoidedFoods:['민트 초콜릿','고수'],foodStatus:'selected'};
  const loaded=parseProgress(JSON.stringify(p));
  assert.equal(destination(loaded),'/setup/foods');
  assert.deepEqual(loaded.avoidedFoods,['민트 초콜릿','고수']);
  assert.deepEqual(loaded.allergyIds,p.allergyIds);
 }
 const p={...initialProgress,name:'테스트',stage:'foods',allergyStatus:'none',foodStatus:'none',avoidedFoods:['고수']};
 assert.deepEqual(parseProgress(JSON.stringify(p)).avoidedFoods,[]);
 assert.equal(parseProgress(JSON.stringify({...initialProgress,name:'테스트',stage:'foods'})).stage,'preferences');
});
