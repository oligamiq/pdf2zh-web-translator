import { onMount } from 'solid-js';
import { setCurrentUser, setAuthReady } from '../authState';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AuthInitializer() {
  onMount(() => {
    if (import.meta.env.MODE === 'e2e') return;
    if ((window as any).__firebase_auth_initialized) return;
    (window as any).__firebase_auth_initialized = true;
    onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      setAuthReady(true);
    });
  });
  return null;
}
