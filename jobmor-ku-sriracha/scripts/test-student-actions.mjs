import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { canWithdraw } from '../src/features/student/validation.ts';

// Node-only component handler tests; browser/native rendering is checked separately.
const source = ts.transpileModule(readFileSync(new URL('../src/features/student/job-card.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function harness(initial, overrides = {}) {
  const cells = []; let cursor = 0; let job = initial;
  const calls = [];
  const service = Object.fromEntries(['applyForJob', 'withdrawApplication', 'setJobSaved'].map(name => [name, async (...args) => {
    calls.push([name, ...args]);
    return overrides[name] ? overrides[name](...args) : name === 'applyForJob' ? { id: 'application', status: 'pending', created_at: '2026-09-21' } : undefined;
  }]));
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => {
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' };
    if (name === 'react') return {
      useState(value) { const index = cursor++; if (!(index in cells)) cells[index] = value; return [cells[index], value => { cells[index] = value; }]; },
      useRef(value) { const index = cursor++; if (!(index in cells)) cells[index] = { current: value }; return cells[index]; },
    };
    if (name === 'expo-router') return { router: {} };
    if (name === 'react-native') return { View: 'View', StyleSheet: { create: value => value } };
    if (name === '@expo/vector-icons/Ionicons') return {};
    if (name === '@/hooks/use-theme') return {};
    if (name.endsWith('/ui')) return { Button: 'Button', Card: 'Card', Copy: 'Copy', DeleteDialog: 'DeleteDialog', Notice: 'Notice', styles: {}, useEmployerText: () => key => key };
    if (name.endsWith('/jobs-screen')) return {};
    if (name.endsWith('/localization-provider')) return { useTranslation: () => ({ t: key => key }) };
    if (name === './student-service') return service;
    if (name === './use-student-data') return { studentErrorKey: () => 'error' };
    if (name === './validation') return { canWithdraw };
    throw new Error(`Unexpected import ${name}`);
  } });
  function render() {
    cursor = 0;
    const tree = exports.StudentJobActions({ job, changed: updated => { job = updated; } });
    const nodes = [];
    function visit(node) { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(visit); nodes.push(node); visit(node.props?.children); }
    visit(tree); return nodes;
  }
  return { calls, get job() { return job; }, render, button: label => render().find(node => node.type === 'Button' && node.props.label === label).props,
    dialog: () => render().find(node => node.type === 'DeleteDialog').props };
}
const initial = { id: 'job', status: 'active', saved: false, application: null };
const settle = () => new Promise(resolve => setImmediate(resolve));
test('cancel withdrawal only dismisses confirmation and sends no request', () => {
  const h = harness({ ...initial, application: { id: 'application', status: 'pending', created_at: '2026-09-21' } });
  h.button('studentFlow.withdraw').onPress();
  assert.equal(h.dialog().visible, true);
  h.dialog().cancel();
  assert.equal(h.dialog().visible, false);
  assert.equal(h.calls.length, 0);
  assert.equal(h.job.application.status, 'pending');
});
test('apply locks double submits then updates state from backend response', async () => {
  let resolve;
  const h = harness(initial, { applyForJob: () => new Promise(done => { resolve = done; }) });
  const button = h.button('studentFlow.apply'); button.onPress(); button.onPress();
  assert.equal(h.calls.length, 1);
  assert.equal(h.button('studentFlow.apply').disabled, true);
  resolve({ id: 'application', status: 'pending', created_at: '2026-09-21' }); await settle();
  assert.equal(h.job.application.status, 'pending');
  assert.ok(!h.render().some(node => node.type === 'Button' && node.props.label === 'studentFlow.apply'));
});
test('withdraw failure remains in modal with error; success removes application', async () => {
  const job = { ...initial, application: { id: 'application', status: 'pending', created_at: '2026-09-21' } };
  const failed = harness(job, { withdrawApplication: async () => { throw new Error('offline'); } });
  failed.button('studentFlow.withdraw').onPress(); failed.dialog().confirm(); await settle();
  assert.equal(failed.dialog().visible, true);
  assert.equal(failed.dialog().errorText, 'studentFlow.error');
  assert.equal(failed.job.application.id, 'application');
  const success = harness(job);
  success.button('studentFlow.withdraw').onPress(); success.dialog().confirm(); await settle();
  assert.equal(success.job.application, null); assert.equal(success.dialog().visible, false);
});
test('save/unsave follows successful response; failure leaves original state', async () => {
  const h = harness(initial);
  h.button('studentFlow.saveJob').onPress(); await settle(); assert.equal(h.job.saved, true);
  h.button('studentFlow.unsave').onPress(); await settle(); assert.equal(h.job.saved, false);
  const failed = harness(initial, { setJobSaved: async () => { throw new Error('offline'); } });
  failed.button('studentFlow.saveJob').onPress(); await settle(); assert.equal(failed.job.saved, false);
  assert.ok(failed.render().some(node => node.type === 'Notice' && node.props.error && node.props.text === 'studentFlow.error'));
});
