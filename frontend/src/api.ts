import { auth } from './firebase';
import { setCurrentUser } from './authState';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function getToken(forceRefresh: boolean = false) {
  const isE2EAuthBypassEnabled =
    import.meta.env.MODE === 'e2e' &&
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

  const e2eToken = isE2EAuthBypassEnabled ? sessionStorage.getItem('e2e_token') : null;
  if (e2eToken) return e2eToken;
  return auth.currentUser ? await auth.currentUser.getIdToken(forceRefresh) : null;
}

export function isAuthenticated(): boolean {
  const isE2EAuthBypassEnabled =
    import.meta.env.MODE === 'e2e' &&
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

  if (isE2EAuthBypassEnabled && sessionStorage.getItem('e2e_token')) {
    return true;
  }
  return !!auth.currentUser;
}

export async function logout() {
  const isE2EAuthBypassEnabled =
    import.meta.env.MODE === 'e2e' &&
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

  if (isE2EAuthBypassEnabled) {
    sessionStorage.removeItem('e2e_token');
    sessionStorage.removeItem('e2e_user_email');
    setCurrentUser(null);
    return;
  }

  await auth.signOut();
  setCurrentUser(null);
}
export async function apiFetch(endpoint: string, options: RequestInit = {}, forceRefresh: boolean = false, retryCount: number = 0): Promise<Response> {
  const token = await getToken(forceRefresh);
  
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
        if (retryCount === 0 && isAuthenticated()) {
          return await apiFetch(endpoint, options, true, 1);
        }
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
  const token = await getToken();
  let jobs = [];
  if (token) {
    jobs = await apiFetch('/jobs').then(r => r.json());
  }
  
  // Also fetch public jobs stored in localStorage
  const publicJobsStr = localStorage.getItem('public_jobs') || '{}';
  const publicJobs = JSON.parse(publicJobsStr);
  
  for (const [id, receipt] of Object.entries(publicJobs)) {
    try {
      const publicJob = await apiFetch(`/public/jobs/${id}?receipt=${receipt}`).then(r => r.json());
      // Append if not already in the list
      if (!jobs.find((j: any) => j.id === id)) {
        jobs.push(publicJob);
      }
    } catch (e) {
      // Ignore missing or expired public jobs
    }
  }
  
  // sort by created_at DESC
  jobs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return jobs;
}

export async function getJob(id: string) {
  const publicJobsStr = localStorage.getItem('public_jobs') || '{}';
  const publicJobs = JSON.parse(publicJobsStr);
  const receipt = publicJobs[id];
  if (receipt) {
    return apiFetch(`/public/jobs/${id}?receipt=${receipt}`).then(r => r.json());
  }
  return apiFetch(`/jobs/${id}`).then(r => r.json());
}

export async function uploadJob(file: File, targetLanguage: string, turnstileToken?: string, clientId?: string) {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('target_language', targetLanguage);
  if (turnstileToken) formData.append('turnstile', turnstileToken);
  if (clientId) formData.append('client_id', clientId);
  
  const res = await apiFetch('/jobs', {
    method: 'POST',
    body: formData,
  }).then(r => r.json());
  
  if (res.receipt) {
    const publicJobsStr = localStorage.getItem('public_jobs') || '{}';
    const publicJobs = JSON.parse(publicJobsStr);
    publicJobs[res.id] = res.receipt;
    localStorage.setItem('public_jobs', JSON.stringify(publicJobs));
  }
  
  return res;
}

export async function getLog(id: string, offset: number) {
  const publicJobsStr = localStorage.getItem('public_jobs') || '{}';
  const publicJobs = JSON.parse(publicJobsStr);
  const receipt = publicJobs[id];
  if (receipt) {
    return apiFetch(`/public/jobs/${id}/log?receipt=${receipt}&offset=${offset}&limit=65536`).then(r => r.json());
  }
  return apiFetch(`/jobs/${id}/log?offset=${offset}&limit=65536`).then(r => r.json());
}

// Removed getDownloadUrl since downloadJob is used

export async function downloadJob(id: string) {
  const publicJobsStr = localStorage.getItem('public_jobs') || '{}';
  const publicJobs = JSON.parse(publicJobsStr);
  const receipt = publicJobs[id];
  if (receipt) {
    return apiFetch(`/public/jobs/${id}/download?receipt=${receipt}`);
  }
  return apiFetch(`/jobs/${id}/download`);
}

export interface ApiBasicSettings {
  target_language?: string;
  has_api_key?: boolean; // For legacy or general indicator, if needed
}

export async function getApiBasicSettings(): Promise<ApiBasicSettings> {
  return apiFetch('/settings/api/basic').then(r => r.json());
}

export async function updateApiBasicSettings(payload: { target_language?: string, api_key?: string }) {
  return apiFetch('/settings/api/basic', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export interface ApiProvider {
  id: number;
  provider_name: string;
  base_url?: string;
  model_name?: string;
  priority: number;
  enabled: boolean;
  has_api_key?: boolean;
}

export async function getApiProviders(): Promise<ApiProvider[]> {
  return apiFetch('/settings/api/providers').then(r => r.json());
}

export async function addApiProvider(payload: any) {
  return apiFetch('/settings/api/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function updateApiProvider(id: number, payload: any) {
  return apiFetch(`/settings/api/providers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function deleteApiProvider(id: number) {
  return apiFetch(`/settings/api/providers/${id}`, {
    method: 'DELETE',
  }).then(r => r.json());
}

export async function testApiProvider(id: number) {
  return apiFetch(`/settings/api/providers/${id}/test`, {
    method: 'POST',
  }).then(r => r.json());
}

export async function reorderApiProviders(payload: { provider_ids: number[] }) {
  return apiFetch('/settings/api/providers/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}
