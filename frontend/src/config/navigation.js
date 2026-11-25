export const navByRole = {
  'Cashier/Staff': [{ id: 'new-order', label: 'New order' }, { id: 'orders', label: 'Orders' }, { id: 'alerts', label: 'Alerts' }],
  Administrator: [{ id: 'menu', label: 'Menu and stock' }, { id: 'accounts', label: 'Accounts' }, { id: 'orders', label: 'Orders' }, { id: 'notifications', label: 'Notifications' }],
  Customer: [{ id: 'my-orders', label: 'My orders' }, { id: 'notices', label: 'Notices' }, { id: 'profile', label: 'Profile' }],
};
export const firstTab = { 'Cashier/Staff': 'new-order', Administrator: 'menu', Customer: 'my-orders' };
export const niceRole = { 'Cashier/Staff': 'Cashier', Administrator: 'Admin', Customer: 'Customer' };
export const emptyProduct = { name: '', category: 'Coffee', description: '', price: '', stock: 0, minimumStockLevel: 5, isAvailable: true };
