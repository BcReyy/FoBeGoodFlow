import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderPayload, normalizeOrder } from '../src/services/liveOrders.js';

test('guest order sends IDs and quantities without customerId', () => {
  assert.deepEqual(buildOrderPayload([{ id: 3, qty: 2, price: 100 }], ''), {
    items: [{ menuItemId: 3, quantity: 2 }],
  });
});

test('linked customer order includes numeric CustomerID', () => {
  assert.deepEqual(buildOrderPayload([{ id: 2, qty: 1 }], ' 17 '), {
    customerId: 17, items: [{ menuItemId: 2, quantity: 1 }],
  });
});

test('invalid IDs, empty carts and duplicates are rejected', () => {
  assert.throws(() => buildOrderPayload([], ''), /Select at least/);
  assert.throws(() => buildOrderPayload([{ id: 1, qty: 1 }], 'guest'), /Customer account ID/);
  assert.throws(() => buildOrderPayload([{ id: 1, qty: 0 }], ''), /invalid/);
  assert.throws(() => buildOrderPayload([{ id: 1, qty: 1 }, { id: 1, qty: 1 }], ''), /duplicate/);
});

test('maps backend OrderDetail and status to UI model', () => {
  const mapped = normalizeOrder({
    orderId: 12, orderNumber: 'ORD-XYZ', customerId: 17, cashierId: 4,
    orderStatus: 'Pending', totalAmount: '20.00', orderDate: '2026-11-24T04:00:00Z',
    items: [{ menuItemId: 6, quantity: 2, unitPrice: '10.00', subtotal: '20.00' }],
  }, [{ id: 6, name: 'Americano' }]);
  assert.equal(mapped.id, 12);
  assert.equal(mapped.customerName, 'Customer #17');
  assert.equal(mapped.items[0].name, 'Americano');
  assert.equal(mapped.items[0].quantity, 2);
  assert.equal(mapped.total, 20);
});

test('historical products not in visible catalog show their ID', () => {
  const mapped = normalizeOrder({
    orderId: 2, orderNumber: 'ORD-2', customerId: null, cashierId: 4,
    orderStatus: 'Cancelled', totalAmount: '5.00', orderDate: '2026-11-24T04:00:00Z',
    items: [{ menuItemId: 21, quantity: 1, unitPrice: '5.00' }],
  });
  assert.equal(mapped.items[0].name, 'Menu item #21');
  assert.equal(mapped.customerName, 'Guest');
});

test('unknown statuses and malformed lines are rejected', () => {
  const item = {
    orderId: 1, orderNumber: 'ORD-1', customerId: null, cashierId: 4,
    orderStatus: 'Preparing', totalAmount: '5.00', orderDate: '2026-11-24T04:00:00Z',
    items: [{ menuItemId: 21, quantity: 1, unitPrice: '5.00' }],
  };
  assert.throws(() => normalizeOrder(item), /invalid order/);
  assert.throws(() => normalizeOrder({ ...item, orderStatus: 'Completed', items: [{ menuItemId: 21, quantity: 0, unitPrice: '5.00' }] }), /invalid order line/);
});
