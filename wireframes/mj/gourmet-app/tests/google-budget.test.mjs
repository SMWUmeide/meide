import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleBudget} from '../google-budget.mjs';
test('monthly caps stop excess requests and count each kind separately',()=>{const b=createGoogleBudget(':memory:');assert.equal(b.take('search',2),1);assert.equal(b.take('search',2),2);assert.throws(()=>b.take('search',2),/호출 제한/);assert.equal(b.take('photo',1),1);assert.throws(()=>b.take('photo',1),/호출 제한/);b.close();});
