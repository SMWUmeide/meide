import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MenuTestLimits } from '../server/menu-test-limits.mjs';
import { WebMapLimits } from '../server/web-map-limits.mjs';
import { NearbyTestLimits } from '../server/nearby-test-limits.mjs';
import { InviteStore } from '../server/invite-store.mjs';
import { createApp } from '../server/app.mjs';

function setup(budget='125') {
  const dir=mkdtempSync(join(tmpdir(),'meide-webmap-')),id=randomUUID(),other=randomUUID(),file=join(dir,'usage.json');
  const env={MENU_TEST_ENABLED:'true',MENU_TEST_START_DATE:'2026-11-15',MENU_TEST_PROFILE_IDS:id+','+other,MENU_TEST_BUDGET_USD:budget};
  const clock={now:Date.parse('2026-11-16T23:59:00+09:00')};
  const menuTest=new MenuTestLimits({file,env,now:()=>clock.now});
  const maps=new WebMapLimits({menuTest,key:'test-browser-key'});
  return {dir,id,other,file,env,clock,menuTest,maps,input:()=>({id,requestId:randomUUID()}),close:()=>rmSync(dir,{recursive:true,force:true})};
}
test('100 map loads are shared across testers and persist across restart, resetting at Korean midnight',()=>{
  const s=setup();
  try{
    for(let i=0;i<100;i++)s.maps.authorize({...s.input(),id:i%2?s.id:s.other});
    const restarted=new WebMapLimits({menuTest:new MenuTestLimits({file:s.file,env:s.env,now:()=>s.clock.now}),key:'test-browser-key'});
    assert.throws(()=>restarted.authorize(s.input()),e=>e.status===429);
    const saved=readFileSync(s.file,'utf8');
    assert.equal(JSON.parse(saved).mapLoads.length,100);assert.ok(!saved.includes('test-browser-key'));
    s.clock.now+=60000;
    assert.equal(restarted.authorize(s.input()).apiKey,'test-browser-key');
  }finally{s.close();}
});
test('invalid, duplicate, disabled, expired and missing-key requests never reserve another load',()=>{
  const s=setup();
  try{
    assert.throws(()=>s.maps.authorize({...s.input(),id:randomUUID()}),e=>e.status===403);
    assert.throws(()=>s.maps.authorize({...s.input(),requestId:'bad'}),e=>e.status===400);
    assert.throws(()=>new WebMapLimits({menuTest:s.menuTest}).authorize(s.input()),e=>e.status===503);
    const input=s.input();s.maps.authorize(input);
    assert.throws(()=>s.maps.authorize(input),e=>e.status===409);
    s.env.MENU_TEST_ENABLED='false';assert.throws(()=>s.maps.authorize(s.input()),e=>e.status===503);
    s.env.MENU_TEST_ENABLED='true';s.clock.now=Date.parse('2026-12-10T00:00:00+09:00');
    assert.throws(()=>s.maps.authorize(s.input()),e=>e.status===403);
    assert.equal(JSON.parse(readFileSync(s.file,'utf8')).mapLoads.length,1);
  }finally{s.close();}
});
test('map loads consume the same reservation budget as nearby searches',async()=>{
  const s=setup('0.14');
  try{
    s.maps.authorize(s.input());
    const nearby=new NearbyTestLimits({menuTest:s.menuTest,provider:async()=>({})});
    await nearby.search({...s.input(),latitude:48,longitude:2,radius:500,consent:true});
    assert.throws(()=>s.maps.authorize(s.input()),e=>e.status===429);
    assert.equal(nearby.status(s.id).remaining,0);
  }finally{s.close();}
});
test('map authorization authenticates before returning a key and never caches it in HTTP responses',async()=>{
  const s=setup(),token=randomUUID(),store=new InviteStore(join(s.dir,'invites.json'));
  store.register({id:s.id,token,name:'테스트'});
  const app=createApp({store,webRoot:s.dir,webMaps:s.maps});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  const post=body=>fetch('http://127.0.0.1:'+app.address().port+'/api/restaurants/map-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    const denied=await post({...s.input(),token:randomUUID()});assert.equal(denied.status,401);assert.ok(!(await denied.text()).includes('test-browser-key'));
    const allowed=await post({...s.input(),token});assert.equal(allowed.status,200);assert.equal(allowed.headers.get('Cache-Control'),'no-store');assert.equal((await allowed.json()).apiKey,'test-browser-key');
  }finally{await new Promise(resolve=>app.close(resolve));s.close();}
});
