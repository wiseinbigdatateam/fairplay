# Supabase Cutover Plan

## Phase 1 — 인프라

1. 회사 Supabase 프로젝트 생성
2. migration 적용
3. Storage bucket

## Phase 2 — Auth

1. Supabase Auth 연결
2. `SupabaseAuthGateway` 구현
3. `user_identities` 매핑

## Phase 3 — 데이터

1. 데모 seed → SQL seed 변환
2. 기관/과정/콘텐츠 이전
3. `VITE_DATA_PROVIDER=supabase` (staging)

## Phase 4 — 기능

1. 보호자 동의 (이메일 + 토큰)
2. 수료증 서버 발급
3. 파일 업로드
4. 관리자 서버 권한

## Phase 5 — 운영

1. RLS 통합 테스트
2. `VITE_RELEASE_STAGE=pilot`
3. 보안·법률 검토
4. production 전환

## 롤백

- demo provider로 즉시 롤백 **불가** (production에서 demo 차단)
- staging에서만 demo 병행 테스트
