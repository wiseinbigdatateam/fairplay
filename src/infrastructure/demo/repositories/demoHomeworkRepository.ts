import type { HomeworkAttachment, HomeworkSubmission, HomeworkTask } from '@/domain';
import type { HomeworkRepository } from '@/application/ports';
import {
  generateId,
  getDemoHomeworkSubmissions,
  getDemoHomeworkTasks,
  getDemoState,
  saveDemoState,
} from '@/infrastructure/demo/demoState';

export class DemoHomeworkRepository implements HomeworkRepository {
  async listTasks(): Promise<HomeworkTask[]> {
    return [...getDemoHomeworkTasks()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async getTaskByCourse(courseId: string): Promise<HomeworkTask | null> {
    return getDemoHomeworkTasks().find((t) => t.courseId === courseId) ?? null;
  }

  async saveTask(
    input: Omit<HomeworkTask, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<HomeworkTask> {
    const state = getDemoState();
    const list = (state.homeworkTasks as HomeworkTask[]) ?? [];
    const now = new Date().toISOString();

    const byId = input.id ? list.findIndex((t) => t.id === input.id) : -1;
    const byCourse = list.findIndex((t) => t.courseId === input.courseId);
    const idx = byId >= 0 ? byId : byCourse;

    if (idx >= 0) {
      const next: HomeworkTask = {
        ...list[idx],
        title: input.title.trim(),
        prompt: input.prompt.trim(),
        maxScore: Math.max(1, input.maxScore),
        courseId: input.courseId,
        updatedAt: now,
      };
      list[idx] = next;
      state.homeworkTasks = list;
      saveDemoState(state);
      return next;
    }

    const next: HomeworkTask = {
      id: generateId('hw-task'),
      courseId: input.courseId,
      title: input.title.trim(),
      prompt: input.prompt.trim(),
      maxScore: Math.max(1, input.maxScore),
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(next);
    state.homeworkTasks = list;
    saveDemoState(state);
    return next;
  }

  async deleteTask(taskId: string): Promise<void> {
    const state = getDemoState();
    state.homeworkTasks = ((state.homeworkTasks as HomeworkTask[]) ?? []).filter((t) => t.id !== taskId);
    saveDemoState(state);
  }

  async listByUser(userId: string): Promise<HomeworkSubmission[]> {
    return getDemoHomeworkSubmissions()
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async listByCourse(courseId: string): Promise<HomeworkSubmission[]> {
    return getDemoHomeworkSubmissions()
      .filter((h) => h.courseId === courseId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async listAll(): Promise<HomeworkSubmission[]> {
    return [...getDemoHomeworkSubmissions()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async getById(id: string): Promise<HomeworkSubmission | null> {
    return getDemoHomeworkSubmissions().find((h) => h.id === id) ?? null;
  }

  async getLatestByUserAndCourse(userId: string, courseId: string): Promise<HomeworkSubmission | null> {
    return (
      getDemoHomeworkSubmissions()
        .filter((h) => h.userId === userId && h.courseId === courseId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null
    );
  }

  async submit(input: {
    userId: string;
    courseId: string;
    homeworkTaskId: string;
    content: string;
    attachments: Omit<HomeworkAttachment, 'id'>[];
    maxScore?: number;
  }): Promise<HomeworkSubmission> {
    const state = getDemoState();
    const list = (state.homeworkSubmissions as HomeworkSubmission[]) ?? [];
    const now = new Date().toISOString();
    const existingIdx = list.findIndex(
      (h) => h.userId === input.userId && h.courseId === input.courseId,
    );

    const attachments: HomeworkAttachment[] = input.attachments.map((file) => ({
      ...file,
      id: generateId('hw-file'),
    }));

    if (existingIdx >= 0) {
      const next: HomeworkSubmission = {
        ...list[existingIdx],
        homeworkTaskId: input.homeworkTaskId,
        content: input.content,
        attachments,
        status: 'submitted',
        score: undefined,
        feedback: undefined,
        gradedAt: undefined,
        gradedByUserId: undefined,
        updatedAt: now,
        maxScore: input.maxScore ?? list[existingIdx].maxScore ?? 100,
      };
      list[existingIdx] = next;
      state.homeworkSubmissions = list;
      saveDemoState(state);
      return next;
    }

    const next: HomeworkSubmission = {
      id: generateId('hw'),
      userId: input.userId,
      courseId: input.courseId,
      homeworkTaskId: input.homeworkTaskId,
      content: input.content,
      attachments,
      status: 'submitted',
      maxScore: input.maxScore ?? 100,
      submittedAt: now,
      updatedAt: now,
    };
    list.unshift(next);
    state.homeworkSubmissions = list;
    saveDemoState(state);
    return next;
  }

  async grade(input: {
    submissionId: string;
    score: number;
    maxScore: number;
    feedback?: string;
    gradedByUserId: string;
  }): Promise<HomeworkSubmission> {
    const state = getDemoState();
    const list = (state.homeworkSubmissions as HomeworkSubmission[]) ?? [];
    const idx = list.findIndex((h) => h.id === input.submissionId);
    if (idx < 0) throw new Error('과제 제출을 찾을 수 없습니다.');

    const maxScore = Math.max(1, input.maxScore);
    const score = Math.min(maxScore, Math.max(0, Math.round(input.score)));
    const next: HomeworkSubmission = {
      ...list[idx],
      status: 'graded',
      score,
      maxScore,
      feedback: input.feedback?.trim() || undefined,
      gradedAt: new Date().toISOString(),
      gradedByUserId: input.gradedByUserId,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = next;
    state.homeworkSubmissions = list;
    saveDemoState(state);
    return next;
  }
}
