import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '@/domain';
import {
  getCourseDetailMeta,
  getCourseIndex,
} from '@/components/courses/courseDetailUtils';

type DetailTab = 'intro' | 'curriculum';

interface CourseDetailViewProps {
  course: Course;
  enrollHref?: string;
  enrollState?: { from: { pathname: string } };
  enrollLabel?: string;
}

export function CourseDetailView({
  course,
  enrollHref = '/login',
  enrollState,
  enrollLabel = '수강하기',
}: CourseDetailViewProps) {
  const [tab, setTab] = useState<DetailTab>('intro');
  const index = getCourseIndex(course);
  const meta = getCourseDetailMeta(course, index);
  const { weight, cutoff } = meta.completion;
  const openLearnInNewTab = enrollHref.includes('/learn/');

  return (
    <div className="course-detail">
      <section className="course-detail-hero panel">
        <div className="course-detail-thumb">
          <div className={`course-detail-thumb-inner ${meta.tone}`}>
            <img src={meta.thumbnail} alt="" className="course-detail-thumb-image" />
            <div className="course-detail-thumb-overlay">
              <strong>{course.title}</strong>
            </div>
          </div>
        </div>

        <div className="course-detail-summary">
          <h1>{course.title}</h1>
          <dl className="course-detail-info">
            <div>
              <dt>교육기간</dt>
              <dd>{meta.schedule.educationPeriod}</dd>
            </div>
            <div>
              <dt>신청기간</dt>
              <dd>{meta.schedule.applicationPeriod}</dd>
            </div>
            <div>
              <dt>복습기간</dt>
              <dd>{meta.schedule.reviewPeriod}</dd>
            </div>
            <div>
              <dt>교육시간</dt>
              <dd>{meta.schedule.educationHours}</dd>
            </div>
            <div>
              <dt>강사</dt>
              <dd>{meta.instructor.name}</dd>
            </div>
            <div>
              <dt>교육비</dt>
              <dd className="course-detail-price-list">{meta.pricing.listPrice}</dd>
            </div>
          </dl>
          <Link
            to={enrollHref}
            state={enrollState}
            target={openLearnInNewTab ? '_blank' : undefined}
            rel={openLearnInNewTab ? 'noopener noreferrer' : undefined}
            className="btn btn-primary course-detail-enroll"
          >
            {enrollLabel}
          </Link>
        </div>
      </section>

      <div className="course-detail-tabs" role="tablist" aria-label="과정 상세">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'intro'}
          className={`course-detail-tab ${tab === 'intro' ? 'active' : ''}`}
          onClick={() => setTab('intro')}
        >
          과정소개
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'curriculum'}
          className={`course-detail-tab ${tab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setTab('curriculum')}
        >
          커리큘럼
        </button>
      </div>

      {tab === 'intro' ? (
        <div className="course-detail-content">
          <section className="course-detail-section">
            <h2>학습목표</h2>
            <ol className="course-detail-objectives">
              {course.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ol>
          </section>

          <section className="course-detail-section">
            <h2>교육대상</h2>
            <p className="course-detail-audience">- {meta.targetAudience}</p>
          </section>

          <section className="course-detail-section">
            <h2>수료기준</h2>
            <div className="course-detail-table-wrap">
              <table className="course-detail-table">
                <thead>
                  <tr>
                    <th scope="col">평가기준</th>
                    <th scope="col">진도율</th>
                    <th scope="col">진행단계평가</th>
                    <th scope="col">최종평가</th>
                    <th scope="col">과제</th>
                    <th scope="col">총점</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{weight.label}</th>
                    <td>{weight.progress}</td>
                    <td>{weight.midterm}</td>
                    <td>{weight.final}</td>
                    <td>{weight.assignment}</td>
                    <td>{weight.total}</td>
                  </tr>
                  <tr>
                    <th scope="row">{cutoff.label}</th>
                    <td>{cutoff.progress}</td>
                    <td>{cutoff.midterm}</td>
                    <td>{cutoff.final}</td>
                    <td>{cutoff.assignment}</td>
                    <td>{cutoff.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="course-detail-note">
              ※ 수료기준은 각 평가항목의 점수가 수료기준 점수 이상이고 총점이{' '}
              <strong>{course.completionRules.minimumQuizScore}점</strong> 이상이어야 합니다.
            </p>
          </section>

          <section className="course-detail-section">
            <h2>강사소개</h2>
            <div className="course-detail-instructor panel">
              <dl>
                <div>
                  <dt>강사명</dt>
                  <dd>{meta.instructor.name}</dd>
                </div>
                <div>
                  <dt>강사약력</dt>
                  <dd>
                    <ul>
                      {meta.instructor.bio.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      ) : (
        <div className="course-detail-content">
          <section className="course-detail-section">
            <h2>커리큘럼</h2>
            <p className="course-detail-desc">{course.description}</p>
            <ul className="course-detail-curriculum">
              {course.modules.map((mod) => (
                <li key={mod.id}>
                  <strong>{mod.title}</strong>
                  <span>{mod.lessonIds.length}차시 · {meta.schedule.educationHours}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
