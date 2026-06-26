import { createSignal, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

export default function App(props: { children?: JSX.Element }) {
  const navigate = useNavigate();
  const [, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(() => {
    const isE2EAuthBypassEnabled =
      import.meta.env.MODE === 'e2e' &&
      import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

    if (isE2EAuthBypassEnabled && sessionStorage.getItem('e2e_token')) {
      setUser({ uid: 'e2e-user' } as User);
      setLoading(false);
      const path = window.location.pathname;
      if (path === '/login') navigate('/', { replace: true });
      return () => {};
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      // Basic route guard (public mode enabled)
      const path = window.location.pathname;
      if (u && path === '/login') {
        navigate('/', { replace: true });
      }
    });
    return unsub;
  });

  return (
    <div class="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Show when={!loading()} fallback={<div class="p-8">Loading Auth...</div>}>
        {props.children}
      </Show>
    </div>
  );
}
