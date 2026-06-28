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

  const handleClearKey = async () => {
    if (!confirm('デフォルトのOllama APIキーをクリアしてもよろしいですか？')) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateApiBasicSettings({ target_language: targetLanguage(), api_key: "" });
      setMessage({ type: 'success', text: 'API Key cleared successfully.' });
      setHasApiKey(false);
      setApiKey('');
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to clear API Key: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="settings-page">
      <div class="header" style="border-bottom: none; padding-bottom: 0;">
        <h1 style="margin:0; font-size: 1.5rem;">設定</h1>
        <A href="/" class="button button-secondary">← 戻る</A>
      </div>

      <Show when={!loading()} fallback={<div style="color: var(--text-muted); padding-top: 24px;">設定を読み込み中...</div>}>
        <Show when={!currentUser()}>
          <div class="settings-card" style="margin-top: 24px;">
            <h2 class="settings-section-title" style="color: var(--primary);">設定はログイン後に利用可能です。</h2>
            <p class="settings-section-desc">サインインして、翻訳先言語やAPIプロバイダを設定してください。</p>
          </div>
        </Show>
        <Show when={currentUser()}>
          <div class="settings-card" style="margin-top: 24px;">
            <h2 class="settings-section-title">基本API設定</h2>
            <p class="settings-section-desc">通常はOllama APIキーのみ必要です。</p>
            
            <Show when={message()}>
              <div class={`alert ${message()?.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {message()?.text}
              </div>
            </Show>

            <form onSubmit={handleSave} style="margin-top: 24px;">
              <div class="settings-section">
                <div class="form-group">
                  <label class="form-label">翻訳先言語 (デフォルト)</label>
                  <select
                    class="form-select"
                    value={targetLanguage()}
                    onChange={(e) => setTargetLanguage(e.currentTarget.value)}
                  >
                    <option value="ja">日本語</option>
                    <option value="en">英語</option>
                    <option value="zh">中国語</option>
                    <option value="ko">韓国語</option>
                    <option value="fr">フランス語</option>
                    <option value="de">ドイツ語</option>
                    <option value="es">スペイン語</option>
                  </select>
                </div>
              </div>

              <div class="settings-section" style="border-top: 1px solid var(--border); padding-top: 24px;">
                <div class="form-group">
                  <div class="form-label-flex">
                    <label class="form-label" style="margin-bottom:0;">Ollama API Key</label>
                    <Show when={hasApiKey()}>
                      <span class="status-badge status-success" style="background: transparent; border: 1px solid var(--success); color: var(--success);">保存済み</span>
                    </Show>
                  </div>
                  <div style="margin-top: 8px;">
                    <input
                      type="password"
                      placeholder={hasApiKey() ? "新しいAPIキーを入力して上書き" : "••••••••••••••••"}
                      class="form-input"
                      value={apiKey()}
                      onInput={(e) => setApiKey(e.currentTarget.value)}
                    />
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
                <Show when={hasApiKey()}>
                  <button type="button" class="button button-danger" disabled={saving()} onClick={handleClearKey}>
                    クリア
                  </button>
                </Show>
                <button type="submit" class="button button-primary" disabled={saving()}>
                  {saving() ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>

          <div class="settings-card">
            <h2 class="settings-section-title">高度なAPIルーティング</h2>
            <p class="settings-section-desc">Providerは上から順に試行されます。1つが失敗した場合、次の有効なProviderが使用されます。</p>
            <A href="/settings/advanced" class="button button-secondary" style="margin-top: 8px;">高度な設定を開く</A>
          </div>
        </Show>
      </Show>
    </div>
  );
}
