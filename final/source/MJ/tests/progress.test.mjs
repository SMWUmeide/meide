import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress, parseProgress, advance, destination } from '../src/state/model.ts';
test('fresh install starts at first introduction', () => { assert.equal(destination(parseProgress(null)), '/onboarding'); assert.equal(parseProgress(null).slide, 0); });
test('shared menu invitation survives first-run setup and rejects malformed tokens', async () => {
 const {finishSetup}=await import('../src/state/model.ts');
 const token='ab'.repeat(32);
 const first=parseProgress(JSON.stringify({...initialProgress,pendingOrderInvite:token}));
 assert.equal(first.pendingOrderInvite,token);
 assert.equal(destination(first),'/onboarding');
 const done=finishSetup({...first,stage:'companions',name:'테스트',allergyStatus:'none',foodStatus:'none'},'later');
 assert.equal(parseProgress(JSON.stringify(done)).pendingOrderInvite,token);
 assert.equal(parseProgress(JSON.stringify({...done,pendingOrderInvite:'https://wrong.invalid'})).pendingOrderInvite,undefined);
});
test('next advances through 3 pages then name', () => { const second = advance(initialProgress); const third = advance(second); assert.equal(second.slide, 1); assert.equal(third.slide, 2); assert.equal(destination(advance(third)), '/setup/name'); });
test('every skip resumes at name after restart', () => { for (const slide of [0,1,2]) assert.equal(destination(parseProgress(JSON.stringify({ ...initialProgress, slide, stage: 'name' }))), '/setup/name'); });
test('partial progress and saved name survive restart', () => { assert.equal(parseProgress(JSON.stringify(advance(initialProgress))).slide, 1); const saved = { ...initialProgress, stage: 'preferences', name: '민주' }; assert.equal(destination(parseProgress(JSON.stringify(saved))), '/setup/preferences'); assert.equal(parseProgress(JSON.stringify(saved)).name, '민주'); });
test('corrupt progress recovers and blank saved names cannot bypass name', () => { for (const raw of ['{', '{}', '{"version":5}', JSON.stringify({...initialProgress,slide:99})]) assert.deepEqual(parseProgress(raw), initialProgress); assert.equal(parseProgress(JSON.stringify({...initialProgress,stage:'preferences',name:' '})).stage,'name'); });

test('setup completion persists home for both registration and skipping', async () => {
 const {finishSetup} = await import('../src/state/model.ts');
 const setup = {...initialProgress,stage:'companions',name:'테스트',allergyStatus:'none',foodStatus:'none'};
 for (const status of ['selected','later']) {
  const finished = finishSetup(setup,status);
  const loaded = parseProgress(JSON.stringify(finished));
  assert.equal(destination(loaded),'/home');
  assert.equal(loaded.companionStatus,status);
  assert.equal(loaded.homeGuideSeen,false);
  assert.equal(parseProgress(JSON.stringify({...finished,homeGuideSeen:true})).homeGuideSeen,true);
 }
});
test('home still requires completed name and food preferences', () => {
 const state={...initialProgress,stage:'home',name:'테스트',allergyStatus:'none',foodStatus:'none',homeGuideSeen:true};
 assert.equal(parseProgress(JSON.stringify({...state,name:''})).stage,'name');
 assert.equal(parseProgress(JSON.stringify({...state,allergyStatus:undefined})).stage,'preferences');
 assert.equal(parseProgress(JSON.stringify({...state,foodStatus:undefined})).stage,'foods');
 assert.equal(parseProgress(JSON.stringify({...state,homeGuideSeen:'true'})).homeGuideSeen,false);
});
