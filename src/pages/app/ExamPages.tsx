import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  canTakeCourseExam,
  getExamQuestionCount,
  scoreExamAttempt,
  selectExamQuestions,
} from '@/application/services/examRules';
import { EmptyState, LoadingState, PageHeader } from '@/components/ui/PageStates';
import type { Course, ExamAttempt, ExamQuestion } from '@/domain';

interface ExamListPageProps {
  basePath: string;
}

export function ExamListPage({ basePath }: ExamListPageProps) {
  const deps = useDeps();
  const { user } = useAuth();
  const [rows, setRows] = useState<
    Array<{
      course: Course;
      progressPercent: number;
      bankCount: number;
      examCount: number;
      latest?: ExamAttempt;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const assigned = await deps.courseRepository.listAssignedCourses(user.id);
      const attempts = await deps.examRepository.listAttemptsByUser(user.id);
      const next = await Promise.all(
        assigned.map(async (course) => {
          const progress = await deps.learningRepository.getCourseProgress(user.id, course.id);
          const bank = await deps.examRepository.listQuestionsByCourse(course.id);
          const courseAttempts = attempts.filter((a) => a.courseId === course.id);
          return {
            course,
            progressPercent: progress?.progressPercent ?? 0,
            bankCount: bank.length,
            examCount: getExamQuestionCount(bank.length),
            latest: courseAttempts[0],
          };
        }),
      );
      setRows(next);
      setLoading(false);
    })();
  }, [user, deps]);

  if (loading) return <LoadingState label="시험 목록을 불러오는 중…" />;

  return (
    <div className="exam-page">
      <PageHeader
        title="시험"
        description="수강한 교육과정의 기출문제 중 80%가 출제되며, 문항별 배점을 합산해 100점 만점으로 채점합니다."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="응시 가능한 교육이 없습니다"
          description="기관에서 배정한 교육을 수강한 뒤 시험에 응시할 수 있습니다."
        />
      ) : (
        <div className="admin-table-wrap panel">
          <table className="data-table">
            <caption className="sr-only">과정별 시험 목록</caption>
            <thead>
              <tr>
                <th scope="col">교육과정</th>
                <th scope="col">수강 진도</th>
                <th scope="col">기출 / 출제</th>
                <th scope="col">최근 성적</th>
                <th scope="col">응시</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ course, progressPercent, bankCount, examCount, latest }) => {
                const eligible = canTakeCourseExam(progressPercent) && bankCount > 0;
                return (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{progressPercent}%</td>
                    <td>
                      {bankCount}문항 / {examCount}문항 출제
                    </td>
                    <td>
                      {latest ? (
                        <span className={latest.passed ? 'exam-score-pass' : 'exam-score-fail'}>
                          {latest.score}점 ({latest.passed ? '합격' : '재응시 권장'})
                        </span>
                      ) : (
                        '미응시'
                      )}
                    </td>
                    <td>
                      {eligible ? (
                        <Link to={`${basePath}/${course.id}`} className="btn btn-primary btn-sm">
                          {latest ? '다시 응시' : '시험 응시'}
                        </Link>
                      ) : (
                        <span className="exam-locked">
                          {bankCount === 0 ? '기출 미등록' : '수강 후 응시'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface ExamTakePageProps {
  basePath: string;
}

export function ExamTakePage({ basePath }: ExamTakePageProps) {
  const { courseId = '' } = useParams();
  const deps = useDeps();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !courseId) return;
    (async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      const found = await deps.courseRepository.getCourse(courseId);
      setCourse(found);
      if (!found) {
        setError('과정을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      const progress = await deps.learningRepository.getCourseProgress(user.id, courseId);
      if (!canTakeCourseExam(progress?.progressPercent ?? 0)) {
        setError('해당 교육을 수강한 뒤 시험에 응시할 수 있습니다.');
        setLoading(false);
        return;
      }
      const bank = await deps.examRepository.listQuestionsByCourse(courseId);
      if (bank.length === 0) {
        setError('등록된 기출문제가 없습니다. 관리자에게 문의해 주세요.');
        setLoading(false);
        return;
      }
      setQuestions(selectExamQuestions(bank));
      setResponses({});
      setLoading(false);
    })();
  }, [user, courseId, deps]);

  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + q.points, 0),
    [questions],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !course) return;
    const unanswered = questions.filter((q) => !responses[q.id]);
    if (unanswered.length > 0) {
      setError(`미응답 문항이 ${unanswered.length}개 있습니다.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    const scored = scoreExamAttempt(questions, responses, 60);
    const attempt = await deps.examRepository.saveAttempt({
      userId: user.id,
      courseId: course.id,
      questionIds: questions.map((q) => q.id),
      responses,
      ...scored,
      attemptedAt: new Date().toISOString(),
    });
    setResult(attempt);
    setSubmitting(false);
  };

  if (loading) return <LoadingState label="시험지를 준비하는 중…" />;

  if (error && questions.length === 0) {
    return (
      <div className="exam-page">
        <PageHeader title="시험" />
        <EmptyState
          title="시험을 시작할 수 없습니다"
          description={error}
          action={{ to: basePath, label: '목록으로' }}
        />
      </div>
    );
  }

  if (result) {
    return (
      <div className="exam-page">
        <PageHeader title={`${course?.title ?? '과정'} 시험 결과`} />
        <section className="panel exam-result">
          <p className="exam-result-score">
            <strong>{result.score}</strong>
            <span>/ 100점</span>
          </p>
          <p>
            획득 배점 {result.earnedPoints} / 출제 배점 {result.totalPoints}
            {' · '}
            {result.passed ? '합격 (60점 이상)' : '미달 (60점 미만)'}
          </p>
          <div className="exam-result-actions">
            <Link to={basePath} className="btn btn-secondary">
              목록으로
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => navigate(0)}>
              다시 응시
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="exam-page">
      <PageHeader
        title={`${course?.title ?? ''} 시험`}
        description={`기출 ${questions.length}문항 출제 · 총 배점 ${totalPoints}점 → 100점 만점 환산`}
      />
      {error && <p className="exam-error" role="alert">{error}</p>}
      <form className="exam-form panel" onSubmit={handleSubmit}>
        {questions.map((question, index) => (
          <fieldset key={question.id} className="exam-question">
            <legend>
              {index + 1}. {question.prompt}
              <span className="exam-points">({question.points}점)</span>
            </legend>
            <div className="exam-options">
              {question.options.map((option) => (
                <label key={option.id} className="exam-option">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={responses[question.id] === option.id}
                    onChange={() =>
                      setResponses((prev) => ({ ...prev, [question.id]: option.id }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="exam-form-actions">
          <Link to={basePath} className="btn btn-secondary">
            취소
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '채점 중…' : '제출하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
