import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InviteStore } from '../server/invite-store.mjs';
import { createApp } from '../server/app.mjs';

test('ordering proxy authenticates, enforces the pilot and forwards only the request payload', async () => {
 const dir=mkdtempSync(join(tmpdir(),'meide-order-api-'));
 const store=new InviteStore(join(dir,'registry.json'));
 const person={id:randomUUID(),token:randomUUID(),name:'통합 검사'};
 store.register(person);
 let allowed=false;
 const app=createApp({store,webRoot:dir,menuTest:{check(id){assert.equal(id,person.id);if(!allowed)throw Object.assign(new Error('참가자 등록 필요'),{status:403});}}});
 await new Promise((resolve,reject)=>{app.once('error',reject);app.listen(0,'127.0.0.1',resolve);});
 const realFetch=globalThis.fetch;
 const forwarded=[];
 globalThis.fetch=async (url,options)=>{
  if(String(url).startsWith('https://meide-meide1.vercel.app/')) {
   forwarded.push({url:String(url),options});
   return Response.json({photos:[]});
  }
  return realFetch(url,options);
 };
 const post=(data)=>realFetch(`http://127.0.0.1:${app.address().port}/api/ordering/menu-photos`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 try {
  assert.equal((await post({payload:{items:[]}})).status,401);
  assert.equal((await post({...person,payload:{items:[]}})).status,403);
  assert.equal(forwarded.length,0);
  allowed=true;
  assert.equal((await post({...person,payload:{items:[]},endpoint:'https://wrong.invalid'})).status,200);
  assert.equal(forwarded.length,1);
  assert.equal(forwarded[0].url,'https://meide-meide1.vercel.app/api/menu-photos');
  assert.deepEqual(JSON.parse(forwarded[0].options.body),{items:[]});
  assert.equal(JSON.stringify(forwarded).includes(person.token),false);
 } finally {globalThis.fetch=realFetch;await new Promise(resolve=>app.close(resolve));rmSync(dir,{recursive:true,force:true});}
});
