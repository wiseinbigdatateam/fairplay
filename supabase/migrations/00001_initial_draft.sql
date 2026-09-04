-- FAIR PLAY ACADEMY — 미적용 초안
-- 회사 Supabase 프로젝트 준비 후 재검토·수정 필요
-- DO NOT APPLY without review

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  organization_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  birth_year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  UNIQUE(provider, provider_subject)
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  target_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  completion_rules JSONB NOT NULL DEFAULT '{}'
);

-- Additional tables: modules, lessons, lesson_blocks, enrollments,
-- lesson_progress, scenario_attempts, quiz_attempts, practice_commitments,
-- certificates, organization_members, teams, guardian_relationships, etc.
-- See docs/data-model.md

-- RLS policies: NOT INCLUDED — draft only
