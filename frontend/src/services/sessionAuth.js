// Demo/local development: sessionStorage survives a reload of this tab but
// is cleared when the tab closes. Never store passwords here.
const SESSION_KEY = 'fobegoodflow-auth-token-v1';

export function readSessionToken() {
  try {
    const value = globalThis.sessionStorage?.getItem(SESSION_KEY);
    return typeof value === 'string' && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveSessionToken(token) {
  if (typeof token !== 'string' || !token) return false;
  try {
    globalThis.sessionStorage?.setItem(SESSION_KEY, token);
    return globalThis.sessionStorage?.getItem(SESSION_KEY) === token;
  } catch {
    // Private browsing or restrictive settings may block sessionStorage.
    return false;
  }
}

export function clearSessionToken() {
  try {
    globalThis.sessionStorage?.removeItem(SESSION_KEY);
  } catch {
    // React will still clear the in-memory session during logout.
  }
}
