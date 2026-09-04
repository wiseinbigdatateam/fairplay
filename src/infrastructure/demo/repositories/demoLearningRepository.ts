import type {
  CourseProgress,
  LessonProgress,
  PracticeCommitment,
  QuizAttempt,
  ScenarioAttempt,
  CourseCompletion,
} from '@/domain';
import type { LearningRepository } from '@/application/ports';
import {
  computeLessonProgressPercent,
  isDuplicateProgressSave,
} from '@/application/services/learningRules';
import { generateId, getDemoLessons, getDemoState, saveDemoState } from '@/infrastructure/demo/demoState';

export class DemoLearningRepository implements LearningRepository {
  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    const state = getDemoState();
    return (
      (state.courseProgress as CourseProgress[]).find(
        (p) => p.userId === userId && p.courseId === courseId,
      ) ?? null
    );
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    const state = getDemoState();
    return (
      (state.lessonProgress as LessonProgress[]).find(
        (p) => p.userId === userId && p.lessonId === lessonId,
      ) ?? null
    );
  }

  async saveLessonProgress(progress: LessonProgress): Promise<LessonProgress> {
    const state = getDemoState();
    const list = state.lessonProgress as LessonProgress[];
    const existing = list.find((p) => p.userId === progress.userId && p.lessonId === progress.lessonId) ?? null;

    if (isDuplicateProgressSave(existing, progress)) {
      return existing!;
    }

    const now = new Date().toISOString();
    const lesson = getDemoLessons().find((l) => l.id === progress.lessonId);
    const computedPercent = lesson
      ? computeLessonProgressPercent(lesson, progress.lastCompletedBlockId)
      : progress.progressPercent;

    const next: LessonProgress = {
      ...progress,
      progressPercent: computedPercent,
      lastAccessedAt: now,
      completedAt: computedPercent >= 100 ? progress.completedAt ?? now : undefined,
    };

    const idx = list.findIndex((p) => p.userId === progress.userId && p.lessonId === progress.lessonId);
    if (idx >= 0) list[idx] = next;
    else list.push(next);

    await this.syncCourseProgress(progress.userId, progress.courseId);
    saveDemoState(state);
    return next;
  }

  async saveCourseProgress(progress: CourseProgress): Promise<CourseProgress> {
    const state = getDemoState();
    const list = state.courseProgress as CourseProgress[];
    const existing = list.find((p) => p.userId === progress.userId && p.courseId === progress.courseId);
    if (
      existing &&
      existing.progressPercent === progress.progressPercent &&
      existing.completedAt === progress.completedAt
    ) {
      return existing;
    }
    const idx = list.findIndex((p) => p.userId === progress.userId && p.courseId === progress.courseId);
    const next = { ...progress, lastAccessedAt: new Date().toISOString() };
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    saveDemoState(state);
    return next;
  }

  async saveScenarioAttempt(attempt: ScenarioAttempt): Promise<ScenarioAttempt> {
    const state = getDemoState();
    const list = state.scenarioAttempts as ScenarioAttempt[];
    const existing = list.find(
      (a) => a.userId === attempt.userId && a.scenarioId === attempt.scenarioId && a.lessonId === attempt.lessonId,
    );
    if (existing) {
      existing.finalChoiceId = attempt.finalChoiceId;
      existing.reselected = attempt.firstChoiceId !== attempt.finalChoiceId;
      saveDemoState(state);
      return existing;
    }
    list.push({ ...attempt, id: attempt.id || generateId('scenario-attempt') });
    saveDemoState(state);
    return attempt;
  }

  async saveQuizAttempt(attempt: QuizAttempt): Promise<QuizAttempt> {
    const state = getDemoState();
    const list = state.quizAttempts as QuizAttempt[];
    const idx = list.findIndex(
      (a) => a.userId === attempt.userId && a.quizId === attempt.quizId && a.lessonId === attempt.lessonId,
    );
    if (idx >= 0) list[idx] = attempt;
    else list.push({ ...attempt, id: attempt.id || generateId('quiz-attempt') });
    saveDemoState(state);
    return attempt;
  }

  async saveCommitment(commitment: PracticeCommitment): Promise<PracticeCommitment> {
    const state = getDemoState();
    const list = state.commitments as PracticeCommitment[];
    const idx = list.findIndex((c) => c.userId === commitment.userId && c.lessonId === commitment.lessonId);
    const now = new Date().toISOString();
    const next = { ...commitment, updatedAt: now, createdAt: commitment.createdAt || now };
    if (idx >= 0) list[idx] = next;
    else list.push({ ...next, id: next.id || generateId('commitment') });
    saveDemoState(state);
    return next;
  }

  async getCommitments(userId: string): Promise<PracticeCommitment[]> {
    return (getDemoState().commitments as PracticeCommitment[]).filter((c) => c.userId === userId);
  }

  async getCompletions(userId: string): Promise<CourseCompletion[]> {
    return (getDemoState().completions as CourseCompletion[]).filter((c) => c.userId === userId);
  }

  async getScenarioAttempts(userId: string, scenarioId: string): Promise<ScenarioAttempt[]> {
    return (getDemoState().scenarioAttempts as ScenarioAttempt[]).filter(
      (a) => a.userId === userId && a.scenarioId === scenarioId,
    );
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return (getDemoState().quizAttempts as QuizAttempt[]).filter(
      (a) => a.userId === userId && a.quizId === quizId,
    );
  }

  private async syncCourseProgress(userId: string, courseId: string) {
    const state = getDemoState();
    const lessonProgress = (state.lessonProgress as LessonProgress[]).filter(
      (p) => p.userId === userId && p.courseId === courseId,
    );
    if (lessonProgress.length === 0) return;
    const avg =
      lessonProgress.reduce((sum, p) => sum + p.progressPercent, 0) / lessonProgress.length;
    await this.saveCourseProgress({
      id: `cp-${userId}-${courseId}`,
      userId,
      courseId,
      startedAt: lessonProgress[0].startedAt,
      lastAccessedAt: new Date().toISOString(),
      progressPercent: Math.round(avg),
      completedAt: avg >= 100 ? new Date().toISOString() : undefined,
    });
  }
}
