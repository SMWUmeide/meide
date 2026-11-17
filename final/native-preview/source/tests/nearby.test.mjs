import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import { classifyRestaurant, distanceMeters } from '../server/nearby-categories.mjs';
import { createGoogleNearbyProvider } from '../server/google-nearby.mjs';
import { NearbyTestLimits, reservedTotal } from '../server/nearby-test-limits.mjs';
import { MenuTestLimits } from '../server/menu-test-limits.mjs';
import { InviteStore } from '../server/invite-store.mjs';
import { createApp } from '../server/app.mjs';

test('taxonomy puts Korean in both tabs, prioritizes types, uses conservative multilingual name fallback and place overrides',()=>{
  assert.deepEqual(classifyRestaurant({types:['korean_restaurant']}),{korean:true,asian:true,source:'google'});
  assert.equal(classifyRestaurant({primaryType:'korean_barbecue_restaurant'}).korean,true);
  assert.deepEqual(classifyRestaurant({types:['japanese_restaurant'],displayName:{text:'Korean Express'}}),{korean:false,asian:true,source:'google'});
  for(const name of ['Kimchi Bistro','Restaurant Coréen','한식당 소반']) assert.equal(classifyRestaurant({displayName:{text:name}}).korean,true);
  assert.equal(classifyRestaurant({types:['asian_restaurant'],displayName:{text:'Restaurant Coréen'}}).korean,true);
  assert.equal(classifyRestaurant({displayName:{text:'Sushi Sakura'}}).asian,true);
  assert.equal(classifyRestaurant({displayName:{text:'Thaisville Bistro'}}).asian,false);
  assert.equal(classifyRestaurant({displayName:{text:'서울 카페'}}).korean,false);
  assert.equal(classifyRestaurant({id:'verified',types:['korean_restaurant']},{verified:'other'}).asian,false);
});

test('distance handles date line and nearby points without inventing walking time',()=>{
  assert.equal(distanceMeters({latitude:0,longitude:0},{latitude:0,longitude:0}),0);
  assert.ok(distanceMeters({latitude:0,longitude:179.999},{latitude:0,longitude:-179.999})<230);
  assert.ok(distanceMeters({latitude:0,longitude:0},{latitude:0.001,longitude:0})>110);
});

test('Google uses three category searches without Static Maps, deduplicates and drops outside-radius/permanently-closed results',async()=>{
  const calls=[];
  const make=(id,type,lat=48.87)=>({id,displayName:{text:id},types:[type],location:{latitude:lat,longitude:2.33},rating:4.5,userRatingCount:9,googleMapsUri:'https://maps.google.com/test'});
  const provider=createGoogleNearbyProvider({env:{GOOGLE_MENU_API_KEY:'private-key'},fetchImpl:async(url,options)=>{
    calls.push({url,options});
    const body=JSON.parse(options.body);
    if(body.includedTypes.length===1)return Response.json({places:[make('italian','italian_restaurant'),make('far','restaurant',40),{...make('closed','restaurant'),businessStatus:'CLOSED_PERMANENTLY'}]});
    return Response.json({places:[make('korean','korean_restaurant'),make('japanese','japanese_restaurant')]});
  }});
  const result=await provider({latitude:48.87,longitude:2.33,radius:500});
  assert.equal(calls.length,3);
  assert.ok(calls.every(call=>call.url==='https://places.googleapis.com/v1/places:searchNearby'));
  for(const call of calls.filter(c=>c.url.includes('searchNearby'))){
    const body=JSON.parse(call.options.body);
    assert.equal(body.maxResultCount,20);assert.equal(body.rankPreference,'DISTANCE');
    assert.equal(body.locationRestriction.circle.radius,500);
    assert.ok(!call.options.headers['X-Goog-FieldMask'].includes('*'));
  }
  assert.deepEqual(result.groups.korean.places.map(p=>p.id),['korean']);
  assert.equal(result.groups.asian.places.length,2);
  assert.equal(result.groups.all.places.length,3);
  assert.ok(!JSON.stringify(result).includes('private-'));
});

