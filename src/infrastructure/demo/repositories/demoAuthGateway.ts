import type { Session, UserProfile, UserRole } from '@/domain';
import type { AuthGateway } from '@/application/ports';
import { generateId, getDemoProfiles, getDemoState, saveDemoState } from '@/infrastructure/demo/demoState';
import { DEMO_ROLE_USER_MAP } from '@/infrastructure/demo/seed/users';

export class DemoAuthGateway implements AuthGateway {
  async getCurrentSession(): Promise<Session | null> {
    const state = getDemoState();
    return (state.session as Session | null) ?? null;
  }

  async signInDemoRole(role: UserRole): Promise<Session> {
    const userId = DEMO_ROLE_USER_MAP[role];
    const session: Session = {
      userId,
      role,
      isDemo: true,
    };
    const state = getDemoState();
    state.session = session;
    saveDemoState(state);
    return session;
  }

  async signUpDemo(input: {
    role: UserRole;
    displayName: string;
    email?: string;
  }): Promise<Session> {
    const state = getDemoState();
    const userId = generateId('user');
    const profile: UserProfile = {
      id: userId,
      displayName: input.displayName.trim(),
      organizationId: 'org-hanbit',
      teamIds: input.role === 'athlete' ? ['team-hanbit-baseball'] : [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    void input.email;
    state.profiles = [...(state.profiles as UserProfile[]), profile];
    state.memberships = [
      ...(state.memberships as Array<{
        id: string;
        organizationId: string;
        userId: string;
        role: UserRole;
        teamIds: string[];
      }>),
      {
        id: generateId('member'),
        organizationId: 'org-hanbit',
        userId,
        role: input.role,
        teamIds: profile.teamIds,
      },
    ];
    const session: Session = {
      userId,
      role: input.role,
      isDemo: true,
    };
    state.session = session;
    saveDemoState(state);
    return session;
  }

  async signOut(): Promise<void> {
    const state = getDemoState();
    state.session = null;
    saveDemoState(state);
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const session = await this.getCurrentSession();
    if (!session) return null;
    return getDemoProfiles().find((p) => p.id === session.userId) ?? null;
  }

  async requestPasswordReset(email: string) {
    void email;
    return {
      demoOnly: true as const,
      message: '운영 백엔드 연결 후 활성화되는 기능입니다.',
    };
  }

  async requestGuardianConsent(input: {
    athleteUserId: string;
    guardianName: string;
    guardianEmail: string;
  }) {
    const state = getDemoState();
    state.guardianRelationships.push({
      id: generateId('consent'),
      guardianUserId: 'user-guardian-1',
      athleteUserId: input.athleteUserId,
      status: 'pending_guardian_consent',
      requestedAt: new Date().toISOString(),
    });
    const profile = (state.profiles as UserProfile[]).find((p) => p.id === input.athleteUserId);
    if (profile) profile.status = 'pending_guardian_consent';
    saveDemoState(state);
    return { status: 'pending_guardian_consent' as const, demoOnly: true as const };
  }

  async approveGuardianConsent(consentId: string): Promise<void> {
    const state = getDemoState();
    const consent = state.guardianRelationships.find((c) => (c as { id: string }).id === consentId) as
      | { id: string; athleteUserId: string; status: string }
      | undefined;
    if (consent) {
      consent.status = 'active';
      const profile = (state.profiles as UserProfile[]).find((p) => p.id === consent.athleteUserId);
      if (profile) profile.status = 'active';
    }
    saveDemoState(state);
  }

  async rejectGuardianConsent(consentId: string): Promise<void> {
    const state = getDemoState();
    const consent = state.guardianRelationships.find((c) => (c as { id: string }).id === consentId) as
      | { id: string; athleteUserId: string; status: string }
      | undefined;
    if (consent) {
      consent.status = 'rejected';
      const profile = (state.profiles as UserProfile[]).find((p) => p.id === consent.athleteUserId);
      if (profile) profile.status = 'rejected';
    }
    saveDemoState(state);
  }
}
