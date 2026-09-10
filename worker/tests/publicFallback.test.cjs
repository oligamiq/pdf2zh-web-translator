const test = require('node:test');
const assert = require('node:assert/strict');
const { publicFallbackConfigError, publicFallbackProviderPlan } = require('../.tmp/public-fallback-test/publicFallback.js');

test('siliconflow_free needs no endpoint, model, or API key', () => {
  assert.equal(publicFallbackConfigError('siliconflow_free', undefined, undefined, false), null);
  assert.deepEqual(publicFallbackProviderPlan('siliconflow_free', undefined, undefined, false), [{
    displayName: 'SiliconFlow Free', providerType: 'siliconflow_free', baseUrl: '', model: '', priority: 1, usesServerApiKey: false,
  }]);
});

test('keyed SiliconFlow is primary and native free engine is fallback', () => {
  const plan = publicFallbackProviderPlan('openai_compatible', 'https://api.siliconflow.cn/v1', 'Qwen/Qwen2.5-7B-Instruct', true);
  assert.equal(plan.length, 2);
  assert.deepEqual(plan.map(p => [p.providerType, p.priority, p.usesServerApiKey]), [
    ['openai_compatible', 1, true],
    ['siliconflow_free', 2, false],
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
