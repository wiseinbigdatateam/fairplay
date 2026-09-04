import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { type UserRole } from '@/domain';

const COURSE_LINKS = [
  { label: '학생선수', to: '/courses?role=athlete' },
  { label: '학부모', to: '/courses?role=guardian' },
  { label: '지도자', to: '/courses?role=coach' },
] as const;

const COMMUNITY_LINKS = [
  { label: '공지사항', to: '/community/announcements' },
  { label: '자주묻는 질문', to: '/community/faq' },
  { label: 'Q&A', to: '/community/qna' },
] as const;

const ROLE_SETTINGS: Record<UserRole, string> = {
  athlete: '/app/settings',
  guardian: '/guardian/settings',
  coach: '/coach/settings',
  org_manager: '/organization/settings',
  content_manager: '/admin',
  super_admin: '/admin',
};

export function PublicNav() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'courses' | 'community' | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  const toggleDropdown = (key: 'courses' | 'community') => {
    setOpenDropdown((current) => (current === key ? null : key));
  };

  const myPagePath = session ? ROLE_SETTINGS[session.role] : '/login';

  return (
    <>
      <button
        type="button"
        className="nav-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="public-nav-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="sr-only">{menuOpen ? '메뉴 닫기' : '메뉴 열기'}</span>
        <span className="nav-menu-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <nav
        id="public-nav-menu"
        aria-label="주요 메뉴"
        className={`public-nav ${menuOpen ? 'is-open' : ''}`}
      >
        <ul className="nav-root">
          <li>
            <Link to="/education" className="nav-link" onClick={closeMenu}>
              페어플레이 교육 안내
            </Link>
          </li>

          <li className={`nav-dropdown ${openDropdown === 'courses' ? 'is-open' : ''}`}>
            <button
              type="button"
              className="nav-link nav-dropdown-trigger"
              aria-haspopup="true"
              aria-expanded={openDropdown === 'courses'}
              onClick={() => toggleDropdown('courses')}
            >
              교육과정
            </button>
            <ul className="nav-dropdown-menu" role="menu">
              {COURSE_LINKS.map((item) => (
                <li key={item.to} role="none">
                  <Link to={item.to} className="nav-dropdown-item" role="menuitem" onClick={closeMenu}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          <li className={`nav-dropdown ${openDropdown === 'community' ? 'is-open' : ''}`}>
            <button
              type="button"
              className="nav-link nav-dropdown-trigger"
              aria-haspopup="true"
              aria-expanded={openDropdown === 'community'}
              onClick={() => toggleDropdown('community')}
            >
              커뮤니티
            </button>
            <ul className="nav-dropdown-menu" role="menu">
              {COMMUNITY_LINKS.map((item) => (
                <li key={item.to} role="none">
                  <Link to={item.to} className="nav-dropdown-item" role="menuitem" onClick={closeMenu}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>

        <div className="nav-auth">
          {session ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm nav-auth-btn" onClick={handleLogout}>
                로그아웃
              </button>
              <Link to={myPagePath} className="btn btn-primary btn-sm" onClick={closeMenu}>
                마이페이지
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm nav-auth-btn" onClick={closeMenu}>
                로그인
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" onClick={closeMenu}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
