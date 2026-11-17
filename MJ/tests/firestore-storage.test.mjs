import test from 'node:test';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { FirestoreRecord, FirestoreLedger, FirestoreInviteStore } from '../server/firestore-storage.mjs';
import { MenuTestLimits, testPolicy } from '../server/menu-test-limits.mjs';
import { WebMapLimits } from '../server/web-map-limits.mjs';
import { createApp } from '../server/app.mjs';

test('migrated localhost preview preserves POST requests and never touches the old registry',async()=>{
  const store=new Proxy({},{get(){throw Error('Local registry must not be used after migration.');}});
  const server=createApp({store,webRoot:'/unused',remoteApiOrigin:'https://meide.example',allowedOrigins:['http://localhost:5190']});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/invites`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:5190'},body:'{}',redirect:'manual'});
    assert.equal(response.status,307);assert.equal(response.headers.get('Location'),'https://meide.example/api/invites');
  }finally{await new Promise(resolve=>server.close(resolve));}
});

// Async transactional test double: catches accidental network calls before a
// durable reservation and shared-store failures. Deployed Firestore is checked separately.
function database(initial) {
  const docs=new Map(Object.entries(initial).map(([key,value])=>[key,{serialized:JSON.stringify(value)}]));
  let queue=Promise.resolve();
  return {docs,fail:false,doc:path=>path,
    runTransaction(fn){const run=queue.then(async()=>{
      if(this.fail)throw Error('database unavailable');
      const writes=new Map();
      const result=await fn({get:async key=>{await new Promise(resolve=>setTimeout(resolve,1));return {exists:docs.has(key),data:()=>structuredClone(docs.get(key))};},set:(key,value)=>writes.set(key,value)});
      for(const [key,value] of writes)docs.set(key,value);
      return result;
    });queue=run.catch(()=>{});return run;},
  };
}

test('cloud identities and reciprocal friend links survive independent store instances and await HTTP authentication',async()=>{
  const db=database({invites:{version:1,rows:[]}}),store=new FirestoreInviteStore(new FirestoreRecord(db,'invites'));
  const a={id:randomUUID(),token:randomUUID(),name:'가'},b={id:randomUUID(),token:randomUUID(),name:'나'};
  const [ar,br]=await Promise.all([store.register(a),store.register(b)]);
  await store.accept({...a,code:br.code});
  const restarted=new FirestoreInviteStore(new FirestoreRecord(db,'invites'));
  assert.deepEqual(await restarted.list(b),[{id:a.id,name:'가'}]);
  assert.equal((await restarted.find(ar.code)).id,a.id);
  await assert.rejects(restarted.authenticate({...a,token:randomUUID()}),e=>e.status===401);
  const app=createApp({store:restarted,webRoot:'/tmp'});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  try{
    const response=await fetch('http://127.0.0.1:'+app.address().port+'/api/companions/list',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(a)});
    assert.equal(response.status,200);assert.deepEqual((await response.json()).companions,[{id:b.id,name:'나'}]);
  }finally{await new Promise(resolve=>app.close(resolve));}
  await restarted.remove({...a,friendId:b.id});assert.deepEqual(await store.list(b),[]);
});

test('two Cloud Run instances reserve before OCR: concurrent third job and duplicate never call Google',async()=>{
  const id=randomUUID(),env={K_SERVICE:'meide-api',NODE_ENV:'production',MENU_TEST_ENABLED:'true',MENU_TEST_START_DATE:'2026-11-15',MENU_TEST_PROFILE_IDS:id,MENU_TEST_BUDGET_USD:'125'};
  const db=database({usage:{version:1,policy:testPolicy(env).fingerprint,jobs:[]}}),calls=[];
  const make=()=>new MenuTestLimits({env,now:()=>Date.parse('2026-11-16T00:00:00+09:00'),ledger:new FirestoreLedger(new FirestoreRecord(db,'usage')),providers:{ocr:async()=>{const saved=JSON.parse(db.docs.get('usage').serialized);assert.ok(saved.jobs.some(job=>job.operations.ocr==='pending'));calls.push('ocr');return {text:'MENU'};},translate:async()=>({text:'메뉴'})}});
  const a=make(),b=make(),imageBase64=Buffer.from([255,216,255,224,0,0,0,0,255,217]).toString('base64');
  const input=()=>({id,requestId:randomUUID(),operation:'ocr',payload:{consent:true,imageBase64}});
  const duplicate=input();
  const results=await Promise.allSettled([a.process(duplicate),b.process(duplicate),a.process(input()),b.process(input())]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,2);assert.equal(calls.length,2);
  assert.equal((await make().status(id)).remaining,0);
  db.fail=true;
  await assert.rejects(new WebMapLimits({menuTest:a,key:'browser'}).authorize({id,requestId:randomUUID()}),e=>e.status===503);
});

test('missing, corrupt and failed shared storage never silently recreates user data or resets usage',async()=>{
  const db=database({broken:{unexpected:true}});
  const record=new FirestoreRecord(db,'missing');
  await assert.rejects(record.transaction(()=>{}),e=>e.status===503);assert.ok(!db.docs.has('missing'));
  db.docs.set('missing',{serialized:'not json'});await assert.rejects(record.transaction(()=>{}),e=>e.status===503);
  const store=new FirestoreInviteStore(new FirestoreRecord(db,'broken'));
  await assert.rejects(store.register({id:randomUUID(),token:randomUUID(),name:'가'}),e=>e.status===503);
});
