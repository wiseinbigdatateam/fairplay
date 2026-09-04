# FAIR PLAY ACADEMY

**승리를 넘어, 존중받는 선수로**

기능 검증 및 기관 제안용 **프로토타입**입니다. 회사 소유 Supabase 연결 및 인증·RLS·서버 권한검증 완료 전 **실서비스 운영 불가**.

## 기술 스택

- Vite + React 18 + TypeScript (strict)
- React Router 6
- Vitest + Testing Library

## 시작하기

```bash
# Node.js 20+ 필요
npm install
cp .env.example .env
npm run dev
```

## 환경변수

```env
VITE_RELEASE_STAGE=prototype   # prototype | pilot | production
VITE_DATA_PROVIDER=demo        # demo | supabase
VITE_ENABLE_DEMO=true
```

- `production` + `demo` 조합은 **앱 시작을 차단**합니다.
- production에서 Supabase 미설정 시 demo로 fallback하지 않습니다.

## 아키텍처

```
src/
  domain/           # 순수 타입·규칙
  application/      # ports, services, use-cases
  infrastructure/   # demo/supabase providers, config
  pages/            # Presentation
  components/
```

- 페이지/컴포넌트는 `localStorage`, Supabase SDK를 **직접 호출하지 않음**
- `createAppDependencies(config)`에서 provider 선택

## 데모 모드

- 역할별 데모 로그인 (이메일/비밀번호 불필요)
- 브라우저 localStorage (`fairplay:demo:v1`)
- 데모 데이터 초기화: 기관관리 → 설정

## 문서

- [docs/data-model.md](docs/data-model.md)
- [docs/backend-provider-architecture.md](docs/backend-provider-architecture.md)
- [docs/supabase-setup-checklist.md](docs/supabase-setup-checklist.md)
- [docs/supabase-cutover-plan.md](docs/supabase-cutover-plan.md)
- [docs/aws-portability.md](docs/aws-portability.md)

## Supabase migration

`supabase/migrations/` — **미적용 초안**. 회사 Supabase 준비 후 재검토 필요.

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 검사 |
| `npm run lint` | ESLint |
| `npm run test` | 단위 테스트 |

## 제한사항 (신규 프로젝트)

- 기존 15장 제안 사이트/PRESENT/PDF/사진 자산 **미포함**
- `/proposal`은 신규 HTML 제안 페이지 (상위 폴더 PDF 참고)
- Node.js 미설치 환경에서는 `npm install` 후 실행

## 라이선스

Proprietary — WiseIN / FAIR PLAY ACADEMY
