import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { countLessons } from '@/components/courses/courseCatalogUtils';
import { LoadingState, PageHeader, StatGrid } from '@/components/ui/PageStates';
import {
  FAIR_PLAY_VALUES,
  ROLE_LABELS,
  type ContentStatus,
  type Course,
  type FairPlayValue,
  type UserRole,
} from '@/domain';
import { getDemoCourses, getDemoOrganizations, generateId } from '@/infrastructure/demo/demoState';

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: '초안',
  in_review: '검수 중',
  changes_requested: '수정 요청',
  approved: '승인됨',
  scheduled: '예약',
  published: '게시됨',
  suspended: '중지',
  archived: '보관',
};

const COURSE_ROLES: UserRole[] = ['athlete', 'guardian', 'coach'];
const VALUE_KEYS = Object.keys(FAIR_PLAY_VALUES) as FairPlayValue[];
const STATUS_KEYS = Object.keys(STATUS_LABELS) as ContentStatus[];

function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`content-status content-status-${status}`}>{STATUS_LABELS[status]}</span>;
}

function slugify(title: string, fallback: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || fallback;
}

export function ContentManagerDashboardPage() {
  const courses = getDemoCourses();
  const organizations = getDemoOrganizations();
  const publishedCourses = courses.filter((course) => course.status === 'published').length;
  const reviewCourses = courses.filter((course) => course.status !== 'published').length;

  return (
    <div className="admin-page">
      <PageHeader
        title="콘텐츠 현황"
        description="교육과정·시험·과제 콘텐츠를 관리합니다."
      />
      <StatGrid
        items={[
          { label: '전체 과정', value: courses.length },
          { label: '게시 과정', value: publishedCourses },
          { label: '검수/초안', value: reviewCourses },
          { label: '연계 기관', value: organizations.length },
        ]}
      />

      <section className="panel">
        <h2>빠른 메뉴</h2>
        <nav className="quick-links">
          <Link to="/admin/content/courses">과정 관리</Link>
          <Link to="/admin/exams/questions">시험 기출</Link>
          <Link to="/admin/exams/results">시험 내역</Link>
          <Link to="/admin/homework/tasks">과제 출제</Link>
          <Link to="/admin/homework">과제 채점</Link>
          <Link to="/admin/content/assessments">자기점검</Link>
        </nav>
      </section>

      <section className="panel">
        <h2>최근 게시 과정</h2>
        <table className="data-table">
          <caption className="sr-only">최근 게시 과정 목록</caption>
          <thead>
            <tr>
              <th scope="col">과정명</th>
              <th scope="col">대상</th>
              <th scope="col">상태</th>
              <th scope="col">차시</th>
            </tr>
          </thead>
          <tbody>
            {courses.slice(0, 5).map((course) => (
              <tr key={course.id}>
                <td>
                  <Link to={`/courses/${course.slug}`} target="_blank" rel="noopener noreferrer">
                    {course.title}
                  </Link>
                </td>
                <td>{ROLE_LABELS[course.targetRole]}</td>
                <td>
                  <StatusBadge status={course.status} />
                </td>
                <td>{countLessons(course)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export function AdminCoursesPage() {
  const deps = useDeps();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole>('athlete');
  const [targetAgeGroup, setTargetAgeGroup] = useState('');
  const [values, setValues] = useState<FairPlayValue[]>(['respect']);
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [objectivesText, setObjectivesText] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    const all = await deps.courseRepository.listAllCourses();
    setCourses(all);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [deps]);

  const resetForm = () => {
    setEditingId(undefined);
    setTitle('');
    setDescription('');
    setTargetRole('athlete');
    setTargetAgeGroup('');
    setValues(['respect']);
    setStatus('draft');
    setEstimatedMinutes(30);
    setObjectivesText('');
    setFormOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
    setMessage(null);
  };

  const openEdit = (course: Course) => {
    setEditingId(course.id);
    setTitle(course.title);
    setDescription(course.description);
    setTargetRole(course.targetRole);
    setTargetAgeGroup(course.targetAgeGroup ?? '');
    setValues(course.values.length ? [...course.values] : ['respect']);
    setStatus(course.status);
    setEstimatedMinutes(course.estimatedMinutes);
    setObjectivesText(course.learningObjectives.join('\n'));
    setFormOpen(true);
    setMessage(null);
  };

  const toggleValue = (value: FairPlayValue, on: boolean) => {
    setValues((prev) => {
      if (on) return prev.includes(value) ? prev : [...prev, value];
      const next = prev.filter((v) => v !== value);
      return next.length ? next : prev;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (values.length === 0) {
      setMessage('핵심 가치를 하나 이상 선택하세요.');
      return;
    }
    setSaving(true);
    setMessage(null);
    const objectives = objectivesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (editingId) {
      const existing = courses.find((c) => c.id === editingId);
      if (!existing) {
        setSaving(false);
        return;
      }
      await deps.courseRepository.saveCourse({
        ...existing,
        title: title.trim(),
        slug: slugify(title.trim(), existing.id),
        description: description.trim(),
        targetRole,
        targetAgeGroup: targetAgeGroup.trim() || undefined,
        values,
        status,
        estimatedMinutes: Math.max(1, estimatedMinutes),
        learningObjectives: objectives.length
          ? objectives
          : existing.learningObjectives,
      });
      setMessage('과정이 수정되었습니다.');
    } else {
      const id = generateId('course');
      const lessonId = `lesson-${id}-1`;
      const moduleId = `module-${id}-1`;
      await deps.courseRepository.saveCourse({
        id,
        slug: slugify(title.trim(), id),
        title: title.trim(),
        description: description.trim() || `${title.trim()} — FAIR PLAY ACADEMY 교육과정입니다.`,
        targetRole,
        targetAgeGroup: targetAgeGroup.trim() || undefined,
        values,
        estimatedMinutes: Math.max(1, estimatedMinutes),
        learningObjectives: objectives.length
          ? objectives
          : ['실제 상황에서 더 나은 선택을 연습합니다.'],
        modules: [
          {
            id: moduleId,
            courseId: id,
            title: '1차시',
            order: 1,
            lessonIds: [lessonId],
          },
        ],
        completionRules: {
          requiredLessonPercent: 100,
          requiredScenarioComplete: false,
          minimumQuizScore: 60,
          commitmentRequired: false,
        },
        status,
        version: 1,
      });
      setMessage('과정이 등록되었습니다.');
    }

    resetForm();
    await reload();
    setSaving(false);
  };

  const handleDelete = async (course: Course) => {
    if (
      !confirm(
        `"${course.title}" 과정을 삭제할까요?\n관련 시험·과제·배정·진도 데이터도 함께 삭제됩니다.`,
      )
    ) {
      return;
    }
    await deps.courseRepository.deleteCourse(course.id);
    if (editingId === course.id) resetForm();
    setMessage('과정이 삭제되었습니다.');
    await reload();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="admin-page">
      <PageHeader
        title="과정 관리"
        description="교육과정을 등록하고 수정·삭제할 수 있습니다."
      />

      <div className="admin-toolbar">
        <p>
          전체 <strong>{courses.length}</strong>개 과정
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          새 과정 등록
        </button>
      </div>

      {formOpen && (
        <form className="panel org-form" onSubmit={handleSubmit}>
          <h2>{editingId ? '과정 수정' : '새 과정 등록'}</h2>
          <div className="org-form-grid">
            <div className="org-form-row">
              <label htmlFor="course-title">과정명</label>
              <input
                id="course-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="org-form-row">
              <label htmlFor="course-role">대상</label>
              <select
                id="course-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
              >
                {COURSE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="org-form-row">
              <label htmlFor="course-status">상태</label>
              <select
                id="course-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
              >
                {STATUS_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="org-form-row">
              <label htmlFor="course-minutes">예상 시간(분)</label>
              <input
                id="course-minutes"
                type="number"
                min={1}
                max={300}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 1)}
                required
              />
            </div>
            <div className="org-form-row">
              <label htmlFor="course-age">대상 연령(선택)</label>
              <input
                id="course-age"
                type="text"
                value={targetAgeGroup}
                onChange={(e) => setTargetAgeGroup(e.target.value)}
                placeholder="예: 중•고등"
              />
            </div>
          </div>

          <div className="org-form-row" style={{ marginTop: '0.85rem' }}>
            <label htmlFor="course-desc">소개</label>
            <textarea
              id="course-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="과정 소개를 입력하세요."
            />
          </div>

          <fieldset className="org-value-fieldset">
            <legend>핵심 가치</legend>
            <ul className="org-check-list">
              {VALUE_KEYS.map((value) => (
                <li key={value}>
                  <label>
                    <input
                      type="checkbox"
                      checked={values.includes(value)}
                      onChange={(e) => toggleValue(value, e.target.checked)}
                    />
                    <span>{FAIR_PLAY_VALUES[value].ko}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="org-form-row" style={{ marginTop: '0.85rem' }}>
            <label htmlFor="course-objectives">학습 목표 (줄바꿈으로 구분)</label>
            <textarea
              id="course-objectives"
              rows={3}
              value={objectivesText}
              onChange={(e) => setObjectivesText(e.target.value)}
              placeholder="목표를 한 줄씩 입력하세요."
            />
          </div>

          {message && <p className="privacy-notice">{message}</p>}
          <div className="org-form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중…' : editingId ? '수정 저장' : '과정 등록'}
            </button>
          </div>
        </form>
      )}

      {!formOpen && message && <p className="privacy-notice">{message}</p>}

      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">교육과정 목록</caption>
          <thead>
            <tr>
              <th scope="col">과정명</th>
              <th scope="col">대상</th>
              <th scope="col">가치</th>
              <th scope="col">차시</th>
              <th scope="col">상태</th>
              <th scope="col">버전</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={7}>등록된 과정이 없습니다.</td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{ROLE_LABELS[course.targetRole]}</td>
                  <td>{course.values.map((v) => FAIR_PLAY_VALUES[v].ko).join(', ')}</td>
                  <td>{countLessons(course)}</td>
                  <td>
                    <StatusBadge status={course.status} />
                  </td>
                  <td>v{course.version}</td>
                  <td>
                    <div className="hw-table-actions">
                      <Link
                        to={`/courses/${course.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(course)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(course)}
                      >
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

export function AdminAssessmentsPage() {
  const assessments = [
    {
      id: 'assess-fairplay-self',
      title: 'FAIR PLAY 자기점검',
      target: '학생선수',
      items: 12,
      status: 'published' as const,
    },
    {
      id: 'assess-guardian-self',
      title: '학부모 언어·태도 점검',
      target: '학부모',
      items: 8,
      status: 'published' as const,
    },
    {
      id: 'assess-coach-self',
      title: '지도자 팀문화 점검',
      target: '지도자',
      items: 10,
      status: 'published' as const,
    },
  ];

  return (
    <div className="admin-page">
      <PageHeader title="자기점검" description="과정 수료 전·후 자기점검 문항을 관리합니다." />
      <div className="admin-toolbar">
        <p>
          전체 <strong>{assessments.length}</strong>개 점검표
        </p>
        <button type="button" className="btn btn-primary btn-sm" disabled>
          새 자기점검
        </button>
      </div>
      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">자기점검 목록</caption>
          <thead>
            <tr>
              <th scope="col">제목</th>
              <th scope="col">대상</th>
              <th scope="col">문항 수</th>
              <th scope="col">상태</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.target}</td>
                <td>{item.items}문항</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminOrganizationsPage() {
  const organizations = getDemoOrganizations();

  return (
    <div className="admin-page">
      <PageHeader title="기관" description="플랫폼에 등록된 기관 목록입니다." />
      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">기관 목록</caption>
          <thead>
            <tr>
              <th scope="col">기관명</th>
              <th scope="col">설명</th>
              <th scope="col">식별자</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id}>
                <td>{org.name}</td>
                <td>{org.description ?? '-'}</td>
                <td>{org.slug}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  return (
    <div className="admin-page">
      <PageHeader title="사용자" description="운영자·기관관리자 계정을 관리합니다." />
      <div className="panel">
        <p>사용자 관리 기능은 운영 백엔드 연동 후 제공됩니다.</p>
      </div>
    </div>
  );
}

export function AdminAuditLogsPage() {
  return (
    <div className="admin-page">
      <PageHeader title="감사로그" description="콘텐츠 변경 및 운영 이력을 확인합니다." />
      <div className="panel">
        <p>감사로그는 운영 백엔드 연동 후 제공됩니다.</p>
      </div>
    </div>
  );
}

export function ContentManagerSettingsPage() {
  return (
    <div className="admin-page">
      <PageHeader title="설정" description="콘텐츠 관리자 계정 및 알림 설정" />
      <section className="panel">
        <h2>계정</h2>
        <p>콘텐츠 검수·게시 권한이 부여된 운영 계정입니다.</p>
      </section>
      <section className="panel">
        <h2>알림</h2>
        <p>검수 요청 및 게시 예약 알림은 준비 중입니다.</p>
      </section>
    </div>
  );
}
