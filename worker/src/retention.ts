export const SERVICE_LIMIT_EXEMPT_EMAIL = 'nziq53@gmail.com';
export const RETENTION_EXEMPT_EMAIL = SERVICE_LIMIT_EXEMPT_EMAIL;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function isServiceLimitExemptIdentity(email: unknown, emailVerified: unknown): boolean {
  return emailVerified === true && normalizeEmail(email) === SERVICE_LIMIT_EXEMPT_EMAIL;
}

export function isRetentionExemptIdentity(email: unknown, emailVerified: unknown): boolean {
  return isServiceLimitExemptIdentity(email, emailVerified);
}

export function retentionDaysForScope(isGuest: boolean, retentionExempt: boolean): number | null {
  if (isGuest) return 1;
  return retentionExempt ? null : 7;
}

export function usageLimitsForScope(
  isGuest: boolean,
  serviceLimitExempt: boolean,
): { pdfMaxBytes: number | null; jobsPerDay: number | null } {
  if (!isGuest && serviceLimitExempt) {
    return { pdfMaxBytes: null, jobsPerDay: null };
  }
  return isGuest
    ? { pdfMaxBytes: 5 * 1024 * 1024, jobsPerDay: 3 }
    : { pdfMaxBytes: 20 * 1024 * 1024, jobsPerDay: 10 };
}

export function pdfViewTokenMessage(
  jobId: string,
  downloadExpiresAt: string | null | undefined,
  retentionExempt: boolean,
): string {
  if (retentionExempt) return `pdf-job-retention-exempt:v1:${jobId}`;
  return `pdf-job:v1:${jobId}:${downloadExpiresAt || ''}`;
}

export function isExpiredAt(
  expiresAt: string | null | undefined,
  retentionExempt: boolean,
  nowMs: number = Date.now(),
): boolean {
  if (retentionExempt || !expiresAt) return false;
  const expiryMs = Date.parse(expiresAt);
  return Number.isFinite(expiryMs) && nowMs > expiryMs;
}
