import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canWithdraw, filterJobs, validateStudentProfile } from '../src/features/student/validation.ts';

test('profile follows database nonblank and length constraints', () => {
  assert.equal(validateStudentProfile({ display_name: 'นิสิต', phone: '0812345678' }), null);
  assert.equal(validateStudentProfile({ display_name: ' ', phone: '0812345678' }), 'required');
  assert.equal(validateStudentProfile({ display_name: 'นิสิต', phone: '\t' }), 'required');
  assert.equal(validateStudentProfile({ display_name: 'A'.repeat(160), phone: '+66 (81) 234-5678' }), null);
  assert.equal(validateStudentProfile({ display_name: 'A'.repeat(161), phone: '0812345678' }), 'profileTooLong');
  assert.equal(validateStudentProfile({ display_name: 'Student', phone: '1'.repeat(21) }), 'profileTooLong');
});
test('only pending applications can be withdrawn', () => {
  assert.equal(canWithdraw('pending'), true);
  for (const status of ['accepted', 'rejected', undefined, 'unknown']) assert.equal(canWithdraw(status), false);
});
const job = { title: 'Event Assistant', description: 'Registration desk', category: 'events', location: 'Sriracha', shift: '09:00-17:00', working_date: '2026-12-01', wage: 500 };
const empty = { search: '', category: '', date: '', area: '', time: '', wage: '' };
test('search and filters use real job fields and combine without mutating jobs', () => {
  const jobs = [job];
  assert.deepEqual(filterJobs(jobs, empty), jobs);
  assert.deepEqual(filterJobs(jobs, { ...empty, search: '  EVENT ', area: 'sri', date: '2026-12', time: '09:', wage: '500', category: 'events' }), jobs);
  for (const filter of [{ search: 'retail' }, { wage: '501' }, { category: 'retail' }, { date: '2027' }, { time: '18:' }, { area: 'Bangkok' }]) {
    assert.deepEqual(filterJobs(jobs, { ...empty, ...filter }), []);
  }
  assert.deepEqual(jobs, [job]);
});
