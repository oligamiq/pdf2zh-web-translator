import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { checkHealth, checkPcHealth, logout } from '../api';
import { A } from '@solidjs/router';
import JobList from '../components/JobList';
import UploadForm from '../components/UploadForm';
import { loginWithGoogle } from '../firebase';
import { currentUser, authReady } from '../authState';

export default function Dashboard() {
  const [health, setHealth] = createSignal<string>('確認中...');
  const [pcHealth, setPcHealth] = createSignal<{ok: boolean, status: string, message?: string} | null>(null);
  const [loginError, setLoginError] = createSignal<string>('');
  const [signingIn, setSigningIn] = createSignal(false);
  const [refreshFlag, setRefreshFlag] = createSignal(0);
  const [accountMenuOpen, setAccountMenuOpen] = createSignal(false);
  let accountMenuRef: HTMLDivElement | undefined;

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

    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuOpen() && accountMenuRef && !accountMenuRef.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    onCleanup(() => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    });
  });

  const handleLogout = async () => {
    await logout();
    // After logout, user stays on Dashboard in Guest mode
  };

  const handleLogin = async () => {
    if (signingIn()) return;

    setSigningIn(true);
    setLoginError('');

    try {
      await loginWithGoogle();
      // Auth state will automatically update via App.tsx onAuthStateChanged
    } catch (e: any) {
      const code = e?.code;

      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) {
        return;
      }

      if (code === 'auth/popup-blocked') {
        setLoginError('Popup was blocked. Please allow popups and try again.');
        return;
      }

      if (code === 'auth/unauthorized-domain') {
        setLoginError('This domain is not authorized for Firebase sign-in.');
        return;
      }

      setLoginError('Failed to sign in with Google. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div class="container">
      <header class="app-header">
        <div class="header-main">
          <div class="brand">
            <h1 class="brand-title" style="margin: 0;" data-testid="brand-title">PDF翻訳</h1>
          </div>

          <div class="header-auth">
            <Show
              when={authReady()}
              fallback={<span style="opacity: 0.65; font-size: 0.9rem;">Checking sign-in...</span>}
            >
              <Show
                when={currentUser()}
                fallback={
                  <div style="position: relative;">
                    <button class="btn guest-auth-button" data-testid="guest-auth-button" onClick={handleLogin} disabled={signingIn()}>
                      <span class="guest-auth-chip" style={{ background: "var(--accent)", color: "white" }}>ゲスト</span>
                      <span class="guest-auth-label">{signingIn() ? 'ログイン中...' : 'Googleログイン'}</span>
                    </button>
                    {loginError() && <div style="position: absolute; top: 100%; right: 0; color: var(--danger); margin-top: 4px; font-size: 14px; white-space: nowrap;">{loginError()}</div>}
                  </div>
                }
              >
                {(u) => (
                  <div class="account-menu" data-testid="account-menu" ref={accountMenuRef}>
                    <button
                      class="btn account-icon-button"
                      type="button"
                      data-testid="account-menu-button"
                      aria-label="アカウントメニュー"
                      aria-haspopup="menu"
                      aria-expanded={accountMenuOpen()}
                      title="アカウント"
                      onClick={() => setAccountMenuOpen(!accountMenuOpen())}
                    >
                      <span class="account-avatar" aria-hidden="true">
                        <Show
                          when={u().photoURL}
                          fallback={<span class="account-avatar-fallback">{(u().email?.[0] ?? "A").toUpperCase()}</span>}
                        >
                          <img src={u().photoURL!} alt="" class="account-avatar-img" />
                        </Show>
                      </span>
                    </button>

                    <Show when={accountMenuOpen()}>
                      <div class="account-menu-popover" role="menu">
                        <div class="account-menu-email" title={u().email ?? undefined}>
                          {u().email ?? "Signed in"}
                        </div>

                        <A href="/settings" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          設定
                        </A>

                        <A href="/about" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          利用制限と注意事項
                        </A>

                        <A href="/licenses" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          ライセンス
                        </A>

                        <button class="btn btn-danger signout-btn" onClick={handleLogout} role="menuitem">
                          ログアウト
                        </button>
                      </div>
                    </Show>
                  </div>
                )}
              </Show>
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
