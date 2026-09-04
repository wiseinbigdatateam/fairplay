import type {
  Course,
  CourseCompletionRules,
  CourseProgress,
  Lesson,
  LessonProgress,
  PracticeCommitment,
  QuizAttempt,
  ScenarioAttempt,
} from '@/domain';

export interface CourseCompletionInput {
  course: Course;
  lessons?: Lesson[];
  courseProgress: CourseProgress | null;
  lessonProgresses: LessonProgress[];
  scenarioAttempts: ScenarioAttempt[];
  quizAttempts: QuizAttempt[];
  commitments: PracticeCommitment[];
}

export interface CourseCompletionResult {
  isComplete: boolean;
  reasons: string[];
  missingRequirements: string[];
}

export function evaluateCourseCompletion(
  input: CourseCompletionInput,
  rules: CourseCompletionRules = input.course.completionRules,
): CourseCompletionResult {
  const missing: string[] = [];
  const reasons: string[] = [];

  const requiredLessons = input.course.modules.flatMap((m) => m.lessonIds);
  const completedLessons = input.lessonProgresses.filter(
    (lp) => lp.completedAt && requiredLessons.includes(lp.lessonId),
  );
  const lessonPercent =
    requiredLessons.length === 0
      ? 0
      : (completedLessons.length / requiredLessons.length) * 100;

  if (lessonPercent < rules.requiredLessonPercent) {
    missing.push(`필수 차시 ${rules.requiredLessonPercent}% 미완료 (현재 ${Math.round(lessonPercent)}%)`);
  } else {
    reasons.push('필수 차시 완료');
  }

  if (rules.requiredScenarioComplete) {
    const scenarioBlocks = getScenarioIdsFromCourse(input.course, input.lessons);
    const completedScenarios = new Set(
      input.scenarioAttempts.filter((a) => a.finalChoiceId).map((a) => a.scenarioId),
    );
    const allDone = scenarioBlocks.every((id) => completedScenarios.has(id));
    if (!allDone) {
      missing.push('필수 상황형 학습 미완료');
    } else {
      reasons.push('상황형 학습 완료');
    }
  }

  const quizBlocks = getQuizIdsFromCourse(input.course, input.lessons);
  if (quizBlocks.length > 0) {
    const passed = input.quizAttempts.some((a) => a.passed && a.score >= rules.minimumQuizScore);
    if (!passed) {
      missing.push(`확인문항 ${rules.minimumQuizScore}점 미달`);
    } else {
      reasons.push('확인문항 통과');
    }
  }

  if (rules.commitmentRequired) {
    const hasCommitment = input.commitments.some(
      (c) => c.courseId === input.course.id && c.text.trim().length > 0,
    );
    if (!hasCommitment) {
      missing.push('실천약속 미저장');
    } else {
      reasons.push('실천약속 저장');
    }
  }

  return {
    isComplete: missing.length === 0,
    reasons,
    missingRequirements: missing,
  };
}

export function calculateQuizScore(
  responses: Record<string, string>,
  questions: { id: string; options: { id: string; isCorrect: boolean }[] }[],
): number {
  if (questions.length === 0) return 0;
  let correct = 0;
  for (const q of questions) {
    const selected = responses[q.id];
    const option = q.options.find((o) => o.id === selected);
    if (option?.isCorrect) correct++;
  }
  return Math.round((correct / questions.length) * 100);
}

export function validateCommitmentText(text: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (text.length > 200) {
    warnings.push('200자 이내로 입력해 주세요.');
  }
  if (/\d{2,3}-\d{3,4}-\d{4}/.test(text) || /\d{10,11}/.test(text)) {
    warnings.push('연락처는 입력하지 마세요.');
  }
  if (/[가-힣]{2,4}(선수|코치|감독)/.test(text)) {
    warnings.push('특정인의 실명은 입력하지 마세요.');
  }
  const sensitive = ['피해', '폭력', '괴롭', '성희롱', '주민등록'];
  if (sensitive.some((w) => text.includes(w))) {
    warnings.push('피해내용 등 민감한 정보는 입력하지 마세요.');
  }
  return { valid: text.length <= 200 && warnings.length === 0, warnings };
}

export function shouldSuppressAnonymousStats(participantCount: number): boolean {
  return participantCount < 5;
}

function getScenarioIdsFromCourse(course: Course, lessons?: Lesson[]): string[] {
  const ids: string[] = [];
  const lessonList = lessons ?? getLessonsFromCourse(course);
  for (const lesson of lessonList) {
    for (const block of lesson.blocks) {
      if (block.type === 'scenario') ids.push(block.scenarioId);
    }
  }
  return ids;
}

function getQuizIdsFromCourse(course: Course, lessons?: Lesson[]): string[] {
  const ids: string[] = [];
  const lessonList = lessons ?? getLessonsFromCourse(course);
  for (const lesson of lessonList) {
    for (const block of lesson.blocks) {
      if (block.type === 'quiz') ids.push(block.quizId);
    }
  }
  return ids;
}

function getLessonsFromCourse(course: Course): Lesson[] {
  return (course as Course & { _lessons?: Lesson[] })._lessons ?? [];
}

export function attachLessonsToCourse(course: Course, lessons: Lesson[]): Course & { _lessons: Lesson[] } {
  return { ...course, _lessons: lessons };
}

export function computeLessonProgressPercent(
  lesson: Lesson,
  lastCompletedBlockId?: string,
): number {
  if (lesson.blocks.length === 0) return 0;
  if (!lastCompletedBlockId) return 0;
  const idx = lesson.blocks.findIndex((b) => b.id === lastCompletedBlockId);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / lesson.blocks.length) * 100);
}

export function isDuplicateProgressSave(
  existing: LessonProgress | null,
  update: Pick<LessonProgress, 'lastCompletedBlockId' | 'progressPercent' | 'completedAt'>,
): boolean {
  if (!existing) return false;
  return (
    existing.lastCompletedBlockId === update.lastCompletedBlockId &&
    existing.progressPercent === update.progressPercent &&
    existing.completedAt === update.completedAt
  );
}
