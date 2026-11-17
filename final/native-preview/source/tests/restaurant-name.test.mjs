import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRestaurant } from '../server/restaurant-name.mjs';
test('extracts explicit and split venue names, accented cafe names, and a street', () => {
  assert.deepEqual(extractRestaurant('RISTORANTE\nDa Mario\nVia Roma 10, Firenze\nMENU\nSpaghetti €12'), {restaurantName:'RISTORANTE Da Mario',restaurantQuery:'RISTORANTE Da Mario Via Roma 10, Firenze'});
  assert.equal(extractRestaurant('Caffè Florian\nMENU\nEspresso €8').restaurantName,'Caffè Florian');
  assert.equal(extractRestaurant('Café de Flore\nMENU').restaurantName,'Café de Flore');
  assert.equal(extractRestaurant('Field & Fork\nMENU\nPasta €12').restaurantName,'Field & Fork');
});
test('does not turn menu sections, prices, or dietary notices into names; never prompts for a name', () => {
  for (const text of ['', 'MENU\nPASTA\nSpaghetti alle Vongole €16', 'PASTA\nMENU\nRisotto €18', 'Restaurant Menu\nPasta €10', 'Restaurant\nMENU', 'Vegan gluten free\nMENU', 'MENU\nRestaurant\nPASTA']) {
    assert.deepEqual(extractRestaurant(text),{restaurantName:null,restaurantQuery:null}, text);
  }
});
