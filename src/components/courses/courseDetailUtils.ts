import type { Course, UserRole } from '@/domain';
import { ROLE_LABELS } from '@/domain';
import {
  countLessons,
  formatWon,
  getCoursePricing,
  getCourseThumbnail,
  getCourseThumbnailTone,
  getValueLabel,
} from '@/components/courses/courseCatalogUtils';

export function getFirstLessonId(course: Course): string | undefined {
  return course.modules[0]?.lessonIds[0];
}

export function getCourseLearnHref(course: Course): string {
  return `/app/learn/${course.id}`;
}

export function isLearnPageHref(href: string): boolean {
  return href.includes('/learn/');
}

export function getCourseIndex(course: Course): number {
  const match = course.id.match(/-(\d+)$/);
  return match ? Number.parseInt(match[1], 10) - 1 : 0;
}

function formatKoreanDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${String(m).padStart(2, '0')}월 ${String(d).padStart(2, '0')}일`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export interface CourseScheduleInfo {
  educationPeriod: string;
  educationBadge: string;
  applicationPeriod: string;
  reviewPeriod: string;
  educationHours: string;
}

export function getCourseSchedule(course: Course): CourseScheduleInfo {
  const seed = course.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const startMonth = (seed % 6) + 3;
  const start = new Date(2026, startMonth - 1, 3);
  const end = addDays(start, course.estimatedMinutes <= 30 ? 14 : 30);
  const applyStart = addDays(start, -35);
  const applyEnd = addDays(start, -2);

  return {
    educationPeriod: `${formatKoreanDate(start)} - ${formatKoreanDate(end)}`,
    educationBadge: course.targetRole === 'athlete' ? '기관배정' : '온라인교육',
    applicationPeriod: `${formatKoreanDate(applyStart)} - ${formatKoreanDate(applyEnd)}`,
    reviewPeriod: '학습종료 후 180일 까지',
    educationHours: `${Math.max(1, Math.round(course.estimatedMinutes / 60))}시간`,
  };
}

export interface CourseInstructor {
  name: string;
  bio: string[];
}

const INSTRUCTORS: Record<UserRole, CourseInstructor> = {
  athlete: {
    name: '박서준',
    bio: [
      '대한체육회 스포츠윤리교육 자문위원',
      '전 국가대표 선수 출신 스포츠 멘토',
      '15년 학생선수 인성·멘탈 코칭 경력',
      '《FAIR PLAY 선수 되기》 집필',
      '스포츠인성교육 전문강사',
    ],
  },
  guardian: {
    name: '이수연',
    bio: [
      '학부모 스포츠교육 상담 전문가',
      '대한스포츠학부모연합 교육위원',
      '12년 청소년 스포츠 지원 활동',
      '《부모의 언어가 선수를 만든다》 집필',
      '가정-학교-팀 연계 교육 컨설턴트',
    ],
  },
  coach: {
    name: '정민호',
    bio: [
      '대한체육회 지도자 윤리교육 강사',
      '전 프로팀 코치 · 스포츠 심리학 석사',
      '20년 현장 지도 및 팀 문화 컨설팅',
      '《존중으로 지도하는 사람》 집필',
      '스포츠 지도자 역량강화 프로그램 운영',
    ],
  },
  org_manager: {
    name: '김원표',
    bio: ['기관교육 운영 컨설턴트'],
  },
  content_manager: {
    name: '관리자',
    bio: ['콘텐츠 운영'],
  },
  super_admin: {
    name: '관리자',
    bio: ['시스템 운영'],
  },
};

export function getCourseInstructor(course: Course): CourseInstructor {
  return INSTRUCTORS[course.targetRole];
}

export function getCourseTargetAudience(course: Course): string {
  const roleLabel = ROLE_LABELS[course.targetRole];
  const age = course.targetAgeGroup ? ` (${course.targetAgeGroup})` : '';
  const values = course.values.map(getValueLabel).join('·');
  return `${roleLabel}${age} — ${values} 가치를 실제 상황에서 연습하고 팀·가정·지도 현장에 적용하고자 하는 학습자`;
}

export interface CompletionCriteriaRow {
  label: string;
  progress: string;
  midterm: string;
  final: string;
  assignment: string;
  total: string;
}

export function getCompletionCriteria(course: Course): {
  weight: CompletionCriteriaRow;
  cutoff: CompletionCriteriaRow;
} {
  const rules = course.completionRules;
  return {
    weight: {
      label: '반영비율',
      progress: '10%',
      midterm: rules.requiredScenarioComplete ? '40%' : '30%',
      final: `${rules.minimumQuizScore > 0 ? 50 : 40}%`,
      assignment: rules.commitmentRequired ? '포함' : '-',
      total: '100점',
    },
    cutoff: {
      label: '이수(과락)기준',
      progress: `${rules.requiredLessonPercent}%`,
      midterm: '-',
      final: '-',
      assignment: '-',
      total: `${rules.minimumQuizScore}점`,
    },
  };
}

export function getCourseDetailMeta(course: Course, index: number) {
  const pricing = getCoursePricing(course, index);
  const subsidy = pricing.listPrice - pricing.finalPrice;

  return {
    thumbnail: getCourseThumbnail(course, index),
    tone: getCourseThumbnailTone(course, index),
    schedule: getCourseSchedule(course),
    instructor: getCourseInstructor(course),
    pricing: {
      listPrice: formatWon(pricing.listPrice),
      subsidy: formatWon(subsidy),
      finalPrice: formatWon(pricing.finalPrice),
    },
    lessonCount: countLessons(course),
    targetAudience: getCourseTargetAudience(course),
    completion: getCompletionCriteria(course),
  };
}
