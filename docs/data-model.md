# 데이터 모델 (초안)

> 회사 소유 Supabase 미연결 · 검토용 문서

## 주요 엔터티

- **UserProfile** — 서비스 내부 UUID (`id`)
- **UserIdentity** — `provider` + `providerSubject` (demo/supabase/cognito)
- **Organization**, **Team**, **OrganizationMembership**
- **GuardianRelationship**, **GuardianConsent**
- **Course**, **Module**, **Lesson**, **LessonBlock**
- **ScenarioCase**, **Quiz**, **PracticeCommitment**
- **LessonProgress**, **CourseProgress**, **CourseCompletion**
- **Certificate**, **CourseAssignment**

## ID 전략

- 모든 PK: UUID
- 내부 `userId` ≠ Auth provider subject
- `user_identities` 테이블로 매핑

## 역할

`athlete | guardian | coach | org_manager | content_manager | super_admin`

- 역할은 서버(RLS/Edge Function)에서만 변경
- 프런트 역할 선택은 **데모 전용**

## 기관 격리

- 모든 기관 데이터에 `organization_id`
- RLS: `organization_members` 기반

## 비공개 학습 데이터

다음은 기관관리자·지도자 DTO에서 **제외**:

- 상황 선택 상세
- 실천약속 전문
- 자기점검 응답

## 익명 통계

- 집단 5명 미만 → 세부 통계 비공개
- application service (`getOrganizationAnonymousInsights`)에서 강제

## 파일 참조

```ts
StorageObjectReference { provider, bucket, objectKey, contentType }
```

전체 URL을 domain에 저장하지 않음.
