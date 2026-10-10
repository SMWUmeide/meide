process.env.FREE_MODE='false';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {route,validateImages,validateLocation,normalizeMenu,orderPrompt,safeURL} from '../server.mjs';
const image='data:image/jpeg;base64,YQ==';
test('photos: bounds, MIME and payload validation',()=>{
  assert.equal(validateImages([image]).length,1);
  for(const x of [[],Array(7).fill(image),['https://example.com/x.png'],['data:image/svg+xml;base64,YQ=='],['data:image/jpeg;base64,!!!']])assert.throws(()=>validateImages(x));
});
test('OCR preserves actual dishes, never invents missing prices',()=>{
  const m=normalizeMenu({restaurantName:'Chez Test',language:'fr',currency:'EUR',items:[{original:'Soupe',price:null},{original:'Salade',price:9},{original:'',price:20}]});
  assert.equal(m.items.length,2);assert.equal(m.items[0].price,null);assert.equal(m.items[1].price,9);assert.deepEqual(m.items[0].allergens,[]);assert.equal(normalizeMenu({items:[]}).items.length,0);
});
test('GPS and source URL validation',()=>{assert.ok(validateLocation({latitude:41.9,longitude:12.5}));assert.ok(!validateLocation({latitude:100,longitude:12}));assert.ok(!validateLocation({latitude:'41',longitude:12}));assert.ok(safeURL('https://example.com'));assert.ok(!safeURL('javascript:alert(1)'));});
test('missing credentials explicitly fail vision; Places has no fictional results',async()=>{
  const old=process.env.OPENAI_API_KEY,places=process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.OPENAI_API_KEY;delete process.env.GOOGLE_PLACES_API_KEY;
  try{await assert.rejects(route('/api/recognize',{images:[image]}),/OPENAI_API_KEY/);assert.deepEqual((await route('/api/places',{})).places,[]);assert.equal((await route('/api/config',{})).vision,false);}finally{if(old)process.env.OPENAI_API_KEY=old;if(places)process.env.GOOGLE_PLACES_API_KEY=places;}
});
test('real integration contract: OCR → Places → official search → order (mock HTTP)',async()=>{
  const originalFetch=global.fetch;const oldAI=process.env.OPENAI_API_KEY,oldPlaces=process.env.GOOGLE_PLACES_API_KEY;
  process.env.OPENAI_API_KEY='test-key';process.env.GOOGLE_PLACES_API_KEY='test-places';
  let searches=0;const requests=[];
  global.fetch=async(url,options)=>{
    const b=options.body?JSON.parse(options.body):null;requests.push({url:String(url),b});
    let data;
    if(String(url).includes('places.googleapis.com'))data=String(url).includes('search')?{places:[{id:'test-place',displayName:{text:'Chez Test'},websiteUri:'https://restaurant.example/menu',googleMapsUri:'https://maps.google.com/?cid=1'}]}:{id:'test-place',displayName:{text:'Chez Test'},websiteUri:'https://restaurant.example/menu',googleMapsUri:'https://maps.google.com/?cid=1'};
    else {
      let result,annotations=[];
      if(b.tools){searches++;result={items:[{id:'0',description:'공식 메뉴 설명',ingredients:['감자'],allergens:[],sources:[{title:'공식 메뉴',url:'https://restaurant.example/menu'},{title:'invented',url:'https://fake.example'}]}]};annotations=[{type:'url_citation',url:'https://restaurant.example/menu',title:'Menu'}];}
      else if(b.input[0].content.some(c=>c.type==='input_image'))result={restaurantName:'Chez Test',language:'fr',currency:'EUR',items:[{original:'Soupe du jour',korean:'오늘의 수프',price:8.5}]};
      else result={text:'Deux soupes, s’il vous plaît.',pronunciation:'되 수프 실 부 플레',korean:'수프 두 개 주세요.'};
      data={output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result),annotations}]}]};
    }
    return {ok:true,json:async()=>data};
  };
  try{
    const r=await route('/api/recognize',{images:[image]});assert.equal(r.menu.items[0].original,'Soupe du jour');assert.ok(r.sessionId);
    const p=await route('/api/places',{query:r.menu.restaurantName});assert.equal(p.places[0].id,'test-place');
    const a=await route('/api/analyze',{sessionId:r.sessionId,placeId:'test-place'});assert.equal(a.menu.items[0].description,'공식 메뉴 설명');assert.equal(a.menu.items[0].sources.length,1);assert.equal(searches,1);
    const o=await route('/api/order',{sessionId:r.sessionId,items:[{id:'0',quantity:2}]});assert.match(o.text,/Deux/);
    assert.ok(requests.find(x=>x.b?.tools)?.b.tools[0].filters.allowed_domains.includes('restaurant.example'));
    await assert.rejects(route('/api/order',{sessionId:r.sessionId,items:[{id:'0',quantity:-1}]}),/수량/);
    await assert.rejects(route('/api/analyze',{sessionId:'invalid'}),/만료/);
  }finally{global.fetch=originalFetch;if(oldAI)process.env.OPENAI_API_KEY=oldAI;else delete process.env.OPENAI_API_KEY;if(oldPlaces)process.env.GOOGLE_PLACES_API_KEY=oldPlaces;else delete process.env.GOOGLE_PLACES_API_KEY;}
});
test('order request includes exact dish names and quantities',()=>{assert.match(orderPrompt([{original:'Soupe',quantity:3}],'fr'),/"quantity":3/);});

test('nearby recommendations request real ratings and sort by rating, reviews, distance',async()=>{
 const oldFetch=global.fetch,oldKey=process.env.GOOGLE_PLACES_API_KEY;process.env.GOOGLE_PLACES_API_KEY='test';
 global.fetch=async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.maxResultCount,20);assert.equal(body.locationRestriction.circle.radius,1500);assert.match(options.headers['X-Goog-FieldMask'],/places.rating/);return {ok:true,json:async()=>({places:[{id:'near',displayName:{text:'Near'},rating:4.1,userRatingCount:100,location:{latitude:41.9,longitude:12.5}},{id:'best',displayName:{text:'Best'},rating:4.9,userRatingCount:60,location:{latitude:41.901,longitude:12.5}},{id:'unknown',displayName:{text:'Unknown'}}]})};};
 try{const r=await route('/api/places',{location:{latitude:41.9,longitude:12.5}});assert.deepEqual(r.places.map(p=>p.id),['best','near','unknown']);assert.equal(r.places[0].userRatingCount,60);assert.equal(r.places[1].distanceMeters,0);assert.equal(r.places[2].rating,null);}finally{global.fetch=oldFetch;if(oldKey)process.env.GOOGLE_PLACES_API_KEY=oldKey;else delete process.env.GOOGLE_PLACES_API_KEY;}
});
