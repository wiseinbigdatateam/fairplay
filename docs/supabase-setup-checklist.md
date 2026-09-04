# Supabase Setup Checklist

> 회사 계정으로 진행 · 개인/임시 프로젝트 사용 금지

- [ ] Supabase Organization 생성 (회사 계정)
- [ ] dev / staging / production 프로젝트 분리
- [ ] 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Service role key — **서버/Edge만**, 프런트 금지
- [ ] `supabase/migrations/` 초안 검토 후 적용
- [ ] Auth: 이메일 리디렉션 URL 등록
- [ ] Storage bucket + RLS
- [ ] Edge Functions (권한 검증, 수료증 발급)
- [ ] RLS 정책 테스트 (역할별)
- [ ] 테스트 계정 (비실명)
- [ ] 백업·복구 확인
