# AWS Portability

## 원칙

1. Supabase SDK를 page/component에서 직접 호출하지 않음
2. 내부 user ID ↔ auth subject 분리
3. Storage: object key 중심
4. 비즈니스 규칙: pure TypeScript (`application/services/`)
5. Edge Function 로직 ↔ domain 분리

## 교체 지점

| 현재 (준비) | AWS 대안 |
|-------------|----------|
| Supabase Auth | Cognito |
| Postgres | RDS |
| Storage | S3 |
| Edge Functions | Lambda + API Gateway |

## 재사용

- `domain/*`
- `application/services/*`
- `application/ports/*`
- Presentation (provider 무관)

## 교체

- `infrastructure/supabase/*` → `infrastructure/aws/*`
