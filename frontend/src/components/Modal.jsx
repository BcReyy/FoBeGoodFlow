import React, { useEffect, useRef } from 'react';
export default function Modal({ title, children, onClose, wide = false }) {
  const panelRef = useRef(null);
  useEffect(() => {
    const focusBefore = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('input, select, textarea, button')?.focus();
    return () => { document.body.style.overflow = previousOverflow; focusBefore?.focus?.(); };
  }, []);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const elements = [...panelRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!elements.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={panelRef} className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><h2>{title}</h2><button className="close-button" type="button" aria-label="Close dialog" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>;
}
