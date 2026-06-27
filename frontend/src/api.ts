import { auth } from './firebase';
import { setCurrentUser } from './authState';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function getToken() {
  const isE2EAuthBypassEnabled =
    import.meta.env.MODE === 'e2e' &&
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

  const e2eToken = isE2EAuthBypassEnabled ? sessionStorage.getItem('e2e_token') : null;
  if (e2eToken) return e2eToken;
  return auth.currentUser ? await auth.currentUser.getIdToken() : null;
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

export async function uploadJob(file: File, turnstileToken?: string, apiKey?: string, clientId?: string) {
  const formData = new FormData();
  formData.append('pdf', file);
  if (turnstileToken) formData.append('turnstile', turnstileToken);
  if (apiKey) formData.append('api_key', apiKey);
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
