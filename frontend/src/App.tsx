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
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      // Basic route guard
      const path = window.location.pathname;
      if (!u && path !== '/login') {
        navigate('/login', { replace: true });
      } else if (u && path === '/login') {
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
