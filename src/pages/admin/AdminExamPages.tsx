import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { getExamQuestionCount } from '@/application/services/examRules';
import { LoadingState, PageHeader } from '@/components/ui/PageStates';
import type { Course, ExamAttempt, ExamQuestion, UserProfile } from '@/domain';
import { ROLE_LABELS } from '@/domain';
import { getDemoProfiles } from '@/infrastructure/demo/demoState';

export function AdminExamQuestionsPage() {
  const deps = useDeps();
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [courseId, setCourseId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [points, setPoints] = useState(10);
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    const allCourses = await deps.courseRepository.listAllCourses();
    const allQuestions = await deps.examRepository.listAllQuestions();
    setCourses(allCourses);
    setQuestions(allQuestions);
    if (!courseId && allCourses[0]) setCourseId(allCourses[0].id);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [deps]);

  const filtered = useMemo(
    () => questions.filter((q) => !courseId || q.courseId === courseId),
    [questions, courseId],
  );

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId || !prompt.trim()) return;
    if (options.some((o) => !o.trim())) {
      setMessage('보기를 모두 입력해 주세요.');
      return;
    }
    setSaving(true);
    setMessage(null);
    await deps.examRepository.saveQuestion({
      courseId,
      prompt: prompt.trim(),
      points: Math.max(1, points),
      options: options.map((label, i) => ({
        id: `opt-${i + 1}`,
        label: label.trim(),
        isCorrect: i === correctIndex,
      })),
    });
    setPrompt('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setPoints(10);
    setMessage('기출문제가 등록되었습니다. 시험에는 등록 문항의 약 80%가 출제됩니다.');
    await reload();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 기출문제를 삭제할까요?')) return;
    await deps.examRepository.deleteQuestion(id);
    await reload();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="admin-page">
      <PageHeader
        title="시험 기출 등록"
        description="교육과정별 객관식 기출을 등록합니다. 응시 시 등록 문항의 80%가 출제되며, 문항별 배점으로 100점 만점 환산 채점합니다."
      />

      <form className="panel admin-exam-form" onSubmit={handleSubmit}>
        <h2>기출문제 등록</h2>

        <div className="admin-exam-grid">
          <div className="admin-exam-field admin-exam-field-course">
            <label htmlFor="exam-course">교육과정</label>
            <select
              id="exam-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{ROLE_LABELS[course.targetRole]}] {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-exam-field admin-exam-field-points">
            <label htmlFor="exam-points">배점</label>
            <input
              id="exam-points"
              type="number"
              min={1}
              max={50}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value) || 1)}
            />
          </div>

          <div className="admin-exam-field admin-exam-field-prompt">
            <label htmlFor="exam-prompt">문항</label>
            <textarea
              id="exam-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="문제 내용을 입력하세요"
              required
            />
          </div>
        </div>

        <fieldset className="admin-exam-options">
          <legend>객관식 보기</legend>
          <p className="admin-exam-options-hint">정답으로 지정할 보기를 선택하세요.</p>
          <div className="admin-exam-option-list">
            {options.map((opt, i) => (
              <div key={i} className="admin-exam-option-row">
                <span className="admin-exam-option-index">{i + 1}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`보기 ${i + 1} 내용`}
                  aria-label={`보기 ${i + 1}`}
                  required
                />
                <label className="admin-exam-correct">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                  />
                  <span>정답</span>
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        {message && <p className="privacy-notice">{message}</p>}
        <div className="admin-exam-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중…' : '기출 등록'}
          </button>
        </div>
      </form>

      <div className="admin-toolbar">
        <p>
          선택 과정 기출 <strong>{filtered.length}</strong>문항
          {courseId && (
            <>
              {' '}
              · 출제 예정 <strong>{getExamQuestionCount(filtered.length)}</strong>문항 (80%)
            </>
          )}
        </p>
        <Link to="/admin/exams/results" className="btn btn-secondary btn-sm">
          수강생 시험 내역
        </Link>
      </div>

      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">기출문제 목록</caption>
          <thead>
            <tr>
              <th scope="col">과정</th>
              <th scope="col">문항</th>
              <th scope="col">배점</th>
              <th scope="col">정답</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.id}>
                <td>{courseTitle(q.courseId)}</td>
                <td>{q.prompt}</td>
                <td>{q.points}</td>
                <td>{q.options.find((o) => o.isCorrect)?.label ?? '-'}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(q.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminExamResultsPage() {
  const deps = useDeps();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [allAttempts, allCourses] = await Promise.all([
        deps.examRepository.listAllAttempts(),
        deps.courseRepository.listAllCourses(),
      ]);
      setAttempts(allAttempts);
      setCourses(allCourses);
      setProfiles(getDemoProfiles());
      setLoading(false);
    })();
  }, [deps]);

  const filtered = useMemo(
    () => (courseFilter === 'all' ? attempts : attempts.filter((a) => a.courseId === courseFilter)),
    [attempts, courseFilter],
  );

  const nameOf = (userId: string) => profiles.find((p) => p.id === userId)?.displayName ?? userId;
  const courseOf = (courseId: string) => courses.find((c) => c.id === courseId)?.title ?? courseId;

  if (loading) return <LoadingState />;

  return (
    <div className="admin-page">
      <PageHeader
        title="수강생 시험 내역"
        description="학생선수·학부모·지도자별 시험 응시 결과와 점수를 확인합니다."
      />
      <div className="admin-toolbar">
        <label className="course-filter-select">
          <span className="sr-only">과정 필터</span>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">전체 과정</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <p>
          총 <strong>{filtered.length}</strong>건
        </p>
        <Link to="/admin/exams/questions" className="btn btn-secondary btn-sm">
          기출 등록
        </Link>
      </div>

      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">시험 응시 내역</caption>
          <thead>
            <tr>
              <th scope="col">수강생</th>
              <th scope="col">교육과정</th>
              <th scope="col">점수</th>
              <th scope="col">배점 합산</th>
              <th scope="col">출제 문항</th>
              <th scope="col">결과</th>
              <th scope="col">응시 시각</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>아직 응시 내역이 없습니다.</td>
              </tr>
            ) : (
              filtered.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{nameOf(attempt.userId)}</td>
                  <td>{courseOf(attempt.courseId)}</td>
                  <td>
                    <strong className={attempt.passed ? 'exam-score-pass' : 'exam-score-fail'}>
                      {attempt.score}점
                    </strong>
                  </td>
                  <td>
                    {attempt.earnedPoints} / {attempt.totalPoints}
                  </td>
                  <td>{attempt.questionIds.length}문항</td>
                  <td>{attempt.passed ? '합격' : '미달'}</td>
                  <td>{new Date(attempt.attemptedAt).toLocaleString('ko-KR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
