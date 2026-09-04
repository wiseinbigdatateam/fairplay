import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { formatCertificateDate } from '@/application/services/certificateRules';
import { LoadingState, PageHeader, StatGrid } from '@/components/ui/PageStates';
import type { Certificate } from '@/domain';

export function GenericRolePage({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
    </div>
  );
}

function RoleCertificatesSummary({
  certificatesPath,
  greeting,
}: {
  certificatesPath: string;
  greeting: string;
}) {
  const deps = useDeps();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [assignedCount, setAssignedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [certs, assigned] = await Promise.all([
        deps.certificateRepository.listCertificates(user.id),
        deps.courseRepository.listAssignedCourses(user.id),
      ]);
      setCertificates(certs);
      setAssignedCount(assigned.length);
      setLoading(false);
    })();
  }, [user, deps]);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title={greeting} />
      <StatGrid
        items={[
          { label: '배정 교육', value: assignedCount },
          { label: '수료증', value: certificates.length },
        ]}
      />
      {certificates.length > 0 ? (
        <section className="panel">
          <h2>최근 수료증</h2>
          <ul className="item-list">
            {certificates.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link to={certificatesPath}>{c.courseTitle}</Link>
                <span>{formatCertificateDate(c.completedAt)}</span>
              </li>
            ))}
          </ul>
          <div className="quick-links">
            <Link to={certificatesPath}>수료증 전체 보기</Link>
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>수료증</h2>
          <p>과정을 완료하면 수료증을 발급·확인할 수 있습니다.</p>
          <div className="quick-links">
            <Link to={certificatesPath}>수료증으로 이동</Link>
          </div>
        </section>
      )}
    </div>
  );
}

export function GuardianDashboardPage() {
  const { user } = useAuth();
  return (
    <RoleCertificatesSummary
      certificatesPath="/guardian/certificates"
      greeting={`${user?.displayName ?? '학부모'}님, 자녀와 함께하는 페어플레이 교육입니다.`}
    />
  );
}

export function CoachDashboardPage() {
  const { user } = useAuth();
  return (
    <RoleCertificatesSummary
      certificatesPath="/coach/certificates"
      greeting={`${user?.displayName ?? '지도자'}님, 존중으로 지도하는 하루를 시작해 보세요.`}
    />
  );
}

export function AdminDashboardPage() {
  return (
    <GenericRolePage title="운영현황" description="전체 운영 현황과 기관·사용자 관리" />
  );
}

export function SettingsPage() {
  return <GenericRolePage title="설정" />;
}
