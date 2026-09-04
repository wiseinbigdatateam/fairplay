import type { Certificate } from '@/domain';

/** 과정 진도 100% 완료 시 수료증 발급 가능 */
export function canIssueCertificate(progressPercent: number, alreadyIssued: boolean): boolean {
  return progressPercent >= 100 && !alreadyIssued;
}

export function isCourseCertificateEligible(progressPercent: number): boolean {
  return progressPercent >= 100;
}

export function formatCertificateDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function formatEducationHours(minutes: number): number {
  return Math.max(1, Math.ceil(minutes / 60));
}

export function buildEducationPeriod(completedAt: string): string {
  const end = new Date(completedAt);
  if (Number.isNaN(end.getTime())) return '교육기간 확인';
  const start = new Date(end);
  start.setMonth(start.getMonth() - 3);
  return `${formatCertificateDate(start.toISOString())} — ${formatCertificateDate(end.toISOString())}`;
}

export function sortCertificatesNewestFirst(certs: Certificate[]): Certificate[] {
  return [...certs].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export type CertificateRowStatus = 'issued' | 'eligible' | 'in_progress';

export function getCertificateRowStatus(
  progressPercent: number,
  hasCertificate: boolean,
): CertificateRowStatus {
  if (hasCertificate) return 'issued';
  if (isCourseCertificateEligible(progressPercent)) return 'eligible';
  return 'in_progress';
}

export const CERTIFICATE_STATUS_LABEL: Record<CertificateRowStatus, string> = {
  issued: '발급완료',
  eligible: '발급가능',
  in_progress: '수강중',
};
