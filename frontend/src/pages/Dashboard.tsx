import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { checkHealth, checkPcHealth } from '../api';
import { A } from '@solidjs/router';
import { clientOnly } from '@solidjs/start';
import JobList from '../components/JobList';
import UploadForm from '../components/UploadForm';
import { authReady, currentUser, autoLoginTriggered, setAutoLoginTriggered } from '../authState';

const HeaderAuth = clientOnly(() => import('../components/HeaderAuth'), { lazy: true });

export default function Dashboard() {
  const [health, setHealth] = createSignal<string>('確認中...');
  const [pcHealth, setPcHealth] = createSignal<{ok: boolean, status: string, message?: string} | null>(null);
  const [refreshFlag, setRefreshFlag] = createSignal(0);

  const fetchHealth = async () => {
    try {
      await checkHealth();
      setHealth('オンライン');
    } catch (e: any) {
      setHealth(`オフライン / エラー: ${e.message}`);
    }
  };

  const fetchPcHealth = async () => {
    try {
      const res = await checkPcHealth();
      setPcHealth(res);
    } catch (e: any) {
      setPcHealth({ ok: false, status: 'offline', message: e.message });
    }
  };

  onMount(() => {
    fetchHealth();
    fetchPcHealth();
    const interval = setInterval(fetchPcHealth, 30000);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return (
    <div class="container">
      <header class="app-header">
        <div class="header-main">
          <div class="brand">
            <h1 class="brand-title" style="margin: 0;" data-testid="brand-title">PDF翻訳</h1>
          </div>
          <div class="header-auth">
            <Show when={autoLoginTriggered() || currentUser() !== null} fallback={
              <div style="position: relative;">
                <button class="btn guest-auth-button" data-testid="guest-auth-button" onClick={() => { setAutoLoginTriggered(true); }}>
                  <span class="guest-auth-chip" style={{ background: "var(--primary-hover)", color: "white" }}>ゲスト</span>
                  <span class="guest-auth-label">ログイン</span>
                </button>
              </div>
            }>
              <HeaderAuth />
            </Show>
          </div>
        </div>


      </header>
      
      <p class="site-description" style="margin-top: 0;">
        ゲスト利用とGoogleログインに対応したPDF翻訳Webアプリです。
      </p>

      <div class="status-row">
        <span class="status-badge" style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: rgba(156, 163, 175, 0.2); font-size: 0.75rem;">
          API: <strong style="color: var(--text);">{health() === 'オンライン' ? 'online' : health()}</strong>
        </span>
        <Show when={pcHealth()} fallback={<span class="status-badge fallback" style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: rgba(156, 163, 175, 0.2); color: #9ca3af; font-size: 0.75rem;">server: checking...</span>}>
          {(h) => (
            h().ok ? (
              <span class="status-badge online" style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 0.75rem;">server: online</span>
            ) : (
              <span class="status-badge offline" style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 0.75rem; vertical-align: middle;">
                server: offline
              </span>
            )
          )}
        </Show>
      </div>

      <UploadForm onUploadSuccess={() => setRefreshFlag(f => f + 1)} />
      <JobList authReady={authReady()} user={currentUser()} refreshFlag={refreshFlag()} />
    </div>
  );
}
