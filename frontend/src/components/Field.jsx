import React from 'react';
export default function Field({ label, id, children, hint }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && <div className="field-hint">{hint}</div>}</div>;
}
