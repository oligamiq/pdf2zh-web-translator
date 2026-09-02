const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isRetentionExemptIdentity,
  isServiceLimitExemptIdentity,
  retentionDaysForScope,
  usageLimitsForScope,
  pdfViewTokenMessage,
  isExpiredAt,
} = require('../.tmp/retention-test/retention.js');

test('only the verified admin email is retention exempt', () => {
  assert.equal(isRetentionExemptIdentity('nziq53@gmail.com', true), true);
  assert.equal(isRetentionExemptIdentity('NZIq53@GMAIL.COM ', true), true);
  assert.equal(isRetentionExemptIdentity('nziq53@gmail.com', false), false);
  assert.equal(isRetentionExemptIdentity('other@example.com', true), false);
});

test('only the verified admin email is service-limit exempt', () => {
  assert.equal(isServiceLimitExemptIdentity('nziq53@gmail.com', true), true);
  assert.equal(isServiceLimitExemptIdentity('NZIq53@GMAIL.COM ', true), true);
  assert.equal(isServiceLimitExemptIdentity('nziq53@gmail.com', false), false);
  assert.equal(isServiceLimitExemptIdentity('other@example.com', true), false);
});

test('ordinary retention stays unchanged', () => {
  assert.equal(retentionDaysForScope(true, false), 1);
  assert.equal(retentionDaysForScope(false, false), 7);
  assert.equal(retentionDaysForScope(false, true), null);
});

test('usage limits are removed only for the exempt authenticated account', () => {
  assert.deepEqual(usageLimitsForScope(true, false), { pdfMaxBytes: 5 * 1024 * 1024, jobsPerDay: 3 });
  assert.deepEqual(usageLimitsForScope(false, false), { pdfMaxBytes: 20 * 1024 * 1024, jobsPerDay: 10 });
  assert.deepEqual(usageLimitsForScope(false, true), { pdfMaxBytes: null, jobsPerDay: null });
  assert.deepEqual(usageLimitsForScope(true, true), { pdfMaxBytes: 5 * 1024 * 1024, jobsPerDay: 3 });
});

test('retention-exempt view tokens do not depend on the old expiry', () => {
  assert.equal(
    pdfViewTokenMessage('job-1', '2026-01-01T00:00:00.000Z', true),
    'pdf-job-retention-exempt:v1:job-1',
  );
  assert.equal(
    pdfViewTokenMessage('job-1', '2026-01-01T00:00:00.000Z', false),
    'pdf-job:v1:job-1:2026-01-01T00:00:00.000Z',
  );
});

test('expiry is bypassed only for retention-exempt access', () => {
  const now = Date.parse('2026-09-02T00:00:00.000Z');
  assert.equal(isExpiredAt('2026-09-01T00:00:00.000Z', false, now), true);
  assert.equal(isExpiredAt('2026-09-01T00:00:00.000Z', true, now), false);
  assert.equal(isExpiredAt('2026-09-03T00:00:00.000Z', false, now), false);
  assert.equal(isExpiredAt(null, false, now), false);
});
