import { createSignal, createEffect, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { getApiBasicSettings, updateApiBasicSettings } from '../api';
import { currentUser } from '../authState';

export default function Settings() {
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal<{ type: 'success' | 'error', text: string } | null>(null);

  const [targetLanguage, setTargetLanguage] = createSignal('ja');
  const [apiKey, setApiKey] = createSignal('');
  const [hasApiKey, setHasApiKey] = createSignal(false);

  createEffect(async () => {
    if (!currentUser()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getApiBasicSettings();
      if (data.target_language) setTargetLanguage(data.target_language);
      if (data.has_api_key) setHasApiKey(data.has_api_key);
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
        target_language: targetLanguage(),
      };
      if (apiKey().trim() !== '') {
        payload.api_key = apiKey().trim();
      }
      
      await updateApiBasicSettings(payload);
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

  return (
    <div class="container mx-auto p-4 max-w-2xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Basic Settings</h1>
        <div class="flex gap-4">
          <A href="/settings/advanced" class="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm text-white transition-colors">Advanced Routing</A>
          <A href="/" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-100 transition-colors">← Back</A>
        </div>
      </div>

      <Show when={!loading()} fallback={<div class="p-4 text-gray-400">Loading settings...</div>}>
        <Show when={!currentUser()}>
          <div class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <h2 class="text-xl text-blue-400 font-bold mb-2">Settings are available after signing in.</h2>
            <p class="text-gray-300">Please sign in to configure default target language and API providers.</p>
          </div>
        </Show>
        <Show when={currentUser()}>
          <div class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
          
          <Show when={message()}>
            <div class={`mb-4 p-3 rounded ${message()?.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'}`}>
              {message()?.text}
            </div>
          </Show>

          <form onSubmit={handleSave} class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Default Target Language</label>
              <select
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                value={targetLanguage()}
                onChange={(e) => setTargetLanguage(e.currentTarget.value)}
              >
                <option value="ja">Japanese</option>
                <option value="en">English</option>
                <option value="zh">Chinese</option>
                <option value="ko">Korean</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div class="pt-2 border-t border-gray-700 mt-4">
              <label class="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                <span>Ollama API Key</span>
                <Show when={hasApiKey()}>
                  <span class="text-xs px-2 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-800/50">Saved</span>
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
              </div>
              <p class="text-xs text-gray-400 mt-1">Sets the API key for your default primary provider. Go to Advanced Routing to configure multiple fallback providers.</p>
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
