import { createSignal, onMount } from 'solid-js';
import { checkHealth, logout } from '../api';
import { useNavigate, A } from '@solidjs/router';
import JobList from '../components/JobList';
import UploadForm from '../components/UploadForm';

export default function Dashboard() {
  const navigate = useNavigate();
  const [health, setHealth] = createSignal<string>('Checking...');

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

  return (
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Dashboard</h1>
        <div>
          <span style="margin-right: 16px; color: var(--text-muted);">API Status: <strong style="color: var(--text);">{health()}</strong></span>
          <A href="/settings/llm" class="btn" style="margin-right: 8px;">Settings</A>
          <button class="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <UploadForm />
      <JobList />
    </div>
  );
}
