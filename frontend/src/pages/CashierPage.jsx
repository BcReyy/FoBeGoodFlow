import React from 'react';
import { money, stockStatus } from '../demoData.js';
import Field from '../components/Field.jsx';
import StatusPill from '../components/StatusPill.jsx';
import OrderCards from '../components/OrderCards.jsx';
import NoticeList from '../components/NoticeList.jsx';

export default function CashierPage({
  tab, products, cart, cartItems, cartTotal, customerText, onCustomerText,
  onUpdateCart, onPlaceOrder, sortedOrders, lowProducts, outProducts,
  onTabChange, onChangeOrderStatus, liveNotices, noticeLoading, noticeError,
  onMarkRead, onMarkAllRead, onRefreshNotices, noticesSaving,
  placingOrder, orderMenuLoading, orderMenuLoaded, orderMenuError, onReloadOrderMenu,
  ordersLoading, ordersError, ordersLoaded, orderActionError, statusSavingId, onRefreshOrders,
}) {
  if (tab === 'new-order') return (
    <div className="cashier-layout">
      <section className="menu-area">
        <div className="page-heading">
          <div><h1>Pick items</h1><p>Live menu and stock from MySQL.</p></div>
          <button className="secondary-button" type="button" onClick={onReloadOrderMenu}
            disabled={orderMenuLoading || placingOrder}>
            {orderMenuLoading ? 'Refreshing...' : 'Refresh menu'}
          </button>
        </div>
        {orderMenuError && <div className="inline-alert" role="alert">{orderMenuError}</div>}
        {orderMenuLoading && <p role="status">Loading products...</p>}
        {orderMenuLoaded && !orderMenuError && (
          <div className="product-grid">
            {products.map((product) => {
              const available = product.isAvailable && product.stock > 0;
              return (
                <button type="button" key={product.id}
                  className={`product-card ${!available ? 'unavailable' : ''} ${(cart[product.id] || 0) > 0 ? 'selected' : ''}`}
                  disabled={!available || placingOrder || orderMenuLoading}
                  onClick={() => onUpdateCart(product.id, (cart[product.id] || 0) + 1)}>
                  <strong>{product.name}</strong>
                  <span>{money(product.price)} · {stockStatus(product) === 'Low stock'
                    ? `Low: ${product.stock} left` : available ? `${product.stock} left` : stockStatus(product)}</span>
                  {(cart[product.id] || 0) > 0 && <em>{cart[product.id]} added</em>}
                </button>
              );
            })}
            {!products.length && <p>No available menu items returned by MySQL.</p>}
          </div>
        )}
        <p className="assistive-note">The backend validates stock again when the order is submitted.</p>
      </section>
      <aside className="cart-panel">
        <h2>Current order</h2>
        {cartItems.length ? (
          <div className="cart-lines">
            {cartItems.map((item) => (
              <div className="cart-line" key={item.id}>
                <div>
                  <span>{item.qty} × {item.name}</span>
                  <div className="quantity-controls">
                    <button type="button" aria-label={`Remove one ${item.name}`}
                      disabled={placingOrder || orderMenuLoading}
                      onClick={() => onUpdateCart(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button type="button" aria-label={`Add one ${item.name}`}
                      disabled={placingOrder || orderMenuLoading}
                      onClick={() => onUpdateCart(item.id, item.qty + 1)}>+</button>
                  </div>
                </div>
                <strong>{money(item.qty * item.price)}</strong>
              </div>
            ))}
          </div>
        ) : <div className="cart-empty">Your selected items will appear here.</div>}
        <Field id="customer-id" label="Customer account ID (optional)">
          <input id="customer-id" type="text" inputMode="numeric" autoComplete="off"
            placeholder="Leave blank for guest order" value={customerText}
            onChange={(event) => onCustomerText(event.target.value)}
            maxLength={12} disabled={placingOrder} />
        </Field>
        <p className="assistive-note">Ask the customer for their account ID from Profile to link the order to My orders. Leave blank for a guest transaction.</p>
        <div className="cart-total"><strong>Total</strong><strong>{money(cartTotal)}</strong></div>
        {orderActionError && <div className="inline-alert" role="alert">{orderActionError}</div>}
        <button className="primary-button wide-button" type="button" onClick={onPlaceOrder}
          disabled={!cartItems.length || placingOrder || orderMenuLoading || !orderMenuLoaded || Boolean(orderMenuError)}>
          {placingOrder ? 'Saving order...' : 'Place order in MySQL'}
        </button>
      </aside>
    </div>
  );

  if (tab === 'orders') return (
    <div className="content-area">
      <div className="page-heading">
        <div><h1>Orders</h1><p>Orders created by your Cashier account, from MySQL.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="secondary-button" onClick={onRefreshOrders}
            disabled={ordersLoading || statusSavingId != null}>
            {ordersLoading ? 'Refreshing...' : 'Refresh orders'}
          </button>
          <button className="primary-button" type="button" onClick={() => onTabChange('new-order')}>New order</button>
        </div>
      </div>
      {ordersError && <div className="inline-alert" role="alert">{ordersError}</div>}
      {orderActionError && <div className="inline-alert" role="alert">{orderActionError}</div>}
      {ordersLoading && <p role="status">Loading orders...</p>}
      {ordersLoaded && !ordersError && !ordersLoading && (
        <OrderCards list={sortedOrders} allowStatusChange onChangeStatus={onChangeOrderStatus}
          statusSavingId={statusSavingId} />
      )}
    </div>
  );

  return (
    <div className="content-area">
      <div className="page-heading"><div><h1>Alerts</h1><p>Account notifications and live inventory alerts.</p></div></div>
      <div className="page-heading">
        <div><h2>Account notifications</h2></div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" className="secondary-button" onClick={onRefreshNotices} disabled={noticeLoading}>Refresh</button>
          {liveNotices.some((n) => !n.isRead) && (
            <button type="button" className="underlined" onClick={onMarkAllRead} disabled={noticesSaving}>Mark all read</button>
          )}
        </div>
      </div>
      {noticeError ? <div className="inline-alert" role="alert">{noticeError}</div>
        : noticeLoading ? <p role="status">Loading notifications...</p>
          : <div className="notices-panel"><NoticeList notices={liveNotices} onRead={onMarkRead} /></div>}
      <h2 style={{ marginTop: 24 }}>Inventory alerts</h2>
      {orderMenuError && <div className="inline-alert" role="alert">{orderMenuError}</div>}
      {orderMenuLoading && <p role="status">Loading inventory...</p>}
      {orderMenuLoaded && !orderMenuError && (
        <>
          <div className="alert-summary">{lowProducts.length} items running low · {outProducts.length} unavailable</div>
          <div className="stock-alert-list">
            {[...lowProducts, ...outProducts].map((p) => (
              <div className="stock-alert-row" key={p.id}>
                <span><strong>{p.name}</strong><small>{p.stock} in stock · threshold {p.minimumStockLevel}</small></span>
                <StatusPill status={stockStatus(p)} />
              </div>
            ))}
            {!lowProducts.length && !outProducts.length && <div className="empty-state">No inventory alerts.</div>}
          </div>
        </>
      )}
    </div>
  );
}
