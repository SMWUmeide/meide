import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recommendedFoods,sameFood} from '../public/food-recommendations.js';
import {europeanCountries} from '../public/destinations.js';
import {koreanPlaceName} from '../public/korean-place.js';
test('every supported country has regional food suggestions',()=>{for(const d of europeanCountries){assert.ok(recommendedFoods(d).length>=15,d.code);assert.ok(recommendedFoods(d).every(i=>i.price===null));}assert.notDeepEqual(recommendedFoods({code:'IT'}),recommendedFoods({code:'FR'}));});
test('saved food matches accents and common menu variants but not unrelated dishes',()=>{assert.ok(sameFood({original:'Spaghetti alla Carbonara'},{original:'Carbonara'}));assert.ok(sameFood({original:'Bœuf',korean:'소고기 와인 조림'},{original:'Boeuf',korean:'소고기 와인 조림'}));assert.ok(sameFood({original:'Crêpe'},{original:'crepe'}));assert.equal(sameFood({original:'Carbonara'},{original:'Cacio e Pepe'}),false);assert.equal(sameFood({},{original:'Soup'}),false);});
test('Korean place names preserved; missing Latin names display Hangul',()=>{assert.equal(koreanPlaceName('로마'),'로마');assert.match(koreanPlaceName('Matera'),/^[가-힣 ]+$/);assert.match(koreanPlaceName('Saint-Malo'),/^[가-힣 -]+$/);});

test('cities show 15+ foods and desserts; unsupported cities use actual country catalogue',()=>{for(const [code,city] of [['IT','로마'],['FR','파리'],['IT','피렌체'],['DE','작은 도시']]){const foods=recommendedFoods({code,city});assert.ok(foods.length>=15);assert.ok(foods.some(i=>i.dessert));assert.equal(foods[2].dessert,true);assert.equal(new Set(foods.map(i=>i.id)).size,foods.length);}assert.notDeepEqual(recommendedFoods({code:'IT',city:'로마'}).map(i=>i.original),recommendedFoods({code:'IT',city:'피렌체'}).map(i=>i.original));assert.ok(recommendedFoods({code:'IT',city:'작은 도시'}).every(i=>!i.citySpecific));});
