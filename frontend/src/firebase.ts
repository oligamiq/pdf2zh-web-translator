import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { setCurrentUser } from './authState';

const isE2E = import.meta.env.MODE === 'e2e';

if (!isE2E) {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_FIREBASE_API_KEY is required in production');
  }
  if (apiKey.includes('<Firebase Web API Key>') || apiKey.includes('dummy') || apiKey.includes('placeholder')) {
    throw new Error('VITE_FIREBASE_API_KEY contains a placeholder value');
  }
  if (!apiKey.startsWith('AIza')) {
    throw new Error('VITE_FIREBASE_API_KEY must start with AIza');
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (isE2E ? 'fake-api-key-for-e2e-so-it-doesnt-crash' : ''),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (isE2E ? 'fake.firebaseapp.com' : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (isE2E ? 'fake-project-id' : ''),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (isE2E ? '1:1234567890:web:abcdef' : ''),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const loginWithGoogle = async () => {
  if (import.meta.env.MODE === 'e2e' && import.meta.env.VITE_E2E_AUTH_BYPASS === 'true') {
    if ((window as any).__e2e_simulate_login_hang) {
      return new Promise(() => {}); // hang forever
    }
    
    const simError = (window as any).__e2e_simulate_login_error;
    if (simError) {
      if (typeof simError === 'object' && simError.delayMs) {
        await new Promise(resolve => setTimeout(resolve, simError.delayMs));
        throw { code: simError.code };
      }
      throw { code: typeof simError === 'string' ? simError : simError.code };
    }
    sessionStorage.setItem('e2e_token', 'mock-token');
    sessionStorage.setItem('e2e_user_email', 'e2e-user@example.com');
    setCurrentUser({ uid: 'e2e-user', email: 'e2e-user@example.com' } as User);
    return;
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  setCurrentUser(result.user);
  return result;
};

export const logout = () => {
  return signOut(auth);
};
