import { onMount } from 'solid-js';
import type { JSX } from 'solid-js';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { setCurrentUser, setAuthReady } from './authState';

export default function App(props: { children?: JSX.Element }) {

  onMount(() => {
    const isE2EAuthBypassEnabled =
      import.meta.env.MODE === 'e2e' &&
      import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

    if (isE2EAuthBypassEnabled && sessionStorage.getItem('e2e_token')) {
      setCurrentUser({ uid: 'e2e-user', email: sessionStorage.getItem('e2e_user_email') || 'e2e-user@example.com' } as User);
      setAuthReady(true);
      return () => {};
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      const delay = isE2EAuthBypassEnabled ? sessionStorage.getItem('e2e_delay_auth') : null;
      if (delay) {
        setTimeout(() => {
          setCurrentUser(u);
          setAuthReady(true);
        }, parseInt(delay));
      } else {
        setCurrentUser(u);
        setAuthReady(true);
      }
    });
    return unsub;
  });

  return (
    <div class="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {props.children}
    </div>
  );
}
