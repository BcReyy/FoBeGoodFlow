// The NestJS Orders API is authoritative for status, totals and stock changes.
// Never update browser inventory optimistically after an order mutation.
export function buildOrderPayload(cartItems, customerIdInput) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Select at least one product before placing an order.');
  }

  const ids = new Set();
  const items = cartItems.map((item) => {
    const menuItemId = Number(item.id);
    const quantity = Number(item.qty);
    if (!Number.isSafeInteger(menuItemId) || menuItemId < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1 || ids.has(menuItemId)) {
      throw new Error('Cart contains an invalid or duplicate product.');
    }
    ids.add(menuItemId);
    return { menuItemId, quantity };
  });

  const customerIdText = String(customerIdInput ?? '').trim();
  if (!customerIdText) return { items }; // Guest order; not linked to a customer account.
  if (!/^[1-9]\d*$/.test(customerIdText) || !Number.isSafeInteger(Number(customerIdText))) {
    throw new Error('Enter a valid positive Customer account ID, or leave it blank for a guest order.');
  }
  return { customerId: Number(customerIdText), items };
}

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function normalizeOrder(record, products = []) {
  const id = validId(record?.orderId);
  const total = Number(record?.totalAmount);
  const createdAt = record?.orderDate;
  if (!id || typeof record.orderNumber !== 'string' || !record.orderNumber ||
      !['Pending', 'Completed', 'Cancelled'].includes(record.orderStatus) ||
      !Number.isFinite(total) || total < 0 || typeof createdAt !== 'string' ||
      !Number.isFinite(Date.parse(createdAt)) || !Array.isArray(record.items)) {
    throw new Error('The Orders API returned an invalid order.');
  }

  const names = new Map(products.map((p) => [p.id, p.name]));
  const items = record.items.map((entry) => {
    const menuItemId = validId(entry?.menuItemId);
    const quantity = Number(entry?.quantity);
    const unitPrice = Number(entry?.unitPrice);
    if (!menuItemId || !Number.isSafeInteger(quantity) || quantity < 1 ||
        !Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error('The Orders API returned an invalid order line.');
    }
    return {
      menuItemId,
      name: names.get(menuItemId) || `Menu item #${menuItemId}`,
      quantity,
      unitPrice,
    };
  });

  const customerId = record.customerId == null ? null : validId(record.customerId);
  const cashierId = validId(record.cashierId);
  if (!cashierId || (record.customerId != null && !customerId)) {
    throw new Error('The Orders API returned an invalid customer or cashier ID.');
  }
  return {
    id,
    orderNumber: record.orderNumber,
    customerId,
    customerName: customerId ? `Customer #${customerId}` : 'Guest',
    cashierId,
    items,
    total,
    status: record.orderStatus,
    createdAt,
  };
}
