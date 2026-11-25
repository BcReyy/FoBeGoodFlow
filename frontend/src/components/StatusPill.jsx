import React from 'react';
export default function StatusPill({ status }) { return <span className={`status-pill status-${String(status).toLowerCase().replace(/[^a-z]+/g, '-')}`}>{status}</span>; }
