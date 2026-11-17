import test from 'node:test';
import assert from 'node:assert/strict';
import { isOrderNavigation, parseOrderMessage, parseOrderStorage } from '../src/features/ordering/protocol.ts';
test('native menu routes and back navigation stay inside the bundled app',()=>{
 for(const url of ['about:blank','https://localhost/','https://localhost/#/cart','https://localhost/#/detail/scan-1'])assert.equal(isOrderNavigation(url),true);
 for(const url of ['https://wrong.invalid/','https://localhost.evil.invalid/','https://localhost/other','https://localhost/?redirect=bad','https://user@localhost/','file:///menu','javascript:alert(1)'])assert.equal(isOrderNavigation(url),false);
});
test('the order bridge rejects malformed, oversized and unrelated messages',()=>{
 for(const raw of ['no','{}',JSON.stringify({channel:'other',id:'1',action:'save'}),'x'.repeat(2000001)])assert.equal(parseOrderMessage(raw),null);
 assert.equal(parseOrderMessage(JSON.stringify({channel:'meide-orders-v1',id:'1',action:'bootstrap'})).action,'bootstrap');
});
test('the menu persistence bridge cannot replace MJ profile or save private server settings',()=>{
 for(const value of [{ 'meide.first-run.v1':'x' },{GEMINI_API_KEY:'x'},{'meide.order.v1':{}},{'meide.order.v1':'x'.repeat(1500001)},null])assert.throws(()=>parseOrderStorage(value));
 assert.deepEqual(parseOrderStorage({'meide.order.v1':'{}'}),{'meide.order.v1':'{}'});
});
