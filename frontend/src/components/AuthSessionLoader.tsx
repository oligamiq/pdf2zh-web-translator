import { createSignal, onMount, Show } from 'solid-js';
import { clientOnly } from '@solidjs/start';
import { autoLoginTriggered, setAuthReady, setCurrentUser } from '../authState';

const AuthInitializer = clientOnly(() => import('./AuthInitializer'), { lazy: true });

export default function AuthSessionLoader() {
  const [shouldLoad, setShouldLoad] = createSignal(false);

  onMount(() => {
    const isE2EAuthBypassEnabled = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

    if (isE2EAuthBypassEnabled) {
      const delay = sessionStorage.getItem('e2e_delay_auth');
      const token = sessionStorage.getItem('e2e_token');
      const applyE2E = () => {
        if (token) {
          setCurrentUser({ uid: 'e2e-user', email: sessionStorage.getItem('e2e_user_email') || 'e2e-user@example.com' } as any);
        } else {
          setCurrentUser(null);
        }
        setAuthReady(true);
      };

      if (delay) {
        setTimeout(applyE2E, parseInt(delay));
      } else {
        applyE2E();
      }
      return;
    }

    try {
      const request = indexedDB.open('firebaseLocalStorageDb');
      let existed = true;
      request.onupgradeneeded = () => {
        existed = false;
        request.transaction?.abort();
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!existed) {
          db.close();
          setCurrentUser(null);
          setAuthReady(true);
          return;
        }
        try {
          const tx = db.transaction('firebaseLocalStorage', 'readonly');
          const store = tx.objectStore('firebaseLocalStorage');
          const countReq = store.count();
          countReq.onsuccess = () => {
            if (countReq.result > 0) {
              setShouldLoad(true);
            } else {
              setCurrentUser(null);
              setAuthReady(true);
            }
            db.close();
          };
          countReq.onerror = () => {
            setShouldLoad(true);
            db.close();
          };
        } catch(e) {
          setCurrentUser(null);
          setAuthReady(true);
          db.close();
        }
      };
      request.onerror = (e) => {
        // If aborted because it didn't exist, we don't need to load Firebase
        if (!existed && request.error?.name === 'AbortError') {
          setCurrentUser(null);
          setAuthReady(true);
        } else {
          setShouldLoad(true);
        }
      };
    } catch(e) {
      // IndexedDB completely unavailable (e.g., incognito) - better to load to be safe
      setShouldLoad(true);
    }
  });

  return (
    <Show when={shouldLoad() || autoLoginTriggered()}>
      <AuthInitializer />
    </Show>
  );
}
