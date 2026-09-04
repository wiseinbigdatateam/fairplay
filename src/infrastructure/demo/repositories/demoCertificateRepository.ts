import type { Certificate, CourseCompletion } from '@/domain';
import type { CertificateRepository } from '@/application/ports';
import { buildEducationPeriod, formatEducationHours } from '@/application/services/certificateRules';
import {
  generateId,
  getDemoCourses,
  getDemoOrganizations,
  getDemoProfiles,
  getDemoState,
  saveDemoState,
} from '@/infrastructure/demo/demoState';

export class DemoCertificateRepository implements CertificateRepository {
  async listCertificates(userId: string): Promise<Certificate[]> {
    return (getDemoState().certificates as Certificate[])
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }

  async getCertificate(certificateId: string): Promise<Certificate | null> {
    return (getDemoState().certificates as Certificate[]).find((c) => c.id === certificateId) ?? null;
  }

  async createDemoCertificatePreview(input: { userId: string; courseId: string }): Promise<Certificate> {
    const state = getDemoState();
    const existing = (state.certificates as Certificate[]).find(
      (c) => c.userId === input.userId && c.courseId === input.courseId,
    );
    if (existing) return existing;

    const profile = getDemoProfiles().find((p) => p.id === input.userId);
    const course = getDemoCourses().find((c) => c.id === input.courseId);
    if (!profile || !course) throw new Error('Certificate preview unavailable');

    const progress = (state.courseProgress as Array<{ userId: string; courseId: string; progressPercent: number; completedAt?: string }>).find(
      (p) => p.userId === input.userId && p.courseId === input.courseId,
    );
    if (!progress || progress.progressPercent < 100) {
      throw new Error('과정을 완료해야 수료증을 발급할 수 있습니다.');
    }

    const org = getDemoOrganizations().find((o) => o.id === profile.organizationId);
    const completedAt = progress.completedAt ?? new Date().toISOString();
    const certificate: Certificate = {
      id: generateId('cert'),
      userId: input.userId,
      courseId: input.courseId,
      organizationId: profile.organizationId,
      learnerName: profile.displayName,
      organizationName: org?.name,
      courseTitle: course.title,
      educationHours: formatEducationHours(course.estimatedMinutes),
      educationPeriod: buildEducationPeriod(completedAt),
      completedAt,
      verificationCode: `FP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      isDemo: true,
    };

    (state.certificates as Certificate[]).push(certificate);

    const completions = state.completions as CourseCompletion[];
    const completionIdx = completions.findIndex(
      (c) => c.userId === input.userId && c.courseId === input.courseId,
    );
    if (completionIdx >= 0) {
      completions[completionIdx] = {
        ...completions[completionIdx],
        certificateId: certificate.id,
        completedAt,
      };
    } else {
      completions.push({
        id: generateId('completion'),
        userId: input.userId,
        courseId: input.courseId,
        completedAt,
        certificateId: certificate.id,
      });
    }

    saveDemoState(state);
    return certificate;
  }

  async verifyCertificate(code: string): Promise<Certificate | null> {
    const normalized = code.trim().toUpperCase();
    const cert = (getDemoState().certificates as Certificate[]).find(
      (c) => c.verificationCode.toUpperCase() === normalized,
    );
    return cert ?? null;
  }
}
