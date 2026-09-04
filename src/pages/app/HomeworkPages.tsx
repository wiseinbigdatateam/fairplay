import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  HOMEWORK_DOCUMENT_ACCEPT,
  isAllowedHomeworkDocument,
} from '@/application/services/homeworkRules';
import { EmptyState, LoadingState, PageHeader } from '@/components/ui/PageStates';
import type { Course, HomeworkAttachment, HomeworkSubmission, HomeworkTask } from '@/domain';

const MAX_FILE_BYTES = 500 * 1024;
const MAX_FILES = 3;

const STATUS_LABEL: Record<HomeworkSubmission['status'], string> = {
  submitted: '제출완료 (채점대기)',
  graded: '채점완료',
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

async function readFileAsAttachment(file: File): Promise<Omit<HomeworkAttachment, 'id'>> {
  const base = {
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type || 'application/octet-stream',
  };
  if (file.size > MAX_FILE_BYTES) {
    return base;
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
  return { ...base, dataUrl };
}

interface HomeworkListPageProps {
  basePath: string;
}

export function HomeworkListPage({ basePath }: HomeworkListPageProps) {
  const deps = useDeps();
  const { user } = useAuth();
  const [rows, setRows] = useState<
    Array<{
      course: Course;
      progressPercent: number;
      task: HomeworkTask | null;
      latest: HomeworkSubmission | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const assigned = await deps.courseRepository.listAssignedCourses(user.id);
      const next = await Promise.all(
        assigned.map(async (course) => {
          const progress = await deps.learningRepository.getCourseProgress(user.id, course.id);
          const task = await deps.homeworkRepository.getTaskByCourse(course.id);
          const latest = await deps.homeworkRepository.getLatestByUserAndCourse(user.id, course.id);
          return {
            course,
            progressPercent: progress?.progressPercent ?? 0,
            task,
            latest,
          };
        }),
      );
      setRows(next);
      setLoading(false);
    })();
  }, [user, deps]);

  if (loading) return <LoadingState label="과제 목록을 불러오는 중…" />;

  return (
    <div className="homework-page">
      <PageHeader
        title="과제제출"
        description="교육과정별 과제 문제를 확인하고, 내용과 문서 파일을 첨부해 제출합니다."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="제출 가능한 교육과정이 없습니다"
          description="배정된 교육을 수강한 뒤 과제를 제출할 수 있습니다."
        />
      ) : (
        <div className="admin-table-wrap panel">
          <table className="data-table">
            <caption className="sr-only">과정별 과제 제출 현황</caption>
            <thead>
              <tr>
                <th scope="col">교육과정</th>
                <th scope="col">과제 문제</th>
                <th scope="col">수강 진도</th>
                <th scope="col">상태</th>
                <th scope="col">점수</th>
                <th scope="col">제출</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ course, progressPercent, task, latest }) => {
                const canSubmit = progressPercent > 0 && !!task;
                return (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{task?.title ?? <span className="exam-locked">미등록</span>}</td>
                    <td>{progressPercent}%</td>
                    <td>
                      {latest ? (
                        <span className={`hw-status hw-status-${latest.status}`}>
                          {STATUS_LABEL[latest.status]}
                        </span>
                      ) : (
                        <span className="hw-status hw-status-none">미제출</span>
                      )}
                    </td>
                    <td>
                      {latest?.status === 'graded' && latest.score != null
                        ? `${latest.score} / ${latest.maxScore}점`
                        : '-'}
                    </td>
                    <td>
                      {canSubmit ? (
                        <Link to={`${basePath}/${course.id}`} className="btn btn-primary btn-sm">
                          {latest ? '확인·재제출' : '과제 제출'}
                        </Link>
                      ) : (
                        <span className="exam-locked">
                          {!task ? '과제 미등록' : '수강 후 제출'}
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

interface HomeworkSubmitPageProps {
  basePath: string;
}

export function HomeworkSubmitPage({ basePath }: HomeworkSubmitPageProps) {
  const { courseId = '' } = useParams();
  const deps = useDeps();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [task, setTask] = useState<HomeworkTask | null>(null);
  const [latest, setLatest] = useState<HomeworkSubmission | null>(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Omit<HomeworkAttachment, 'id'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !courseId) return;
    (async () => {
      setLoading(true);
      setError(null);
      const found = await deps.courseRepository.getCourse(courseId);
      setCourse(found);
      if (!found) {
        setError('과정을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      const progress = await deps.learningRepository.getCourseProgress(user.id, courseId);
      if ((progress?.progressPercent ?? 0) <= 0) {
        setError('해당 교육을 수강한 뒤 과제를 제출할 수 있습니다.');
        setLoading(false);
        return;
      }
      const homeworkTask = await deps.homeworkRepository.getTaskByCourse(courseId);
      setTask(homeworkTask);
      if (!homeworkTask) {
        setError('아직 등록된 과제 문제가 없습니다. 관리자 등록 후 제출할 수 있습니다.');
        setLoading(false);
        return;
      }
      const existing = await deps.homeworkRepository.getLatestByUserAndCourse(user.id, courseId);
      setLatest(existing);
      if (existing) {
        setContent(existing.content);
        setAttachments(
          existing.attachments.map(({ fileName, fileSize, contentType, dataUrl }) => ({
            fileName,
            fileSize,
            contentType,
            dataUrl,
          })),
        );
      }
      setLoading(false);
    })();
  }, [user, courseId, deps]);

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);
    setMessage(null);

    const invalid = files.filter((f) => !isAllowedHomeworkDocument(f.name));
    if (invalid.length > 0) {
      setError(
        `문서 파일만 첨부할 수 있습니다. (허용: ${HOMEWORK_DOCUMENT_ACCEPT}) — 제외됨: ${invalid
          .map((f) => f.name)
          .join(', ')}`,
      );
    }
    const allowed = files.filter((f) => isAllowedHomeworkDocument(f.name));
    if (allowed.length === 0) return;

    const room = MAX_FILES - attachments.length;
    if (room <= 0) {
      setError(`첨부파일은 최대 ${MAX_FILES}개까지 가능합니다.`);
      return;
    }
    const selected = allowed.slice(0, room);
    try {
      const next = await Promise.all(selected.map(readFileAsAttachment));
      const oversized = selected.filter((f) => f.size > MAX_FILE_BYTES);
      setAttachments((prev) => [...prev, ...next]);
      if (oversized.length > 0) {
        setMessage(
          `${oversized.map((f) => f.name).join(', ')}은(는) 500KB를 초과해 메타정보만 저장됩니다.`,
        );
      }
    } catch {
      setError('첨부파일을 처리하지 못했습니다.');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !course || !task) return;
    if (!content.trim()) {
      setError('과제 내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await deps.homeworkRepository.submit({
        userId: user.id,
        courseId: course.id,
        homeworkTaskId: task.id,
        content: content.trim(),
        attachments,
        maxScore: task.maxScore,
      });
      setLatest(saved);
      setMessage('과제가 제출되었습니다. 관리자 채점 후 점수를 확인할 수 있습니다.');
    } catch {
      setError('과제 제출에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="과제 정보를 불러오는 중…" />;

  if (error && (!course || !task)) {
    return (
      <div className="homework-page">
        <PageHeader title="과제제출" />
        <EmptyState
          title="과제를 열 수 없습니다"
          description={error}
          action={{ to: basePath, label: '목록으로' }}
        />
      </div>
    );
  }

  return (
    <div className="homework-page">
      <PageHeader
        title={`${course?.title ?? ''} 과제`}
        description="과제 문제를 확인한 뒤 내용과 문서 첨부파일을 등록하세요."
      />

      {task && (
        <section className="panel hw-task-card">
          <p className="hw-task-label">과제 문제</p>
          <h2>{task.title}</h2>
          <div className="hw-task-prompt">
            {task.prompt.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>
          <p className="hw-task-score">만점 {task.maxScore}점</p>
        </section>
      )}

      {latest && (
        <section className="panel hw-status-card">
          <h2>제출 현황</h2>
          <dl className="hw-status-meta">
            <div>
              <dt>상태</dt>
              <dd>
                <span className={`hw-status hw-status-${latest.status}`}>{STATUS_LABEL[latest.status]}</span>
              </dd>
            </div>
            <div>
              <dt>제출일시</dt>
              <dd>{new Date(latest.submittedAt).toLocaleString('ko-KR')}</dd>
            </div>
            <div>
              <dt>점수</dt>
              <dd>
                {latest.status === 'graded' && latest.score != null
                  ? `${latest.score} / ${latest.maxScore}점`
                  : '채점 대기'}
              </dd>
            </div>
          </dl>
          {latest.feedback && (
            <div className="hw-feedback">
              <strong>피드백</strong>
              <p>{latest.feedback}</p>
            </div>
          )}
        </section>
      )}

      <form className="panel hw-form" onSubmit={handleSubmit}>
        <div className="hw-field">
          <label htmlFor="hw-content">과제 내용</label>
          <textarea
            id="hw-content"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="과제 문제에 대한 답변을 입력해 주세요."
            required
          />
        </div>

        <div className="hw-field">
          <label htmlFor="hw-files">첨부파일 (문서만)</label>
          <input
            id="hw-files"
            type="file"
            multiple
            onChange={handleFiles}
            accept={HOMEWORK_DOCUMENT_ACCEPT}
          />
          <p className="hw-file-hint">
            허용 확장자: {HOMEWORK_DOCUMENT_ACCEPT} · 최대 {MAX_FILES}개 · 파일당 500KB 이하 권장
          </p>
          {attachments.length > 0 && (
            <ul className="hw-file-list">
              {attachments.map((file, index) => (
                <li key={`${file.fileName}-${index}`}>
                  <div>
                    <strong>{file.fileName}</strong>
                    <span>{formatBytes(file.fileSize)}</span>
                    {!file.dataUrl && <em>메타만 저장</em>}
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeAttachment(index)}>
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="exam-error" role="alert">{error}</p>}
        {message && <p className="privacy-notice">{message}</p>}

        <div className="hw-form-actions">
          <Link to={basePath} className="btn btn-secondary">
            목록으로
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving || !task}>
            {saving ? '제출 중…' : latest ? '다시 제출' : '제출하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
