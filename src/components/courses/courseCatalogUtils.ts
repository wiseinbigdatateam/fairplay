import type { Course, FairPlayValue, UserRole } from '@/domain';
import { FAIR_PLAY_VALUES } from '@/domain';

const THUMBNAIL_IMAGES = [
  '/assets/hero-handshake.jpg',
  '/assets/team-quiet.jpg',
  '/assets/track-dawn.jpg',
  '/assets/support.jpg',
];

const THUMBNAIL_TONES = [
  'tone-rose',
  'tone-sky',
  'tone-mint',
  'tone-sand',
  'tone-lavender',
];

export function getCourseThumbnail(_course: Course, index: number): string {
  return THUMBNAIL_IMAGES[index % THUMBNAIL_IMAGES.length];
}

export function getCourseThumbnailTone(_course: Course, index: number): string {
  return THUMBNAIL_TONES[index % THUMBNAIL_TONES.length];
}

export function countLessons(course: Course): number {
  return course.modules.reduce((sum, mod) => sum + mod.lessonIds.length, 0);
}

export function formatEducationHours(minutes: number): string {
  return `${(minutes / 60).toFixed(2)}시간`;
}

export function formatEducationPeriod(minutes: number): string {
  if (minutes <= 30) return '1주';
  if (minutes <= 60) return '2주';
  return '1개월';
}

export function getValueLabel(value: FairPlayValue): string {
  return FAIR_PLAY_VALUES[value].ko;
}

export function getCourseBadges(course: Course, index: number): string[] {
  const badges: string[] = ['온라인교육', '모바일지원'];
  if (index === 0) badges.push('추천');
  if (index === 1) badges.push('인기');
  if (course.targetRole === 'athlete') badges.push('상황형 학습');
  return badges;
}

export function getCourseRating(
  course: Course,
  index: number,
): { stars: number; count: number } {
  const seed = course.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    stars: 5,
    count: index === 0 ? 26 : seed % 41,
  };
}

export function getCoursePricing(
  course: Course,
  index: number,
): { listPrice: number; finalPrice: number } {
  const lessonCount = countLessons(course);
  const listPrice = 68000 + lessonCount * 1600 + index * 8000;
  const finalPrice = Math.round(listPrice * (index === 0 ? 0.35 : 0.42));
  return { listPrice, finalPrice };
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export const ROLE_TABS: Array<{ role: UserRole; label: string }> = [
  { role: 'athlete', label: '학생선수' },
  { role: 'guardian', label: '학부모' },
  { role: 'coach', label: '지도자' },
];

export const VALUE_FILTER_OPTIONS: Array<{ value: FairPlayValue | 'all'; label: string }> = [
  { value: 'all', label: '- 카테고리 -' },
  { value: 'fairness', label: '공정' },
  { value: 'respect', label: '존중' },
  { value: 'responsibility', label: '책임' },
  { value: 'coexistence', label: '공존' },
  { value: 'courage', label: '용기' },
];

export function filterCourses(
  courses: Course[],
  query: string,
  valueFilter: FairPlayValue | 'all',
): Course[] {
  const q = query.trim().toLowerCase();
  return courses.filter((course) => {
    const matchesValue =
      valueFilter === 'all' || course.values.includes(valueFilter);
    const matchesQuery =
      !q ||
      course.title.toLowerCase().includes(q) ||
      course.description.toLowerCase().includes(q);
    return matchesValue && matchesQuery;
  });
}
