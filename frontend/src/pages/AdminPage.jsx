import React from 'react';
import { money, stockStatus } from '../demoData.js';
import { niceRole } from '../config/navigation.js';
import OrderCards from '../components/OrderCards.jsx';

export default function AdminPage({
  tab,
  lowProducts,
  products,
  accounts,
  sortedOrders,
  ordersLoading = false,
  ordersLoaded = false,
  ordersError = '',
  onRefreshOrders,
  onAddAccount,
  accountsLoading = false,
  accountsLoaded = false,
  accountsError = '',
  savingAccount = false,
  onReloadAccounts,
  onChangeAccountStatus,
  menuLoading,
  menuLoaded,
  menuError,
  onReloadProducts,
  onOpenProduct,
  onOpenRestock,
  savingProduct = false,
}) {
  if (tab === 'menu') {
    const controlsDisabled = menuLoading || savingProduct || !menuLoaded || Boolean(menuError);

    return (
      <div className="content-area">
        <div className="page-heading">
          <div>
            <h1>Menu and stock</h1>
            <p>
              {menuLoaded
                ? `${lowProducts.length} active item(s) at or below their minimum stock level.`
                : 'Live inventory from MySQL.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={onReloadProducts}
              disabled={menuLoading || savingProduct}
            >
              {menuLoading ? 'Refreshing...' : 'Refresh inventory'}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => onOpenProduct()}
              disabled={controlsDisabled}
            >
              Add menu item
            </button>
          </div>
        </div>

        <p className="assistive-note">
          Live MySQL inventory. Edit updates product details; Restock adds units without replacing the current stock.
          Orders and Accounts are connected through the secured MySQL API.
        </p>

        {menuError && (
          <div className="inline-alert" role="alert">
            Unable to load live inventory: {menuError}
          </div>
        )}
        {menuLoading && <p role="status">Loading menu items from MySQL...</p>}

        {menuLoaded && !menuError && (
          <div className="table-shell">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>In stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={5}>No menu items found in the database.</td></tr>
                ) : products.map((product) => {
                  const status = stockStatus(product);
                  return (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{money(product.price)}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={`stock-text ${status === 'Low stock' ? 'stock-low' : ''}`}>
                          {status}
                        </span>
                      </td>
                      <td className="edit-col">
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="underlined"
                            onClick={() => onOpenProduct(product)}
                            disabled={controlsDisabled}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="underlined"
                            onClick={() => onOpenRestock(product)}
                            disabled={controlsDisabled}
                          >
                            Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (tab === 'accounts') {
    return (
      <div className="content-area">
        <div className="page-heading">
          <div>
            <h1>Accounts</h1>
            <p>Customer, cashier, and administrator accounts from MySQL.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="secondary-button" type="button" onClick={onReloadAccounts} disabled={accountsLoading || savingAccount}>
              {accountsLoading ? 'Refreshing...' : 'Refresh accounts'}
            </button>
            <button className="primary-button" type="button" onClick={onAddAccount} disabled={accountsLoading || savingAccount || !accountsLoaded || Boolean(accountsError)}>
              Add cashier account
            </button>
          </div>
        </div>
        <p className="assistive-note">Only Cashier accounts can be created here. Administrator accounts cannot be deactivated. Inactive users cannot log in or use existing JWT sessions.</p>
        {accountsError && <div className="inline-alert" role="alert">Unable to load accounts: {accountsError}</div>}
        {accountsLoading && <p role="status">Loading accounts from MySQL...</p>}
        {accountsLoaded && !accountsError && (
          <div className="table-shell">
            <table className="inventory-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan={5}>No accounts were returned by the database.</td></tr>
                ) : accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.fullName}</td>
                    <td>{account.email}</td>
                    <td>{niceRole[account.role] || account.role}</td>
                    <td>{account.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="edit-col">
                      {account.role === 'Admin' ? (
                        <span>Protected</span>
                      ) : (
                        <button className="underlined" type="button" disabled={savingAccount || accountsLoading}
                          onClick={() => onChangeAccountStatus(account)}>
                          {account.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="content-area">
      <div className="page-heading">
        <div>
          <h1>Orders</h1>
          <p>Live order history from MySQL. Administrators can view all orders.</p>
        </div>
      </div>
      <button type="button" className="secondary-button" onClick={onRefreshOrders}
        disabled={ordersLoading}>{ordersLoading ? 'Refreshing...' : 'Refresh orders'}</button>
      {ordersError && <div className="inline-alert" role="alert">{ordersError}</div>}
      {ordersLoading && <p role="status">Loading orders...</p>}
      {ordersLoaded && !ordersError && !ordersLoading && <OrderCards list={sortedOrders} />}
    </div>
  );
}
