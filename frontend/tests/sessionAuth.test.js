import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readSessionToken, saveSessionToken, clearSessionToken } from '../src/services/sessionAuth.js';

const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
afterEach(() => {
  if (originalDescriptor) Object.defineProperty(globalThis, 'sessionStorage', originalDescriptor);
  else delete globalThis.sessionStorage;
});

function mockStorage() {
  const map = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key) => map.has(key) ? map.get(key) : null,
      setItem: (key, value) => { map.set(key, value); },
      removeItem: (key) => { map.delete(key); },
    },
  });
  return map;
}

test('token survives module reads until logout', () => {
  mockStorage();
  assert.equal(readSessionToken(), null);
  assert.equal(saveSessionToken('example-jwt'), true);
  assert.equal(readSessionToken(), 'example-jwt');
  clearSessionToken();
  assert.equal(readSessionToken(), null);
});

test('refuses empty tokens', () => {
  mockStorage();
  assert.equal(saveSessionToken(''), false);
  assert.equal(saveSessionToken(null), false);
  assert.equal(readSessionToken(), null);
});

test('storage-unavailable browser fails closed without throwing', () => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get() { throw new Error('blocked'); },
  });
  assert.equal(readSessionToken(), null);
  assert.equal(saveSessionToken('example-jwt'), false);
  assert.doesNotThrow(clearSessionToken);
});