test('partial category failure is explicit; no retry and no fabricated places',async()=>{
  let calls=0;
  const provider=createGoogleNearbyProvider({env:{GOOGLE_MENU_API_KEY:'key',GOOGLE_MAPS_API_KEY:'map'},fetchImpl:async(url,options)=>{
    calls++;
    if(JSON.parse(options.body).includedTypes.length>1)throw Error('network');
    return Response.json({places:[]});
  }});
  const result=await provider({latitude:48,longitude:2,radius:500});
  assert.equal(calls,3);assert.equal(result.groups.asian.incomplete,true);
  assert.equal(result.groups.korean.places.length,0);assert.equal('mapImage' in result.groups.all,false);
});

function setup(budget='125') {
  const dir=mkdtempSync(join(tmpdir(),'meide-nearby-')),id=randomUUID();
  const env={MENU_TEST_ENABLED:'true',MENU_TEST_START_DATE:'2026-11-15',MENU_TEST_PROFILE_IDS:id,MENU_TEST_BUDGET_USD:budget};
  const clock={now:Date.parse('2026-11-15T00:00:00+09:00')},calls=[];
  const file=join(dir,'usage.json');
  const menuTest=new MenuTestLimits({file,env,now:()=>clock.now,providers:{ocr:async()=>({text:'MENU'}),translate:async()=>({text:'메뉴'})}});
  const nearby=new NearbyTestLimits({menuTest,provider:async payload=>{calls.push(payload);return {groups:{all:{places:[]}}};}});
  return {dir,id,clock,calls,file,menuTest,nearby,input:()=>({id,requestId:randomUUID(),latitude:48.87,longitude:2.33,radius:500,consent:true}),close:()=>rmSync(dir,{recursive:true,force:true})};
}
test('nearby reservations share menu budget, persist across restarts, never store coordinates, and block menu overspending',async()=>{
  const s=setup('0.32');
  try{
    await s.nearby.search(s.input());
    const imageBase64=Buffer.from([255,216,255,224,0,0,0,0,255,217]).toString('base64');
    await s.menuTest.process({id:s.id,requestId:randomUUID(),operation:'ocr',payload:{consent:true,imageBase64}});
    assert.equal(s.menuTest.status(s.id).remaining,0);assert.equal(s.nearby.status(s.id).remaining,0);
    await assert.rejects(s.nearby.search(s.input()),e=>e.status===429);
    const ledger=JSON.parse(readFileSync(s.file,'utf8'));
    assert.equal(reservedTotal(ledger),320000);
    assert.equal(JSON.stringify(ledger).includes('latitude'),false);
    assert.equal(JSON.stringify(ledger).includes('2.33'),false);
  }finally{s.close();}
});
test('daily cap, duplicate requests, validation and test end all block before provider',async()=>{
  const s=setup();
  try{
    for(const override of [{latitude:NaN},{longitude:181},{radius:50000},{consent:false},{id:randomUUID()},{requestId:'bad'}])await assert.rejects(s.nearby.search({...s.input(),...override}));
    assert.equal(s.calls.length,0);
    const input=s.input();
    await s.nearby.search(input);await assert.rejects(s.nearby.search(input),e=>e.status===409);
    await s.nearby.search(s.input());await assert.rejects(s.nearby.search(s.input()),e=>e.status===429);
    assert.equal(s.calls.length,2);
    s.clock.now+=86400000;await s.nearby.search(s.input());
    s.clock.now=Date.parse('2026-12-10T00:00:00+09:00');
    await assert.rejects(s.nearby.search(s.input()),e=>e.status===403);assert.equal(s.calls.length,3);
  }finally{s.close();}
});
test('nearby HTTP authenticates before handling coordinates or calling provider',async()=>{
  const s=setup(), token=randomUUID(),store=new InviteStore(join(s.dir,'invites.json'));
  store.register({id:s.id,token,name:'테스트'});
  const app=createApp({store,webRoot:s.dir,menuTest:s.menuTest,nearbyTest:s.nearby});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  const post=body=>fetch('http://127.0.0.1:'+app.address().port+'/api/restaurants/nearby',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    assert.equal((await post({...s.input(),token:randomUUID()})).status,401);assert.equal(s.calls.length,0);
    assert.equal((await post({...s.input(),token})).status,200);assert.equal(s.calls.length,1);
  }finally{await new Promise(resolve=>app.close(resolve));s.close();}
});
