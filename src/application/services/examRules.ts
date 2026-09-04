import type { ExamAttempt, ExamQuestion } from '@/domain';

/** 등록 문항의 80%를 출제 (최소 1문항, 올림) */
export function getExamQuestionCount(bankSize: number): number {
  if (bankSize <= 0) return 0;
  return Math.max(1, Math.ceil(bankSize * 0.8));
}

/** Fisher–Yates 셔플 후 출제 수만큼 선택 */
export function selectExamQuestions(
  bank: ExamQuestion[],
  count = getExamQuestionCount(bank.length),
  random: () => number = Math.random,
): ExamQuestion[] {
  if (bank.length === 0 || count <= 0) return [];
  const shuffled = [...bank];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function scoreExamAttempt(
  questions: ExamQuestion[],
  responses: Record<string, string>,
  passingScore = 60,
): Pick<ExamAttempt, 'score' | 'earnedPoints' | 'totalPoints' | 'passed'> {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  let earnedPoints = 0;
  for (const question of questions) {
    const selected = responses[question.id];
    const correct = question.options.find((o) => o.isCorrect)?.id;
    if (selected && correct && selected === correct) {
      earnedPoints += question.points;
    }
  }
  const score =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  return {
    earnedPoints,
    totalPoints,
    score,
    passed: score >= passingScore,
  };
}

export function canTakeCourseExam(progressPercent: number): boolean {
  return progressPercent > 0;
}
