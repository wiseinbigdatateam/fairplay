import { Link } from 'react-router-dom';
import { FAIR_PLAY_VALUES } from '@/domain';
import { Section } from '@/components/ui/PageStates';

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <p className="hero-label">FAIR PLAY ACADEMY</p>
          <h1>
            승리를 넘어,
            <br />
            존중받는 선수로
          </h1>
          <p className="hero-desc">
            경기와 훈련, 온라인과 일상에서 마주하는 실제 상황을 통해 공정·존중·책임·공존·용기를 배우고
            실천합니다.
          </p>
          <div className="hero-actions">
            <Link to="/courses?role=athlete" className="btn btn-primary">
              학생선수 교육 시작
            </Link>
            <Link to="/courses?role=guardian" className="btn btn-secondary">
              학부모·지도자 교육
            </Link>
            <Link to="/organizations" className="btn btn-ghost">
              기관교육 알아보기
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <img
            src="/assets/hero-handshake.jpg"
            alt="악수하는 학생선수 — 팀워크와 존중의 순간"
            width={1200}
            height={800}
          />
        </div>
      </section>

      <Section title="당신에게 맞는 페어플레이 교육을 시작하세요">
        <div className="role-grid">
          {[
            { role: '학생선수', quote: '좋은 선택도 훈련할 수 있습니다.', to: '/courses?role=athlete' },
            { role: '학부모', quote: '가정의 언어와 태도가 선수의 기준을 만듭니다.', to: '/courses?role=guardian' },
            { role: '지도자', quote: '지도자의 말과 선택이 팀 문화를 만듭니다.', to: '/courses?role=coach' },
            {
              role: '기관관리자',
              quote: '교육 배정부터 이수와 변화까지 한곳에서 관리합니다.',
              to: '/organization',
            },
          ].map((item) => (
            <Link key={item.role} to={item.to} className="role-card">
              <h3>{item.role}</h3>
              <p>{item.quote}</p>
            </Link>
          ))}
        </div>
      </Section>

      <section className="section section-dark">
        <div className="editorial-split">
          <div>
            <p className="section-label">BEYOND VICTORY</p>
            <h2>
              한 번의 승리는 기록에 남지만,
              <br />
              공정과 존중은 선수 이후의 삶에 남습니다.
            </h2>
            <p style={{ opacity: 0.82, lineHeight: 1.75 }}>
              메달보다 오래 남는 것. 경기력은 선수의 현재를 만들고, 가치는 선수의 미래를 만듭니다.
            </p>
          </div>
          <div className="editorial-photo">
            <img src="/assets/team-quiet.jpg" alt="팀 벤치에서 함께하는 선수들" loading="lazy" />
          </div>
        </div>
      </section>

      <Section label="VALUES" title="페어플레이 다섯 가지 가치">
        <div className="values-editorial">
          {(Object.keys(FAIR_PLAY_VALUES) as Array<keyof typeof FAIR_PLAY_VALUES>).map((key) => (
            <article key={key} className="value-row">
              <span className="value-en">{FAIR_PLAY_VALUES[key].en}</span>
              <h3>{FAIR_PLAY_VALUES[key].ko}</h3>
            </article>
          ))}
        </div>
      </Section>

      <Section title="정답을 외우는 교육이 아니라, 더 나은 선택을 연습하는 교육">
        <div className="editorial-split">
          <ol className="learning-flow">
            <li>실제 상황 확인</li>
            <li>나의 행동 선택</li>
            <li>선택의 영향 확인</li>
            <li>더 나은 행동 연습</li>
            <li>확인문항</li>
            <li>실천약속</li>
            <li>이수 및 변화 확인</li>
          </ol>
          <div className="editorial-photo">
            <img src="/assets/track-dawn.jpg" alt="새벽 트랙 위 훈련하는 선수" loading="lazy" />
          </div>
        </div>
      </Section>

      <Section title="대상별 대표 교육과정">
        <div className="course-preview-grid">
          <Link to="/courses?role=athlete" className="preview-card">
            <strong>학생선수</strong>
            <span>9개 과정</span>
          </Link>
          <Link to="/courses?role=guardian" className="preview-card">
            <strong>학부모</strong>
            <span>4개 과정</span>
          </Link>
          <Link to="/courses?role=coach" className="preview-card">
            <strong>지도자</strong>
            <span>8개 과정</span>
          </Link>
        </div>
      </Section>

      <section className="section">
        <div className="editorial-split">
          <div>
            <p className="section-label">EXPERIENCE</p>
            <h2>상황형 무료체험</h2>
            <p style={{ color: 'var(--graphite-soft)', lineHeight: 1.75 }}>
              팀 단체채팅 조롱 상황 — 선택의 영향을 직접 확인해 보세요.
            </p>
            <Link to="/experience" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
              무료체험 시작
            </Link>
          </div>
          <div className="editorial-photo">
            <img src="/assets/support.jpg" alt="지도자와 선수의 대화" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>한 명의 태도 변화에서 시작해, 한 팀의 문화를 바꿉니다.</h2>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary">
            교육 시작하기
          </Link>
          <Link to="/support" className="btn btn-secondary">
            기관교육 도입 문의
          </Link>
          <Link to="/proposal" className="btn btn-ghost">
            디지털 제안서 보기
          </Link>
        </div>
      </section>
    </>
  );
}
