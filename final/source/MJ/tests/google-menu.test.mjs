import test from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleMenuProviders } from '../server/google-menu.mjs';

test('Google key stays in headers; one image/feature, fixed Korean NMT, one request per stage', async () => {
  const calls = [];
  const providers = createGoogleMenuProviders({env:{GOOGLE_MENU_API_KEY:'test-only-key'},fetchImpl:async (url, options) => {
    calls.push({url,options,body:options.body && JSON.parse(options.body)});
    if (url.includes('vision.')) return Response.json({responses:[{fullTextAnnotation:{text:'Pasta al Pomodoro €13',restaurantName:null,restaurantQuery:null}}]});
    if (url.includes('translation.')) return Response.json({data:{translations:[{translatedText:'토마토 파스타 €13',detectedSourceLanguage:'it'}]}});
    return Response.json({places:[{id:'example'}]});
  }});
  assert.deepEqual(await providers.ocr({imageBase64:'image',feature:'LABEL_DETECTION'}),{text:'Pasta al Pomodoro €13',restaurantName:null,restaurantQuery:null});
  assert.deepEqual(await providers.translate({text:'Pasta',model:'llm',targetLanguage:'en'}),{text:'토마토 파스타 €13',sourceLanguage:'it'});
  await providers.search({query:'Example restaurant',fields:['places.id']});
  await providers.details({placeId:'example',fields:['id','websiteUri']});
  assert.equal(calls.length,4);
  assert.equal(calls[0].body.requests.length,1);
  assert.deepEqual(calls[0].body.requests[0].features,[{type:'DOCUMENT_TEXT_DETECTION'}]);
  assert.deepEqual(calls[1].body,{q:'Pasta',target:'ko',format:'text',model:'nmt'});
  assert.equal(calls[2].options.headers['X-Goog-FieldMask'],'places.id');
  assert.equal(calls[3].options.method,'GET');
  assert.ok(calls.every(call => !call.url.includes('test-only-key') && call.options.headers['X-Goog-Api-Key']==='test-only-key' && call.options.redirect==='error'));
});

test('missing key has no providers; failures and malformed responses never retry or leak details', async () => {
  assert.deepEqual(createGoogleMenuProviders({env:{}}),{});
  for (const response of [()=>new Response('private upstream diagnostic',{status:403}),()=>Response.json({responses:[{error:{message:'private upstream diagnostic'}}]}),()=>Response.json({})]) {
    let count=0;
    const providers=createGoogleMenuProviders({env:{GOOGLE_MENU_API_KEY:'test-only-key'},fetchImpl:async()=>{count++;return response();}});
    await assert.rejects(providers.ocr({imageBase64:'image'}),error=>error.status===502 && !error.message.includes('private'));
    assert.equal(count,1);
  }
});

test('search is bounded to five photos and one map, strips keys and unsafe links, preserves attribution', async () => {
  const calls=[];
  const providers=createGoogleMenuProviders({env:{GOOGLE_MENU_API_KEY:'private-api',GOOGLE_MAPS_API_KEY:'private-map'},fetchImpl:async(url,options)=>{
    calls.push({url,options});
    if(url.includes('searchText')) return Response.json({places:Array.from({length:9},(_,i)=>({id:`place${i}`,displayName:{text:`Restaurant ${i}`},formattedAddress:'Roma',googleMapsUri:'https://maps.google.com/test',location:{latitude:41,longitude:12},currentOpeningHours:{openNow:true},photos:[{name:`places/place${i}/photos/photo`,authorAttributions:[{displayName:'Author',uri:'https://maps.google.com/author'}]}]}))});
    if(url.includes('staticmap')) return new Response(new Uint8Array([137,80,78,71]),{headers:{'content-type':'image/png'}});
    return Response.json({photoUri:'https://lh3.googleusercontent.com/photo'});
  }});
  const result=await providers.search({query:'restaurant',fields:['places.id']});
  assert.equal(result.places.length,5);assert.equal(calls.length,7);
  assert.equal(result.places[0].photo.authors[0].name,'Author');
  assert.equal(result.places[0].openNow,true);
  assert.ok(result.mapImage.startsWith('data:image/png;base64,'));
  assert.ok(!JSON.stringify(result).includes('private-'));
  assert.equal(calls.filter(call=>call.url.includes('staticmap')).length,1);
});
test('empty search skips photo/map costs; optional media failures preserve real candidates', async()=>{
  for(const empty of [true,false]) {
    let count=0;
    const providers=createGoogleMenuProviders({env:{GOOGLE_MENU_API_KEY:'private-api',GOOGLE_MAPS_API_KEY:'private-map'},fetchImpl:async url=>{
      count++;
      if(url.includes('searchText')) return Response.json({places:empty?[]:[{id:'test',displayName:{text:'Test'},location:{latitude:1,longitude:2},googleMapsUri:'javascript:alert(1)',photos:[{name:'places/test/photos/photo'}]}]});
      throw Error('private diagnostic');
    }});
    const result=await providers.search({query:'x',fields:['places.id']});
    assert.equal(count,empty?1:3);assert.equal(result.mapImage,null);
    if(!empty) {assert.equal(result.places[0].photo,null);assert.equal(result.places[0].googleMapsUri,null);}
  }
});
