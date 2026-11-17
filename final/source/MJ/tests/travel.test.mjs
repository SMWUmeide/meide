import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress, parseProgress, toggleTravelDestination } from '../src/state/model.ts';
import { findDestination, initialDestination, searchDestinations } from '../src/features/travel/catalog.ts';

test('travel choice survives restart without resetting profile and setup', () => {
  const saved = { ...initialProgress, stage: 'home', name: '테스트', allergyStatus: 'none', foodStatus: 'none', avoidedFoods: [], homeGuideSeen: true, travelDestinationId: 'fr-paris' };
  const restored = parseProgress(JSON.stringify(saved));
  assert.equal(findDestination(restored.travelDestinationId)?.city, '파리');
  assert.equal(restored.stage, 'home');
  assert.equal(restored.homeGuideSeen, true);
  assert.equal(restored.name, saved.name);
  for (const value of [undefined, 'missing-city', {}, 123]) {
    const old = parseProgress(JSON.stringify({ ...saved, travelDestinationId: value }));
    assert.equal(old.stage, 'home');
    assert.equal(findDestination(old.travelDestinationId) ?? initialDestination, initialDestination);
  }
});

test('destination search supports Korean prefixes, countries and local aliases', () => {
  assert.equal(searchDestinations('').length, 6);
  assert.equal(searchDestinations('파')[0].id, 'fr-paris');
  assert.equal(searchDestinations('프랑스')[0].id, 'fr-paris');
  assert.equal(searchDestinations('프랑스 파리')[0].id, 'fr-paris');
  assert.equal(searchDestinations(' PRAgue ')[0].id, 'cz-praha');
  assert.equal(searchDestinations('españa')[0].id, 'es-barcelona');
  assert.equal(searchDestinations('없는도시').length, 0);
});

test('one destination can be selected, deselected, restored and replaced', () => {
  const original = { ...initialProgress, stage: 'home', name: '테스트', allergyStatus: 'none', foodStatus: 'none' };
  const deselected = toggleTravelDestination(original, 'it-chiusi');
  assert.equal(deselected.travelDestinationEnabled, false);
  const restored = parseProgress(JSON.stringify(deselected));
  assert.equal(restored.travelDestinationEnabled, false);
  assert.equal(restored.travelDestinationId, 'it-chiusi');
  assert.equal(toggleTravelDestination(restored, 'it-chiusi').travelDestinationEnabled, true);
  const paris = toggleTravelDestination(restored, 'fr-paris');
  assert.equal(paris.travelDestinationId, 'fr-paris');
  assert.equal(paris.travelDestinationEnabled, true);
  assert.equal(toggleTravelDestination(paris, 'fr-paris').travelDestinationEnabled, false);
  assert.equal(toggleTravelDestination(paris, 'it-roma').travelDestinationEnabled, true);
  assert.equal(toggleTravelDestination(paris, 'invalid'), paris);
});
