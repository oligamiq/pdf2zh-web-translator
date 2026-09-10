const test = require('node:test');
const assert = require('node:assert/strict');
const { publicFallbackConfigError, publicFallbackProviderPlan } = require('../.tmp/public-fallback-test/publicFallback.js');

test('siliconflow_free needs no endpoint, model, or API key', () => {
  assert.equal(publicFallbackConfigError('siliconflow_free', undefined, undefined, false), null);
  assert.deepEqual(publicFallbackProviderPlan('siliconflow_free', undefined, undefined, 0), [{
    displayName: 'SiliconFlow Free', providerType: 'siliconflow_free', baseUrl: '', model: '', priority: 1, usesServerApiKey: false, serverApiKeyIndex: null,
  }]);
});

test('two Ollama Cloud credentials are tried before native free fallback', () => {
  const plan = publicFallbackProviderPlan('openai_compatible', 'https://ollama.com/v1', 'gemma4:31b-cloud', 2);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.map(p => [p.providerType, p.priority, p.usesServerApiKey, p.serverApiKeyIndex]), [
    ['openai_compatible', 1, true, 0],
    ['openai_compatible', 2, true, 1],
    ['siliconflow_free', 3, false, null],
  ]);
});

test('generic OpenAI-compatible primary still requires endpoint, model, and API key', () => {
  assert.equal(publicFallbackConfigError('openai_compatible', undefined, undefined, false), 'missing_endpoint_or_model');
  assert.equal(publicFallbackConfigError('openai_compatible', 'https://example.invalid/v1', 'model', false), 'missing_api_key');
  assert.equal(publicFallbackConfigError('openai_compatible', 'https://example.invalid/v1', 'model', true), null);
});

test('missing source is rejected', () => {
  assert.equal(publicFallbackConfigError(undefined, undefined, undefined, false), 'missing_source');
});
