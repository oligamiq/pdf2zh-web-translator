import { createSignal, Show, onMount, onCleanup, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { currentUser, authReady, autoLoginTriggered, setAutoLoginTriggered } from '../authState';
import { loginWithGoogle, logout } from '../firebase';

export default function HeaderAuth() {
  const [loginError, setLoginError] = createSignal<string>('');
  const [signingIn, setSigningIn] = createSignal(false);
  const [signingInStartedAt, setSigningInStartedAt] = createSignal(0);
  const [accountMenuOpen, setAccountMenuOpen] = createSignal(false);
  let accountMenuRef: HTMLDivElement | undefined;

  const LOGIN_TIMEOUT_MS = import.meta.env.MODE === 'e2e' ? 1000 : 30_000;

  const handleLogin = async () => {
    if (signingIn()) return;

    setSigningIn(true);
    setSigningInStartedAt(Date.now());
    setLoginError('');

    let settled = false;

    const timeout = window.setTimeout(() => {
      if (!settled) {
        setSigningIn(false);
        setLoginError('');
      }
    }, LOGIN_TIMEOUT_MS);

    try {
      await loginWithGoogle();
      settled = true;
    } catch (e: any) {
      settled = true;
      const code = e?.code || (e?.message?.match(/\(auth\/([a-z\-]+)\)/)?.[0]?.replace('(', '').replace(')', ''));

      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) {
        setLoginError('');
        return;
      }

      if (code === 'auth/popup-blocked') {
        setLoginError('ログインポップアップがブロックされました。ブラウザ設定を確認してください。');
        return;
      }

      if (code === 'auth/unauthorized-domain') {
        setLoginError('This domain is not authorized for Firebase sign-in.');
        return;
      }

      setLoginError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      window.clearTimeout(timeout);
      setSigningIn(false);
      setAutoLoginTriggered(false);
    }
  };

  onMount(() => {
    if (autoLoginTriggered()) {
      handleLogin();
    }
  });

  const handleLogout = async () => {
    await logout();
  };

  createEffect(() => {
    const resetIfStillSigningIn = () => {
      if (signingIn() && Date.now() - signingInStartedAt() > 1500) {
        setSigningIn(false);
      }
    };

    window.addEventListener('focus', resetIfStillSigningIn);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resetIfStillSigningIn();
      }
    });

    onCleanup(() => {
      window.removeEventListener('focus', resetIfStillSigningIn);
      document.removeEventListener('visibilitychange', resetIfStillSigningIn);
    });
  });

  onMount(() => {
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
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    });
  });

  return (
    <div class="header-auth">
      <Show
        when={authReady()}
        fallback={<span style="opacity: 0.65; font-size: 0.9rem;">Checking sign-in...</span>}
      >
        <Show
          when={currentUser()}
          fallback={
            <div style="position: relative;">
              <button 
                class="btn guest-auth-button" 
                data-testid="guest-auth-button" 
                onClick={handleLogin} 
                disabled={signingIn()}
                aria-busy={signingIn()}
              >
                {signingIn() ? 'ログイン中...' : (
                  <>
                    <span class="guest-auth-chip" style={{ background: "var(--accent)", color: "white" }}>ゲスト</span>
                    <span class="guest-auth-label">ログイン</span>
                  </>
                )}
              </button>
              {loginError() && <div style="position: absolute; top: 100%; right: 0; color: var(--danger); margin-top: 4px; font-size: 14px; white-space: nowrap;">{loginError()}</div>}
            </div>
          }
        >
          {(u) => (
            <div 
              class="account-menu" 
              data-testid="account-menu" 
              ref={accountMenuRef}
              data-no-upload-dnd
              draggable={false}
              onDragStart={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
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
  );
}
