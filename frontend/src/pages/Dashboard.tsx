import { createSignal, onMount, Show } from 'solid-js';
import { checkHealth, logout } from '../api';
import { A } from '@solidjs/router';
import JobList from '../components/JobList';
import UploadForm from '../components/UploadForm';
import { loginWithGoogle } from '../firebase';
import { currentUser, authReady } from '../authState';

export default function Dashboard() {
  const [health, setHealth] = createSignal<string>('Checking...');
  const [loginError, setLoginError] = createSignal<string>('');
  const [signingIn, setSigningIn] = createSignal(false);
  const [refreshFlag, setRefreshFlag] = createSignal(0);

  const fetchHealth = async () => {
    try {
      await checkHealth();
      setHealth('Online');
    } catch (e: any) {
      setHealth(`Offline / Error: ${e.message}`);
    }
  };

  onMount(() => {
    fetchHealth();
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
      <div class="header">
        <h1 style="margin: 0;">Dashboard</h1>
        <div>
          <span style="margin-right: 16px; color: var(--text-muted);">API Status: <strong style="color: var(--text);">{health()}</strong></span>
          <Show
            when={authReady()}
            fallback={<span style="opacity: 0.65; font-size: 0.9rem; margin-right: 16px;">Checking sign-in...</span>}
          >
            <Show
              when={currentUser()}
              fallback={
                <>
                  <span style="margin-right: 16px; color: var(--accent); font-weight: bold;">Guest mode</span>
                  <button class="btn" onClick={handleLogin} disabled={signingIn()}>
                    {signingIn() ? 'Signing in...' : 'Sign in with Google'}
                  </button>
                  {loginError() && <div style="color: var(--danger); margin-top: 8px; font-size: 14px;">{loginError()}</div>}
                </>
              }
            >
              {(u) => (
                <>
                  <span style="margin-right: 16px;">{u().email}</span>
                  <A href="/settings/llm" class="btn" style="margin-right: 8px;">Settings</A>
                  <button class="btn btn-danger" onClick={handleLogout}>Sign out</button>
                </>
              )}
            </Show>
          </Show>
        </div>
      </div>
      <UploadForm onUploadSuccess={() => setRefreshFlag(f => f + 1)} />
      <JobList authReady={authReady()} user={currentUser()} refreshFlag={refreshFlag()} />
    </div>
  );
}
