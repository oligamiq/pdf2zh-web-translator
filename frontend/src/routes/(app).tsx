import { onMount, Suspense } from "solid-js";
import { setCurrentUser, setAuthReady } from '../authState';

export default function AppLayout(props: { children: any }) {
  onMount(() => {
    const isE2EAuthBypassEnabled = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

    if (isE2EAuthBypassEnabled && sessionStorage.getItem('e2e_token')) {
      const delay = sessionStorage.getItem('e2e_delay_auth');
      if (delay) {
        setTimeout(() => {
          setCurrentUser({ uid: 'e2e-user', email: sessionStorage.getItem('e2e_user_email') || 'e2e-user@example.com' } as any);
          setAuthReady(true);
        }, parseInt(delay));
      } else {
        setCurrentUser({ uid: 'e2e-user', email: sessionStorage.getItem('e2e_user_email') || 'e2e-user@example.com' } as any);
        setAuthReady(true);
      }
      return;
    }

    import('../firebase').then(({ auth }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
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
        // We don't cleanup because this layout stays mounted for the whole app
      });
    });
  });

  return (
    <>
      {props.children}
    </>
  );
}
