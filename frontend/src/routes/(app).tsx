import { onMount, Suspense } from "solid-js";
import { setCurrentUser, setAuthReady } from '../authState';

export default function AppLayout(props: { children: any }) {
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

    const initAuth = () => {
      if ((window as any).__firebase_auth_initialized) return;
      (window as any).__firebase_auth_initialized = true;
      import('../firebase').then(({ auth }) => {
        import('firebase/auth').then(({ onAuthStateChanged }) => {
          onAuthStateChanged(auth, (u) => {
            setCurrentUser(u);
            setAuthReady(true);
          });
        });
      });
    };

    // Check IndexedDB to see if user has a Firebase session
    try {
      const request = indexedDB.open('firebaseLocalStorageDb');
      let existed = true;
      request.onupgradeneeded = () => { existed = false; request.transaction?.abort(); };
      request.onsuccess = () => {
        const db = request.result;
        if (!existed) { db.close(); setCurrentUser(null); setAuthReady(true); return; }
        try {
          const tx = db.transaction('firebaseLocalStorage', 'readonly');
          const store = tx.objectStore('firebaseLocalStorage');
          const countReq = store.count();
          countReq.onsuccess = () => {
            if (countReq.result > 0) initAuth();
            else { setCurrentUser(null); setAuthReady(true); }
            db.close();
          };
          countReq.onerror = () => { initAuth(); db.close(); };
        } catch(e) { initAuth(); db.close(); }
      };
      request.onerror = () => initAuth();
    } catch(e) {
      initAuth();
    }

    const triggerInit = () => {
      initAuth();
      ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(e => document.removeEventListener(e, triggerInit));
    };

    ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(e => {
      document.addEventListener(e, triggerInit, { once: true, passive: true });
    });
    setTimeout(triggerInit, 2000);
  });

  return (
    <>
      {props.children}
    </>
  );
}
