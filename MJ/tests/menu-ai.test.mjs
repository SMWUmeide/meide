import test from 'node:test';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { MenuAI, MODEL, validateImage, validateMenu } from '../server/menu-ai.mjs';
import { createApp } from '../server/app.mjs';
const imageBase64=Buffer.from([255,216,255,224,0,0,0,0,255,217]).toString('base64');
const menu={restaurantName:'Test',items:[{originalName:'Risotto ai Funghi',koreanName:'버섯 리소토',priceOriginal:'€18',description:'버섯을 넣은 쌀 요리',comparison:'',confirmedIngredients:['버섯'],possibleIngredients:['치즈'],needsReview:false}]};
const setup=(overrides={},fetcher=async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(menu)}]}]}))=>{
 const dir=mkdtempSync(join(tmpdir(),'meide-ai-'));
 const env={MENU_AI_ENABLED:'true',OPENAI_API_KEY:'test-key',MENU_AI_TOTAL_ALLOWANCE_USD:'0.70',MENU_AI_ALLOWANCE_EXPIRES_AT:'2099-01-01T00:00:00Z',MENU_AI_ALLOWED_PROFILE_IDS:'user',...overrides};
 const options={file:join(dir,'usage.json'),env,fetcher};
 return {ai:new MenuAI(options),options,cleanup:()=>rmSync(dir,{recursive:true,force:true})};
};
const input=()=>({id:'user',requestId:randomUUID(),imageBase64,consent:true});
test('no key, zero allowance, disabled switch and expiry fail before any provider call',async()=>{
 for(const overrides of [{OPENAI_API_KEY:''},{MENU_AI_TOTAL_ALLOWANCE_USD:'0'},{MENU_AI_ENABLED:'false'},{MENU_AI_ALLOWANCE_EXPIRES_AT:'2000-01-01'}]){
  const s=setup(overrides,()=>{throw Error('must not call');});
  try {await assert.rejects(s.ai.analyze(input()),e=>e.status===503);}finally{s.cleanup();}
 }
});
test('closed pilot and consent gates reject before billing; no remote URL input',async()=>{
 const s=setup({},()=>{throw Error('must not call');});
 try {
  await assert.rejects(s.ai.analyze({...input(),id:'other'}),e=>e.status===403);
  await assert.rejects(s.ai.analyze({...input(),consent:false}),e=>e.status===400);
  assert.throws(()=>validateImage('https://example.com/photo'),e=>e.status===400);
  assert.throws(()=>validateImage(Buffer.from('not an image').toString('base64')),e=>e.status===400);
 }finally{s.cleanup();}
});
test('provider uses fixed model, secret header, strict schema, no storage; preserves price',async()=>{
 const s=setup({},async(url,init)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(init.headers.Authorization,'Bearer test-key');
  const body=JSON.parse(init.body);assert.equal(body.store,false);assert.equal(body.model,MODEL);assert.equal(body.max_output_tokens,4000);assert.equal(body.text.format.strict,true);assert.equal(body.tools,undefined);
  return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(menu)}]}]});
 });
 try{assert.deepEqual(await s.ai.analyze(input()),menu);}finally{s.cleanup();}
});
test('reservations survive restart, duplicate requests and total allowance block extra calls',async()=>{
 let calls=0;const s=setup({},async()=>{calls++;return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(menu)}]}]});});
 try {
  const first=input();await s.ai.analyze(first);
  await assert.rejects(s.ai.analyze(first),e=>e.status===409);
  const restarted=new MenuAI(s.options);await restarted.analyze(input());
  await assert.rejects(restarted.analyze(input()),e=>e.status===429);assert.equal(calls,2);
 }finally{s.cleanup();}
});
test('concurrent requests cannot spend the same allowance; uncertain failures remain charged against cap',async()=>{
 let finish;const pending=new Promise(resolve=>{finish=resolve;});
 const s=setup({MENU_AI_TOTAL_ALLOWANCE_USD:'0.35'},async()=>{await pending;throw Error('network');});
 try{const one=s.ai.analyze(input());await assert.rejects(s.ai.analyze(input()),e=>e.status===409);finish();await assert.rejects(one,e=>e.status===502);await assert.rejects(s.ai.analyze(input()),e=>e.status===429);}finally{s.cleanup();}
});
test('incomplete, refusal, malformed and empty menu never become invented success',async()=>{
 for(const response of [{status:'incomplete'},{status:'completed',output:[{content:[{type:'refusal'}]}]},{status:'completed',output:[{content:[{type:'output_text',text:'bad json'}]}]}]){
  const s=setup({},async()=>Response.json(response));try{await assert.rejects(s.ai.analyze(input()));}finally{s.cleanup();}
 }
 assert.throws(()=>validateMenu({...menu,items:[]}));assert.throws(()=>validateMenu({...menu,items:[{...menu.items[0],priceOriginal:18}]}));
});
test('HTTP disabled and authentication gates keep provider untouched',async()=>{
 let calls=0;const app=createApp({webRoot:tmpdir(),store:{authenticate:()=>{throw Object.assign(Error('인증 실패'),{status:401});}},menuAI:{configured:()=>true,analyze:()=>{calls++;}}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try {const response=await fetch(`http://127.0.0.1:${app.address().port}/api/menu/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input())});assert.equal(response.status,401);assert.equal(calls,0);}finally{await new Promise(resolve=>app.close(resolve));}
});
