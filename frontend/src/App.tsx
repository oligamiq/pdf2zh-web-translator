import { createSignal, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { setCurrentUser, setAuthReady } from './authState';

export default function App(props: { children?: JSX.Element }) {
  const [loading, setLoading] = createSignal(true);

  onMount(() => {
    const isE2EAuthBypassEnabled =
      import.meta.env.MODE === 'e2e' &&
      import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

    if (isE2EAuthBypassEnabled && sessionStorage.getItem('e2e_token')) {
      setCurrentUser({ uid: 'e2e-user', email: sessionStorage.getItem('e2e_user_email') || 'e2e-user@example.com' } as User);
      setAuthReady(true);
      setLoading(false);
      return () => {};
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      setAuthReady(true);
      setLoading(false);
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
