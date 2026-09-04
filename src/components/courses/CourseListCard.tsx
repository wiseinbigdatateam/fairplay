import { Link } from 'react-router-dom';
import type { Course } from '@/domain';
import {
  countLessons,
  formatEducationHours,
  formatEducationPeriod,
  formatWon,
  getCourseBadges,
  getCoursePricing,
  getCourseRating,
  getCourseThumbnail,
  getCourseThumbnailTone,
  getValueLabel,
} from '@/components/courses/courseCatalogUtils';

import { getCourseLearnHref, isLearnPageHref } from '@/components/courses/courseDetailUtils';

interface CourseListCardProps {
  course: Course;
  index: number;
  previewHref?: string;
  enrollHref?: string;
  mode?: 'catalog' | 'my-courses';
  progressPercent?: number;
  learnHref?: string;
}

export function CourseListCard({
  course,
  index,
  previewHref,
  enrollHref,
  mode = 'catalog',
  progressPercent = 0,
  learnHref,
}: CourseListCardProps) {
  const lessonCount = countLessons(course);
  const badges = getCourseBadges(course, index);
  const thumbnail = getCourseThumbnail(course, index);
  const tone = getCourseThumbnailTone(course, index);
  const rating = getCourseRating(course, index);
  const pricing = getCoursePricing(course, index);
  const detailHref = previewHref ?? `/courses/${course.slug}`;
  const startHref = learnHref ?? enrollHref ?? getCourseLearnHref(course);
  const isMyCourses = mode === 'my-courses';
  const openDetailInNewTab = isLearnPageHref(detailHref);
  const openLearnInNewTab = isLearnPageHref(startHref);

  return (
    <article className="course-card">
      <Link
        to={detailHref}
        target={openDetailInNewTab ? '_blank' : undefined}
        rel={openDetailInNewTab ? 'noopener noreferrer' : undefined}
        className="course-card-thumb"
        aria-label={openDetailInNewTab ? `${course.title} 수강하기` : `${course.title} 상세보기`}
      >
        <div className={`course-card-thumb-inner ${tone}`}>
          <img src={thumbnail} alt="" className="course-card-thumb-image" loading="lazy" />
          <div className="course-card-thumb-overlay">
            <span className="course-card-thumb-label">{getValueLabel(course.values[0] ?? 'fairness')}</span>
            <strong>{course.title}</strong>
          </div>
        </div>
      </Link>

      <div className="course-card-body">
        <Link
          to={detailHref}
          target={openDetailInNewTab ? '_blank' : undefined}
          rel={openDetailInNewTab ? 'noopener noreferrer' : undefined}
          className="course-card-title"
        >
          {course.title}
        </Link>

        <div className="course-card-rating" aria-label={`평점 ${rating.stars}점, 리뷰 ${rating.count}개`}>
          <span className="course-stars" aria-hidden="true">
            {'★'.repeat(rating.stars)}
            {'☆'.repeat(5 - rating.stars)}
          </span>
          <span className="course-review-count">({rating.count})</span>
        </div>

        <p className="course-card-desc">{course.description}</p>

        <dl className="course-card-meta">
          <div>
            <dt>강의수</dt>
            <dd>{lessonCount}차시</dd>
          </div>
          <div>
            <dt>교육기간</dt>
            <dd>{formatEducationPeriod(course.estimatedMinutes)}</dd>
          </div>
          <div>
            <dt>교육시간</dt>
            <dd>{formatEducationHours(course.estimatedMinutes)}</dd>
          </div>
          {isMyCourses && (
            <div>
              <dt>진도율</dt>
              <dd>{progressPercent}%</dd>
            </div>
          )}
        </dl>

        {isMyCourses && (
          <div className="course-card-progress">
            <div
              className="progress-bar course-card-progress-bar"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${course.title} 진도율 ${progressPercent}%`}
            >
              <div style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        <div className="course-card-tags">
          {badges.map((badge) => (
            <span key={badge} className="course-tag">
              {badge}
            </span>
          ))}
          {course.values.slice(0, 2).map((value) => (
            <span key={value} className="course-tag course-tag-value">
              {getValueLabel(value)}
            </span>
          ))}
        </div>
      </div>

      <div className="course-card-side">
        {isMyCourses ? (
          <>
            <div className="course-card-progress-summary">
              <span className="course-price-label">학습 진도</span>
              <strong className="course-card-progress-value">{progressPercent}%</strong>
              <span className="course-price-sub">
                {progressPercent >= 100 ? '수료 완료' : progressPercent > 0 ? '수강 중' : '학습 시작 전'}
              </span>
            </div>
            <div className="course-card-actions">
              <Link
                to={startHref}
                target={openLearnInNewTab ? '_blank' : undefined}
                rel={openLearnInNewTab ? 'noopener noreferrer' : undefined}
                className="btn btn-primary btn-sm course-btn-enroll"
              >
                수강하기
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="course-card-price">
              <span className="course-price-list">
                정가 <s>{formatWon(pricing.listPrice)}</s>
              </span>
              <span className="course-price-label">실결제액</span>
              <strong className="course-price-value">{formatWon(pricing.finalPrice)}</strong>
            </div>
            <div className="course-card-actions">
              <Link to={detailHref} className="btn btn-secondary btn-sm course-btn-preview">
                맛보기
              </Link>
              <Link
                to={startHref}
                target={openLearnInNewTab ? '_blank' : undefined}
                rel={openLearnInNewTab ? 'noopener noreferrer' : undefined}
                className="btn btn-primary btn-sm course-btn-enroll"
              >
                수강신청
              </Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
