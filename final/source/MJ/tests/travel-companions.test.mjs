import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress, parseProgress, toggleTravelCompanion, travelCompanions, withCompanions } from '../src/state/model.ts';

const first = { id: '11111111-1111-4111-8111-111111111111', name: '김미영' };
const second = { id: '22222222-2222-4222-8222-222222222222', name: '박정숙' };
const progress = { ...initialProgress, stage: 'home', name: '여행자', allergyStatus: 'none', foodStatus: 'none', companions: [first, second] };

test('existing connected companions remain selected until the user edits this trip', () => {
  assert.deepEqual(travelCompanions(parseProgress(JSON.stringify(progress))), [first, second]);
  assert.strictEqual(toggleTravelCompanion(progress, 'not-a-friend'), progress);
});

test('removing from this trip preserves friendship and survives a restart', () => {
  const changed = toggleTravelCompanion(progress, first.id);
  assert.deepEqual(changed.companions, [first, second]);
  const loaded = parseProgress(JSON.stringify(changed));
  assert.deepEqual(travelCompanions(loaded), [second]);
  assert.deepEqual(travelCompanions(toggleTravelCompanion(loaded, first.id)), [first, second]);
});

test('an explicitly empty trip stays empty after sync and restart', () => {
  const empty = toggleTravelCompanion(toggleTravelCompanion(progress, first.id), second.id);
  assert.deepEqual(travelCompanions(parseProgress(JSON.stringify(withCompanions(empty, [first, second])))), []);
  assert.deepEqual(empty.companions, [first, second]);
});

test('selection cannot retain disconnected or unknown friends', () => {
  const selected = { ...progress, travelCompanionIds: [first.id, second.id, 'unknown', second.id] };
  assert.deepEqual(parseProgress(JSON.stringify(selected)).travelCompanionIds, [first.id, second.id]);
  const disconnected = withCompanions(selected, [second]);
  assert.deepEqual(disconnected.travelCompanionIds, [second.id]);
  assert.deepEqual(travelCompanions(disconnected), [second]);
  assert.deepEqual(travelCompanions(withCompanions(disconnected, [first, second])), [second]);
});
