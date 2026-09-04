import type { ExamAttempt, ExamQuestion } from '@/domain';
import type { ExamRepository } from '@/application/ports';
import {
  generateId,
  getDemoExamAttempts,
  getDemoExamQuestions,
  getDemoState,
  saveDemoState,
} from '@/infrastructure/demo/demoState';

export class DemoExamRepository implements ExamRepository {
  async listQuestionsByCourse(courseId: string): Promise<ExamQuestion[]> {
    return getDemoExamQuestions()
      .filter((q) => q.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async listAllQuestions(): Promise<ExamQuestion[]> {
    return [...getDemoExamQuestions()].sort((a, b) => {
      if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId);
      return a.order - b.order;
    });
  }

  async saveQuestion(
    input: Omit<ExamQuestion, 'id' | 'createdAt' | 'order'> & { id?: string; order?: number },
  ): Promise<ExamQuestion> {
    const state = getDemoState();
    const list = (state.examQuestions as ExamQuestion[]) ?? [];
    const now = new Date().toISOString();

    if (input.id) {
      const idx = list.findIndex((q) => q.id === input.id);
      if (idx >= 0) {
        const next: ExamQuestion = {
          ...list[idx],
          prompt: input.prompt,
          options: input.options,
          points: input.points,
          courseId: input.courseId,
          order: input.order ?? list[idx].order,
        };
        list[idx] = next;
        state.examQuestions = list;
        saveDemoState(state);
        return next;
      }
    }

    const sameCourse = list.filter((q) => q.courseId === input.courseId);
    const order = input.order ?? sameCourse.length + 1;
    const next: ExamQuestion = {
      id: generateId('eq'),
      courseId: input.courseId,
      prompt: input.prompt,
      options: input.options.map((o, i) => ({
        ...o,
        id: o.id.startsWith('opt-') ? `${generateId('opt')}-${i + 1}` : o.id,
      })),
      points: input.points,
      order,
      createdAt: now,
    };
    list.push(next);
    state.examQuestions = list;
    saveDemoState(state);
    return next;
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const state = getDemoState();
    state.examQuestions = ((state.examQuestions as ExamQuestion[]) ?? []).filter((q) => q.id !== questionId);
    saveDemoState(state);
  }

  async listAttemptsByUser(userId: string): Promise<ExamAttempt[]> {
    return getDemoExamAttempts()
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime());
  }

  async listAttemptsByCourse(courseId: string): Promise<ExamAttempt[]> {
    return getDemoExamAttempts()
      .filter((a) => a.courseId === courseId)
      .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime());
  }

  async listAllAttempts(): Promise<ExamAttempt[]> {
    return [...getDemoExamAttempts()].sort(
      (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime(),
    );
  }

  async getAttempt(attemptId: string): Promise<ExamAttempt | null> {
    return getDemoExamAttempts().find((a) => a.id === attemptId) ?? null;
  }

  async saveAttempt(attempt: Omit<ExamAttempt, 'id'> & { id?: string }): Promise<ExamAttempt> {
    const state = getDemoState();
    const list = (state.examAttempts as ExamAttempt[]) ?? [];
    const next: ExamAttempt = {
      ...attempt,
      id: attempt.id || generateId('exam-attempt'),
    };
    list.push(next);
    state.examAttempts = list;
    saveDemoState(state);
    return next;
  }
}
