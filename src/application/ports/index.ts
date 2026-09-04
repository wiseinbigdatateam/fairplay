import type {
  Certificate,
  Course,
  CourseAssignment,
  CourseCompletion,
  CourseProgress,
  ExamAttempt,
  ExamQuestion,
  GuardianRelationship,
  HomeworkAttachment,
  HomeworkSubmission,
  HomeworkTask,
  Lesson,
  LessonProgress,
  Organization,
  OrganizationMembership,
  PracticeCommitment,
  QuizAttempt,
  ScenarioAttempt,
  Session,
  Team,
  UserProfile,
  UserRole,
} from '@/domain';

export interface AuthGateway {
  getCurrentSession(): Promise<Session | null>;
  signInDemoRole(role: UserRole): Promise<Session>;
  signUpDemo(input: { role: UserRole; displayName: string; email?: string }): Promise<Session>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<UserProfile | null>;
  requestPasswordReset(email: string): Promise<{ demoOnly: true; message: string }>;
  requestGuardianConsent(input: {
    athleteUserId: string;
    guardianName: string;
    guardianEmail: string;
  }): Promise<{ status: 'pending_guardian_consent'; demoOnly: true }>;
  approveGuardianConsent(consentId: string): Promise<void>;
  rejectGuardianConsent(consentId: string): Promise<void>;
}

export interface UserRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, input: Partial<UserProfile>): Promise<UserProfile>;
  getRoles(userId: string): Promise<UserRole[]>;
  getGuardianRelationships(userId: string): Promise<GuardianRelationship[]>;
  getCoachTeams(userId: string): Promise<Team[]>;
}

export interface CourseRepository {
  listPublishedCourses(): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  listCoursesForRole(role: UserRole): Promise<Course[]>;
  listAssignedCourses(userId: string): Promise<Course[]>;
  listRecommendedCourses(userId: string): Promise<Course[]>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  saveCourse(course: Course): Promise<Course>;
  deleteCourse(courseId: string): Promise<void>;
  listAllCourses(): Promise<Course[]>;
}

export interface LearningRepository {
  getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null>;
  getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null>;
  saveLessonProgress(progress: LessonProgress): Promise<LessonProgress>;
  saveCourseProgress(progress: CourseProgress): Promise<CourseProgress>;
  saveScenarioAttempt(attempt: ScenarioAttempt): Promise<ScenarioAttempt>;
  saveQuizAttempt(attempt: QuizAttempt): Promise<QuizAttempt>;
  saveCommitment(commitment: PracticeCommitment): Promise<PracticeCommitment>;
  getCommitments(userId: string): Promise<PracticeCommitment[]>;
  getCompletions(userId: string): Promise<CourseCompletion[]>;
  getScenarioAttempts(userId: string, scenarioId: string): Promise<ScenarioAttempt[]>;
  getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]>;
}

export interface ExamRepository {
  listQuestionsByCourse(courseId: string): Promise<ExamQuestion[]>;
  listAllQuestions(): Promise<ExamQuestion[]>;
  saveQuestion(
    input: Omit<ExamQuestion, 'id' | 'createdAt' | 'order'> & { id?: string; order?: number },
  ): Promise<ExamQuestion>;
  deleteQuestion(questionId: string): Promise<void>;
  listAttemptsByUser(userId: string): Promise<ExamAttempt[]>;
  listAttemptsByCourse(courseId: string): Promise<ExamAttempt[]>;
  listAllAttempts(): Promise<ExamAttempt[]>;
  getAttempt(attemptId: string): Promise<ExamAttempt | null>;
  saveAttempt(attempt: Omit<ExamAttempt, 'id'> & { id?: string }): Promise<ExamAttempt>;
}

