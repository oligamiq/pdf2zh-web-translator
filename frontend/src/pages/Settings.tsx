import { createSignal, onMount, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { getLlmSettings, updateLlmSettings, clearLlmApiKey } from '../api';
import { auth } from '../firebase';

export default function Settings() {
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal<{ type: 'success' | 'error', text: string } | null>(null);

  const [llmSource, setLlmSource] = createSignal('openaicompatible');
  const [baseUrl, setBaseUrl] = createSignal('');
  const [model, setModel] = createSignal('');
  const [apiKey, setApiKey] = createSignal('');
  const [hasApiKey, setHasApiKey] = createSignal(false);

  onMount(async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      const data = await getLlmSettings();
      setLlmSource(data.llm_source || 'openaicompatible');
      setBaseUrl(data.llm_base_url || '');
      setModel(data.llm_model || '');
      setHasApiKey(data.has_api_key || false);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to load settings: ' + err.message });
    } finally {
      setLoading(false);
    }
  });

  const handleSave = async (e: Event) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        llm_source: llmSource(),
        llm_base_url: baseUrl(),
        llm_model: model(),
      };
      if (apiKey().trim() !== '') {
        payload.api_key = apiKey().trim();
      }
      
      await updateLlmSettings(payload);
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      if (apiKey().trim() !== '') {
        setHasApiKey(true);
        setApiKey('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClearApiKey = async () => {
    if (!confirm('Are you sure you want to delete the API Key?')) return;
    setSaving(true);
    setMessage(null);
    try {
      await clearLlmApiKey();
      setHasApiKey(false);
      setMessage({ type: 'success', text: 'API Key deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to delete API Key: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="container mx-auto p-4 max-w-2xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">LLM Settings</h1>
        <A href="/" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-100 transition-colors">← Back</A>
      </div>

      <Show when={!loading()} fallback={<div class="p-4 text-gray-400">Loading settings...</div>}>
        <Show when={!auth.currentUser}>
          <div class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <h2 class="text-xl text-blue-400 font-bold mb-2">Settings are available after signing in.</h2>
            <p class="text-gray-300">For guest mode, enter an API key on the upload form for one-time use.</p>
          </div>
        </Show>
        <Show when={auth.currentUser}>
          <div class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
          
          <Show when={message()}>
            <div class={`mb-4 p-3 rounded ${message()?.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'}`}>
              {message()?.text}
            </div>
          </Show>

          <form onSubmit={handleSave} class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">LLM Source</label>
              <input
                type="text"
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                value={llmSource()}
                disabled
              />
              <p class="text-xs text-gray-400 mt-1">Currently fixed to OpenAI Compatible.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Base URL</label>
              <input
                type="text"
                placeholder="https://api.example.com/v1"
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                value={baseUrl()}
                onInput={(e) => setBaseUrl(e.currentTarget.value)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
              <input
                type="text"
                placeholder="gpt-4o"
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                value={model()}
                onInput={(e) => setModel(e.currentTarget.value)}
              />
            </div>

            <div class="pt-2 border-t border-gray-700 mt-4">
              <label class="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                <span>API Key</span>
                <Show when={hasApiKey()}>
                  <span class="text-xs px-2 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-800/50">保存済み</span>
                </Show>
              </label>
              <div class="flex gap-2">
                <input
                  type="password"
                  placeholder={hasApiKey() ? "Enter new API Key to override" : "Enter API Key"}
                  class="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                  value={apiKey()}
                  onInput={(e) => setApiKey(e.currentTarget.value)}
                />
                <Show when={hasApiKey()}>
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    disabled={saving()}
                    class="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 rounded disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    削除
                  </button>
                </Show>
              </div>
              <p class="text-xs text-gray-400 mt-1">Leave empty to keep existing key. Key will be encrypted and stored securely.</p>
            </div>

            <div class="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving()}
                class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded shadow disabled:opacity-50 transition-colors"
              >
                {saving() ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
          </div>
        </Show>
      </Show>
    </div>
  );
}
