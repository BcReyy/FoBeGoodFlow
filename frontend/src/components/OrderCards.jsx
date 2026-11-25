import React from 'react';
import { money, shortDate } from '../demoData.js';
import StatusPill from './StatusPill.jsx';

export default function OrderCards({
  list,
  allowStatusChange = false,
  onChangeStatus,
  statusSavingId = null,
}) {
  if (!list.length) return <div className="empty-state">No orders found for this account.</div>;
  return (
    <div className="order-list">
      {list.map((order) => (
        <article className="order-card" key={order.id}>
          <div className="order-main">
            <strong>Order #{order.orderNumber}</strong>
            <div className="order-description">
              {order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ') || 'No order lines'}
            </div>
            <small className="order-meta">
              {shortDate(order.createdAt)} · {order.customerName}
            </small>
          </div>
          <div className="order-right">
            <StatusPill status={order.status} />
            <strong>{money(order.total)}</strong>
            {allowStatusChange && order.status === 'Pending' && (
              <div className="order-actions">
                <button type="button" disabled={statusSavingId != null}
                  onClick={() => onChangeStatus(order, 'Completed')}>
                  {statusSavingId === order.id ? 'Saving...' : 'Complete'}
                </button>
                <button type="button" className="muted-action" disabled={statusSavingId != null}
                  onClick={() => onChangeStatus(order, 'Cancelled')}>Cancel</button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
