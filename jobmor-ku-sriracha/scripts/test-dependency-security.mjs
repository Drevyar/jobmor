import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const query = require('query-string');

test('router query parser retains Unicode, plus, arrays and URL fragment behavior', () => {
  assert.deepEqual({ ...query.parse('q=%E0%B8%87%E0%B8%B2%E0%B8%99+part-time&jobId=123&x=1&x=2') }, { jobId: '123', q: 'งาน part-time', x: ['1', '2'] });
  assert.equal(query.parse('q=a%2Bb').q, 'a+b');
  assert.equal(query.parseUrl('/jobs?q=test#hello+world', { parseFragmentIdentifier: true }).fragmentIdentifier, 'hello world');
  const state = { jobId: '123', search: 'งาน + retail' };
  assert.deepEqual({ ...query.parse(query.stringify(state)) }, state);
});
test('malformed URL decoding finishes within a bounded subprocess timeout', () => {
  const result = spawnSync(process.execPath, ['-e', `
    const q = require('query-string');
    const output = q.parse('q=' + '%FF'.repeat(10000) + '%41');
    if (!output.q.endsWith('A')) process.exit(2);
  `], { cwd: new URL('../', import.meta.url), timeout: 5000, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
test('xcode continues generating valid unique IDs with the patched uuid dependency', () => {
  const xcode = require('xcode');
  const project = xcode.project('test.pbxproj');
  project.hash = { project: { objects: {} } };
  const ids = new Set(Array.from({ length: 100 }, () => project.generateUuid()));
  assert.equal(ids.size, 100);
  assert.ok([...ids].every(id => /^[A-F0-9]{24}$/.test(id)));
});
