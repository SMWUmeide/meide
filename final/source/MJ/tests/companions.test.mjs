import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { parseInvite, addCompanion } from '../src/features/companions/invite.ts';
import { initialProgress, parseProgress, destination } from '../src/state/model.ts';
test('codes accept exactly 8 English letters and digits, including lowercase input', () => {
 assert.equal(parseInvite(' ab23CD45 '),'AB23CD45');
 for (const raw of ['ABC1234','ABC123456','가나다라마바사아','AB12-CD3','https://example.com','MEIDE1|id|name']) assert.throws(()=>parseInvite(raw));
});
test('reject invalid profiles, own QR and repeated companions', () => {
 const a=randomUUID(), b=randomUUID(); const person={id:b,name:'친구'};
 assert.throws(()=>addCompanion([],a,{id:'bad',name:'친구'}));
 assert.throws(()=>addCompanion([],a,{id:a,name:'나'}),/내 QR/);
 const people=addCompanion([],a,person);
 assert.deepEqual(people,[person]);
 assert.throws(()=>addCompanion(people,a,person),/이미/);
});
test('identity and selected companions survive restart with stage validation', () => {
 const id=randomUUID(), friend=randomUUID(), token=randomUUID();
 const state={...initialProgress,stage:'companions',name:'테스트',profileId:id,profileToken:token,allergyStatus:'none',foodStatus:'none',companions:[{id:friend,name:'친구'}],companionStatus:'selected'};
 const loaded=parseProgress(JSON.stringify(state));
 assert.equal(loaded.profileId,id); assert.equal(loaded.profileToken,token);
 assert.equal(destination(loaded),'/setup/companions');
 assert.deepEqual(loaded.companions,state.companions);
 assert.equal(loaded.companionStatus,'selected');
 assert.equal(parseProgress(JSON.stringify({...state,companionStatus:'later'})).companionStatus,'later');
 assert.equal(parseProgress(JSON.stringify({...state,foodStatus:undefined})).stage,'foods');
 assert.equal(parseProgress(JSON.stringify({...state,allergyStatus:undefined})).stage,'preferences');
});
test('an invitation survives onboarding stages without accepting on behalf of the recipient',()=>{
 for (const stage of ['intro','name','preferences','foods','companions']) {
  const state={...initialProgress,stage,name:'테스트',allergyStatus:'none',foodStatus:'none',pendingInvite:'AB23CD45'};
  const loaded=parseProgress(JSON.stringify(state));
  assert.equal(loaded.pendingInvite,'AB23CD45'); assert.deepEqual(loaded.companions,[]);
 }
});
