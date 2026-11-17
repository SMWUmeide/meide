// Uses short-lived CLI credentials in memory. Isolated check documents are
// removed in finally; real profile and quota documents are never touched.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FirestoreRecord,FirestoreInviteStore,FirestoreLedger } from '../server/firestore-storage.mjs';
import { MenuTestLimits,testPolicy } from '../server/menu-test-limits.mjs';
const require=createRequire(new URL('../server/package.json',import.meta.url));
const {Firestore}=require('@google-cloud/firestore');
const {OAuth2Client}=require('google-auth-library');
const project=process.argv[2];if(!/^[a-z][a-z0-9-]+$/.test(project??''))throw Error('Pass project ID.');
const token=readFileSync(0,'utf8').trim();if(!token)throw Error('Supply temporary OAuth token through stdin.');
const authClient=new OAuth2Client();authClient.setCredentials({access_token:token,expiry_date:Date.now()+3000000});
const db=new Firestore({projectId:project,authClient,preferRest:true});
const runId=randomUUID(),identityPath=`meideChecks/${runId}-invites`,usagePath=`meideChecks/${runId}-usage`;
const a={id:randomUUID(),token:randomUUID(),name:'저장 확인 A'},b={id:randomUUID(),token:randomUUID(),name:'저장 확인 B'};
const date='2026-11-16',now=()=>Date.parse(`${date}T12:00:00+09:00`);
const env={K_SERVICE:'storage-check',MENU_TEST_ENABLED:'true',MENU_TEST_START_DATE:date,MENU_TEST_PROFILE_IDS:a.id,MENU_TEST_BUDGET_USD:'1'};
const policy=testPolicy(env);let calls=0;
try{
  await db.doc(identityPath).create({serialized:JSON.stringify({version:1,rows:[]})});
  await db.doc(usagePath).create({serialized:JSON.stringify({version:1,policy:policy.fingerprint,jobs:[]})});
  const store=()=>new FirestoreInviteStore(new FirestoreRecord(db,identityPath));
  const [first,second]=await Promise.all([store().register(a),store().register(b)]);
  assert.equal(first.id,a.id);await store().accept({...a,code:second.code});
  assert.deepEqual(await store().list(b),[{id:a.id,name:a.name}]);
  const limits=()=>new MenuTestLimits({env,now,ledger:new FirestoreLedger(new FirestoreRecord(db,usagePath)),providers:{ocr:async()=>{calls++;return {text:'MENU'};},translate:async()=>({text:'메뉴'})}});
  const requestId=randomUUID();
  const payload={consent:true,imageBase64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfZkAAAAASUVORK5CYII='};
  const results=await Promise.allSettled([requestId,requestId,randomUUID(),randomUUID()].map(requestId=>limits().process({id:a.id,requestId,operation:'ocr',payload})));
  assert.equal(calls,2);assert.equal(results.filter(result=>result.status==='fulfilled').length,2);
  assert.equal((await limits().status(a.id)).remaining,0);
  await store().remove({...a,friendId:b.id});assert.deepEqual(await store().list(b),[]);
  console.log('LIVE FIRESTORE PASSED: reciprocal connections, independent store reads, concurrent two-use quota, duplicate protection, restart persistence. No paid menu providers called.');
}finally{
  await Promise.all([db.doc(identityPath).delete(),db.doc(usagePath).delete()]);
  await db.terminate();
}