export interface HomeworkRepository {
  listTasks(): Promise<HomeworkTask[]>;
  getTaskByCourse(courseId: string): Promise<HomeworkTask | null>;
  saveTask(
    input: Omit<HomeworkTask, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<HomeworkTask>;
  deleteTask(taskId: string): Promise<void>;
  listByUser(userId: string): Promise<HomeworkSubmission[]>;
  listByCourse(courseId: string): Promise<HomeworkSubmission[]>;
  listAll(): Promise<HomeworkSubmission[]>;
  getById(id: string): Promise<HomeworkSubmission | null>;
  getLatestByUserAndCourse(userId: string, courseId: string): Promise<HomeworkSubmission | null>;
  submit(input: {
    userId: string;
    courseId: string;
    homeworkTaskId: string;
    content: string;
    attachments: Omit<HomeworkAttachment, 'id'>[];
    maxScore?: number;
  }): Promise<HomeworkSubmission>;
  grade(input: {
    submissionId: string;
    score: number;
    maxScore: number;
    feedback?: string;
    gradedByUserId: string;
  }): Promise<HomeworkSubmission>;
}

export interface OrgMemberProgressRow {
  userId: string;
  displayName: string;
  role: UserRole;
  teamIds: string[];
  teamNames: string[];
  assignedCourses: number;
  averageProgress: number;
  completedCourses: number;
  startedCourses: number;
}

export interface OrgTeamProgressRow {
  teamId: string;
  teamName: string;
  memberCount: number;
  assignedCourses: number;
  averageProgress: number;
  startedMembers: number;
  completedMembers: number;
}

export interface OrganizationRepository {
  getOrganization(orgId: string): Promise<Organization | null>;
  listMembers(orgId: string): Promise<Array<OrganizationMembership & { displayName?: string }>>;
  listTeams(orgId: string): Promise<Team[]>;
  createTeam(orgId: string, name: string): Promise<Team>;
  updateTeam(teamId: string, name: string): Promise<Team>;
  deleteTeam(teamId: string): Promise<void>;
  assignMemberToTeam(memberId: string, teamId: string): Promise<void>;
  setMemberTeams(memberId: string, teamIds: string[]): Promise<void>;
  listAssignments(orgId: string): Promise<CourseAssignment[]>;
  createAssignment(assignment: Omit<CourseAssignment, 'id'>): Promise<CourseAssignment>;
  deleteAssignment(assignmentId: string): Promise<void>;
  getOrganizationProgress(orgId: string): Promise<{
    totalMembers: number;
    assigned: number;
    started: number;
    completed: number;
    inProgress: number;
    averageProgress: number;
  }>;
  getDetailedProgress(orgId: string): Promise<{
    teams: OrgTeamProgressRow[];
    members: OrgMemberProgressRow[];
  }>;
  addDemoMember(orgId: string, input: { displayName: string; role: UserRole; teamId?: string }): Promise<OrganizationMembership>;
  importDemoMembers(orgId: string, rows: Array<{ displayName: string; email: string; role: UserRole }>): Promise<{
    valid: OrganizationMembership[];
    errors: Array<{ row: number; message: string }>;
  }>;
}

export interface CertificateRepository {
  listCertificates(userId: string): Promise<Certificate[]>;
  getCertificate(certificateId: string): Promise<Certificate | null>;
  createDemoCertificatePreview(input: {
    userId: string;
    courseId: string;
  }): Promise<Certificate>;
  verifyCertificate(code: string): Promise<Certificate | null>;
}

export interface ReportRepository {
  getOrganizationReport(orgId: string): Promise<{
    organizationName: string;
    period: string;
    assigned: number;
    started: number;
    completed: number;
    completionRate: number;
    roleParticipation: Record<string, number>;
    courseProgress: Array<{ courseTitle: string; progressPercent: number }>;
    anonymousInsights: string[];
    isDemo: true;
  }>;
  exportDemoReport(orgId: string): Promise<{ filename: string; content: string; mimeType: string }>;
}

export interface FileStorage {
  getPublicAsset(ref: { bucket: string; objectKey: string }): string;
  getSignedAsset(ref: { bucket: string; objectKey: string }): Promise<string>;
  upload(): Promise<never>;
  remove(): Promise<never>;
}

export interface AppDependencies {
  authGateway: AuthGateway;
  userRepository: UserRepository;
  courseRepository: CourseRepository;
  learningRepository: LearningRepository;
  examRepository: ExamRepository;
  homeworkRepository: HomeworkRepository;
  organizationRepository: OrganizationRepository;
  certificateRepository: CertificateRepository;
  reportRepository: ReportRepository;
  fileStorage: FileStorage;
}
