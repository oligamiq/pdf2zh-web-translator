import { createSignal, createEffect, Show, For } from 'solid-js';
import { A } from '@solidjs/router';
import { getApiProviders, addApiProvider, updateApiProvider, deleteApiProvider, testApiProvider, reorderApiProviders } from '../api';
import type { ApiProvider } from '../api';
import { currentUser } from '../authState';

export default function AdvancedSettings() {
  const [loading, setLoading] = createSignal(true);
  const [providers, setProviders] = createSignal<ApiProvider[]>([]);
  const [message, setMessage] = createSignal<{ type: 'success' | 'error', text: string } | null>(null);

  const [showForm, setShowForm] = createSignal(false);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  
  // form state
  const [providerName, setProviderName] = createSignal('openaicompatible');
  const [baseUrl, setBaseUrl] = createSignal('');
  const [modelName, setModelName] = createSignal('');
  const [apiKey, setApiKey] = createSignal('');
  const [enabled, setEnabled] = createSignal(true);

  const loadProviders = async () => {
    try {
      const data = await getApiProviders();
      setProviders(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to load providers: ' + err.message });
    }
  };

  createEffect(async () => {
    if (!currentUser()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    await loadProviders();
    setLoading(false);
  });

  const resetForm = () => {
    setProviderName('openaicompatible');
    setBaseUrl('');
    setModelName('');
    setApiKey('');
    setEnabled(true);
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (p: ApiProvider) => {
    setProviderName(p.provider_name);
    setBaseUrl(p.base_url || '');
    setModelName(p.model_name || '');
    setApiKey('');
    setEnabled(p.enabled);
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSaveProvider = async (e: Event) => {
    e.preventDefault();
    try {
      const payload: any = {
        provider_name: providerName(),
        base_url: baseUrl(),
        model_name: modelName(),
        enabled: enabled(),
      };
      if (apiKey().trim() !== '') {
        payload.api_key = apiKey().trim();
      }

      if (editingId() !== null) {
        await updateApiProvider(editingId()!, payload);
        setMessage({ type: 'success', text: 'Provider updated.' });
      } else {
        await addApiProvider(payload);
        setMessage({ type: 'success', text: 'Provider added.' });
      }
      resetForm();
      await loadProviders();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to save provider: ' + err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      await deleteApiProvider(id);
      setMessage({ type: 'success', text: 'Provider deleted.' });
      await loadProviders();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to delete provider: ' + err.message });
    }
  };

  const handleTest = async (id: number) => {
    setMessage({ type: 'success', text: 'Testing connection...' });
    try {
      await testApiProvider(id);
      setMessage({ type: 'success', text: 'Connection test successful!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Test failed: ' + err.message });
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newProviders = [...providers()];
    const temp = newProviders[index];
    newProviders[index] = newProviders[index - 1];
    newProviders[index - 1] = temp;
    setProviders(newProviders);
    await saveOrder(newProviders);
  };

  const handleMoveDown = async (index: number) => {
    if (index === providers().length - 1) return;
    const newProviders = [...providers()];
    const temp = newProviders[index];
    newProviders[index] = newProviders[index + 1];
    newProviders[index + 1] = temp;
    setProviders(newProviders);
    await saveOrder(newProviders);
  };

  const saveOrder = async (orderedProviders: ApiProvider[]) => {
    try {
      await reorderApiProviders({ provider_ids: orderedProviders.map(p => p.id) });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to save order: ' + err.message });
      await loadProviders(); // revert
    }
  };

  return (
    <div class="container mx-auto p-4 max-w-4xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Advanced API Routing</h1>
        <div class="flex gap-4">
          <A href="/settings" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-100 transition-colors">← Back to Basic</A>
        </div>
      </div>

      <Show when={!loading()} fallback={<div class="p-4 text-gray-400">Loading settings...</div>}>
        <Show when={!currentUser()}>
          <div class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <h2 class="text-xl text-blue-400 font-bold mb-2">Settings are available after signing in.</h2>
            <p class="text-gray-300">Please sign in to configure API providers.</p>
          </div>
        </Show>
        <Show when={currentUser()}>
          <Show when={message()}>
            <div class={`mb-4 p-3 rounded ${message()?.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'}`}>
              {message()?.text}
            </div>
          </Show>

          <div class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold">Fallback Providers</h2>
              <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm" onClick={openAddForm}>Add Provider</button>
            </div>
            <p class="text-sm text-gray-400 mb-4">Providers will be attempted in the order listed below. If a translation fails, the system will fall back to the next provider.</p>
            
            <Show when={providers().length === 0}>
              <p class="text-gray-500 py-4">No providers configured.</p>
            </Show>
            
            <div class="space-y-2">
              <For each={providers()}>
                {(p, index) => (
                  <div class="flex items-center justify-between p-4 bg-gray-700 rounded border border-gray-600">
                    <div class="flex items-center gap-4">
                      <div class="flex flex-col gap-1">
                        <button class="text-gray-400 hover:text-white disabled:opacity-30" disabled={index() === 0} onClick={() => handleMoveUp(index())}>▲</button>
                        <button class="text-gray-400 hover:text-white disabled:opacity-30" disabled={index() === providers().length - 1} onClick={() => handleMoveDown(index())}>▼</button>
                      </div>
                      <div>
                        <div class="font-medium text-gray-200">
                          {p.provider_name}
                          <Show when={!p.enabled}>
                            <span class="ml-2 text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded">Disabled</span>
                          </Show>
                        </div>
                        <div class="text-xs text-gray-400 mt-1">
                          {p.base_url || 'Default URL'} • {p.model_name || 'Default Model'} • {p.has_api_key ? 'Key Saved' : 'No Key'}
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-sm rounded" onClick={() => handleTest(p.id)}>Test</button>
                      <button class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-sm rounded" onClick={() => openEditForm(p)}>Edit</button>
                      <button class="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-200 text-sm rounded" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          <Show when={showForm()}>
            <div class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
              <h2 class="text-lg font-semibold mb-4">{editingId() !== null ? 'Edit Provider' : 'Add Provider'}</h2>
              <form onSubmit={handleSaveProvider} class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Provider Name</label>
                  <select
                    class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                    value={providerName()}
                    onChange={(e) => setProviderName(e.currentTarget.value)}
                  >
                    <option value="openaicompatible">OpenAI Compatible (Ollama)</option>
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Base URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://api.openai.com/v1"
                    class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                    value={baseUrl()}
                    onInput={(e) => setBaseUrl(e.currentTarget.value)}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Model Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. gpt-4o"
                    class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                    value={modelName()}
                    onInput={(e) => setModelName(e.currentTarget.value)}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                    <span>API Key</span>
                    <Show when={editingId() !== null}>
                      <span class="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Leave empty to keep existing key</span>
                    </Show>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter API Key"
                    class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                    value={apiKey()}
                    onInput={(e) => setApiKey(e.currentTarget.value)}
                  />
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled-checkbox"
                    checked={enabled()}
                    onChange={(e) => setEnabled(e.currentTarget.checked)}
                  />
                  <label for="enabled-checkbox" class="text-sm font-medium text-gray-300">Enabled</label>
                </div>

                <div class="pt-4 flex justify-end gap-2">
                  <button type="button" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded" onClick={resetForm}>Cancel</button>
                  <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
