import type { UserProfile, UserRole, Team, GuardianRelationship } from '@/domain';
import type { UserRepository } from '@/application/ports';
import {
  getDemoMemberships,
  getDemoProfiles,
  getDemoState,
  getDemoTeams,
  saveDemoState,
} from '@/infrastructure/demo/demoState';

export class DemoUserRepository implements UserRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    return getDemoProfiles().find((p) => p.id === userId) ?? null;
  }

  async updateProfile(userId: string, input: Partial<UserProfile>): Promise<UserProfile> {
    const state = getDemoState();
    const profiles = state.profiles as UserProfile[];
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx < 0) throw new Error('Profile not found');
    profiles[idx] = { ...profiles[idx], ...input };
    save(state);
    return profiles[idx];
  }

  async getRoles(userId: string): Promise<UserRole[]> {
    return getDemoMemberships()
      .filter((m) => m.userId === userId)
      .map((m) => m.role);
  }

  async getGuardianRelationships(userId: string): Promise<GuardianRelationship[]> {
    const state = getDemoState();
    return (state.guardianRelationships as GuardianRelationship[]).filter(
      (r) => r.guardianUserId === userId || r.athleteUserId === userId,
    );
  }

  async getCoachTeams(userId: string): Promise<Team[]> {
    const membership = getDemoMemberships().find((m) => m.userId === userId && m.role === 'coach');
    if (!membership) return [];
    return getDemoTeams().filter((t) => membership.teamIds.includes(t.id));
  }
}

function save(state: ReturnType<typeof getDemoState>) {
  saveDemoState(state);
}
