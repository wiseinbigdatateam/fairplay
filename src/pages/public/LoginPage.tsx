import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROLE_HOME_PATHS, ROLE_LABELS, type UserRole } from '@/domain';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { PageHeader } from '@/components/ui/PageStates';

export const AUTH_ROLES: UserRole[] = [
  'athlete',
  'guardian',
  'coach',
  'org_manager',
  'content_manager',
  'super_admin',
];

type SignupRole = 'athlete' | 'guardian' | 'coach';

export const SIGNUP_ROLES: SignupRole[] = ['athlete', 'guardian', 'coach'];

export function LoginPage() {
  const deps = useDeps();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const handleLogin = async (role: UserRole) => {
    await deps.authGateway.signInDemoRole(role);
    await refresh();
    navigate(redirectPath ?? ROLE_HOME_PATHS[role], { replace: true });
  };

  return (
    <div className="auth-page">
      <PageHeader
        title="로그인"
        description="역할을 선택해 FAIR PLAY ACADEMY 학습공간에 입장하세요."
      />
      <p className="privacy-notice">
        가상 계정으로 체험할 수 있습니다. 실제 개인정보는 입력하지 마세요.
      </p>
      <div className="login-role-grid">
        {AUTH_ROLES.map((role) => (
          <button key={role} type="button" className="login-role-card" onClick={() => handleLogin(role)}>
            <strong>{ROLE_LABELS[role]}</strong>
            <span>입장하기</span>
          </button>
        ))}
      </div>
      <p className="auth-switch">
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </p>
    </div>
  );
}

const SIGNUP_FIELD_LABELS: Record<SignupRole, { name: string; email: string; submit: string }> = {
  athlete: { name: '학생선수 이름', email: '이메일(선택)', submit: '학생선수 가입하기' },
  guardian: { name: '보호자 이름', email: '보호자 이메일', submit: '학부모 가입하기' },
  coach: { name: '지도자 이름', email: '이메일', submit: '지도자 가입하기' },
};

export function SignupPage() {
  const deps = useDeps();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<SignupRole>('athlete');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fields = SIGNUP_FIELD_LABELS[selectedRole];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSubmitting(true);
    try {
      await deps.authGateway.signUpDemo({
        role: selectedRole,
        displayName: displayName.trim(),
        email: email.trim() || undefined,
      });
      await refresh();
      navigate(ROLE_HOME_PATHS[selectedRole], { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <PageHeader
        title="회원가입"
        description="회원 유형을 선택하고 FAIR PLAY ACADEMY에 가입하세요."
      />
      <p className="privacy-notice">
        데모 환경에서는 가상 계정이 생성됩니다. 실제 개인정보는 입력하지 마세요.
      </p>

      <section className="auth-section">
        <h2 className="auth-section-title">회원 유형 선택</h2>
        <div className="login-role-grid">
          {SIGNUP_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={`login-role-card ${selectedRole === role ? 'selected' : ''}`}
              aria-pressed={selectedRole === role}
              onClick={() => setSelectedRole(role)}
            >
              <strong>{ROLE_LABELS[role]}</strong>
              <span>{selectedRole === role ? '선택됨' : '선택하기'}</span>
            </button>
          ))}
        </div>
      </section>

      <form className="demo-form auth-signup-form panel" onSubmit={handleSubmit}>
        <h2 className="auth-section-title">{ROLE_LABELS[selectedRole]} 정보 입력</h2>
        <label>
          {fields.name}
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="예: 김페어"
            required
          />
        </label>
        <label>
          {fields.email}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
        </label>
        {selectedRole === 'athlete' && (
          <p className="privacy-notice">
            만 14세 미만 학생선수는 가입 후 보호자 동의 절차가 필요할 수 있습니다.
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '가입 처리 중…' : fields.submit}
        </button>
      </form>

      <p className="auth-switch">
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </div>
  );
}
