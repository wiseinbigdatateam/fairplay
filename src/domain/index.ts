export type ReleaseStage = 'prototype' | 'pilot' | 'production';
export type DataProvider = 'demo' | 'supabase';
export type AuthProvider = 'demo' | 'supabase' | 'cognito';

export type UserRole =
  | 'athlete'
  | 'guardian'
  | 'coach'
  | 'org_manager'
  | 'content_manager'
  | 'super_admin';

export type AccountStatus =
  | 'active'
  | 'pending_guardian_consent'
  | 'rejected'
  | 'expired';

export type ContentStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'suspended'
  | 'archived';

export type FairPlayValue =
  | 'fairness'
  | 'respect'
  | 'responsibility'
  | 'coexistence'
  | 'courage';

export interface StorageObjectReference {
  provider: 'demo' | 'supabase' | 's3';
  bucket: string;
  objectKey: string;
  contentType?: string;
  originalFileName?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  organizationId?: string;
  teamIds: string[];
  status: AccountStatus;
  birthYear?: number;
  createdAt: string;
}

export interface UserIdentity {
  userId: string;
  provider: AuthProvider;
  providerSubject: string;
}

export interface GuardianRelationship {
  id: string;
  guardianUserId: string;
  athleteUserId: string;
  status: AccountStatus;
  requestedAt: string;
  respondedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  teamIds: string[];
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  memberCount: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetRole: UserRole;
  targetAgeGroup?: string;
  values: FairPlayValue[];
  estimatedMinutes: number;
  thumbnail?: StorageObjectReference;
  learningObjectives: string[];
  modules: Module[];
  completionRules: CourseCompletionRules;
  status: ContentStatus;
  version: number;
}

export interface CourseCompletionRules {
  requiredLessonPercent: number;
  requiredScenarioComplete: boolean;
  minimumQuizScore: number;
  commitmentRequired: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessonIds: string[];
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  required: boolean;
  blocks: LessonBlock[];
}

export type LessonBlock =
  | TitleBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | QuoteBlock
  | KeyPointsBlock
  | ScenarioBlock
  | QuizBlock
  | CommitmentBlock
  | ResourceBlock
  | CompletionBlock;

interface BaseBlock {
  id: string;
  order: number;
}

export interface TitleBlock extends BaseBlock {
  type: 'title';
  text: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  asset: StorageObjectReference;
  alt: string;
  caption?: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  asset: StorageObjectReference;
  title: string;
  transcript: string;
  captionsAvailable: boolean;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface KeyPointsBlock extends BaseBlock {
  type: 'key_points';
  points: string[];
}

export interface ScenarioBlock extends BaseBlock {
  type: 'scenario';
  scenarioId: string;
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  quizId: string;
}

export interface CommitmentBlock extends BaseBlock {
  type: 'commitment';
  prompt: string;
}

export interface ResourceBlock extends BaseBlock {
  type: 'resource';
  resourceId: string;
}

export interface CompletionBlock extends BaseBlock {
  type: 'completion';
  message: string;
}

export interface ScenarioCase {
  id: string;
  title: string;
  description: string;
  audience: string;
  relatedValue: FairPlayValue;
  relatedCourseIds: string[];
  choices: ScenarioChoice[];
}

export interface ScenarioChoice {
  id: string;
  label: string;
  impactOnSelf: string;
  impactOnPeer: string;
  impactOnTeam: string;
  betterAction: string;
  usableSentence: string;
  isRecommended: boolean;
}

export interface ScenarioAttempt {
  id: string;
  userId: string;
  scenarioId: string;
  lessonId: string;
  firstChoiceId: string;
  finalChoiceId: string;
  reselected: boolean;
  attemptedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string; isCorrect: boolean }[];
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  lessonId: string;
  score: number;
  responses: Record<string, string>;
  passed: boolean;
  attemptedAt: string;
}

