import type {
  CourseAssignment,
  CourseProgress,
  Organization,
  OrganizationMembership,
  Team,
  UserProfile,
  UserRole,
} from '@/domain';
import type {
  OrgMemberProgressRow,
  OrgTeamProgressRow,
  OrganizationRepository,
} from '@/application/ports';
import {
  generateId,
  getDemoMemberships,
  getDemoOrganizations,
  getDemoState,
  getDemoTeams,
  saveDemoState,
  getDemoProfiles,
} from '@/infrastructure/demo/demoState';

type MemberWithName = OrganizationMembership & { displayName?: string };

function syncTeamMemberCounts(state: ReturnType<typeof getDemoState>) {
  const memberships = state.memberships as OrganizationMembership[];
  const teams = state.teams as Team[];
  for (const team of teams) {
    team.memberCount = memberships.filter((m) => m.teamIds.includes(team.id)).length;
  }
}

function syncProfileTeams(state: ReturnType<typeof getDemoState>, userId: string, teamIds: string[]) {
  const profile = (state.profiles as UserProfile[]).find((p) => p.id === userId);
  if (profile) profile.teamIds = [...teamIds];
}

export class DemoOrganizationRepository implements OrganizationRepository {
  async getOrganization(orgId: string): Promise<Organization | null> {
    return getDemoOrganizations().find((o) => o.id === orgId) ?? null;
  }

  async listMembers(orgId: string): Promise<MemberWithName[]> {
    return getDemoMemberships()
      .filter((m) => m.organizationId === orgId)
      .map((m) => {
        const profile = getDemoProfiles().find((p) => p.id === m.userId);
        return { ...m, displayName: profile?.displayName };
      });
  }

  async listTeams(orgId: string): Promise<Team[]> {
    return getDemoTeams().filter((t) => t.organizationId === orgId);
  }

  async createTeam(orgId: string, name: string): Promise<Team> {
    const state = getDemoState();
    const team: Team = {
      id: generateId('team'),
      organizationId: orgId,
      name: name.trim(),
      memberCount: 0,
    };
    (state.teams as Team[]).push(team);
    saveDemoState(state);
    return team;
  }

  async updateTeam(teamId: string, name: string): Promise<Team> {
    const state = getDemoState();
    const team = (state.teams as Team[]).find((t) => t.id === teamId);
    if (!team) throw new Error('팀을 찾을 수 없습니다.');
    team.name = name.trim();
    saveDemoState(state);
    return team;
  }

  async deleteTeam(teamId: string): Promise<void> {
    const state = getDemoState();
    state.teams = (state.teams as Team[]).filter((t) => t.id !== teamId);
    for (const member of state.memberships as OrganizationMembership[]) {
      if (member.teamIds.includes(teamId)) {
        member.teamIds = member.teamIds.filter((id) => id !== teamId);
        syncProfileTeams(state, member.userId, member.teamIds);
      }
    }
    for (const assignment of state.assignments as CourseAssignment[]) {
      assignment.targetTeamIds = assignment.targetTeamIds.filter((id) => id !== teamId);
    }
    syncTeamMemberCounts(state);
    saveDemoState(state);
  }

  async assignMemberToTeam(memberId: string, teamId: string): Promise<void> {
    const state = getDemoState();
    const member = (state.memberships as OrganizationMembership[]).find((m) => m.id === memberId);
    if (!member) return;
    if (!member.teamIds.includes(teamId)) {
      member.teamIds = [...member.teamIds, teamId];
      syncProfileTeams(state, member.userId, member.teamIds);
    }
    syncTeamMemberCounts(state);
    saveDemoState(state);
  }

  async setMemberTeams(memberId: string, teamIds: string[]): Promise<void> {
    const state = getDemoState();
    const member = (state.memberships as OrganizationMembership[]).find((m) => m.id === memberId);
    if (!member) return;
    const unique = [...new Set(teamIds)];
    member.teamIds = unique;
    syncProfileTeams(state, member.userId, unique);
    syncTeamMemberCounts(state);
    saveDemoState(state);
  }

  async listAssignments(orgId: string): Promise<CourseAssignment[]> {
    return (getDemoState().assignments as CourseAssignment[]).filter((a) => a.organizationId === orgId);
  }

  async createAssignment(assignment: Omit<CourseAssignment, 'id'>): Promise<CourseAssignment> {
    const state = getDemoState();
    const next: CourseAssignment = { ...assignment, id: generateId('assign') };
    (state.assignments as CourseAssignment[]).push(next);
    saveDemoState(state);
    return next;
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    const state = getDemoState();
    state.assignments = (state.assignments as CourseAssignment[]).filter((a) => a.id !== assignmentId);
    saveDemoState(state);
  }

