import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  canIssueCertificate,
  CERTIFICATE_STATUS_LABEL,
  formatCertificateDate,
  getCertificateRowStatus,
  sortCertificatesNewestFirst,
} from '@/application/services/certificateRules';
import { getCourseLearnHref } from '@/components/courses/courseDetailUtils';
import { EmptyState, LoadingState, PageHeader } from '@/components/ui/PageStates';
import type { Certificate, Course } from '@/domain';

type CourseRow = {
  course: Course;
  progressPercent: number;
  certificate: Certificate | null;
};

interface CertificatesPageProps {
  /** 교육과정 목록/상세 경로 prefix (예: /app/courses, /guardian/courses) */
  coursesPath?: string;
}

export function CertificatesPage({ coursesPath = '/app/courses' }: CertificatesPageProps) {
  const deps = useDeps();
  const { user } = useAuth();
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const assigned = await deps.courseRepository.listAssignedCourses(user.id);
      const issued = sortCertificatesNewestFirst(
        await deps.certificateRepository.listCertificates(user.id),
      );
      const byCourse = new Map(issued.map((c) => [c.courseId, c]));
      const nextRows = await Promise.all(
        assigned.map(async (course) => {
          const progress = await deps.learningRepository.getCourseProgress(user.id, course.id);
          return {
            course,
            progressPercent: progress?.progressPercent ?? 0,
            certificate: byCourse.get(course.id) ?? null,
          };
        }),
      );
      setRows(nextRows);
      setCertificates(issued);
      setSelectedId((prev) => {
        if (prev && issued.some((c) => c.id === prev)) return prev;
        return issued[0]?.id ?? null;
      });
    } catch {
      setError('수료증 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user, deps]);

  const selected = certificates.find((c) => c.id === selectedId) ?? null;
  const eligibleCount = rows.filter((r) =>
    canIssueCertificate(r.progressPercent, !!r.certificate),
  ).length;

  const handleIssue = async (courseId: string) => {
    if (!user) return;
    setIssuingId(courseId);
    setError(null);
    try {
      const cert = await deps.certificateRepository.createDemoCertificatePreview({
        userId: user.id,
        courseId,
      });
      await load();
      setSelectedId(cert.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '수료증 발급에 실패했습니다.');
    } finally {
      setIssuingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingState label="수료증을 불러오는 중…" />;

  return (
    <div className="certificates-page">
      <PageHeader
        title="수료증"
        description="과정 이수를 확인하고, 발급된 수료증을 미리보기·인쇄할 수 있습니다."
      />

      {error && (
        <p className="exam-error" role="alert">
          {error}
        </p>
      )}

      <div className="cert-summary panel">
        <div className="cert-summary-item">
          <span>발급 완료</span>
          <strong>{certificates.length}</strong>
        </div>
        <div className="cert-summary-item">
          <span>발급 가능</span>
          <strong>{eligibleCount}</strong>
        </div>
        <div className="cert-summary-item">
          <span>배정 과정</span>
          <strong>{rows.length}</strong>
        </div>
      </div>

      <section className="panel cert-status-section">
        <h2>과정별 수료 현황</h2>
        {rows.length === 0 ? (
          <EmptyState
            title="배정된 교육과정이 없습니다"
            description="기관에서 교육을 배정하면 수료 현황이 표시됩니다."
            action={{ to: coursesPath, label: '교육과정 보기' }}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="data-table">
              <caption className="sr-only">과정별 수료증 발급 현황</caption>
              <thead>
                <tr>
                  <th scope="col">교육과정</th>
                  <th scope="col">진도</th>
                  <th scope="col">상태</th>
                  <th scope="col">수료일</th>
                  <th scope="col">작업</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ course, progressPercent, certificate }) => {
                  const status = getCertificateRowStatus(progressPercent, !!certificate);
                  const canIssue = canIssueCertificate(progressPercent, !!certificate);
                  return (
                    <tr key={course.id}>
                      <td>{course.title}</td>
                      <td>{progressPercent}%</td>
                      <td>
                        <span className={`cert-status cert-status-${status}`}>
                          {CERTIFICATE_STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td>
                        {certificate ? formatCertificateDate(certificate.completedAt) : '—'}
                      </td>
                      <td>
                        {certificate ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedId(certificate.id)}
                          >
                            보기
                          </button>
                        ) : canIssue ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={issuingId === course.id}
                            onClick={() => handleIssue(course.id)}
                          >
                            {issuingId === course.id ? '발급 중…' : '수료증 발급'}
                          </button>
                        ) : (
                          <Link
                            to={getCourseLearnHref(course)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-link"
                          >
                            학습하기
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel cert-preview-section">
        <div className="cert-preview-header">
          <h2>수료증 미리보기</h2>
          {selected && (
            <button type="button" className="btn btn-primary btn-sm no-print-hide" onClick={handlePrint}>
              인쇄 / PDF 저장
            </button>
          )}
        </div>

        {!selected ? (
          <EmptyState
            title="표시할 수료증이 없습니다"
            description="과정을 완료한 뒤 ‘수료증 발급’을 누르면 여기에 표시됩니다."
          />
        ) : (
          <CertificateDocument certificate={selected} />
        )}
      </section>

      {certificates.length > 1 && (
        <section className="panel no-print-hide">
          <h2>발급된 수료증</h2>
          <ul className="cert-list">
            {certificates.map((cert) => (
              <li key={cert.id}>
                <button
                  type="button"
                  className={`cert-list-item ${selectedId === cert.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedId(cert.id)}
                >
                  <strong>{cert.courseTitle}</strong>
                  <span>{formatCertificateDate(cert.completedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CertificateDocument({ certificate }: { certificate: Certificate }) {
  return (
    <article className="certificate-document" aria-label={`${certificate.courseTitle} 수료증`}>
      {certificate.isDemo && <p className="certificate-demo-badge">DEMO</p>}
      <p className="certificate-brand">FAIR PLAY ACADEMY</p>
      <h3 className="certificate-title">수료증</h3>
      <p className="certificate-subtitle">Certificate of Completion</p>

      <p className="certificate-body">
        아래 학습자는 FAIR PLAY ACADEMY의 온라인 가치교육 과정을
        <br />
        성실히 이수하였음을 증명합니다.
      </p>

      <dl className="certificate-fields">
        <div>
          <dt>성명</dt>
          <dd>{certificate.learnerName}</dd>
        </div>
        {certificate.organizationName && (
          <div>
            <dt>소속</dt>
            <dd>{certificate.organizationName}</dd>
          </div>
        )}
        <div>
          <dt>과정명</dt>
          <dd>{certificate.courseTitle}</dd>
        </div>
        <div>
          <dt>교육시간</dt>
          <dd>{certificate.educationHours}시간</dd>
        </div>
        <div>
          <dt>교육기간</dt>
          <dd>{certificate.educationPeriod}</dd>
        </div>
        <div>
          <dt>수료일</dt>
          <dd>{formatCertificateDate(certificate.completedAt)}</dd>
        </div>
      </dl>

      <footer className="certificate-footer">
        <p className="certificate-verify">
          검증코드 <code>{certificate.verificationCode}</code>
        </p>
        <p className="certificate-seal">승리를 넘어, 존중받는 선수로</p>
      </footer>
    </article>
  );
}
