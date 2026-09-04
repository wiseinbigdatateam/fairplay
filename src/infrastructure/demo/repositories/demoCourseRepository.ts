import type {
  Course,
  CourseAssignment,
  CourseProgress,
  ExamQuestion,
  HomeworkSubmission,
  HomeworkTask,
  Lesson,
  LessonProgress,
  OrganizationMembership,
  UserProfile,
  UserRole,
} from '@/domain';
import type { CourseRepository } from '@/application/ports';
import {
  getDemoCourses,
  getDemoLessons,
  getDemoState,
  saveDemoState,
} from '@/infrastructure/demo/demoState';

function ensureDefaultLessons(state: ReturnType<typeof getDemoState>, course: Course) {
  const lessons = state.lessons as Lesson[];
  for (const mod of course.modules) {
    for (const lessonId of mod.lessonIds) {
      const existing = lessons.find((l) => l.id === lessonId);
      if (existing) {
        existing.title = `${course.title} — ${mod.title}`;
        existing.estimatedMinutes = course.estimatedMinutes;
        continue;
      }
      lessons.push({
        id: lessonId,
        courseId: course.id,
        moduleId: mod.id,
        title: `${course.title} — ${mod.title}`,
        order: 1,
        estimatedMinutes: course.estimatedMinutes,
        required: true,
        blocks: [
          { id: `${lessonId}-b1`, order: 1, type: 'title', text: course.title },
          {
            id: `${lessonId}-b2`,
            order: 2,
            type: 'text',
            content: course.description || `${course.title} 교육을 시작합니다.`,
          },
          {
            id: `${lessonId}-b3`,
            order: 3,
            type: 'completion',
            message: '차시를 완료했습니다.',
          },
        ],
      });
    }
  }
}

export class DemoCourseRepository implements CourseRepository {
  async listPublishedCourses(): Promise<Course[]> {
    return getDemoCourses().filter((c) => c.status === 'published');
  }

  async getCourse(courseId: string): Promise<Course | null> {
    return getDemoCourses().find((c) => c.id === courseId) ?? null;
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    return getDemoCourses().find((c) => c.slug === slug) ?? null;
  }

  async listCoursesForRole(role: UserRole): Promise<Course[]> {
    return getDemoCourses().filter((c) => c.targetRole === role && c.status === 'published');
  }

  async listAssignedCourses(userId: string): Promise<Course[]> {
    const state = getDemoState();
    const membership = (state.memberships as OrganizationMembership[]).find((m) => m.userId === userId);
    const profile = (state.profiles as UserProfile[]).find((p) => p.id === userId);
    const teamIds = new Set([...(membership?.teamIds ?? []), ...(profile?.teamIds ?? [])]);
    const assignments = (state.assignments as CourseAssignment[]).filter(
      (a) =>
        a.targetUserIds.includes(userId) || a.targetTeamIds.some((teamId) => teamIds.has(teamId)),
    );
    const courseIds = new Set(assignments.map((a) => a.courseId));
    return getDemoCourses().filter((c) => courseIds.has(c.id));
  }

  async listRecommendedCourses(userId: string): Promise<Course[]> {
    const assigned = await this.listAssignedCourses(userId);
    const assignedIds = new Set(assigned.map((c) => c.id));
    return getDemoCourses().filter((c) => !assignedIds.has(c.id) && c.status === 'published').slice(0, 3);
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    return getDemoLessons().find((l) => l.id === lessonId) ?? null;
  }

  async saveCourse(course: Course): Promise<Course> {
    const state = getDemoState();
    const courses = state.courses as Course[];
    const idx = courses.findIndex((c) => c.id === course.id);
    const next: Course =
      idx >= 0 ? { ...course, version: courses[idx].version + 1 } : { ...course, version: course.version || 1 };
    if (idx >= 0) courses[idx] = next;
    else courses.push(next);
    ensureDefaultLessons(state, next);
    saveDemoState(state);
    return next;
  }

  async deleteCourse(courseId: string): Promise<void> {
    const state = getDemoState();
    state.courses = (state.courses as Course[]).filter((c) => c.id !== courseId);
    state.lessons = (state.lessons as Lesson[]).filter((l) => l.courseId !== courseId);
    state.assignments = (state.assignments as CourseAssignment[]).filter((a) => a.courseId !== courseId);
    state.courseProgress = (state.courseProgress as CourseProgress[]).filter((p) => p.courseId !== courseId);
    state.lessonProgress = (state.lessonProgress as LessonProgress[]).filter((p) => p.courseId !== courseId);
    if (Array.isArray(state.examQuestions)) {
      state.examQuestions = (state.examQuestions as ExamQuestion[]).filter((q) => q.courseId !== courseId);
    }
    if (Array.isArray(state.homeworkTasks)) {
      state.homeworkTasks = (state.homeworkTasks as HomeworkTask[]).filter((t) => t.courseId !== courseId);
    }
    if (Array.isArray(state.homeworkSubmissions)) {
      state.homeworkSubmissions = (state.homeworkSubmissions as HomeworkSubmission[]).filter(
        (s) => s.courseId !== courseId,
      );
    }
    saveDemoState(state);
  }

  async listAllCourses(): Promise<Course[]> {
    return getDemoCourses();
  }
}
