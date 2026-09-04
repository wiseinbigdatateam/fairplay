import type { ReportRepository } from '@/application/ports';
import { getDemoCourses, getDemoOrganizations, getDemoState } from '@/infrastructure/demo/demoState';
import { getOrganizationAnonymousInsights } from '@/application/services/privacyViews';
import type { CourseProgress } from '@/domain';

export class DemoReportRepository implements ReportRepository {
  async getOrganizationReport(orgId: string) {
    const org = getDemoOrganizations().find((o) => o.id === orgId);
    const state = getDemoState();
    const progress = state.courseProgress as CourseProgress[];
    const completed = progress.filter((p) => p.completedAt).length;
    const started = progress.filter((p) => p.progressPercent > 0).length;
    const assigned = (state.assignments as Array<{ organizationId: string }>).filter(
      (a) => a.organizationId === orgId,
    ).length;
    const insights = getOrganizationAnonymousInsights(Math.max(started, 6), {
      valueEngagement: { fairness: 72, respect: 81, courage: 65 },
      completionByCourse: getDemoCourses()
        .slice(0, 5)
        .map((c) => {
          const matched = progress.filter((p) => p.courseId === c.id);
          const rate =
            matched.length === 0
              ? 0
              : Math.round(matched.reduce((s, p) => s + p.progressPercent, 0) / matched.length);
          return { courseTitle: c.title, rate };
        }),
    });

    return {
      organizationName: org?.name ?? '기관',
      period: '2026.03 — 2026.06',
      assigned,
      started,
      completed,
      completionRate: assigned === 0 ? 0 : Math.round((completed / Math.max(assigned, 1)) * 100),
      roleParticipation: { athlete: 12, coach: 3, guardian: 5 },
      courseProgress: getDemoCourses().slice(0, 5).map((c) => {
        const matched = progress.filter((p) => p.courseId === c.id);
        const progressPercent =
          matched.length === 0
            ? 0
            : Math.round(matched.reduce((s, p) => s + p.progressPercent, 0) / matched.length);
        return { courseTitle: c.title, progressPercent };
      }),
      anonymousInsights: insights.suppressed
        ? [insights.message ?? '']
        : ['익명 통계: 존중 관련 학습 참여가 높았습니다.'],
      isDemo: true as const,
    };
  }

  async exportDemoReport(orgId: string) {
    const report = await this.getOrganizationReport(orgId);
    const header = '과정명,진도율(%)\n';
    const rows = report.courseProgress
      .map((r) => `"${r.courseTitle.replace(/"/g, '""')}",${r.progressPercent}`)
      .join('\n');
    return {
      filename: `fairplay-결과보고서-${orgId}.csv`,
      content: `\uFEFF${header}${rows}`,
      mimeType: 'text/csv;charset=utf-8',
    };
  }
}
