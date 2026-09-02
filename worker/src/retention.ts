export const RETENTION_EXEMPT_EMAIL = 'nziq53@gmail.com';

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function isRetentionExemptIdentity(email: unknown, emailVerified: unknown): boolean {
  return emailVerified === true && normalizeEmail(email) === RETENTION_EXEMPT_EMAIL;
}

export function retentionDaysForScope(isGuest: boolean, retentionExempt: boolean): number | null {
  if (isGuest) return 1;
  return retentionExempt ? null : 7;
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
