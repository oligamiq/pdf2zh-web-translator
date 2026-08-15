import { currentUser, setCurrentUser } from './authState';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

type PublicJobReceipts = Record<string, string>;

function readPublicJobs(): PublicJobReceipts {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem('public_jobs') || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([id, receipt]) => typeof id === 'string' && typeof receipt === 'string')
    ) as PublicJobReceipts;
  } catch {
    localStorage.removeItem('public_jobs');
    return {};
  }
}

function writePublicJobs(publicJobs: PublicJobReceipts) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('public_jobs', JSON.stringify(publicJobs));
  }
}

async function getToken(forceRefresh: boolean = false) {
  const isE2EAuthBypassEnabled =
    import.meta.env.MODE === 'e2e' &&
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

  const e2eToken = isE2EAuthBypassEnabled ? sessionStorage.getItem('e2e_token') : null;
  if (e2eToken) return e2eToken;
  const user = currentUser();
  return user ? await user.getIdToken(forceRefresh) : null;
}

export function isAuthenticated(): boolean {
  const isE2EAuthBypassEnabled =
    import.meta.env.MODE === 'e2e' &&
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

  if (isE2EAuthBypassEnabled && sessionStorage.getItem('e2e_token')) {
    return true;
  }
  return !!currentUser();
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

  const { auth } = await import('./firebase');
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
      let msg = `API Error: ${response.status} - ${errText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && parsed.message) msg = `${parsed.error}: ${parsed.message}`;
        else if (parsed.message) msg = parsed.message;
        else if (parsed.error) msg = parsed.error;
      } catch (e) {}
      throw new Error(msg);
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

export async function checkPcHealth() {
  return apiFetch('/health/pc-api').then(r => r.json());
}

export async function getLimits() {
  return apiFetch('/limits').then(r => r.json());
}

export async function getJobs() {
  const token = await getToken();
  let jobs = [];
  if (token) {
    jobs = await apiFetch('/jobs').then(r => r.json());
  }
  
  // Also fetch public jobs stored in localStorage
  const publicJobs = readPublicJobs();
  
  for (const [id, receipt] of Object.entries(publicJobs)) {
    try {
      const publicJob = await apiFetch(`/public/jobs/${id}?receipt=${encodeURIComponent(receipt)}`).then(r => r.json());
      // Append if not already in the list
      if (!jobs.find((j: any) => j.id === id)) {
        jobs.push(publicJob);
      }
    } catch (e) {
      // Prune missing/expired receipts so every dashboard refresh does not retry them forever.
      delete publicJobs[id];
    }
  }
  writePublicJobs(publicJobs);
  
  // sort by created_at DESC
  jobs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return jobs;
}

export async function getJob(id: string) {
  const publicJobs = readPublicJobs();
  const receipt = publicJobs[id];
  if (receipt) {
    return apiFetch(`/public/jobs/${id}?receipt=${encodeURIComponent(receipt)}`).then(r => r.json());
  }
  return apiFetch(`/jobs/${id}`).then(r => r.json());
}

export async function getJobAttempts(id: string) {
  const publicJobs = readPublicJobs();
  const receipt = publicJobs[id];
  if (receipt) {
    return apiFetch(`/public/jobs/${id}/attempts?receipt=${encodeURIComponent(receipt)}`).then(r => r.json());
  }
  return apiFetch(`/jobs/${id}/attempts`).then(r => r.json());
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
    const publicJobs = readPublicJobs();
    publicJobs[res.id] = res.receipt;
    writePublicJobs(publicJobs);
  }
  
  return res;
}

export async function getLog(id: string, offset: number) {
  const publicJobs = readPublicJobs();
  const receipt = publicJobs[id];
  if (receipt) {
    return apiFetch(`/public/jobs/${id}/log?receipt=${encodeURIComponent(receipt)}&offset=${offset}&limit=65536`).then(r => r.json());
  }
  return apiFetch(`/jobs/${id}/log?offset=${offset}&limit=65536`).then(r => r.json());
}

// Removed getDownloadUrl since downloadJob is used

export async function downloadJob(id: string) {
  const publicJobs = readPublicJobs();
  const receipt = publicJobs[id];
  if (receipt) {
    return apiFetch(`/public/jobs/${id}/download?receipt=${encodeURIComponent(receipt)}`);
  }
  return apiFetch(`/jobs/${id}/download`);
}

export function getPdfUrl(job: any, kind: "translated" | "bilingual", download: boolean = false): string {
  let receipt = job.view_token;
  if (!receipt && job.owner_type === 'public') {
    const publicJobs = readPublicJobs();
    receipt = publicJobs[job.id];
  }
  const domain = BASE_URL || 'https://pdftr.oligami.workers.dev';
  let url = `${domain}/jobs/${job.id}/files/${kind}.pdf?receipt=${receipt || ''}`;
  if (download) {
    url += '&download=1';
  }
  return url;
}

export async function deleteJob(id: string) {
  const publicJobs = readPublicJobs();
  const receipt = publicJobs[id];
  if (receipt) {
    const res = await apiFetch(`/public/jobs/${id}?receipt=${encodeURIComponent(receipt)}`, { method: 'DELETE' }).then(r => r.json());
    delete publicJobs[id];
    writePublicJobs(publicJobs);
    return res;
  }
  return apiFetch(`/jobs/${id}`, { method: 'DELETE' }).then(r => r.json());
}

export interface ApiBasicSettings {
  target_language?: string;
  has_api_key?: boolean;
  api_key_last4?: string | null;
}

type ApiBasicSettingsResponse = {
  default_target_language?: string;
  ollama?: {
    has_api_key?: boolean;
    api_key_last4?: string | null;
  };
};

export async function getApiBasicSettings(): Promise<ApiBasicSettings> {
  const data = await apiFetch('/settings/api/basic').then(r => r.json()) as ApiBasicSettingsResponse;
  return {
    target_language: data.default_target_language,
    has_api_key: Boolean(data.ollama?.has_api_key),
    api_key_last4: data.ollama?.api_key_last4 ?? null,
  };
}

export async function updateApiBasicSettings(payload: { target_language?: string, api_key?: string }) {
  const body: Record<string, unknown> = {};
  if (payload.target_language !== undefined) {
    body.default_target_language = payload.target_language;
  }
  if (payload.api_key !== undefined) {
    if (payload.api_key === '') {
      body.clear_ollama_api_key = true;
    } else {
      body.ollama_api_key = payload.api_key;
    }
  }

  return apiFetch('/settings/api/basic', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

export interface ApiProvider {
  id: string;
  display_name: string;
  provider_name?: string; // legacy fallback
  provider_type?: string;
  base_url?: string;
  model?: string;
  model_name?: string; // legacy fallback
  priority: number;
  enabled: boolean;
  has_api_key?: boolean;
  timeout_seconds?: number;
  reasoning_effort?: string;
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

export async function updateApiProvider(id: string, payload: any) {
  return apiFetch(`/settings/api/providers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function deleteApiProvider(id: string) {
  return apiFetch(`/settings/api/providers/${id}`, {
    method: 'DELETE',
  }).then(r => r.json());
}

export async function testApiProvider(id: string) {
  return apiFetch(`/settings/api/providers/${id}/test`, {
    method: 'POST',
  }).then(r => r.json());
}

export async function reorderApiProviders(payload: { provider_ids: string[] }) {
  return apiFetch('/settings/api/providers/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}
