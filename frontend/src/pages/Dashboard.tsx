import { createSignal, onMount, Show } from 'solid-js';
import { checkHealth, logout, isAuthenticated } from '../api';
import { useNavigate, A } from '@solidjs/router';
import JobList from '../components/JobList';
import UploadForm from '../components/UploadForm';
import { auth } from '../firebase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [health, setHealth] = createSignal<string>('Checking...');
  const isGuest = () => !isAuthenticated();

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
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Dashboard</h1>
        <div>
          <span style="margin-right: 16px; color: var(--text-muted);">API Status: <strong style="color: var(--text);">{health()}</strong></span>
          <Show when={isGuest()}>
             <span style="margin-right: 16px; color: var(--accent); font-weight: bold;">Guest mode</span>
             <button class="btn" onClick={handleLogin}>Sign in with Google</button>
          </Show>
          <Show when={!isGuest()}>
             <span style="margin-right: 16px;">{auth.currentUser?.email || (import.meta.env.MODE === 'e2e' && import.meta.env.VITE_E2E_AUTH_BYPASS === 'true' ? sessionStorage.getItem('e2e_user_email') : '')}</span>
             <A href="/settings/llm" class="btn" style="margin-right: 8px;">Settings</A>
             <button class="btn btn-danger" onClick={handleLogout}>Sign out</button>
          </Show>
        </div>
      </div>
      <UploadForm />
      <JobList />
    </div>
  );
}
