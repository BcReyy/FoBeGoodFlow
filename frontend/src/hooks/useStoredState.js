import { useEffect, useState } from 'react';
// Isolated local browser storage for the visual prototype only; never an authentication store.
const STORAGE_PREFIX = 'fobegoodflow-demo-v2-';
export default function useStoredState(key, startingValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : startingValue;
    } catch { return startingValue; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch {  }
  }, [key, value]);
  return [value, setValue];
}
