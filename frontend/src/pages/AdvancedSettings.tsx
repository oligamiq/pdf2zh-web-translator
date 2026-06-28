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
  const [displayName, setDisplayName] = createSignal('');
  const [providerType, setProviderType] = createSignal('openai_compatible');
  const [baseUrl, setBaseUrl] = createSignal('');
  const [model, setModel] = createSignal('');
  const [apiKey, setApiKey] = createSignal('');
  const [enabled, setEnabled] = createSignal(true);
  const [timeoutSeconds, setTimeoutSeconds] = createSignal<number | string>(500);
  const [reasoningEffort, setReasoningEffort] = createSignal('high');
  
  // provider testing state
  const [testStatuses, setTestStatuses] = createSignal<Record<number, 'Not tested' | 'Testing...' | 'OK' | 'Failed'>>({});

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
    setDisplayName('');
    setProviderType('openai_compatible');
    setBaseUrl('');
    setModel('');
    setApiKey('');
    setEnabled(true);
    setTimeoutSeconds(500);
    setReasoningEffort('high');
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const isOpenAICompatible = (type?: string) => type === 'openaicompatible' || type === 'openai_compatible';

  const openEditForm = (p: ApiProvider) => {
    setDisplayName(p.display_name ?? p.provider_name ?? '');
    setProviderType(isOpenAICompatible(p.provider_type) ? 'openai_compatible' : (p.provider_type || 'openai_compatible'));
    setBaseUrl(p.base_url || '');
    setModel(p.model ?? p.model_name ?? '');
    setApiKey('');
    setEnabled(p.enabled);
    setTimeoutSeconds(p.timeout_seconds ?? 500);
    setReasoningEffort(p.reasoning_effort || 'high');
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSaveProvider = async (e: Event) => {
    e.preventDefault();
    try {
      const payload: any = {
        display_name: displayName() || undefined, // If empty, backend defaults to 'New Provider' or we can leave it
        provider_type: providerType(),
        base_url: baseUrl(),
        model: model(),
        enabled: enabled(),
      };
      if (apiKey().trim() !== '') {
        payload.api_key = apiKey().trim();
      }

      if (isOpenAICompatible(providerType())) {
        payload.timeout_seconds = parseInt(timeoutSeconds() as string) || 500;
        payload.reasoning_effort = reasoningEffort();
      }

      if (providerType() === 'siliconflow_free') {
        payload.base_url = '';
        payload.model = '';
      }
      
      if (providerType() === 'siliconflow_free' && enabled()) {
        const confirmMsg = "SiliconFlow Freeは、PDFデータをPDFMathTranslateメンテナーのサーバーおよびSiliconFlowに送信します。\n\n機密ドキュメントの場合は、Ollamaまたはご自身のAPIキーを使用してください。\n\nこのプロバイダを有効にしてよろしいですか？";
        if (!window.confirm(confirmMsg)) {
          return;
        }
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
    if (!confirm('このプロバイダを削除してもよろしいですか？')) return;
    try {
      await deleteApiProvider(id);
      setMessage({ type: 'success', text: 'Provider deleted.' });
      await loadProviders();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to delete provider: ' + err.message });
    }
  };
  
  const handleToggleEnable = async (p: ApiProvider) => {
    if (!p.enabled && p.provider_type === 'siliconflow_free') {
      const confirmMsg = "SiliconFlow Freeは、PDFデータをPDFMathTranslateメンテナーのサーバーおよびSiliconFlowに送信します。\n\n機密ドキュメントの場合は、Ollamaまたはご自身のAPIキーを使用してください。\n\nこのプロバイダを有効にしてよろしいですか？";
      if (!window.confirm(confirmMsg)) return;
    }
    try {
      await updateApiProvider(p.id, { enabled: !p.enabled });
      await loadProviders();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to update provider status: ' + err.message });
    }
  };

  const handleTest = async (id: number) => {
    setTestStatuses(prev => ({ ...prev, [id]: 'Testing...' }));
    try {
      await testApiProvider(id);
      setTestStatuses(prev => ({ ...prev, [id]: 'OK' }));
    } catch (err: any) {
      setTestStatuses(prev => ({ ...prev, [id]: 'Failed' }));
      let msg = err.message;
      const match = msg.match(/^API Error: \d{3} - (.*)/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.message) msg = parsed.message;
          else if (parsed.error) msg = parsed.error;
        } catch(e) {
          msg = match[1];
        }
      }
      setMessage({ type: 'error', text: 'Test failed: ' + msg });
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
    <div class="settings-page" style="max-width: 900px;">
      <div class="header" style="border-bottom: none; padding-bottom: 0;">
        <h1 style="margin:0; font-size: 1.5rem;">高度なAPIルーティング</h1>
        <div style="display: flex; gap: 12px;">
          <A href="/settings" class="button button-secondary">← 基本設定へ戻る</A>
        </div>
      </div>

      <Show when={!loading()} fallback={<div style="color: var(--text-muted); padding-top: 24px;">設定を読み込み中...</div>}>
        <Show when={!currentUser()}>
          <div class="settings-card" style="margin-top: 24px;">
            <h2 class="settings-section-title" style="color: var(--primary);">サインインが必要です</h2>
            <p class="settings-section-desc">APIプロバイダを設定するにはサインインしてください。</p>
          </div>
        </Show>
        <Show when={currentUser()}>
          <Show when={message()}>
            <div data-testid="settings-message" class={`alert ${message()?.type === 'success' ? 'alert-success' : 'alert-error'}`} style="margin-top: 24px;">
              {message()?.text}
            </div>
          </Show>

          <div class="settings-card" style="margin-top: 24px; padding: 24px;">
            <div class="flex-center-between" style="margin-bottom: 8px;">
              <h2 class="settings-section-title" style="margin-bottom: 0;">フォールバックプロバイダ</h2>
              <button class="button button-primary" data-testid="add-provider-button" onClick={openAddForm}>+ Providerを追加</button>
            </div>
            <p class="settings-section-desc">Providerは上から順に試行されます。1つが失敗した場合、次の有効なProviderが使用されます。</p>
            
            <Show when={providers().length === 0}>
              <div style="padding: 32px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted); margin-top: 24px;">
                設定されたProviderはありません。
              </div>
            </Show>
            
            <div class="provider-list">
              <For each={providers()}>
                {(p, index) => {
                  const testStatus = testStatuses()[p.id] || 'Not tested';
                  const dispName = p.display_name ?? p.provider_name ?? "名前なし";
                  return (
                    <div class="provider-card">
                      <div class="provider-card-left">
                        <div class="provider-order">
                          <button class="button-icon" disabled={index() === 0} onClick={() => handleMoveUp(index())} title="上へ">▲</button>
                          <div style="text-align: center; font-size: 0.875rem; color: var(--text-muted); font-weight: bold;">{index() + 1}</div>
                          <button class="button-icon" disabled={index() === providers().length - 1} onClick={() => handleMoveDown(index())} title="下へ">▼</button>
                        </div>
                        <div class="provider-info">
                          <div class="provider-header">
                            {dispName}
                            <Show when={!p.enabled}>
                              <span class="status-badge status-disabled">無効</span>
                            </Show>
                            <Show when={p.enabled && index() === 0}>
                              <span class="status-badge status-success" style="background: transparent; border: 1px solid var(--primary); color: var(--primary);">プライマリ</span>
                            </Show>
                          </div>
                          <div class="provider-meta" style="margin-top: 12px; display: flex; flex-direction: column; gap: 4px;">
                            <Show when={p.provider_type !== 'siliconflow_free'}>
                              <div class="provider-meta-row">
                                <span class="provider-meta-label">Base URL:</span> 
                                <span style="color: var(--text);">{p.base_url}</span>
                              </div>
                              <div class="provider-meta-row">
                                <span class="provider-meta-label">Model:</span> 
                                <span style="color: var(--text);">{p.model ?? p.model_name}</span>
                              </div>
                              <div class="provider-meta-row">
                                <span class="provider-meta-label">API Key:</span> 
                                <span style="color: var(--text);">{p.has_api_key ? '保存済み' : '未設定'}</span>
                              </div>
                            </Show>
                            <Show when={p.provider_type === 'siliconflow_free'}>
                              <div class="provider-meta-row">
                                <span class="provider-meta-label">API Key:</span> 
                                <span style="color: var(--text);">APIキー不要</span>
                              </div>
                              <div class="provider-meta-row">
                                <span class="provider-meta-label">Info:</span> 
                                <span style="color: var(--text);">無料サービス</span>
                              </div>
                            </Show>
                            <div class="provider-meta-row" style="margin-top: 4px;">
                              <span class="provider-meta-label" style="align-self: center;">ステータス:</span> 
                              <span class={
                                testStatus === 'OK' ? 'status-badge status-success' : 
                                testStatus === 'Failed' ? 'status-badge status-danger' : 
                                testStatus === 'Testing...' ? 'status-badge status-warning' : 
                                'status-badge status-disabled'
                              }>
                                {testStatus === 'Not tested' ? '未テスト' : testStatus === 'Testing...' ? 'テスト中...' : testStatus === 'OK' ? 'OK' : '失敗'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="provider-actions">
                        <button class="button button-secondary" data-testid="provider-test-button" onClick={() => handleTest(p.id)} disabled={testStatus === 'Testing...'} title="Test connection">テスト</button>
                        <button class="button button-secondary" onClick={() => openEditForm(p)} title="Edit provider">編集</button>
                        <button class="button button-secondary" onClick={() => handleToggleEnable(p)} title={p.enabled ? "Disable this provider" : "Enable this provider"}>{p.enabled ? '無効化' : '有効化'}</button>
                        <button class="button button-danger" onClick={() => handleDelete(p.id)} title="Delete provider">削除</button>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          <Show when={showForm()}>
            <div class="modal-backdrop">
              <div class="modal-content">
                <div class="modal-header">
                  <h2>{editingId() !== null ? 'Providerを編集' : 'Providerを追加'}</h2>
                </div>
                <div class="modal-body">
                  <form id="provider-form" onSubmit={handleSaveProvider}>
                    <div class="form-group">
                      <label class="form-label">プリセット (Providerタイプ)</label>
                      <select
                        class="form-select"
                        value={providerType()}
                        onChange={(e) => setProviderType(e.currentTarget.value)}
                      >
                        <option value="openai_compatible">OpenAI Compatible (Ollama / OpenRouter)</option>
                        <option value="openai">OpenAI</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="siliconflow_free">SiliconFlow Free</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">表示名 (任意)</label>
                      <input
                        type="text"
                        placeholder="例: Ollama Backup"
                        class="form-input"
                        value={displayName()}
                        onInput={(e) => setDisplayName(e.currentTarget.value)}
                      />
                    </div>

                    <Show when={providerType() !== 'siliconflow_free'} fallback={<div class="alert alert-warning" style="margin-top: 16px;">この無料サービスではAPIキー、Base URL、Modelの入力は不要です。</div>}>
                      <div class="form-group">
                        <label class="form-label">Base URL</label>
                        <input
                          type="text"
                          placeholder="例: https://api.openai.com/v1"
                          class="form-input"
                          value={baseUrl()}
                          onInput={(e) => setBaseUrl(e.currentTarget.value)}
                        />
                      </div>

                      <div class="form-group">
                        <label class="form-label">Model</label>
                        <input
                          type="text"
                          placeholder="例: gpt-4o"
                          class="form-input"
                          value={model()}
                          onInput={(e) => setModel(e.currentTarget.value)}
                        />
                      </div>

                      <div class="form-group">
                        <div class="form-label-flex">
                          <label class="form-label" style="margin:0;">API Key</label>
                          <Show when={editingId() !== null && providers().find(p => p.id === editingId())?.has_api_key}>
                            <span class="status-badge status-success" style="background: transparent; border: 1px solid var(--success); color: var(--success);">保存済み</span>
                          </Show>
                        </div>
                        <input
                          type="password"
                          placeholder={editingId() !== null ? "空のままなら既存キーを保持" : "APIキーを入力"}
                          class="form-input"
                          style="margin-top: 8px;"
                          value={apiKey()}
                          onInput={(e) => setApiKey(e.currentTarget.value)}
                        />
                      </div>
                      <Show when={isOpenAICompatible(providerType())}>
                        <div class="form-group" style="margin-top: 20px;">
                          <label class="form-label">タイムアウト(秒)</label>
                          <input
                            type="number"
                            class="form-input"
                            value={timeoutSeconds()}
                            onInput={(e) => setTimeoutSeconds(e.currentTarget.value)}
                          />
                        </div>

                        <div class="form-group">
                          <label class="form-label">推論の強さ (Reasoning effort)</label>
                          <select
                            class="form-select"
                            value={reasoningEffort()}
                            onChange={(e) => setReasoningEffort(e.currentTarget.value)}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </Show>
                    </Show>

                    <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 24px; margin-bottom: 0;">
                      <input
                        type="checkbox"
                        id="enabled-checkbox"
                        checked={enabled()}
                        onChange={(e) => setEnabled(e.currentTarget.checked)}
                        style="width: 16px; height: 16px; accent-color: var(--primary);"
                      />
                      <label for="enabled-checkbox" style="color: var(--text); font-weight: 500; cursor: pointer;">有効化</label>
                    </div>
                  </form>
                </div>
                <div class="modal-footer">
                  <button type="button" class="button button-secondary" onClick={resetForm}>キャンセル</button>
                  <button type="submit" form="provider-form" class="button button-primary">保存</button>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
