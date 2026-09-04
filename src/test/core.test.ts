import { describe, expect, it } from 'vitest';
import { loadAppConfig, ConfigurationError } from '@/infrastructure/config/appConfig';
import {
  calculateQuizScore,
  evaluateCourseCompletion,
  validateCommitmentText,
  isDuplicateProgressSave,
} from '@/application/services/learningRules';
import {
  canIssueCertificate,
  formatCertificateDate,
  formatEducationHours,
  getCertificateRowStatus,
} from '@/application/services/certificateRules';
import {
  filterCommitmentsForRole,
  filterScenarioAttemptsForRole,
  getOrganizationAnonymousInsights,
} from '@/application/services/privacyViews';
import type { Course, ExamQuestion, LessonProgress, PracticeCommitment, ScenarioAttempt } from '@/domain';
import {
  getExamQuestionCount,
  scoreExamAttempt,
} from '@/application/services/examRules';

describe('app config', () => {
  it('blocks production + demo provider', () => {
    expect(() =>
      loadAppConfig({
        VITE_RELEASE_STAGE: 'production',
        VITE_DATA_PROVIDER: 'demo',
        VITE_ENABLE_DEMO: 'true',
      } as ImportMetaEnv),
    ).toThrow(ConfigurationError);
  });

  it('defaults to prototype demo', () => {
    const config = loadAppConfig({} as ImportMetaEnv);
    expect(config.releaseStage).toBe('prototype');
    expect(config.dataProvider).toBe('demo');
  });
});

describe('learning rules', () => {
  const course: Course = {
    id: 'c1',
    slug: 'test',
    title: 'Test',
    description: '',
    targetRole: 'athlete',
    values: ['fairness'],
    estimatedMinutes: 30,
    learningObjectives: [],
    modules: [{ id: 'm1', courseId: 'c1', title: 'M', order: 1, lessonIds: ['l1'] }],
    completionRules: {
      requiredLessonPercent: 100,
      requiredScenarioComplete: true,
      minimumQuizScore: 60,
      commitmentRequired: true,
    },
    status: 'published',
    version: 1,
  };

  it('evaluates course completion', () => {
    const result = evaluateCourseCompletion({
      course,
      courseProgress: null,
      lessonProgresses: [
        {
          id: 'lp1',
          userId: 'u1',
          lessonId: 'l1',
          courseId: 'c1',
          startedAt: '',
          lastAccessedAt: '',
          progressPercent: 100,
          completedAt: new Date().toISOString(),
        },
      ],
      scenarioAttempts: [{ id: 's1', userId: 'u1', scenarioId: 'sc1', lessonId: 'l1', firstChoiceId: 'a', finalChoiceId: 'a', reselected: false, attemptedAt: '' }],
      quizAttempts: [{ id: 'q1', userId: 'u1', quizId: 'qz1', lessonId: 'l1', score: 80, responses: {}, passed: true, attemptedAt: '' }],
      commitments: [{ id: 'c1', userId: 'u1', lessonId: 'l1', courseId: 'c1', text: '연습', createdAt: '', updatedAt: '' }],
    });
    expect(result.isComplete).toBe(true);
  });

  it('calculates quiz score', () => {
    const score = calculateQuizScore(
      { q1: 'b' },
      [{ id: 'q1', options: [{ id: 'a', isCorrect: false }, { id: 'b', isCorrect: true }] }],
    );
    expect(score).toBe(100);
  });

  it('validates commitment warnings', () => {
    const r = validateCommitmentText('010-1234-5678 연락');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('prevents duplicate progress save', () => {
    const existing: LessonProgress = {
      id: '1',
      userId: 'u',
      lessonId: 'l',
      courseId: 'c',
      startedAt: '',
      lastAccessedAt: '',
      lastCompletedBlockId: 'b1',
      progressPercent: 50,
    };
    expect(
      isDuplicateProgressSave(existing, {
        lastCompletedBlockId: 'b1',
        progressPercent: 50,
        completedAt: undefined,
      }),
    ).toBe(true);
  });
});

describe('privacy views', () => {
  it('hides commitments from org manager', () => {
    const commitments: PracticeCommitment[] = [
      { id: '1', userId: 'u', lessonId: 'l', courseId: 'c', text: 'x', createdAt: '', updatedAt: '' },
    ];
    expect(filterCommitmentsForRole(commitments, 'org_manager')).toHaveLength(0);
  });

  it('hides scenario attempts from coach', () => {
    const attempts: ScenarioAttempt[] = [
      { id: '1', userId: 'u', scenarioId: 's', lessonId: 'l', firstChoiceId: 'a', finalChoiceId: 'a', reselected: false, attemptedAt: '' },
    ];
    expect(filterScenarioAttemptsForRole(attempts, 'coach')).toHaveLength(0);
  });

  it('suppresses stats under 5 participants', () => {
    const insights = getOrganizationAnonymousInsights(4);
    expect(insights.suppressed).toBe(true);
  });
});

describe('exam rules', () => {
  it('selects about 80% of bank questions', () => {
    expect(getExamQuestionCount(10)).toBe(8);
    expect(getExamQuestionCount(5)).toBe(4);
    expect(getExamQuestionCount(1)).toBe(1);
  });

  it('scores by weighted points to 100', () => {
    const questions: ExamQuestion[] = [
      {
        id: 'q1',
        courseId: 'c1',
        prompt: 'A',
        options: [
          { id: 'a', label: 'a', isCorrect: true },
          { id: 'b', label: 'b', isCorrect: false },
        ],
        points: 20,
        order: 1,
        createdAt: '',
      },
      {
        id: 'q2',
        courseId: 'c1',
        prompt: 'B',
        options: [
          { id: 'c', label: 'c', isCorrect: true },
          { id: 'd', label: 'd', isCorrect: false },
        ],
        points: 30,
        order: 2,
        createdAt: '',
      },
    ];
    const scored = scoreExamAttempt(questions, { q1: 'a', q2: 'd' });
    expect(scored.earnedPoints).toBe(20);
    expect(scored.totalPoints).toBe(50);
    expect(scored.score).toBe(40);
    expect(scored.passed).toBe(false);
  });
});

describe('certificate rules', () => {
  it('allows issue only when complete and not yet issued', () => {
    expect(canIssueCertificate(100, false)).toBe(true);
    expect(canIssueCertificate(99, false)).toBe(false);
    expect(canIssueCertificate(100, true)).toBe(false);
  });

  it('maps row status labels', () => {
    expect(getCertificateRowStatus(100, true)).toBe('issued');
    expect(getCertificateRowStatus(100, false)).toBe('eligible');
    expect(getCertificateRowStatus(40, false)).toBe('in_progress');
  });

  it('formats certificate date and hours', () => {
    expect(formatCertificateDate('2026-03-20T10:00:00.000Z')).toMatch(/2026\.03\./);
    expect(formatEducationHours(25)).toBe(1);
    expect(formatEducationHours(90)).toBe(2);
  });
});
