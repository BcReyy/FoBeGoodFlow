import React from 'react';
import { shortDate } from '../demoData.js';
export default function NoticeList({ notices, onRead, compact = false }) {
  if (!notices.length) return <div className="empty-mini">No notices yet.</div>;
  return <div className={`notice-list ${compact ? 'compact' : ''}`}>
    {notices.map(notice => <button key={notice.id} type="button" className={`notice-row ${notice.isRead ? 'read' : 'unread'}`} onClick={() => onRead(notice.id)} aria-label={`${notice.message}${notice.isRead ? '' : ' Mark read'}`}>
      <span>{!notice.isRead && <i className="unread-dot" aria-hidden="true" />}{notice.message}</span>
      <small>{shortDate(notice.createdAt)}</small>
    </button>)}
  </div>;
}
