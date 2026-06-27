import { createSignal } from 'solid-js';
import type { User } from 'firebase/auth';

export const [currentUser, setCurrentUser] = createSignal<User | null>(null);
