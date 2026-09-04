import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAppConfig } from '@/app/providers/AppProvider';
import { ROLE_LABELS, type UserRole } from '@/domain';

interface AppShellProps {
  basePath: string;
  role: UserRole;
  navItems: Array<{ to: string; label: string }>;
}

export function AppShell({ basePath, role, navItems }: AppShellProps) {
  const { user, signOut } = useAuth();
  const config = useAppConfig();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <Link to={basePath} className="brand-compact">
            FAIR PLAY ACADEMY
          </Link>
          <span className="role-badge">{ROLE_LABELS[role]}</span>
        </div>
        <div className="app-header-actions">
          <Link to="/" className="btn btn-ghost btn-sm">
            메인페이지
          </Link>
          {config.releaseStage !== 'production' && (
            <Link to="/login" className="btn btn-ghost btn-sm">
              역할 전환
            </Link>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => signOut()}>
            로그아웃
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar" aria-label={`${ROLE_LABELS[role]} 메뉴`}>
          <p className="sidebar-greeting">{user?.displayName}님</p>
          <nav>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === basePath}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main id="main-content" className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const CONTENT_MANAGER_NAV = [
  { to: '/admin', label: '콘텐츠 현황' },
  { to: '/admin/content/courses', label: '과정 관리' },
  { to: '/admin/exams/questions', label: '시험 기출' },
  { to: '/admin/exams/results', label: '시험 내역' },
  { to: '/admin/homework/tasks', label: '과제 출제' },
  { to: '/admin/homework', label: '과제 채점' },
  { to: '/admin/content/assessments', label: '자기점검' },
  { to: '/admin/settings', label: '설정' },
];

const SUPER_ADMIN_NAV = [
  { to: '/admin', label: '운영 현황' },
  { to: '/admin/content/courses', label: '과정 관리' },
  { to: '/admin/exams/questions', label: '시험 기출' },
  { to: '/admin/exams/results', label: '시험 내역' },
  { to: '/admin/homework/tasks', label: '과제 출제' },
  { to: '/admin/homework', label: '과제 채점' },
  { to: '/admin/content/assessments', label: '자기점검' },
  { to: '/admin/organizations', label: '기관' },
  { to: '/admin/users', label: '사용자' },
  { to: '/admin/terms', label: '약관' },
  { to: '/admin/audit-logs', label: '감사로그' },
  { to: '/admin/settings', label: '설정' },
];

export function AdminShell() {
  const { session } = useAuth();
  const role = session?.role ?? 'content_manager';
  const navItems = role === 'super_admin' ? SUPER_ADMIN_NAV : CONTENT_MANAGER_NAV;

  return <AppShell basePath="/admin" role={role} navItems={navItems} />;
}
