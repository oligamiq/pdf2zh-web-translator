const test = require('node:test');
const assert = require('node:assert/strict');
const { publicFallbackConfigError } = require('../.tmp/public-fallback-test/publicFallback.js');

test('siliconflow_free needs no endpoint, model, or API key', () => {
  assert.equal(publicFallbackConfigError('siliconflow_free', undefined, undefined, false), null);
});

test('generic OpenAI-compatible fallback still requires endpoint, model, and API key', () => {
  assert.equal(publicFallbackConfigError('openai_compatible', undefined, undefined, false), 'missing_endpoint_or_model');
  assert.equal(publicFallbackConfigError('openai_compatible', 'https://example.invalid/v1', 'model', false), 'missing_api_key');
  assert.equal(publicFallbackConfigError('openai_compatible', 'https://example.invalid/v1', 'model', true), null);
});

test('missing source is rejected', () => {
  assert.equal(publicFallbackConfigError(undefined, undefined, undefined, false), 'missing_source');
});
