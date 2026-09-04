import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { getOrganizationAnonymousInsights } from '@/application/services/privacyViews';
import type { OrgMemberProgressRow, OrgTeamProgressRow } from '@/application/ports';
import { EmptyState, LoadingState, PageHeader, StatGrid } from '@/components/ui/PageStates';
import type { Course, CourseAssignment, OrganizationMembership, Team, UserRole } from '@/domain';
import { ROLE_LABELS } from '@/domain';
import { resetDemoData } from '@/infrastructure/demo/demoState';

type MemberRow = OrganizationMembership & { displayName?: string };

function ProgressMeter({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="org-meter" aria-label={label ?? `진도 ${clamped}%`}>
      <div className="org-meter-track">
        <div className="org-meter-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="org-meter-value">{clamped}%</span>
    </div>
  );
}

function StatBarList({
  items,
}: {
  items: Array<{ key: string; label: string; value: number; hint?: string }>;
}) {
  const max = Math.max(100, ...items.map((i) => i.value), 1);
  return (
    <ul className="org-stat-bars">
      {items.map((item) => (
        <li key={item.key}>
          <div className="org-stat-bar-head">
            <strong>{item.label}</strong>
            <span>
              {item.value}%{item.hint ? ` · ${item.hint}` : ''}
            </span>
          </div>
          <div className="org-stat-bar-track">
            <div
              className="org-stat-bar-fill"
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrganizationDashboardPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const [stats, setStats] = useState<Awaited<
    ReturnType<typeof deps.organizationRepository.getOrganizationProgress>
  > | null>(null);

  useEffect(() => {
    if (!user?.organizationId) return;
    deps.organizationRepository.getOrganizationProgress(user.organizationId).then(setStats);
  }, [user, deps]);

  return (
    <div className="org-page">
      <PageHeader title="기관관리 대시보드" description="교육 배정 · 진도 · 수료 현황" />
      {stats && (
        <StatGrid
          items={[
            { label: '전체 구성원', value: stats.totalMembers },
            { label: '배정', value: stats.assigned },
            { label: '시작', value: stats.started },
            { label: '수료', value: stats.completed },
            { label: '평균 진도', value: `${stats.averageProgress}%` },
          ]}
        />
      )}
      <nav className="quick-links">
        <Link to="/organization/members">구성원</Link>
        <Link to="/organization/teams">팀</Link>
        <Link to="/organization/assignments">과정 배정</Link>
        <Link to="/organization/progress">진도</Link>
        <Link to="/organization/insights">익명 통계</Link>
        <Link to="/organization/reports">결과보고서</Link>
      </nav>
    </div>
  );
}

export function OrganizationMembersPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.organizationId) return;
    (async () => {
      setLoading(true);
      const [memberList, teamList] = await Promise.all([
        deps.organizationRepository.listMembers(user.organizationId!),
        deps.organizationRepository.listTeams(user.organizationId!),
      ]);
      setMembers(memberList);
      setTeams(teamList);
      setLoading(false);
    })();
  }, [user, deps]);

  const teamName = (ids: string[]) =>
    ids.map((id) => teams.find((t) => t.id === id)?.name ?? id).join(', ') || '-';

  if (loading) return <LoadingState />;

  return (
    <div className="org-page">
      <PageHeader title="구성원 목록" description="기관에 소속된 구성원과 팀 배정 현황입니다." />
      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">기관 구성원</caption>
          <thead>
            <tr>
              <th scope="col">이름</th>
              <th scope="col">역할</th>
              <th scope="col">소속 팀</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={3}>등록된 구성원이 없습니다.</td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td>{m.displayName ?? m.userId}</td>
                  <td>{ROLE_LABELS[m.role] ?? m.role}</td>
                  <td>{teamName(m.teamIds)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="org-hint">
        팀 배정은 <Link to="/organization/teams">팀 관리</Link>에서 진행할 수 있습니다.
      </p>
    </div>
  );
}

export function OrganizationTeamsPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const orgId = user?.organizationId ?? '';
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [memberChecks, setMemberChecks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    if (!orgId) return;
    const [teamList, memberList] = await Promise.all([
      deps.organizationRepository.listTeams(orgId),
      deps.organizationRepository.listMembers(orgId),
    ]);
    setTeams(teamList);
    setMembers(memberList);
    if (!selectedTeamId && teamList[0]) setSelectedTeamId(teamList[0].id);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [orgId, deps]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const next: Record<string, boolean> = {};
    for (const m of members) {
      next[m.id] = m.teamIds.includes(selectedTeamId);
    }
    setMemberChecks(next);
  }, [selectedTeamId, members]);

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
  };

  const handleSaveTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !name.trim()) return;
    setSaving(true);
    setMessage(null);
    if (editingId) {
      await deps.organizationRepository.updateTeam(editingId, name.trim());
      setMessage('팀 정보가 수정되었습니다.');
    } else {
      const created = await deps.organizationRepository.createTeam(orgId, name.trim());
      setSelectedTeamId(created.id);
      setMessage('팀이 생성되었습니다.');
    }
    resetForm();
    await reload();
    setSaving(false);
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setName(team.name);
    setSelectedTeamId(team.id);
    setMessage(null);
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('이 팀을 삭제할까요? 구성원 배정과 과정 배정의 팀 대상에서도 제거됩니다.')) return;
    await deps.organizationRepository.deleteTeam(teamId);
    if (selectedTeamId === teamId) setSelectedTeamId('');
    if (editingId === teamId) resetForm();
    await reload();
  };

  const handleAssignMembers = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    setSaving(true);
    setMessage(null);
    for (const member of members) {
      const shouldBelong = !!memberChecks[member.id];
      const belongs = member.teamIds.includes(selectedTeamId);
      if (shouldBelong === belongs) continue;
      const nextIds = shouldBelong
        ? [...member.teamIds, selectedTeamId]
        : member.teamIds.filter((id) => id !== selectedTeamId);
      await deps.organizationRepository.setMemberTeams(member.id, nextIds);
    }
    setMessage('구성원 팀 배정이 저장되었습니다.');
    await reload();
    setSaving(false);
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (loading) return <LoadingState />;

  return (
    <div className="org-page">
      <PageHeader
        title="팀 관리"
        description="팀(그룹)을 생성·수정·삭제하고, 구성원을 팀에 할당할 수 있습니다."
      />

      <form className="panel org-form" onSubmit={handleSaveTeam}>
        <h2>{editingId ? '팀 수정' : '팀 생성'}</h2>
        <div className="org-form-row">
          <label htmlFor="org-team-name">팀 이름</label>
          <input
            id="org-team-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 한빛고등학교 야구부"
            required
          />
        </div>
        <div className="org-form-actions">
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              취소
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중…' : editingId ? '수정 저장' : '팀 생성'}
          </button>
        </div>
      </form>

      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">팀 목록</caption>
          <thead>
            <tr>
              <th scope="col">팀 이름</th>
              <th scope="col">구성원 수</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={3}>등록된 팀이 없습니다.</td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className={team.id === selectedTeamId ? 'org-row-active' : undefined}>
                  <td>{team.name}</td>
                  <td>{team.memberCount}명</td>
                  <td>
                    <div className="hw-table-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        구성원
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleEdit(team)}>
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(team.id)}
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

      {selectedTeam ? (
        <form className="panel org-form" onSubmit={handleAssignMembers}>
          <h2>
            구성원 할당 — <span>{selectedTeam.name}</span>
          </h2>
          <p className="org-hint">체크한 구성원이 이 팀에 소속됩니다. 여러 팀에 중복 소속될 수 있습니다.</p>
          <ul className="org-check-list">
            {members.map((member) => (
              <li key={member.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!memberChecks[member.id]}
                    onChange={(e) =>
                      setMemberChecks((prev) => ({ ...prev, [member.id]: e.target.checked }))
                    }
                  />
                  <span>
                    {member.displayName ?? member.userId}
                    <em>{ROLE_LABELS[member.role]}</em>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="org-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중…' : '구성원 배정 저장'}
            </button>
          </div>
        </form>
      ) : (
        <EmptyState title="팀을 선택하세요" description="팀을 생성하거나 목록에서 구성원 배정을 선택하세요." />
      )}

      {message && <p className="privacy-notice">{message}</p>}
    </div>
  );
}

export function OrganizationAssignmentsPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const orgId = user?.organizationId ?? '';
  const [courses, setCourses] = useState<Course[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [courseId, setCourseId] = useState('');
  const [targetTeamIds, setTargetTeamIds] = useState<string[]>([]);
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  const [required, setRequired] = useState(true);
  const [startDate, setStartDate] = useState('2026-03-01');
  const [dueDate, setDueDate] = useState('2026-06-30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!orgId) return;
    const [courseList, teamList, memberList, assignmentList] = await Promise.all([
      deps.courseRepository.listPublishedCourses(),
      deps.organizationRepository.listTeams(orgId),
      deps.organizationRepository.listMembers(orgId),
      deps.organizationRepository.listAssignments(orgId),
    ]);
    setCourses(courseList);
    setTeams(teamList);
    setMembers(memberList.filter((m) => !['org_manager', 'content_manager', 'super_admin'].includes(m.role)));
    setAssignments(assignmentList);
    if (!courseId && courseList[0]) setCourseId(courseList[0].id);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [orgId, deps]);

  const toggleId = (list: string[], id: string, on: boolean) =>
    on ? [...new Set([...list, id])] : list.filter((x) => x !== id);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !courseId) return;
    if (targetTeamIds.length === 0 && targetUserIds.length === 0) {
      setError('팀 또는 구성원을 하나 이상 선택하세요.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    await deps.organizationRepository.createAssignment({
      organizationId: orgId,
      courseId,
      targetTeamIds,
      targetUserIds,
      required,
      startDate,
      dueDate,
    });
    setMessage('교육과정이 배정되었습니다.');
    setTargetTeamIds([]);
    setTargetUserIds([]);
    await reload();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 배정을 삭제할까요?')) return;
    await deps.organizationRepository.deleteAssignment(id);
    await reload();
  };

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;
  const teamLabel = (ids: string[]) =>
    ids.map((id) => teams.find((t) => t.id === id)?.name ?? id).join(', ') || '-';
  const memberLabel = (ids: string[]) =>
    ids
      .map((id) => members.find((m) => m.userId === id)?.displayName ?? id)
      .join(', ') || '-';

  if (loading) return <LoadingState />;

  return (
    <div className="org-page">
      <PageHeader
        title="과정 배정"
        description="팀(그룹) 또는 구성원별로 교육과정을 배정합니다."
      />

      <form className="panel org-form" onSubmit={handleSubmit}>
        <h2>새 배정</h2>
        <div className="org-form-grid">
          <div className="org-form-row">
            <label htmlFor="org-assign-course">교육과정</label>
            <select
              id="org-assign-course"
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
          <div className="org-form-row">
            <label htmlFor="org-assign-start">시작일</label>
            <input
              id="org-assign-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="org-form-row">
            <label htmlFor="org-assign-due">마감일</label>
            <input
              id="org-assign-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="org-form-row org-form-row-check">
            <label>
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              필수 과정
            </label>
          </div>
        </div>

        <div className="org-assign-targets">
          <fieldset>
            <legend>팀(그룹) 대상</legend>
            <ul className="org-check-list">
              {teams.map((team) => (
                <li key={team.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={targetTeamIds.includes(team.id)}
                      onChange={(e) =>
                        setTargetTeamIds(toggleId(targetTeamIds, team.id, e.target.checked))
                      }
                    />
                    <span>
                      {team.name}
                      <em>{team.memberCount}명</em>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <fieldset>
            <legend>구성원 대상</legend>
            <ul className="org-check-list">
              {members.map((member) => (
                <li key={member.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={targetUserIds.includes(member.userId)}
                      onChange={(e) =>
                        setTargetUserIds(toggleId(targetUserIds, member.userId, e.target.checked))
                      }
                    />
                    <span>
                      {member.displayName ?? member.userId}
                      <em>{ROLE_LABELS[member.role]}</em>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>

        {error && (
          <p className="exam-error" role="alert">
            {error}
          </p>
        )}
        {message && <p className="privacy-notice">{message}</p>}
        <div className="org-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중…' : '배정하기'}
          </button>
        </div>
      </form>

      <div className="admin-table-wrap panel">
        <table className="data-table">
          <caption className="sr-only">배정 목록</caption>
          <thead>
            <tr>
              <th scope="col">교육과정</th>
              <th scope="col">팀</th>
              <th scope="col">구성원</th>
              <th scope="col">기간</th>
              <th scope="col">필수</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={6}>배정 내역이 없습니다.</td>
              </tr>
            ) : (
              assignments.map((item) => (
                <tr key={item.id}>
                  <td>{courseTitle(item.courseId)}</td>
                  <td>{teamLabel(item.targetTeamIds)}</td>
                  <td>{memberLabel(item.targetUserIds)}</td>
                  <td>
                    {item.startDate} ~ {item.dueDate}
                  </td>
                  <td>{item.required ? '필수' : '선택'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      삭제
                    </button>
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

export function OrganizationProgressPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const [teams, setTeams] = useState<OrgTeamProgressRow[]>([]);
  const [members, setMembers] = useState<OrgMemberProgressRow[]>([]);
  const [view, setView] = useState<'team' | 'member'>('team');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.organizationId) return;
    (async () => {
      setLoading(true);
      const detail = await deps.organizationRepository.getDetailedProgress(user.organizationId!);
      setTeams(detail.teams);
      setMembers(detail.members);
      setLoading(false);
    })();
  }, [user, deps]);

  if (loading) return <LoadingState />;

  return (
    <div className="org-page">
      <PageHeader
        title="진도 현황"
        description="팀(그룹)과 구성원별 교육 진도를 확인합니다."
      />
      <div className="admin-toolbar">
        <div className="org-view-tabs" role="tablist">
          <button
            type="button"
            className={view === 'team' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setView('team')}
          >
            팀별
          </button>
          <button
            type="button"
            className={view === 'member' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setView('member')}
          >
            구성원별
          </button>
        </div>
      </div>

      {view === 'team' ? (
        <div className="admin-table-wrap panel">
          <table className="data-table">
            <caption className="sr-only">팀별 진도</caption>
            <thead>
              <tr>
                <th scope="col">팀</th>
                <th scope="col">구성원</th>
                <th scope="col">배정 과정</th>
                <th scope="col">학습 시작</th>
                <th scope="col">수료</th>
                <th scope="col">평균 진도</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={6}>등록된 팀이 없습니다.</td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.teamId}>
                    <td>{team.teamName}</td>
                    <td>{team.memberCount}명</td>
                    <td>{team.assignedCourses}</td>
                    <td>{team.startedMembers}명</td>
                    <td>{team.completedMembers}명</td>
                    <td>
                      <ProgressMeter value={team.averageProgress} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrap panel">
          <table className="data-table">
            <caption className="sr-only">구성원별 진도</caption>
            <thead>
              <tr>
                <th scope="col">구성원</th>
                <th scope="col">역할</th>
                <th scope="col">소속 팀</th>
                <th scope="col">배정</th>
                <th scope="col">시작</th>
                <th scope="col">수료</th>
                <th scope="col">평균 진도</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7}>구성원이 없습니다.</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.userId}>
                    <td>{member.displayName}</td>
                    <td>{ROLE_LABELS[member.role]}</td>
                    <td>{member.teamNames.join(', ') || '-'}</td>
                    <td>{member.assignedCourses}</td>
                    <td>{member.startedCourses}</td>
                    <td>{member.completedCourses}</td>
                    <td>
                      <ProgressMeter value={member.averageProgress} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function OrganizationInsightsPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const [teams, setTeams] = useState<OrgTeamProgressRow[]>([]);
  const [members, setMembers] = useState<OrgMemberProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.organizationId) return;
    (async () => {
      setLoading(true);
      const detail = await deps.organizationRepository.getDetailedProgress(user.organizationId!);
      setTeams(detail.teams);
      setMembers(detail.members);
      setLoading(false);
    })();
  }, [user, deps]);

  const orgInsights = useMemo(() => {
    const participants = members.filter((m) => m.assignedCourses > 0 || m.averageProgress > 0).length;
    return getOrganizationAnonymousInsights(Math.max(participants, members.length), {
      valueEngagement: {
        fairness: 72,
        respect: 81,
        courage: 65,
        responsibility: 70,
      },
      completionByCourse: teams.map((t) => ({
        courseTitle: t.teamName,
        rate: t.averageProgress,
      })),
    });
  }, [members, teams]);

  const anonymousMembers = useMemo(() => {
    return [...members]
      .sort((a, b) => b.averageProgress - a.averageProgress)
      .map((m, index) => ({
        key: m.userId,
        label: `구성원 ${index + 1}`,
        value: m.averageProgress,
        hint: ROLE_LABELS[m.role as UserRole],
      }));
  }, [members]);

  if (loading) return <LoadingState />;

  return (
    <div className="org-page">
      <PageHeader
        title="익명 통계"
        description="팀·구성원별 진도 상황을 통계로 표현합니다. 개인 식별 정보는 표시하지 않습니다."
      />

      {orgInsights.suppressed ? (
        <section className="panel">
          <h2>통계 제공 제한</h2>
          <p>{orgInsights.message}</p>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>팀(그룹)별 평균 진도</h2>
            {teams.length === 0 ? (
              <p>표시할 팀 통계가 없습니다.</p>
            ) : (
              <StatBarList
                items={teams.map((t) => ({
                  key: t.teamId,
                  label: t.teamName,
                  value: t.averageProgress,
                  hint: `${t.memberCount}명`,
                }))}
              />
            )}
          </section>

          <section className="panel">
            <h2>구성원별 진도 분포 (익명)</h2>
            {anonymousMembers.length === 0 ? (
              <p>표시할 구성원 통계가 없습니다.</p>
            ) : (
              <StatBarList items={anonymousMembers} />
            )}
          </section>

          {orgInsights.valueEngagement && (
            <section className="panel">
              <h2>가치 영역 참여도</h2>
              <StatBarList
                items={Object.entries(orgInsights.valueEngagement).map(([key, value]) => ({
                  key,
                  label: key,
                  value,
                }))}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function DemoResetButton() {
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => {
        if (confirm('학습 데이터를 처음 상태로 되돌립니다. 계속하시겠습니까?')) {
          resetDemoData();
          window.location.reload();
        }
      }}
    >
      데이터 초기화
    </button>
  );
}

type ReportView = Awaited<ReturnType<ReturnType<typeof useDeps>['reportRepository']['getOrganizationReport']>>;

export function OrganizationReportsPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const [report, setReport] = useState<ReportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user?.organizationId) return;
    (async () => {
      setLoading(true);
      const data = await deps.reportRepository.getOrganizationReport(user.organizationId!);
      setReport(data);
      setLoading(false);
    })();
  }, [user, deps]);

  const handleExport = async () => {
    if (!user?.organizationId) return;
    setExporting(true);
    try {
      const file = await deps.reportRepository.exportDemoReport(user.organizationId);
      // UTF-8 BOM을 바이너리로 명시해 Excel/한글 환경에서 깨짐을 방지
      const withoutBom = file.content.replace(/^\uFEFF/, '');
      const encoder = new TextEncoder();
      const body = encoder.encode(withoutBom);
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const blob = new Blob([bom, body], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!report) {
    return (
      <div className="org-page">
        <EmptyState title="보고서를 불러올 수 없습니다" />
      </div>
    );
  }

  return (
    <div className="org-page">
      <PageHeader
        title="결과보고서"
        description="기관 교육 결과 미리보기 및 CSV 내보내기 (UTF-8)"
      />

      <div className="admin-toolbar">
        <p>
          기간 <strong>{report.period}</strong>
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleExport} disabled={exporting}>
          {exporting ? '내보내는 중…' : 'CSV 내보내기'}
        </button>
      </div>

      <section className="panel org-report-preview" lang="ko">
        <h2>미리보기 — {report.organizationName}</h2>
        <StatGrid
          items={[
            { label: '배정', value: report.assigned },
            { label: '시작', value: report.started },
            { label: '수료', value: report.completed },
            { label: '수료율', value: `${report.completionRate}%` },
          ]}
        />

        <h3>과정별 진도</h3>
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">과정명</th>
                <th scope="col">진도율(%)</th>
              </tr>
            </thead>
            <tbody>
              {report.courseProgress.map((row) => (
                <tr key={row.courseTitle}>
                  <td>{row.courseTitle}</td>
                  <td>
                    <ProgressMeter value={row.progressPercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>역할별 참여</h3>
        <ul className="org-role-list">
          {Object.entries(report.roleParticipation).map(([role, count]) => (
            <li key={role}>
              <strong>{ROLE_LABELS[role as UserRole] ?? role}</strong>
              <span>{count}명</span>
            </li>
          ))}
        </ul>

        <h3>인사이트</h3>
        <ul>
          {report.anonymousInsights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
