import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
export async function logout() {
  await auth.signOut();
}
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized (Firebase login expired or invalid)");
      }
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }
    
    return response;
  } catch (err: any) {
    // Transform fetch failure to connection error
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error("Cannot connect to API");
    }
    throw err;
  }
}

export async function checkHealth() {
  return apiFetch('/healthz').then(r => r.text());
}

export async function getJobs() {
  return apiFetch('/jobs').then(r => r.json());
}

export async function getJob(id: string) {
  return apiFetch(`/jobs/${id}`).then(r => r.json());
}

export async function uploadJob(file: File) {
  const formData = new FormData();
  formData.append('pdf', file);
  // Do NOT set Content-Type header, let browser set it with boundary
  return apiFetch('/jobs', {
    method: 'POST',
    body: formData,
  }).then(r => r.json());
}

export async function getLog(id: string, offset: number) {
  return apiFetch(`/jobs/${id}/log?offset=${offset}&limit=65536`).then(r => r.json());
}

export async function getLlmSettings() {
  return apiFetch('/settings/llm').then(r => r.json());
}

export async function updateLlmSettings(payload: { llm_source?: string, llm_base_url?: string, llm_model?: string, api_key?: string }) {
  return apiFetch('/settings/llm', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function clearLlmApiKey() {
  return apiFetch('/settings/llm', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clear_api_key: true }),
  }).then(r => r.json());
}
