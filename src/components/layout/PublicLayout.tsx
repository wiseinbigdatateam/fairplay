import { Link, Outlet } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <header className="public-header">
        <Link to="/" className="brand">
          <span className="brand-en">FAIR PLAY ACADEMY</span>
          <span className="brand-ko">페어플레이 아카데미</span>
        </Link>
        <PublicNav />
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="public-footer">
        <p className="footer-brand">FAIR PLAY ACADEMY</p>
        <p>승리를 넘어, 존중받는 선수로</p>
        <p className="footer-note">학생선수·학부모·지도자·기관을 위한 온라인 스포츠 가치교육 플랫폼</p>
      </footer>
    </div>
  );
}
