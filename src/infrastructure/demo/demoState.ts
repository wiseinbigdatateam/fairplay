import type {
  Announcement,
  Course,
  CourseAssignment,
  ExamAttempt,
  ExamQuestion,
  GuardianRelationship,
  HomeworkSubmission,
  HomeworkTask,
  Lesson,
  Organization,
  OrganizationMembership,
  QnaPost,
  Quiz,
  Resource,
  ScenarioCase,
  Team,
  UserProfile,
} from '@/domain';
import {
  CURRENT_DEMO_SCHEMA_VERSION,
  clearDemoStorage,
  needsSchemaMigration,
  readDemoState,
  writeDemoState,
  writeSchemaVersion,
  type DemoPersistedState,
} from '@/infrastructure/demo/storage/demoStorage';
import { createDefaultLessons, createSeedCourses } from '@/infrastructure/demo/seed/courses';
import {
  seedAnnouncements,
  seedExamQuestions,
  seedHomeworkTasks,
  seedQnaPosts,
  seedQuizzes,
  seedResources,
  seedScenarios,
} from '@/infrastructure/demo/seed/content';
import { DEMO_ORGS, DEMO_TEAMS, DEMO_USERS, seedMemberships } from '@/infrastructure/demo/seed/users';

function createInitialState(): DemoPersistedState {
  const courses = createSeedCourses();
  const lessons = createDefaultLessons(courses);
  return {
    session: null,
    profiles: DEMO_USERS,
    memberships: seedMemberships(),
    teams: DEMO_TEAMS,
    courses,
    lessons,
    scenarios: seedScenarios(),
    quizzes: seedQuizzes(),
    lessonProgress: [],
    courseProgress: seedDemoCourseProgress(),
    scenarioAttempts: [],
    quizAttempts: [],
    examQuestions: seedExamQuestions(),
    examAttempts: [],
    homeworkTasks: seedHomeworkTasks(),
    homeworkSubmissions: [],
    commitments: [],
    completions: [],
    certificates: [],
    assignments: seedAssignments(),
    guardianRelationships: seedGuardianRelationships(),
    auditLogs: [],
    announcements: seedAnnouncements(),
    qnaPosts: seedQnaPosts(),
    resources: seedResources(),
  };
}

/** 데모: 시험 응시 가능하도록 주요 과정 진도 시드 */
function seedDemoCourseProgress() {
  const now = '2026-03-20T10:00:00.000Z';
  return [
    {
      id: 'cp-user-athlete-1-course-athlete-1',
      userId: 'user-athlete-1',
      courseId: 'course-athlete-1',
      startedAt: now,
      lastAccessedAt: now,
      progressPercent: 100,
      completedAt: now,
    },
    {
      id: 'cp-user-guardian-1-course-guardian-1',
      userId: 'user-guardian-1',
      courseId: 'course-guardian-1',
      startedAt: now,
      lastAccessedAt: now,
      progressPercent: 100,
      completedAt: now,
    },
    {
      id: 'cp-user-coach-1-course-coach-1',
      userId: 'user-coach-1',
      courseId: 'course-coach-1',
      startedAt: now,
      lastAccessedAt: now,
      progressPercent: 100,
      completedAt: now,
    },
  ];
}

function seedAssignments(): CourseAssignment[] {
  return [
    {
      id: 'assign-1',
      organizationId: 'org-hanbit',
      courseId: 'course-athlete-1',
      targetTeamIds: ['team-hanbit-baseball'],
      targetUserIds: ['user-athlete-1'],
      required: true,
      startDate: '2026-03-01',
      dueDate: '2026-06-30',
    },
    {
      id: 'assign-2',
      organizationId: 'org-hanbit',
      courseId: 'course-coach-1',
      targetTeamIds: [],
      targetUserIds: ['user-coach-1'],
      required: true,
      startDate: '2026-03-01',
      dueDate: '2026-06-30',
    },
    {
      id: 'assign-3',
      organizationId: 'org-hanbit',
      courseId: 'course-guardian-1',
      targetTeamIds: [],
      targetUserIds: ['user-guardian-1'],
      required: true,
      startDate: '2026-03-01',
      dueDate: '2026-06-30',
    },
  ];
}

function seedGuardianRelationships(): GuardianRelationship[] {
  return [
    {
      id: 'consent-1',
      guardianUserId: 'user-guardian-1',
      athleteUserId: 'user-athlete-pending',
      status: 'pending_guardian_consent',
      requestedAt: '2026-08-01T09:00:00.000Z',
    },
  ];
}

