import type { Course, FairPlayValue, Lesson, UserRole } from '@/domain';

const defaultRules = {
  requiredLessonPercent: 100,
  requiredScenarioComplete: true,
  minimumQuizScore: 60,
  commitmentRequired: true,
};

const athleteTitles = [
  '챔피언의 품격',
  '말도 경기의 일부',
  '상대가 있어야 경기',
  '감정을 이기는 선수',
  '안전한 팀 만들기',
  '침묵하지 않는 동료',
  '유니폼 밖에서도 선수',
  '삶을 함께 준비',
  '우리 종목 FAIR PLAY',
];

const guardianTitles = [
  '학생선수 이해와 성장 지원',
  '승리보다 중요한 부모의 언어',
  '안전•인권•정서 보호',
  '진로•학업•선수 이후의 삶',
];

const coachTitles = [
  '존중으로 지도하는 사람',
  '말도 지도의 일부',
  '감정을 다루는 지도자',
  '공정한 선발과 출전',
  '안전한 팀 만들기',
  '침묵하지 않는 지도자',
  '선수의 목소리를 듣는 법',
  '선수 이후까지 함께 준비',
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createCourse(
  id: string,
  title: string,
  targetRole: UserRole,
  values: FairPlayValue[],
  order: number,
): Course {
  const lessonId = `lesson-${id}-1`;
  return {
    id,
    slug: slugify(title),
    title,
    description: `${title} — FAIR PLAY ACADEMY 온라인 가치교육 과정입니다.`,
    targetRole,
    targetAgeGroup: targetRole === 'athlete' ? '중•고등' : undefined,
    values,
    estimatedMinutes: 25 + order * 2,
    learningObjectives: [
      '실제 상황에서 더 나은 선택을 연습합니다.',
      '팀 문화에 미치는 영향을 이해합니다.',
      '실천약속을 통해 일상으로 연결합니다.',
    ],
    modules: [
      {
        id: `module-${id}-1`,
        courseId: id,
        title: '1차시',
        order: 1,
        lessonIds: [lessonId],
      },
    ],
    completionRules: defaultRules,
    status: 'published',
    version: 1,
  };
}

export function createSeedCourses(): Course[] {
  const athlete = athleteTitles.map((title, i) =>
    createCourse(`course-athlete-${i + 1}`, title, 'athlete', ['respect', 'fairness', 'courage'].slice(0, (i % 3) + 1) as FairPlayValue[], i),
  );
  const guardian = guardianTitles.map((title, i) =>
    createCourse(`course-guardian-${i + 1}`, title, 'guardian', ['responsibility', 'coexistence'], i),
  );
  const coach = coachTitles.map((title, i) =>
    createCourse(`course-coach-${i + 1}`, title, 'coach', ['fairness', 'respect', 'responsibility'], i),
  );
  return [...athlete, ...guardian, ...coach];
}

export function createDefaultLessons(courses: Course[]): Lesson[] {
  const lessons: Lesson[] = [];
  for (const course of courses) {
    for (const mod of course.modules) {
      for (const lessonId of mod.lessonIds) {
        const isFirstAthlete = course.id === 'course-athlete-1';
        lessons.push({
          id: lessonId,
          courseId: course.id,
          moduleId: mod.id,
          title: `${course.title} — 1차시`,
          order: 1,
          estimatedMinutes: course.estimatedMinutes,
          required: true,
          blocks: isFirstAthlete
            ? createChampionLessonBlocks(lessonId)
            : createGenericLessonBlocks(lessonId, course.title),
        });
      }
    }
  }
  return lessons;
}

function createChampionLessonBlocks(lessonId: string) {
  return [
    { id: `${lessonId}-b1`, order: 1, type: 'title' as const, text: '챔피언의 품격' },
    {
      id: `${lessonId}-b2`,
      order: 2,
      type: 'text' as const,
      content:
        '승리는 기록에 남지만, 공정과 존중은 선수 이후의 삶에 남습니다. 오늘은 경기장 밖에서도 이어지는 품격에 대해 연습합니다.',
    },
    {
      id: `${lessonId}-b3`,
      order: 3,
      type: 'key_points' as const,
      points: ['메달보다 오래 남는 것', '좋은 선택도 훈련할 수 있습니다', '말도 경기의 일부'],
    },
    { id: `${lessonId}-b4`, order: 4, type: 'scenario' as const, scenarioId: 'scenario-chat-bullying' },
    { id: `${lessonId}-b5`, order: 5, type: 'quiz' as const, quizId: 'quiz-fairplay-basics' },
    {
      id: `${lessonId}-b6`,
      order: 6,
      type: 'commitment' as const,
      prompt: '이번 교육을 통해 내가 실제로 해 볼 행동 한 가지는 무엇인가요?',
    },
    {
      id: `${lessonId}-b7`,
      order: 7,
      type: 'completion' as const,
      message: '1차시를 완료했습니다. 오늘 연습한 선택을 내일의 훈련과 경기에서 이어가 보세요.',
    },
  ];
}

function createGenericLessonBlocks(lessonId: string, title: string) {
  return [
    { id: `${lessonId}-b1`, order: 1, type: 'title' as const, text: title },
    {
      id: `${lessonId}-b2`,
      order: 2,
      type: 'text' as const,
      content: `${title} 교육의 핵심 상황을 확인하고, 선택의 영향을 살펴봅니다.`,
    },
    { id: `${lessonId}-b3`, order: 3, type: 'scenario' as const, scenarioId: 'scenario-generic-1' },
    { id: `${lessonId}-b4`, order: 4, type: 'quiz' as const, quizId: 'quiz-fairplay-basics' },
    {
      id: `${lessonId}-b5`,
      order: 5,
      type: 'commitment' as const,
      prompt: '이번 교육을 통해 내가 실제로 해 볼 행동 한 가지는 무엇인가요?',
    },
    {
      id: `${lessonId}-b6`,
      order: 6,
      type: 'completion' as const,
      message: '차시를 완료했습니다.',
    },
  ];
}
