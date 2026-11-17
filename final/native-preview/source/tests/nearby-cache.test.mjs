import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedNearby, distanceBetween, mapRegion } from '../src/features/nearby/cache.ts';

const center={latitude:48.87,longitude:2.33};
const entry={profileId:'a',receivedAt:1000,result:{center,radius:500,groups:{}}};
test('fresh nearby results can be reused only for the same person, radius and measured location',()=>{
  assert.equal(cachedNearby([entry],'a',center,500,1100),entry);
  assert.equal(cachedNearby([entry],'a',{latitude:48.8701,longitude:2.33},500,1100),entry);
  assert.equal(cachedNearby([entry],'a',{latitude:48.88,longitude:2.33},500,1100),undefined);
  assert.equal(cachedNearby([entry],'b',center,500,1100),undefined);
  assert.equal(cachedNearby([entry],'a',center,1000,1100),undefined);
  assert.equal(cachedNearby([entry],'a',center,500,301000),undefined);
  assert.equal(cachedNearby([entry],'a',center,500,999),undefined);
});
test('location reuse and map span account for longitude convergence and the date line',()=>{
  assert.ok(distanceBetween({latitude:0,longitude:179.9999},{latitude:0,longitude:-179.9999})<30);
  const region=mapRegion({latitude:89.99,longitude:0},3000);
  assert.ok(Number.isFinite(region.longitudeDelta)&&region.longitudeDelta<=360);
  assert.ok(mapRegion(center,1000).latitudeDelta>mapRegion(center,500).latitudeDelta);
});
