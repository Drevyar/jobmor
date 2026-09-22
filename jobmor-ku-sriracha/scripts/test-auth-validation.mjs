import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateRegistration } from '../src/features/auth/validation.ts';
const valid = { role: 'employer', displayName: 'Employer', email: 'test@example.invalid', phone: '+66 (81) 234-5678', password: 'ValidPass123', confirmPassword: 'ValidPass123', companyName: 'Company', businessCategory: 'other', customCategory: 'Shop', address: 'Sriracha' };
test('registration accepts database-compatible phone and rejects overlong profile fields', () => {
  assert.equal(Object.values(validateRegistration(valid)).filter(Boolean).length, 0);
  for (const [field, size] of [['displayName',160], ['companyName',160], ['customCategory',100], ['address',1000]]) {
    assert.ok(validateRegistration({ ...valid, [field]: 'x'.repeat(size + 1) })[field]);
  }
  assert.equal(validateRegistration({ ...valid, phone: '++12345678' }).phone, 'invalidPhone');
  assert.equal(validateRegistration({ ...valid, role: 'student' }).email, 'kuEmailOnly');
});