let memoryState: DemoPersistedState | null = null;

export function getDemoState(): DemoPersistedState {
  if (typeof window === 'undefined') {
    if (!memoryState) memoryState = createInitialState();
    return memoryState;
  }

  if (needsSchemaMigration()) {
    clearDemoStorage();
    writeSchemaVersion(CURRENT_DEMO_SCHEMA_VERSION);
  }

  const stored = readDemoState();
  if (!stored) {
    const initial = createInitialState();
    writeDemoState(initial);
    writeSchemaVersion(CURRENT_DEMO_SCHEMA_VERSION);
    return initial;
  }
  return stored;
}

export function saveDemoState(state: DemoPersistedState): void {
  if (typeof window === 'undefined') {
    memoryState = state;
    return;
  }
  writeDemoState(state);
}

export function resetDemoData(): void {
  if (typeof window !== 'undefined') {
    clearDemoStorage();
    writeSchemaVersion(CURRENT_DEMO_SCHEMA_VERSION);
  }
  const initial = createInitialState();
  saveDemoState(initial);
}

export function getDemoOrganizations(): Organization[] {
  return DEMO_ORGS;
}

export function getDemoProfiles(): UserProfile[] {
  return getDemoState().profiles as UserProfile[];
}

export function getDemoCourses(): Course[] {
  return getDemoState().courses as Course[];
}

export function getDemoLessons(): Lesson[] {
  return getDemoState().lessons as Lesson[];
}

export function getDemoScenarios(): ScenarioCase[] {
  return getDemoState().scenarios as ScenarioCase[];
}

export function getDemoQuizzes(): Quiz[] {
  return getDemoState().quizzes as Quiz[];
}

export function getDemoTeams(): Team[] {
  return getDemoState().teams as Team[];
}

export function getDemoMemberships(): OrganizationMembership[] {
  return getDemoState().memberships as OrganizationMembership[];
}

export function getDemoAnnouncements(): Announcement[] {
  return getDemoState().announcements as Announcement[];
}

export function getDemoQnaPosts(): QnaPost[] {
  const state = getDemoState();
  if (!Array.isArray(state.qnaPosts) || state.qnaPosts.length === 0) {
    const seeded = seedQnaPosts();
    state.qnaPosts = seeded;
    saveDemoState(state);
    return seeded;
  }
  return state.qnaPosts as QnaPost[];
}

export function addDemoQnaPost(post: Omit<QnaPost, 'id' | 'createdAt' | 'viewCount' | 'status'>): QnaPost {
  const state = getDemoState();
  const newPost: QnaPost = {
    ...post,
    id: generateId('qna'),
    createdAt: new Date().toISOString(),
    viewCount: 0,
    status: 'pending',
  };
  state.qnaPosts = [newPost, ...(state.qnaPosts as QnaPost[])];
  writeDemoState(state);
  return newPost;
}

export function getDemoResources(): Resource[] {
  return getDemoState().resources as Resource[];
}

export function getDemoExamQuestions(): ExamQuestion[] {
  const state = getDemoState();
  if (!Array.isArray(state.examQuestions)) {
    state.examQuestions = seedExamQuestions();
    saveDemoState(state);
  }
  return state.examQuestions as ExamQuestion[];
}

export function getDemoExamAttempts(): ExamAttempt[] {
  const state = getDemoState();
  if (!Array.isArray(state.examAttempts)) {
    state.examAttempts = [];
    saveDemoState(state);
  }
  return state.examAttempts as ExamAttempt[];
}

export function getDemoHomeworkSubmissions(): HomeworkSubmission[] {
  const state = getDemoState();
  if (!Array.isArray(state.homeworkSubmissions)) {
    state.homeworkSubmissions = [];
    saveDemoState(state);
  }
  return state.homeworkSubmissions as HomeworkSubmission[];
}

export function getDemoHomeworkTasks(): HomeworkTask[] {
  const state = getDemoState();
  if (!Array.isArray(state.homeworkTasks) || state.homeworkTasks.length === 0) {
    const seeded = seedHomeworkTasks();
    state.homeworkTasks = seeded;
    saveDemoState(state);
    return seeded;
  }
  return state.homeworkTasks as HomeworkTask[];
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
