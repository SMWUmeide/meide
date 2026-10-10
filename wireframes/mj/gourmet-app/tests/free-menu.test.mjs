import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFreeMenu} from '../public/free-menu.js';
import {route} from '../server.mjs';
test('OCR prices and honest limited dictionary',()=>{const m=parseFreeMenu('MENU\nPizza Margherita €12,50\nMystery dish 17.00\nMaiale alle Mele 14.50','it');assert.equal(m.items.length,3);assert.equal(m.items[0].price,12.5);assert.equal(m.items[1].korean,'Mystery dish');assert.equal(m.items[2].korean,'사과를 곁들인 돼지고기 요리');assert.equal(m.restaurantName,'');});
test('free mode blocks paid endpoints even with keys',async()=>{assert.equal((await route('/api/config',{})).vision,false);for(const p of ['/api/recognize','/api/analyze','/api/order'])await assert.rejects(route(p,{}),/유료 API/);});

test('Korean culinary interpretations preserve dish specifics',()=>{const m=parseFreeMenu('Baccalà alla Fiorentina 16\nCacio e Pepe 14\nUnknown speciality 20','it');assert.equal(m.items[0].korean,'피렌체식 토마토 대구 조림');assert.equal(m.items[1].korean,'치즈와 후추 파스타');assert.equal(m.items[2].korean,'Unknown speciality');assert.match(m.items[0].description,/식당의 조리법을 확인한 정보는 아닙니다/);});
