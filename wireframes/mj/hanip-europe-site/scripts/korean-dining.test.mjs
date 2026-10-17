import test from 'node:test';
import assert from 'node:assert/strict';
import {koreanDining,koreanDiningPayload} from '../public/korean-dining.js';
import {testMenu} from '../public/test-menu.js';
import {getRestaurantCatalog,getUsabilityMenu} from '../lib/restaurant-catalog.mjs';

test('Korean interpretation preserves original facts and separates editorial comparison',()=>{
  const item={id:'x',original:'BATTUTA DI CHIANINA',price:17,description:'공식 설명',ingredients:['소고기'],sources:[{url:'https://example.com/menu'}]};
  const result=koreanDining(item);
  assert.match(result.korean,/육회/);
  assert.match(result.analogy,/참기름/);
  for(const k of ['id','original','price','description','ingredients','sources'])assert.deepEqual(result[k],item[k]);
  assert.equal(item.analogy,undefined);
});
test('exact matching leaves unknown variants and drinks untouched',()=>{
  for(const original of ['Mystery dish','Risotto al limone','Rosato Toscana']){
    const item={original,korean:'기존 해석'};
    assert.deepEqual(koreanDining(item),item);
  }
});
test('both bundled menu and server catalog show comparisons for every test food',()=>{
  for(const menu of [testMenu,getUsabilityMenu()]){
    const foods=menu.items.filter(i=>['zuppe','SECONDI'].includes(i.category));
    assert.equal(foods.length,16);
    for(const item of foods){assert.ok(item.analogy,item.original);assert.ok(item.comparisonNote);}
  }
  const battuta=getRestaurantCatalog().items.find(i=>i.original==='BATTUTA DI CHIANINA');
  assert.match(battuta.korean,/육회/);
});
test('shared API payload keeps IDs, counts and prices while interpreting nested menus',()=>{
  const room={version:7,members:[{id:'me',cart:{dish:2}}],menu:{items:[{id:'dish',original:'ZUPPA DI PORRI E PATATE',price:10}]}};
  const result=koreanDiningPayload(room);
  assert.equal(result.version,7);assert.equal(result.members[0].cart.dish,2);
  assert.equal(result.menu.items[0].price,10);assert.match(result.menu.items[0].analogy,/감자죽/);
});

test('reviewed names preserve meat types and sides instead of replacing them with vague labels',()=>{
  const catalog=getRestaurantCatalog().items;
  const goose=catalog.find(i=>i.original==='PICI CINTOCA');
  assert.match(goose.korean,/거위고기/);
  assert.match(goose.description,/거위고기/);
  assert.ok(goose.ingredients.some(i=>i.includes('거위')));
  assert.doesNotMatch(goose.description,/오리고기/);
  assert.match(catalog.find(i=>i.original==="OSSOBUCO DI CHIANINA E PURE' DI PATATE").korean,/소 정강이.*으깬 감자/);
  assert.match(catalog.find(i=>i.original==='POLPETTE DI CHIANINA E CINTA SENESE AL POMODORO').korean,/소고기·돼지고기/);
  const uncertain=catalog.find(i=>i.original==="CINGHIALE IN SALMI'");
  assert.match(uncertain.listDescription,/확인/);
  assert.match(uncertain.officialSourceNote,/노루/);
});
