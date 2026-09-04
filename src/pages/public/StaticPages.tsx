import { PageHeader, EmptyState } from '@/components/ui/PageStates';

export function AboutPage() {
  return (
    <div className="content-page">
      <PageHeader title="FAIR PLAY ACADEMY 소개" description="승리를 넘어, 존중받는 선수로" />
      <p>
        FAIR PLAY ACADEMY(페어플레이 아카데미)는 학생선수가 경기와 훈련, 온라인과 일상에서 마주하는 실제
        상황을 통해 공정·존중·책임·공존·용기를 배우고 실천하는 온라인 스포츠 가치교육 플랫폼입니다.
      </p>
      <p>경기력은 선수의 현재를 만들고, 가치는 선수의 미래를 만듭니다.</p>
    </div>
  );
}

export function ValuesPage() {
  return (
    <div className="content-page">
      <PageHeader title="다섯 가지 가치" />
      <ul className="values-list">
        <li>공정 — 규칙과 정당한 경쟁을 지키는 태도</li>
        <li>존중 — 상대·동료·심판·관중을 사람으로 존중하는 태도</li>
        <li>책임 — 자신의 말과 행동이 팀과 사회에 미치는 영향을 이해하는 태도</li>
        <li>공존 — 서로의 차이를 인정하고 함께 성장하는 태도</li>
        <li>용기 — 잘못된 행동에 침묵하지 않고 동료를 보호하는 태도</li>
      </ul>
    </div>
  );
}

export function ProgramPage({ audience }: { audience: string }) {
  return (
    <div className="content-page">
      <PageHeader title={`${audience} 교육`} description="출전 전에 가치를 준비하는 체육" />
      <p>대상별 맞춤 교육과정을 제공합니다. 과정 목록과 학습 흐름을 확인할 수 있습니다.</p>
      <a href="/courses" className="btn btn-primary">
        교육과정 보기
      </a>
    </div>
  );
}

export function ProposalPage() {
  return (
    <div className="content-page proposal-page">
      <PageHeader title="디지털 제안서" description="기관교육 도입 제안" />
      <section className="proposal-section panel">
        <h2>FAIR PLAY ACADEMY 기관교육</h2>
        <p>교육 배정 · 진도 · 수료 · 익명 통계 · 결과보고서</p>
        <ul>
          <li>학생선수 9과정 / 학부모 4과정 / 지도자 8과정</li>
          <li>상황형 학습 · 확인문항 · 실천약속</li>
          <li>개인정보 보호 중심 설계 (5명 미만 통계 비공개)</li>
        </ul>
      </section>
    </div>
  );
}

export function SupportPage() {
  return (
    <div className="content-page">
      <PageHeader title="도입 문의" />
      <form className="demo-form" onSubmit={(e) => e.preventDefault()}>
        <label>
          기관명
          <input type="text" />
        </label>
        <label>
          담당자
          <input type="text" />
        </label>
        <button type="submit" className="btn btn-primary">
          문의 남기기
        </button>
      </form>
    </div>
  );
}

export function ExperiencePage() {
  return (
    <div className="content-page">
      <PageHeader title="상황형 무료체험" description="팀 단체채팅 조롱 상황" />
      <p>학생선수로 입장한 뒤 ‘챔피언의 품격’ 1차시를 시작해 보세요.</p>
      <a href="/login" className="btn btn-primary">
        교육 시작하기
      </a>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <EmptyState
      title="페이지를 찾을 수 없습니다"
      description="주소를 확인하거나 홈으로 이동해 주세요."
      action={{ to: '/', label: '홈으로' }}
    />
  );
}

export function SimpleContentPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="content-page">
      <PageHeader title={title} />
      <p>{body}</p>
    </div>
  );
}
