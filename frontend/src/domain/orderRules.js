export function getCartItems(products, cart) {
  return Object.entries(cart)
    .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0)
    .map(([id, qty]) => {
      const product = products.find(p => p.id === Number(id));
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);
}

export function calculateOrderTotal(items) {
  return Math.round(items.reduce((sum, item) => sum + item.price * (item.qty ?? item.quantity), 0) * 100) / 100;
}

export function stockShortfall(items) {
  return items.find(item => !item.isAvailable || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > item.stock) || null;
}

export function applyInventoryDelta(products, items, multiplier) {
  if (![1, -1].includes(multiplier)) throw new Error('Invalid stock adjustment');
  const quantityById = new Map();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error('Invalid quantity');
    quantityById.set(item.menuItemId, (quantityById.get(item.menuItemId) || 0) + item.quantity);
  }
  const found = new Set();
  const next = products.map(product => {
    const amount = quantityById.get(product.id) || 0;
    if (!amount) return product;
    found.add(product.id);
    const stock = product.stock + multiplier * amount;
    if (stock < 0) throw new Error(`Insufficient stock for ${product.name}`);
    return { ...product, stock };
  });
  if (found.size !== quantityById.size) throw new Error('Unknown product in order');
  return next;
}

export function canTransitionOrder(from, to) {
  return from === 'Pending' ? ['Preparing', 'Cancelled'].includes(to)
    : from === 'Preparing' ? ['Completed', 'Cancelled'].includes(to)
    : false;
}

export function validateProductDraft(draft, products, editingId = null) {
  const name = String(draft.name || '').trim();
  const category = String(draft.category || '').trim();
  const priceText = String(draft.price ?? '').trim();
  const price = Number(priceText), stock = Number(draft.stock), minimumStockLevel = Number(draft.minimumStockLevel);
  if (!name || !category || !/^\d+(?:\.\d{1,2})?$/.test(priceText)
    || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0
    || !Number.isInteger(minimumStockLevel) || minimumStockLevel < 0
    || String(draft.stock).trim() === '' || String(draft.minimumStockLevel).trim() === '') {
    return { valid: false, error: 'Enter a valid name, category, price (up to 2 decimals), and nonnegative whole-number stock values.' };
  }
  if (products.some(p => p.id !== editingId && p.name.trim().toLowerCase() === name.toLowerCase())) {
    return { valid: false, error: 'A menu item with this name already exists.' };
  }
  return { valid: true, product: { ...draft, name, category, price, stock, minimumStockLevel, isAvailable: Boolean(draft.isAvailable), description: String(draft.description || '').trim() } };
}
