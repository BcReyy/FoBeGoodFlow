import React from 'react';
import NoticeList from '../components/NoticeList.jsx';
import OrderCards from '../components/OrderCards.jsx';

export default function CustomerPage({
  tab,
  myOrders,
  ordersLoading,
  ordersLoaded,
  ordersError,
  onRefreshOrders,
  myNotices,
  profile,
  profileLoading,
  profileError,
  noticeLoading,
  noticeError,
  noticesSaving,
  onRefreshNotices,
  user,
  onMarkRead,
  onMarkAllRead,
  onTabChange,
  onOpenProfile,
}) {
  const noticeContent = noticeError
    ? <div className="inline-alert" role="alert">{noticeError}</div>
    : noticeLoading
      ? <p role="status">Loading notices...</p>
      : <NoticeList notices={myNotices} onRead={onMarkRead} />;

  if (tab === 'my-orders') {
    return (
      <div className="customer-layout">
        <section>
          <h1>My orders</h1>
          <p className="assistive-note">These are orders linked to your Customer account ID in MySQL. Guest orders do not appear here.</p>
          <button type="button" className="secondary-button" onClick={onRefreshOrders} disabled={ordersLoading}>
            {ordersLoading ? 'Refreshing...' : 'Refresh my orders'}
          </button>
          {ordersError && <div className="inline-alert" role="alert">{ordersError}</div>}
          {ordersLoading && <p role="status">Loading orders...</p>}
          {ordersLoaded && !ordersError && !ordersLoading && <OrderCards list={myOrders} />}
        </section>
        <aside className="notice-sidebar">
          <h2>Notices</h2>
          {noticeError ? <div className="inline-alert" role="alert">{noticeError}</div>
            : noticeLoading ? <p role="status">Loading notices...</p>
              : <NoticeList notices={myNotices.slice(0, 4)} onRead={onMarkRead} compact />}
          <button type="button" className="underlined" onClick={() => onTabChange('notices')}>View all notices</button>
        </aside>
      </div>
    );
  }

  if (tab === 'notices') {
    return (
      <div className="content-area narrow-content">
        <div className="page-heading">
          <div><h1>Notices</h1><p>Messages for your signed-in account, from MySQL.</p></div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="secondary-button" onClick={onRefreshNotices} disabled={noticeLoading}>Refresh</button>
            {myNotices.some((n) => !n.isRead) && <button type="button" className="underlined" onClick={onMarkAllRead} disabled={noticesSaving}>Mark all read</button>}
          </div>
        </div>
        <div className="notices-panel">{noticeContent}</div>
      </div>
    );
  }

  return (
    <div className="content-area narrow-content">
      <div className="page-heading">
        <div><h1>Profile</h1><p>Account details stored in MySQL.</p></div>
        <button type="button" className="primary-button" onClick={onOpenProfile} disabled={profileLoading}>Edit profile</button>
      </div>
      {profileError && <div className="inline-alert" role="alert">{profileError}</div>}
      {profileLoading ? <p role="status">Loading profile...</p> : (
        <div className="profile-panel">
          <div><small>Customer account ID</small><strong>#{user.id}</strong></div>
          <p className="assistive-note">Give this ID to the Cashier when ordering if you want purchases linked to My orders.</p>
          <div><small>Full name</small><strong>{profile?.fullName || user.fullName}</strong></div>
          <div><small>Email</small><strong>{profile?.email || user.email}</strong></div>
          <div><small>Phone number</small><strong>{profile?.phoneNumber || 'Not set'}</strong></div>
          <div><small>Address</small><strong>{profile?.address || 'Not set'}</strong></div>
        </div>
      )}
    </div>
  );
}
