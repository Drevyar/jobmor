import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { validateStudentProfile } from '../src/features/student/validation.ts';

// Exercise the real service with a deterministic transport; SQL tests cover actual RLS.
const source = ts.transpileModule(readFileSync(new URL('../src/features/student/student-service.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup(responses = [], { role = 'student', verification_status = 'verified', user = { id: 'student-a' } } = {}) {
  const calls = [];
  const profile = { data: { role, verification_status }, error: null };
  const queue = [profile, ...responses];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const result = queue.shift();
      assert.ok(result, `Unexpected query to ${table}`);
      const call = { table, steps: [] }; calls.push(call);
      const query = { then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) };
      for (const method of ['select', 'eq', 'order', 'insert', 'delete', 'update', 'single', 'maybeSingle']) {
        query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
      }
      return query;
    },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, require: path => {
    if (path === '@/lib/supabase') return { supabase: client };
    if (path === './validation') return { validateStudentProfile };
    throw new Error(`Unexpected import: ${path}`);
  } });
  return { api: exports, calls };
}
const ok = data => ({ data, error: null });
test('apply uses authenticated user identity and returns backend application', async () => {
  const application = { id: 'application-a', status: 'pending' };
  const { api, calls } = setup([ok(application)]);
  assert.equal(await api.applyForJob('job-a'), application);
  assert.equal(JSON.stringify(calls[1].steps[0]), JSON.stringify(['insert', { job_id: 'job-a', applicant_id: 'student-a' }]));
});
test('duplicate application and transport errors reach UI error handling', async () => {
  const duplicate = setup([{ data: null, error: { code: '23505' } }]);
  await assert.rejects(duplicate.api.applyForJob('job-a'), error => error.key === 'duplicate');
  const failure = { message: 'offline' };
  const failed = setup([{ data: null, error: failure }]);
  await assert.rejects(failed.api.applyForJob('job-a'), error => error === failure);
});
test('withdraw requires own pending application and detects stale decisions', async () => {
  const { api, calls } = setup([ok({ id: 'application-a' })]);
  await api.withdrawApplication('application-a');
  assert.ok(calls[1].steps.some(step => step[0] === 'eq' && step[1] === 'applicant_id' && step[2] === 'student-a'));
  assert.ok(calls[1].steps.some(step => step[0] === 'eq' && step[1] === 'status' && step[2] === 'pending'));
  const stale = setup([ok(null)]);
  await assert.rejects(stale.api.withdrawApplication('application-a'), error => error.key === 'cannotWithdraw');
  const failure = { message: 'offline' };
  const failed = setup([{ data: null, error: failure }]);
  await assert.rejects(failed.api.withdrawApplication('application-a'), error => error === failure);
});
test('saved writes are idempotent and unsave is scoped to current student', async () => {
  await setup([{ data: null, error: { code: '23505' } }]).api.setJobSaved('job-a', true);
  const { api, calls } = setup([ok(null)]);
  await api.setJobSaved('job-a', false);
  assert.ok(calls[1].steps.some(step => step[0] === 'eq' && step[1] === 'student_id' && step[2] === 'student-a'));
  const failure = { code: '42501' };
  await assert.rejects(setup([{ data: null, error: failure }]).api.setJobSaved('job-a', true), error => error === failure);
});
test('collection combines backend application and saved state and retains inaccessible references', async () => {
  const { api } = setup([ok([{ id: 'job-a', status: 'active' }]), ok([{ job_id: 'job-a', status: 'accepted' }]), ok([{ job_id: 'job-a' }, { job_id: 'hidden-job' }])]);
  const data = await api.getStudentCollection();
  assert.equal(data.jobs[0].saved, true);
  assert.equal(data.jobs[0].application.status, 'accepted');
  assert.equal(data.unavailable[0].id, 'hidden-job');
  assert.equal(data.unavailable[0].saved, true);
});
test('collection reports missing schema and saved-job read failures instead of substituting sample jobs', async () => {
  const schemaError = { code: '42P01', message: 'relation does not exist' };
  await assert.rejects(setup([{ data: null, error: schemaError }, ok([]), ok([])]).api.getStudentCollection(), error => error === schemaError);
  const savedError = { code: '42501', message: 'permission denied' };
  await assert.rejects(setup([ok([]), ok([]), { data: null, error: savedError }]).api.getStudentCollection(), error => error === savedError);
});
test('detail rejects inaccessible jobs', async () => {
  await assert.rejects(setup([ok(null)]).api.getStudentJob('hidden-job'), error => error.key === 'jobNotFound');
});
test('detail loads its exact job independently of listing limits', async () => {
  const { api, calls } = setup([ok({ id: 'job-a', title: 'Job' }), ok({ id: 'application-a', status: 'pending' }), ok({ job_id: 'job-a' })]);
  const detail = await api.getStudentJob('job-a');
  assert.equal(detail.id, 'job-a'); assert.equal(detail.saved, true); assert.equal(detail.application.status, 'pending');
  assert.ok(calls[1].steps.some(step => step[0] === 'eq' && step[1] === 'id' && step[2] === 'job-a'));
});
test('profile load returns existing backend values and failed save propagates', async () => {
  const profile = { display_name: 'Student A', phone: '0812345678', email: 'student-a@ku.th' };
  assert.equal(await setup([ok(profile)]).api.getStudentProfile(), profile);
  const failure = { code: '23514' };
  await assert.rejects(setup([{ data: null, error: failure }]).api.updateStudentProfile(profile), error => error === failure);
});
test('profile update trims and allowlists safe fields; validation prevents requests', async () => {
  const { api, calls } = setup([ok({ display_name: 'Name', phone: '123' })]);
  await api.updateStudentProfile({ display_name: ' Name ', phone: ' 123 ', role: 'admin', id: 'student-b' });
  assert.equal(JSON.stringify(calls[1].steps[0]), JSON.stringify(['update', { display_name: 'Name', phone: '123' }]));
  const invalid = setup();
  await assert.rejects(invalid.api.updateStudentProfile({ display_name: ' ', phone: '123' }), error => error.key === 'required');
  assert.equal(invalid.calls.length, 0);
});
test('unauthenticated, employer and suspended accounts cannot mutate student data', async () => {
  for (const options of [{ user: null }, { role: 'employer' }, { verification_status: 'suspended' }]) {
    const { api, calls } = setup([], options);
    await assert.rejects(api.applyForJob('job-a'));
    assert.ok(calls.every(call => call.table === 'profiles'));
  }
});
