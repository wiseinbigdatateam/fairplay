import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { CourseListCard } from '@/components/courses/CourseListCard';
import {
  filterCourses,
  ROLE_TABS,
  VALUE_FILTER_OPTIONS,
} from '@/components/courses/courseCatalogUtils';
import type { Course, FairPlayValue, UserRole } from '@/domain';
import { ROLE_LABELS } from '@/domain';
import { CourseDetailView } from '@/components/courses/CourseDetailView';
import { getCourseLearnHref } from '@/components/courses/courseDetailUtils';
import { EmptyState, LoadingState, PageHeader } from '@/components/ui/PageStates';

export function CoursesPage() {
  const deps = useDeps();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = (searchParams.get('role') as UserRole | null) ?? 'athlete';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [valueFilter, setValueFilter] = useState<FairPlayValue | 'all'>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await deps.courseRepository.listCoursesForRole(role);
      setCourses(list);
      setLoading(false);
    })();
  }, [role, deps.courseRepository]);

  const filtered = useMemo(
    () => filterCourses(courses, query, valueFilter),
    [courses, query, valueFilter],
  );

  const setRole = (nextRole: UserRole) => {
    setSearchParams({ role: nextRole });
    setQuery('');
    setValueFilter('all');
  };

  if (loading) return <LoadingState label="교육과정을 불러오는 중…" />;

  return (
    <div className="course-catalog">
      <div className="course-catalog-tabs" role="tablist" aria-label="교육 대상">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.role}
            type="button"
            role="tab"
            aria-selected={role === tab.role}
            className={`course-tab ${role === tab.role ? 'active' : ''}`}
            onClick={() => setRole(tab.role)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <header className="course-catalog-header">
        <h1>{ROLE_LABELS[role]} 교육과정</h1>
        <p>{ROLE_LABELS[role]}를 위한 FAIR PLAY 가치교육 과정입니다.</p>
      </header>

      <div className="course-catalog-toolbar">
        <label className="course-filter-select">
          <span className="sr-only">카테고리</span>
          <select
            value={valueFilter}
            onChange={(e) => setValueFilter(e.target.value as FairPlayValue | 'all')}
          >
            {VALUE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="course-search">
          <span className="sr-only">과정 검색</span>
          <input
            type="search"
            placeholder="과정명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="course-card-list">
        {filtered.length === 0 ? (
          <EmptyState
            title="검색 결과가 없습니다"
            description="다른 검색어나 카테고리를 선택해 보세요."
          />
        ) : (
          filtered.map((course, index) => (
            <CourseListCard key={course.id} course={course} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

export function CourseDetailPage() {
  const { slug = '' } = useParams();
  const deps = useDeps();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    deps.courseRepository.getCourseBySlug(slug).then(setCourse);
  }, [slug, deps.courseRepository]);

  if (!course) return <LoadingState label="과정 정보 확인 중…" />;

  const learnHref = getCourseLearnHref(course);

  return (
    <div className="course-detail-page">
      <CourseDetailView
        course={course}
        enrollHref={user ? learnHref : '/login'}
        enrollState={user ? undefined : { from: { pathname: learnHref } }}
      />
    </div>
  );
}

export function AppCoursesPage() {
  const deps = useDeps();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Array<{ course: Course; progressPercent: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const assigned = await deps.courseRepository.listAssignedCourses(user.id);
      const withProgress = await Promise.all(
        assigned.map(async (course) => {
          const progress = await deps.learningRepository.getCourseProgress(user.id, course.id);
          return {
            course,
            progressPercent: progress?.progressPercent ?? 0,
          };
        }),
      );
      setCourses(withProgress);
      setLoading(false);
    })();
  }, [user, deps.courseRepository, deps.learningRepository]);

  if (loading) return <LoadingState label="교육과정을 불러오는 중…" />;

  return (
    <div className="course-catalog">
      <PageHeader title="내 교육과정" description="배정된 교육과정의 학습 진도를 확인하고 이어서 학습할 수 있습니다." />
      {courses.length === 0 ? (
        <EmptyState
          title="배정된 교육과정이 없습니다"
          description="기관 관리자에게 교육과정 배정을 요청해 주세요."
        />
      ) : (
        <div className="course-card-list">
          {courses.map(({ course, progressPercent }, index) => {
            const learnHref = getCourseLearnHref(course);
            return (
              <CourseListCard
                key={course.id}
                course={course}
                index={index}
                mode="my-courses"
                progressPercent={progressPercent}
                previewHref={learnHref}
                learnHref={learnHref}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
