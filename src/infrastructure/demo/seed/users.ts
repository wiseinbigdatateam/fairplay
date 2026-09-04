import type { Organization, Team, UserProfile, UserRole, OrganizationMembership } from '@/domain';

export const DEMO_ORGS: Organization[] = [
  {
    id: 'org-hanbit',
    name: '한빛학생스포츠센터',
    slug: 'hanbit-demo',
    description: '기관교육 파트너',
  },
  {
    id: 'org-saebom',
    name: '새봄유소년스포츠클럽',
    slug: 'saebom-demo',
    description: '기관교육 파트너',
  },
];

export const DEMO_TEAMS: Team[] = [
  { id: 'team-hanbit-baseball', organizationId: 'org-hanbit', name: '한빛고등학교 야구부', memberCount: 6 },
  { id: 'team-saebom-badminton', organizationId: 'org-saebom', name: '새봄중학교 배드민턴', memberCount: 4 },
  { id: 'team-dream-track', organizationId: 'org-hanbit', name: '드림스타 육상', memberCount: 8 },
  { id: 'team-wheelchair', organizationId: 'org-saebom', name: '함께하는 휠체어농구', memberCount: 5 },
];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-athlete-1',
    displayName: '김페어',
    organizationId: 'org-hanbit',
    teamIds: ['team-hanbit-baseball'],
    status: 'active',
    birthYear: 2010,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-athlete-pending',
    displayName: '동의대기 선수',
    organizationId: 'org-hanbit',
    teamIds: ['team-hanbit-baseball'],
    status: 'pending_guardian_consent',
    birthYear: 2014,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'user-guardian-1',
    displayName: '이존중',
    organizationId: 'org-hanbit',
    teamIds: [],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-coach-1',
    displayName: '박책임',
    organizationId: 'org-hanbit',
    teamIds: ['team-hanbit-baseball', 'team-dream-track'],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-org-manager-1',
    displayName: '최공존',
    organizationId: 'org-hanbit',
    teamIds: [],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-content-manager-1',
    displayName: '정용기',
    organizationId: 'org-hanbit',
    teamIds: [],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-super-admin-1',
    displayName: '페어플레이',
    organizationId: 'org-hanbit',
    teamIds: [],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEMO_ROLE_USER_MAP: Record<UserRole, string> = {
  athlete: 'user-athlete-1',
  guardian: 'user-guardian-1',
  coach: 'user-coach-1',
  org_manager: 'user-org-manager-1',
  content_manager: 'user-content-manager-1',
  super_admin: 'user-super-admin-1',
};

export function seedMemberships(): OrganizationMembership[] {
  const entries: Array<[string, UserRole, string[], string]> = [
    ['user-athlete-1', 'athlete', ['team-hanbit-baseball'], 'org-hanbit'],
    ['user-athlete-pending', 'athlete', ['team-hanbit-baseball'], 'org-hanbit'],
    ['user-guardian-1', 'guardian', [], 'org-hanbit'],
    ['user-coach-1', 'coach', ['team-hanbit-baseball', 'team-dream-track'], 'org-hanbit'],
    ['user-org-manager-1', 'org_manager', [], 'org-hanbit'],
    ['user-content-manager-1', 'content_manager', [], 'org-hanbit'],
    ['user-super-admin-1', 'super_admin', [], 'org-hanbit'],
  ];
  return entries.map(([userId, role, teamIds, orgId], i) => ({
    id: `member-${i + 1}`,
    organizationId: orgId,
    userId,
    role,
    teamIds,
  }));
}
