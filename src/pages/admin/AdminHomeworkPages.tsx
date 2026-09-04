import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { EmptyState, LoadingState, PageHeader } from '@/components/ui/PageStates';
import type { Course, HomeworkSubmission, HomeworkTask, UserProfile } from '@/domain';
import { ROLE_LABELS } from '@/domain';
import { getDemoProfiles } from '@/infrastructure/demo/demoState';

const STATUS_LABEL: Record<HomeworkSubmission['status'], string> = {
  submitted: '채점대기',
  graded: '채점완료',
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function AdminHomeworkTasksPage() {
  const deps = useDeps();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<HomeworkTask[]>([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    const [allCourses, allTasks] = await Promise.all([
      deps.courseRepository.listAllCourses(),
      deps.homeworkRepository.listTasks(),
    ]);
    setCourses(allCourses);
    setTasks(allTasks);
    if (!courseId && allCourses[0]) setCourseId(allCourses[0].id);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [deps]);

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  const resetForm = (nextCourseId?: string) => {
    setEditingId(undefined);
    setTitle('');
    setPrompt('');
    setMaxScore(100);
    if (nextCourseId) setCourseId(nextCourseId);
  };

  const handleEdit = (task: HomeworkTask) => {
    setEditingId(task.id);
    setCourseId(task.courseId);
    setTitle(task.title);
    setPrompt(task.prompt);
    setMaxScore(task.maxScore);
    setMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim() || !prompt.trim()) return;
    setSaving(true);
    setMessage(null);
    await deps.homeworkRepository.saveTask({
      id: editingId,
      courseId,
      title: title.trim(),
      prompt: prompt.trim(),
      maxScore,
    });
    setMessage(editingId ? '과제 문제가 수정되었습니다.' : '과제 문제가 등록되었습니다.');
    resetForm(courseId);
    await reload();
    setSaving(false);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('이 과제 문제를 삭제할까요?')) return;
    await deps.homeworkRepository.deleteTask(taskId);
    if (editingId === taskId) resetForm(courseId);
    await reload();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="admin-page">
      <PageHeader
        title="과제 출제"
        description="교육과정별로 수강자가 확인할 과제 문제를 작성합니다."
      />

      <form className="panel admin-exam-form" onSubmit={handleSubmit}>
        <h2>{editingId ? '과제 문제 수정' : '과제 문제 등록'}</h2>
        <div className="admin-exam-grid">
          <div className="admin-exam-field admin-exam-field-course">
            <label htmlFor="hw-task-course">교육과정</label>
            <select
              id="hw-task-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              disabled={!!editingId}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{ROLE_LABELS[course.targetRole]}] {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-exam-field admin-exam-field-points">
            <label htmlFor="hw-task-max">만점</label>
            <input
              id="hw-task-max"
              type="number"
              min={1}
              max={200}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value) || 1)}
              required
            />
          </div>
          <div className="admin-exam-field admin-exam-field-prompt">
            <label htmlFor="hw-task-title">과제 제목</label>
            <input
              id="hw-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 페어플레이 실천 보고서"
              required
            />
          </div>
          <div className="admin-exam-field admin-exam-field-prompt">
            <label htmlFor="hw-task-prompt">과제 문제</label>
            <textarea
              id="hw-task-prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="수강자가 수행할 과제 문제와 안내를 작성하세요."
              required
            />
          </div>
        </div>
        {message && <p className="privacy-notice">{message}</p>}
        <div className="admin-exam-actions">
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={() => resetForm(courseId)}>
              취소
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중…' : editingId ? '수정 저장' : '과제 등록'}
          </button>
        </div>
      </form>

      <div className="admin-toolbar">
        <p>
          등록된 과제 <strong>{tasks.length}</strong>건
        </p>
        <Link to="/admin/homework" className="btn btn-secondary btn-sm">
          과제 채점
        </Link>
      </div>

      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">과제 문제 목록</caption>
          <thead>
            <tr>
              <th scope="col">교육과정</th>
              <th scope="col">제목</th>
              <th scope="col">만점</th>
              <th scope="col">수정일</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5}>등록된 과제 문제가 없습니다.</td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td>{courseTitle(task.courseId)}</td>
                  <td>{task.title}</td>
                  <td>{task.maxScore}점</td>
                  <td>{new Date(task.updatedAt).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <div className="hw-table-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleEdit(task)}>
                        수정
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(task.id)}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminHomeworkListPage() {
  const deps = useDeps();
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [all, allCourses] = await Promise.all([
        deps.homeworkRepository.listAll(),
        deps.courseRepository.listAllCourses(),
      ]);
      setSubmissions(all);
      setCourses(allCourses);
      setProfiles(getDemoProfiles());
      setLoading(false);
    })();
  }, [deps]);

  const filtered = useMemo(() => {
    return submissions.filter((item) => {
      const byStatus = statusFilter === 'all' || item.status === statusFilter;
      const byCourse = courseFilter === 'all' || item.courseId === courseFilter;
      return byStatus && byCourse;
    });
  }, [submissions, statusFilter, courseFilter]);

  const nameOf = (userId: string) => profiles.find((p) => p.id === userId)?.displayName ?? userId;
  const courseOf = (courseId: string) => courses.find((c) => c.id === courseId)?.title ?? courseId;

  if (loading) return <LoadingState />;

  return (
    <div className="admin-page">
      <PageHeader
        title="과제 채점"
        description="수강생이 제출한 과제를 확인하고 배점·점수를 부여합니다."
      />
      <div className="admin-toolbar">
        <label className="course-filter-select">
          <span className="sr-only">상태</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'submitted' | 'graded')}
          >
            <option value="all">전체 상태</option>
            <option value="submitted">채점대기</option>
            <option value="graded">채점완료</option>
          </select>
        </label>
        <label className="course-filter-select">
          <span className="sr-only">과정</span>
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
        <Link to="/admin/homework/tasks" className="btn btn-secondary btn-sm">
          과제 출제
        </Link>
      </div>

      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">과제 제출 목록</caption>
          <thead>
            <tr>
              <th scope="col">수강생</th>
              <th scope="col">교육과정</th>
              <th scope="col">상태</th>
              <th scope="col">점수</th>
              <th scope="col">첨부</th>
              <th scope="col">제출일시</th>
              <th scope="col">채점</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>제출된 과제가 없습니다.</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>{nameOf(item.userId)}</td>
                  <td>{courseOf(item.courseId)}</td>
                  <td>
                    <span className={`hw-status hw-status-${item.status}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </td>
                  <td>
                    {item.status === 'graded' && item.score != null
                      ? `${item.score}/${item.maxScore}`
                      : '-'}
                  </td>
                  <td>{item.attachments.length}개</td>
                  <td>{new Date(item.submittedAt).toLocaleString('ko-KR')}</td>
                  <td>
                    <Link to={`/admin/homework/${item.id}`} className="btn btn-primary btn-sm">
                      {item.status === 'graded' ? '확인' : '채점하기'}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminHomeworkGradePage() {
  const { submissionId = '' } = useParams();
  const deps = useDeps();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [task, setTask] = useState<HomeworkTask | null>(null);
  const [learnerName, setLearnerName] = useState('');
  const [score, setScore] = useState(80);
  const [maxScore, setMaxScore] = useState(100);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const found = await deps.homeworkRepository.getById(submissionId);
      setSubmission(found);
      if (!found) {
        setLoading(false);
        return;
      }
      const [foundCourse, foundTask] = await Promise.all([
        deps.courseRepository.getCourse(found.courseId),
        deps.homeworkRepository.getTaskByCourse(found.courseId),
      ]);
      setCourse(foundCourse);
      setTask(foundTask);
      const profile = getDemoProfiles().find((p) => p.id === found.userId);
      setLearnerName(profile?.displayName ?? found.userId);
      setScore(found.score ?? Math.round(found.maxScore * 0.8));
      setMaxScore(found.maxScore || foundTask?.maxScore || 100);
      setFeedback(found.feedback ?? '');
      setLoading(false);
    })();
  }, [submissionId, deps]);

  const handleGrade = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !submission) return;
    if (score < 0 || maxScore < 1 || score > maxScore) {
      setError('점수는 0 이상, 만점 이하여야 합니다.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const graded = await deps.homeworkRepository.grade({
        submissionId: submission.id,
        score,
        maxScore,
        feedback,
        gradedByUserId: user.id,
      });
      setSubmission(graded);
      setMessage('채점이 저장되었습니다.');
    } catch {
      setError('채점 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!submission) {
    return (
      <div className="admin-page">
        <EmptyState
          title="과제를 찾을 수 없습니다"
          action={{ to: '/admin/homework', label: '목록으로' }}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="과제 확인·채점"
        description={`${learnerName} · ${course?.title ?? submission.courseId}`}
      />

      {task && (
        <section className="panel hw-task-card">
          <p className="hw-task-label">출제 과제</p>
          <h2>{task.title}</h2>
          <div className="hw-task-prompt">
            {task.prompt.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>
        </section>
      )}

      <section className="panel hw-review-content">
        <h2>제출 내용</h2>
        <p className="hw-review-meta">
          제출일시 {new Date(submission.submittedAt).toLocaleString('ko-KR')} · 상태{' '}
          <span className={`hw-status hw-status-${submission.status}`}>
            {STATUS_LABEL[submission.status]}
          </span>
        </p>
        <div className="hw-review-body">
          {submission.content.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
        </div>
        {submission.attachments.length > 0 && (
          <div className="hw-review-files">
            <h3>첨부파일</h3>
            <ul className="hw-file-list">
              {submission.attachments.map((file) => (
                <li key={file.id}>
                  <div>
                    <strong>{file.fileName}</strong>
                    <span>{formatBytes(file.fileSize)}</span>
                  </div>
                  {file.dataUrl ? (
                    <a href={file.dataUrl} download={file.fileName} className="btn btn-ghost btn-sm">
                      다운로드
                    </a>
                  ) : (
                    <em>미리보기 없음</em>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <form className="panel hw-grade-form" onSubmit={handleGrade}>
        <h2>채점</h2>
        <div className="hw-grade-grid">
          <div className="hw-field">
            <label htmlFor="hw-max-score">만점 배점</label>
            <input
              id="hw-max-score"
              type="number"
              min={1}
              max={200}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value) || 1)}
              required
            />
          </div>
          <div className="hw-field">
            <label htmlFor="hw-score">부여 점수</label>
            <input
              id="hw-score"
              type="number"
              min={0}
              max={maxScore}
              value={score}
              onChange={(e) => setScore(Number(e.target.value) || 0)}
              required
            />
          </div>
          <div className="hw-field hw-field-full">
            <label htmlFor="hw-feedback">피드백</label>
            <textarea
              id="hw-feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="수강생에게 전달할 피드백을 입력하세요."
            />
          </div>
        </div>
        {error && <p className="exam-error" role="alert">{error}</p>}
        {message && <p className="privacy-notice">{message}</p>}
        <div className="hw-form-actions">
          <Link to="/admin/homework" className="btn btn-secondary">
            목록으로
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중…' : '채점 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