  async getOrganizationProgress(orgId: string) {
    const members = await this.listMembers(orgId);
    const state = getDemoState();
    const progress = state.courseProgress as CourseProgress[];
    const memberIds = new Set(members.map((m) => m.userId));
    const relevant = progress.filter((p) => memberIds.has(p.userId));
    const started = relevant.filter((p) => p.progressPercent > 0).length;
    const completed = relevant.filter((p) => p.completedAt).length;
    const avg =
      relevant.length === 0
        ? 0
        : Math.round(relevant.reduce((s, p) => s + p.progressPercent, 0) / relevant.length);
    const assignments = (state.assignments as CourseAssignment[]).filter((a) => a.organizationId === orgId);

    return {
      totalMembers: members.length,
      assigned: assignments.length,
      started,
      completed,
      inProgress: Math.max(0, started - completed),
      averageProgress: avg,
    };
  }

  async getDetailedProgress(orgId: string): Promise<{
    teams: OrgTeamProgressRow[];
    members: OrgMemberProgressRow[];
  }> {
    const [members, teams, assignments] = await Promise.all([
      this.listMembers(orgId),
      this.listTeams(orgId),
      this.listAssignments(orgId),
    ]);
    const progress = getDemoState().courseProgress as CourseProgress[];

    const memberRows: OrgMemberProgressRow[] = members.map((m) => {
      const userAssignments = assignments.filter(
        (a) =>
          a.targetUserIds.includes(m.userId) ||
          a.targetTeamIds.some((tid) => m.teamIds.includes(tid)),
      );
      const courseIds = [...new Set(userAssignments.map((a) => a.courseId))];
      const userProgress = progress.filter(
        (p) => p.userId === m.userId && (courseIds.length === 0 || courseIds.includes(p.courseId)),
      );
      const avg =
        userProgress.length === 0
          ? 0
          : Math.round(userProgress.reduce((s, p) => s + p.progressPercent, 0) / userProgress.length);
      return {
        userId: m.userId,
        displayName: m.displayName ?? m.userId,
        role: m.role,
        teamIds: m.teamIds,
        teamNames: m.teamIds.map((tid) => teams.find((t) => t.id === tid)?.name ?? tid),
        assignedCourses: courseIds.length,
        averageProgress: avg,
        completedCourses: userProgress.filter((p) => p.completedAt).length,
        startedCourses: userProgress.filter((p) => p.progressPercent > 0).length,
      };
    });

    const teamRows: OrgTeamProgressRow[] = teams.map((team) => {
      const teamMembers = memberRows.filter((m) => m.teamIds.includes(team.id));
      const teamAssignments = assignments.filter((a) => a.targetTeamIds.includes(team.id));
      const avg =
        teamMembers.length === 0
          ? 0
          : Math.round(teamMembers.reduce((s, m) => s + m.averageProgress, 0) / teamMembers.length);
      return {
        teamId: team.id,
        teamName: team.name,
        memberCount: teamMembers.length,
        assignedCourses: new Set(teamAssignments.map((a) => a.courseId)).size,
        averageProgress: avg,
        startedMembers: teamMembers.filter((m) => m.startedCourses > 0 || m.averageProgress > 0).length,
        completedMembers: teamMembers.filter(
          (m) => m.assignedCourses > 0 && m.completedCourses >= m.assignedCourses,
        ).length,
      };
    });

    return {
      teams: teamRows.sort((a, b) => a.teamName.localeCompare(b.teamName, 'ko')),
      members: memberRows.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko')),
    };
  }

  async addDemoMember(
    orgId: string,
    input: { displayName: string; role: UserRole; teamId?: string },
  ): Promise<OrganizationMembership> {
    const state = getDemoState();
    const userId = generateId('user-demo');
    state.profiles.push({
      id: userId,
      displayName: input.displayName,
      organizationId: orgId,
      teamIds: input.teamId ? [input.teamId] : [],
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    const membership: OrganizationMembership = {
      id: generateId('member'),
      organizationId: orgId,
      userId,
      role: input.role,
      teamIds: input.teamId ? [input.teamId] : [],
    };
    (state.memberships as OrganizationMembership[]).push(membership);
    syncTeamMemberCounts(state);
    saveDemoState(state);
    return membership;
  }

  async importDemoMembers(
    orgId: string,
    rows: Array<{ displayName: string; email: string; role: UserRole }>,
  ) {
    const valid: OrganizationMembership[] = [];
    const errors: Array<{ row: number; message: string }> = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      if (!row.displayName.trim()) {
        errors.push({ row: rowNum, message: '이름은 필수입니다.' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({ row: rowNum, message: '이메일 형식이 올바르지 않습니다.' });
        return;
      }
      if (row.displayName.startsWith('=') || row.email.startsWith('=')) {
        errors.push({ row: rowNum, message: '수식 삽입 위험이 있는 값입니다.' });
        return;
      }
      valid.push({
        id: generateId('member'),
        organizationId: orgId,
        userId: generateId('user-import'),
        role: row.role,
        teamIds: [],
      });
    });

    if (valid.length) {
      const state = getDemoState();
      (state.memberships as OrganizationMembership[]).push(...valid);
      saveDemoState(state);
    }

    return { valid, errors };
  }
}
