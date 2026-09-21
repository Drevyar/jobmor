import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyJob, validateJob, validateProfile } from '../src/features/employer/validation.ts';

const validJob = {
  ...emptyJob, title: 'Event assistant', description: 'Help with event registration',
  wage: '500.50', location: 'Sriracha', category: 'events', working_date: '2028-02-29',
  shift: '09:00-17:00', contact_information: '0812345678',
};
test('valid job and leap day are accepted', () => assert.equal(validateJob(validJob), null));
test('empty and whitespace-only required fields are rejected', () => {
  assert.equal(validateJob(emptyJob), 'required');
  assert.equal(validateJob({ ...validJob, title: '   ' }), 'required');
});
test('invalid dates cannot silently roll into the next month', () => {
  for (const working_date of ['2027-02-29', '2026-04-31', '2026-13-01', '0000-01-01', '1/1/2026', '']) {
    assert.equal(validateJob({ ...validJob, working_date }), 'invalidDate');
  }
});
test('wage must fit the numeric database contract', () => {
  for (const wage of ['0', '-1', 'NaN', 'Infinity', '1e3', '10.123', '100000000']) {
    assert.equal(validateJob({ ...validJob, wage }), 'invalidWage');
  }
});
test('workers must be a bounded positive integer', () => {
  for (const workers_required of ['0', '-1', '1.5', '10001', 'abc']) {
    assert.equal(validateJob({ ...validJob, workers_required }), 'invalidWorkers');
  }
});
test('job status and wage unit are validated', () => {
  assert.equal(validateJob({ ...validJob, status: 'unknown' }), 'required');
  assert.equal(validateJob({ ...validJob, wage_type: 'unknown' }), 'required');
});
test('profile validates all required fields and phone', () => {
  const profile = { company: 'Company', contact_name: 'Contact', contact_phone: '0812345678', category: 'events', company_address: 'Sriracha' };
  assert.equal(validateProfile(profile), null);
  assert.equal(validateProfile({ ...profile, company: ' ' }), 'required');
  assert.equal(validateProfile({ ...profile, contact_phone: 'invalid' }), 'invalidPhone');
});
