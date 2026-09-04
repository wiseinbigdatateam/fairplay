# Backend Provider Architecture

## 계층

1. **Presentation** — pages, components
2. **Application** — services, ports
3. **Domain** — pure types
4. **Infrastructure** — demo / supabase implementations

## Composition Root

`createAppDependencies(config)` (`src/infrastructure/composition/`)

| Provider | 구현 |
|----------|------|
| `demo` | `DemoAuthGateway`, `Demo*Repository` |
| `supabase` | (준비됨 — 미구현, `BackendNotConfiguredError`) |

## 규칙

- UI는 port interface만 사용
- demo 구현체를 page에서 직접 import 금지
- **production + demo → ConfigurationError**
- **production + supabase 미설정 → BackendNotConfiguredError**
- demo → production **자동 fallback 금지**

## Provider 교체

1. `VITE_DATA_PROVIDER=supabase`
2. Supabase repository 구현 (`infrastructure/supabase/`)
3. migration 적용 + RLS 테스트
4. seed → production 데이터 이전 (cutover plan 참고)

## AWS 전환

Supabase를 거치더라도 port/interface 유지 → Cognito/RDS/S3/Lambda로 infrastructure만 교체.
