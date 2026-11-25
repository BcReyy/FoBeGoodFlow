import test from 'node:test';
import assert from 'node:assert/strict';
import { getCartItems, calculateOrderTotal, stockShortfall, applyInventoryDelta, canTransitionOrder, validateProductDraft } from '../src/domain/orderRules.js';
import { seedProducts, stockStatus } from '../src/demoData.js';

test('cart items and totals reflect item quantities', () => {
  const items = getCartItems(seedProducts, { 1: 1, 2: 2, 3: 0 });
  assert.equal(items.length, 2);
  assert.equal(calculateOrderTotal(items), 420);
});
test('cannot order unavailable products or more than remaining stock', () => {
  assert.equal(stockShortfall(getCartItems(seedProducts, { 2: 10 })).name, 'Latte');
  assert.equal(stockShortfall(getCartItems(seedProducts, { 6: 1 })).name, 'Banana bread');
  assert.equal(stockShortfall(getCartItems(seedProducts, { 1: 1 })), null);
});
test('deducting and restoring stock preserves original product counts', () => {
  const lines = [{ menuItemId: 2, quantity: 2 }, { menuItemId: 1, quantity: 1 }];
  const deducted = applyInventoryDelta(seedProducts, lines, -1);
  assert.equal(deducted.find(p => p.id === 2).stock, 7);
  assert.deepEqual(applyInventoryDelta(deducted, lines, 1), seedProducts);
});
test('overselling and unknown product IDs are rejected', () => {
  assert.throws(() => applyInventoryDelta(seedProducts, [{ menuItemId: 2, quantity: 11 }], -1), /Insufficient stock/);
  assert.throws(() => applyInventoryDelta(seedProducts, [{ menuItemId: 999, quantity: 1 }], -1), /Unknown product/);
  assert.throws(() => applyInventoryDelta(seedProducts, [{ menuItemId: 1, quantity: -2 }], -1), /Invalid quantity/);
});
test('status transitions follow Pending → Preparing → Completed or Cancelled', () => {
  assert.equal(canTransitionOrder('Pending', 'Preparing'), true);
  assert.equal(canTransitionOrder('Pending', 'Cancelled'), true);
  assert.equal(canTransitionOrder('Preparing', 'Completed'), true);
  assert.equal(canTransitionOrder('Completed', 'Pending'), false);
  assert.equal(canTransitionOrder('Cancelled', 'Preparing'), false);
});
test('product draft rejects duplicate names and invalid price and stock', () => {
  const valid = { name: 'Flat white', category: 'Coffee', price: '145.50', stock: '8', minimumStockLevel: '3', isAvailable: true };
  assert.equal(validateProductDraft(valid, seedProducts).valid, true);
  assert.equal(validateProductDraft({ ...valid, name: 'latte' }, seedProducts).valid, false);
  assert.equal(validateProductDraft({ ...valid, price: '1.234' }, seedProducts).valid, false);
  assert.equal(validateProductDraft({ ...valid, stock: '-1' }, seedProducts).valid, false);
  assert.equal(validateProductDraft({ ...valid, stock: '' }, seedProducts).valid, false);
});
test('one source of truth for mocked inventory, including PDF contradiction', () => {
  assert.equal(stockStatus(seedProducts.find(p => p.id === 6)), 'Hidden from menu');
  assert.equal(seedProducts.filter(p => stockStatus(p) === 'Low stock').length, 2);
});
