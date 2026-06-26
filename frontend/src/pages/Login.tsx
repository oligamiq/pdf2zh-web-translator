import { loginWithGoogle } from '../firebase';
import { useNavigate } from '@solidjs/router';
import { createSignal } from 'solid-js';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = createSignal("");

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div class="container" style="text-align: center; max-width: 400px; margin-top: 100px;">
      <div class="panel">
        <h1 style="margin-top: 0;">PDF2ZH Web V2</h1>
        <p>Login to access the dashboard.</p>
        {error() && <div style="color: var(--danger); margin-bottom: 16px;">{error()}</div>}
        <button class="btn" onClick={handleLogin}>Login with Google</button>
      </div>
    </div>
  );
}
