import type {
  CourseProgress,
  GuardianRelationship,
  OrganizationMembership,
  PracticeCommitment,
  ScenarioAttempt,
  Team,
  UserProfile,
} from '@/domain';
import { shouldSuppressAnonymousStats } from '@/application/services/learningRules';

export interface AthleteDashboardView {
  greeting: string;
  continueLearning?: { courseId: string; courseTitle: string; lessonId: string; lessonTitle: string };
  assignedCourses: Array<{ id: string; title: string; progressPercent: number; dueDate?: string; lessonId?: string }>;
  dueSoon: Array<{ id: string; title: string; dueDate: string }>;
  recentCommitments: Array<{ id: string; text: string; createdAt: string }>;
  certificates: Array<{ id: string; courseTitle: string; completedAt: string }>;
  recommended: Array<{ id: string; title: string }>;
}

export interface GuardianChildSummaryView {
  athleteId: string;
  displayName: string;
  assignedCount: number;
  started: boolean;
  completedCount: number;
}

export interface GuardianDashboardView {
  consentRequests: GuardianRelationship[];
  ownCourses: Array<{ id: string; title: string; progressPercent: number }>;
  children: GuardianChildSummaryView[];
  resources: Array<{ id: string; title: string; category: string }>;
  certificates: Array<{ id: string; courseTitle: string }>;
}

export interface CoachTeamProgressView {
  teamId: string;
  teamName: string;
  assignedCount: number;
  startedCount: number;
  completedCount: number;
  dueSoon: Array<{ courseTitle: string; dueDate: string }>;
  suppressDetail: boolean;
}

export interface CoachDashboardView {
  ownCourses: Array<{ id: string; title: string; progressPercent: number }>;
  continueLearning?: { courseId: string; lessonId: string; title: string };
  teams: CoachTeamProgressView[];
  guides: Array<{ id: string; title: string }>;
}

export interface OrganizationAnonymousInsights {
  participantCount: number;
  suppressed: boolean;
  message?: string;
  valueEngagement?: Record<string, number>;
  completionByCourse?: Array<{ courseTitle: string; rate: number }>;
}

export function getAthletePrivateLearningView(input: {
  profile: UserProfile;
  commitments: PracticeCommitment[];
  scenarioAttempts: ScenarioAttempt[];
}): {
  commitments: PracticeCommitment[];
  scenarioAttempts: ScenarioAttempt[];
} {
  return {
    commitments: input.commitments.filter((c) => c.userId === input.profile.id),
    scenarioAttempts: input.scenarioAttempts.filter((a) => a.userId === input.profile.id),
  };
}

export function getGuardianChildSummaryView(input: {
  athlete: UserProfile;
  assignedCount: number;
  started: boolean;
  completedCount: number;
}): GuardianChildSummaryView {
  return {
    athleteId: input.athlete.id,
    displayName: input.athlete.displayName,
    assignedCount: input.assignedCount,
    started: input.started,
    completedCount: input.completedCount,
  };
}

export function getCoachTeamProgressView(input: {
  team: Team;
  assignedCount: number;
  startedCount: number;
  completedCount: number;
  dueSoon: Array<{ courseTitle: string; dueDate: string }>;
}): CoachTeamProgressView {
  const suppressDetail = shouldSuppressAnonymousStats(input.team.memberCount);
  return {
    teamId: input.team.id,
    teamName: input.team.name,
    assignedCount: input.assignedCount,
    startedCount: input.startedCount,
    completedCount: input.completedCount,
    dueSoon: suppressDetail ? [] : input.dueSoon,
    suppressDetail,
  };
}

export function getOrganizationAnonymousInsights(
  participantCount: number,
  data?: { valueEngagement: Record<string, number>; completionByCourse: Array<{ courseTitle: string; rate: number }> },
): OrganizationAnonymousInsights {
  if (shouldSuppressAnonymousStats(participantCount)) {
    return {
      participantCount,
      suppressed: true,
      message: '개인정보 보호를 위해 참여자가 5명 미만인 집단의 세부 결과는 제공하지 않습니다.',
    };
  }
  return {
    participantCount,
    suppressed: false,
    valueEngagement: data?.valueEngagement,
    completionByCourse: data?.completionByCourse,
  };
}

export function filterCommitmentsForRole(
  commitments: PracticeCommitment[],
  role: string,
): PracticeCommitment[] {
  if (role === 'org_manager' || role === 'coach') {
    return [];
  }
  return commitments;
}

export function filterScenarioAttemptsForRole(
  attempts: ScenarioAttempt[],
  role: string,
): ScenarioAttempt[] {
  if (role === 'org_manager' || role === 'coach') {
    return [];
  }
  return attempts;
}

export function buildAthleteDashboard(input: {
  profile: UserProfile;
  courseProgress: CourseProgress[];
  commitments: PracticeCommitment[];
  assigned: Array<{ id: string; title: string; progressPercent: number; dueDate?: string; lessonId?: string }>;
  certificates: Array<{ id: string; courseTitle: string; completedAt: string }>;
  recommended: Array<{ id: string; title: string }>;
  continueLearning?: AthleteDashboardView['continueLearning'];
}): AthleteDashboardView {
  const dueSoon = input.assigned
    .filter((c) => c.dueDate)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 3)
    .map((c) => ({ id: c.id, title: c.title, dueDate: c.dueDate! }));

  return {
    greeting: `${input.profile.displayName} 선수님, 오늘도 좋은 선택을 훈련해 보세요.`,
    continueLearning: input.continueLearning,
    assignedCourses: input.assigned,
    dueSoon,
    recentCommitments: input.commitments.slice(0, 3).map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
    })),
    certificates: input.certificates,
    recommended: input.recommended,
  };
}

export function buildOrganizationMemberSummary(
  members: OrganizationMembership[],
): { byRole: Record<string, number>; total: number } {
  const byRole: Record<string, number> = {};
  for (const m of members) {
    byRole[m.role] = (byRole[m.role] ?? 0) + 1;
  }
  return { byRole, total: members.length };
}

export function excludePrivateFieldsFromMember(
  member: OrganizationMembership & { displayName?: string },
): { id: string; role: string; teamIds: string[]; displayName?: string } {
  return {
    id: member.id,
    role: member.role,
    teamIds: member.teamIds,
    displayName: member.displayName,
  };
}
