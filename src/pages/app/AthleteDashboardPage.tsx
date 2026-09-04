import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { buildAthleteDashboard } from '@/application/services/privacyViews';
import { LoadingState, PageHeader, StatGrid } from '@/components/ui/PageStates';
import type { Course } from '@/domain';

export function AthleteDashboardPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const [view, setView] = useState<Awaited<ReturnType<typeof buildDashboard>> | null>(null);

  async function buildDashboard() {
    if (!user) return null;
    const assigned = await deps.courseRepository.listAssignedCourses(user.id);
    const progressList = await Promise.all(
      assigned.map(async (c) => ({
        course: c,
        progress: await deps.learningRepository.getCourseProgress(user.id, c.id),
      })),
    );
    const commitments = await deps.learningRepository.getCommitments(user.id);
    const certificates = await deps.certificateRepository.listCertificates(user.id);
    const recommended = await deps.courseRepository.listRecommendedCourses(user.id);

    let continueLearning: { courseId: string; courseTitle: string; lessonId: string; lessonTitle: string } | undefined;
    for (const { course, progress } of progressList) {
      if (progress && progress.progressPercent > 0 && progress.progressPercent < 100) {
        const lessonId = course.modules[0]?.lessonIds[0];
        if (lessonId) {
          const lesson = await deps.courseRepository.getLesson(lessonId);
          continueLearning = {
            courseId: course.id,
            courseTitle: course.title,
            lessonId,
            lessonTitle: lesson?.title ?? '1차시',
          };
          break;
        }
      }
    }

    return buildAthleteDashboard({
      profile: user,
      courseProgress: progressList.map((p) => p.progress).filter(Boolean) as never[],
      commitments,
      assigned: progressList.map(({ course, progress }) => ({
        id: course.id,
        title: course.title,
        progressPercent: progress?.progressPercent ?? 0,
        dueDate: '2026-06-30',
        lessonId: course.modules[0]?.lessonIds[0],
      })),
      certificates: certificates.map((c) => ({
        id: c.id,
        courseTitle: c.courseTitle,
        completedAt: c.completedAt,
      })),
      recommended: recommended.map((c: Course) => ({ id: c.id, title: c.title })),
      continueLearning,
    });
  }

  useEffect(() => {
    buildDashboard().then(setView);
  }, [user]);

  if (!view) return <LoadingState />;

  return (
    <div>
      <PageHeader title={view.greeting} />
      {view.continueLearning && (
        <section className="panel highlight-panel">
          <h2>이어서 학습하기</h2>
          <p>{view.continueLearning.courseTitle} — {view.continueLearning.lessonTitle}</p>
          <Link
            to={`/app/learn/${view.continueLearning.courseId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            이어서 학습
          </Link>
        </section>
      )}
      <StatGrid
        items={[
          { label: '배정 교육', value: view.assignedCourses.length },
          { label: '수료증', value: view.certificates.length },
          { label: '과제제출', value: view.recentCommitments.length },
        ]}
      />
      <section className="panel">
        <h2>기관 배정 필수교육</h2>
        <ul className="item-list">
          {view.assignedCourses.map((c) => (
            <li key={c.id}>
              <Link
                to={`/app/learn/${c.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.title}
              </Link>
              <span>{c.progressPercent}%</span>
            </li>
          ))}
        </ul>
      </section>
      {view.certificates.length > 0 && (
        <section className="panel">
          <h2>최근 수료증</h2>
          <ul className="item-list">
            {view.certificates.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link to="/app/certificates">{c.courseTitle}</Link>
                <span>수료</span>
              </li>
            ))}
          </ul>
          <div className="quick-links">
            <Link to="/app/certificates">수료증 전체 보기</Link>
          </div>
        </section>
      )}
    </div>
  );
}
