export const seedProducts = [
  { id: 1, name: 'Americano', category: 'Coffee', description: 'Classic espresso with hot water', price: 120, stock: 14, minimumStockLevel: 5, isAvailable: true },
  { id: 2, name: 'Latte', category: 'Coffee', description: 'Espresso with steamed milk', price: 150, stock: 9, minimumStockLevel: 5, isAvailable: true },
  { id: 3, name: 'Cappuccino', category: 'Coffee', description: 'Espresso, steamed milk, and foam', price: 155, stock: 3, minimumStockLevel: 5, isAvailable: true },
  { id: 4, name: 'Iced mocha', category: 'Coffee', description: 'Espresso, milk, and chocolate served cold', price: 175, stock: 11, minimumStockLevel: 5, isAvailable: true },
  { id: 5, name: 'Butter croissant', category: 'Pastry', description: 'Flaky, buttery pastry', price: 95, stock: 2, minimumStockLevel: 5, isAvailable: true },
  { id: 6, name: 'Banana bread', category: 'Pastry', description: 'Fresh banana loaf', price: 85, stock: 0, minimumStockLevel: 5, isAvailable: false },
];

export const seedOrders = [
  { id: 1001, orderNumber: '0001', customerId: 'demo-customer', customerName: 'Alex Customer', cashierId: 'demo-cashier', items: [{ menuItemId: 2, name: 'Latte', quantity: 2, unitPrice: 150 }, { menuItemId: 6, name: 'Banana bread', quantity: 1, unitPrice: 85 }], total: 385, status: 'Pending', createdAt: '2026-11-21T09:30:00+08:00', stockRestored: false },
  { id: 1002, orderNumber: '0002', customerId: 'demo-customer', customerName: 'Alex Customer', cashierId: 'demo-cashier', items: [{ menuItemId: 1, name: 'Americano', quantity: 1, unitPrice: 120 }], total: 120, status: 'Completed', createdAt: '2026-11-20T14:15:00+08:00', stockRestored: false },
  { id: 1003, orderNumber: '0003', customerId: 'demo-customer', customerName: 'Alex Customer', cashierId: 'demo-cashier', items: [{ menuItemId: 4, name: 'Iced mocha', quantity: 1, unitPrice: 175 }], total: 175, status: 'Cancelled', createdAt: '2026-11-19T11:20:00+08:00', stockRestored: true },
];

export const seedNotifications = [
  { id: 1, userId: 'demo-customer', message: 'Your order is being prepared.', createdAt: '2026-11-21T09:35:00+08:00', isRead: false, kind: 'order' },
  { id: 2, userId: 'demo-customer', message: 'Order completed. Thank you!', createdAt: '2026-11-20T14:27:00+08:00', isRead: false, kind: 'order' },
];

export const seedAccounts = [
  { id: 'demo-admin', fullName: 'Morgan Admin', email: 'admin@demo.local', role: 'Administrator', isActive: true },
  { id: 'demo-cashier', fullName: 'Jamie Cashier', email: 'cashier@demo.local', role: 'Cashier/Staff', isActive: true },
  { id: 'demo-customer', fullName: 'Alex Customer', email: 'customer@demo.local', role: 'Customer', isActive: true },
];

export const money = value => new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(value);

export const shortDate = value => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }).format(new Date(value));

export const stockStatus = product => !product.isAvailable ? 'Hidden from menu' : product.stock <= 0 ? 'Out of stock' : product.stock <= product.minimumStockLevel ? 'Low stock' : 'Available';