/** 과정별 기출(시험) 객관식 문항 — 관리자가 등록 */
export interface ExamQuestion {
  id: string;
  courseId: string;
  prompt: string;
  options: { id: string; label: string; isCorrect: boolean }[];
  /** 문항별 배점 (시험 총점은 출제 문항 배점 합 대비 100점 환산) */
  points: number;
  order: number;
  createdAt: string;
}

/** 과정 시험 응시 기록 */
export interface ExamAttempt {
  id: string;
  userId: string;
  courseId: string;
  /** 이번 시험에 출제된 문항 ID (기출 은행의 약 80%) */
  questionIds: string[];
  responses: Record<string, string>;
  /** 100점 만점 환산 점수 */
  score: number;
  earnedPoints: number;
  totalPoints: number;
  passed: boolean;
  attemptedAt: string;
}

/** 과정별 과제 출제(문제) — 관리자가 작성 */
export interface HomeworkTask {
  id: string;
  courseId: string;
  title: string;
  /** 과제 문제/안내 내용 */
  prompt: string;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

/** 과정별 과제 제출 */
export type HomeworkStatus = 'submitted' | 'graded';

export interface HomeworkAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  /** 데모용 미리보기/다운로드 (용량 제한) */
  dataUrl?: string;
}

export interface HomeworkSubmission {
  id: string;
  userId: string;
  courseId: string;
  homeworkTaskId: string;
  content: string;
  attachments: HomeworkAttachment[];
  status: HomeworkStatus;
  /** 만점 배점 (출제 시 설정, 채점 시 조정 가능) */
  maxScore: number;
  score?: number;
  feedback?: string;
  submittedAt: string;
  updatedAt: string;
  gradedAt?: string;
  gradedByUserId?: string;
}

export interface PracticeCommitment {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  startedAt: string;
  lastAccessedAt: string;
  lastCompletedBlockId?: string;
  progressPercent: number;
  completedAt?: string;
}

export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  startedAt: string;
  lastAccessedAt: string;
  progressPercent: number;
  completedAt?: string;
}

export interface CourseAssignment {
  id: string;
  organizationId: string;
  courseId: string;
  targetTeamIds: string[];
  targetUserIds: string[];
  required: boolean;
  startDate: string;
  dueDate: string;
}

export interface CourseCompletion {
  id: string;
  userId: string;
  courseId: string;
  completedAt: string;
  certificateId?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  organizationId?: string;
  learnerName: string;
  organizationName?: string;
  courseTitle: string;
  educationHours: number;
  educationPeriod: string;
  completedAt: string;
  verificationCode: string;
  isDemo: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  targetRoles: UserRole[];
  authorName?: string;
  viewCount?: number;
  isPinned?: boolean;
}

export interface QnaPost {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  status: 'pending' | 'answered';
  answer?: string;
  answeredAt?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  targetRoles: UserRole[];
}

export interface SupportLink {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface Session {
  userId: string;
  role: UserRole;
  isDemo: boolean;
  expiresAt?: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  before?: string;
  after?: string;
  createdAt: string;
}

export const FAIR_PLAY_VALUES: Record<FairPlayValue, { ko: string; en: string }> = {
  fairness: { ko: '공정', en: 'FAIRNESS' },
  respect: { ko: '존중', en: 'RESPECT' },
  responsibility: { ko: '책임', en: 'RESPONSIBILITY' },
  coexistence: { ko: '공존', en: 'COEXISTENCE' },
  courage: { ko: '용기', en: 'COURAGE' },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  athlete: '학생선수',
  guardian: '학부모',
  coach: '지도자',
  org_manager: '기관관리자',
  content_manager: '콘텐츠관리자',
  super_admin: '최고관리자',
};

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  athlete: '/app',
  guardian: '/guardian',
  coach: '/coach',
  org_manager: '/organization',
  content_manager: '/admin',
  super_admin: '/admin',
};
