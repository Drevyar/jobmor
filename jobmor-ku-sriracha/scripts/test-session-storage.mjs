import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionStorage } from '../src/lib/session-storage.ts';

function memoryStore() {
  const values = new Map();
  return { values, getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async key => { values.delete(key); } };
}
test('migrates a large Unicode session, removes plaintext and clears all secure chunks on logout', async () => {
  const secure = memoryStore(); const legacy = memoryStore();
  const session = JSON.stringify({ access_token: 'token', metadata: 'นิสิต🌿'.repeat(2000) });
  legacy.values.set('session', session);
  const storage = createSessionStorage(secure, legacy);
  assert.equal(await storage.getItem('session'), session);
  assert.equal(legacy.values.size, 0);
  assert.ok([...secure.values.values()].every(value => Buffer.byteLength(value) <= 1600));
  assert.equal(await storage.getItem('session'), session);
  await storage.removeItem('session');
  assert.equal(secure.values.size, 0);
  assert.equal(await storage.getItem('session'), null);
});
test('failed chunk write preserves prior session and never falls back to plaintext writes', async () => {
  const secure = memoryStore(); const legacy = memoryStore();
  const storage = createSessionStorage(secure, legacy);
  await storage.setItem('session', 'original');
  const write = secure.setItem;
  secure.setItem = async (key, value) => { if (value === 'x'.repeat(400)) throw new Error('Keychain unavailable'); await write(key, value); };
  await assert.rejects(storage.setItem('session', 'x'.repeat(900)), /Keychain unavailable/);
  assert.equal(await storage.getItem('session'), 'original');
  assert.equal(legacy.values.size, 0);
  assert.equal(secure.values.size, 2);
});
test('failed migration retains old session for retry; successful refresh removes old chunks', async () => {
  const secure = memoryStore(); const legacy = memoryStore();
  legacy.values.set('session', 'legacy');
  const write = secure.setItem;
  secure.setItem = async () => { throw new Error('locked'); };
  const storage = createSessionStorage(secure, legacy);
  await assert.rejects(storage.getItem('session'), /locked/);
  assert.equal(legacy.values.get('session'), 'legacy');
  secure.setItem = write;
  assert.equal(await storage.getItem('session'), 'legacy');
  await storage.setItem('session', 'refreshed');
  assert.equal(await storage.getItem('session'), 'refreshed');
  assert.equal(secure.values.size, 2);
});
