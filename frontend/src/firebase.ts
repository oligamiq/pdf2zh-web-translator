import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

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
    sessionStorage.setItem('e2e_token', 'mock-token');
    sessionStorage.setItem('e2e_user_email', 'e2e-user@example.com');
    window.location.reload();
    return;
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logout = () => {
  return signOut(auth);
};
