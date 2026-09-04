import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppShell, AdminShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { HomePage } from '@/pages/public/HomePage';
import { LoginPage, SignupPage } from '@/pages/public/LoginPage';
import {
  AnnouncementDetailPage,
  AnnouncementsPage,
  EducationInfoPage,
  FaqPage,
  QnaDetailPage,
  QnaPage,
  QnaWritePage,
} from '@/pages/public/CommunityPages';
import {
  ExperiencePage,
  NotFoundPage,
  ProposalPage,
  SimpleContentPage,
  SupportPage,
  ValuesPage,
} from '@/pages/public/StaticPages';
import { AppCoursesPage, CourseDetailPage, CoursesPage } from '@/pages/courses/CoursesPages';
import { AthleteDashboardPage } from '@/pages/app/AthleteDashboardPage';
import { LearningPlayerPage } from '@/pages/app/LearningPlayerPage';
import {
  DemoResetButton,
  OrganizationAssignmentsPage,
  OrganizationDashboardPage,
  OrganizationInsightsPage,
  OrganizationMembersPage,
  OrganizationProgressPage,
  OrganizationReportsPage,
  OrganizationTeamsPage,
} from '@/pages/organization/OrganizationPages';
import { ExamListPage, ExamTakePage } from '@/pages/app/ExamPages';
import { HomeworkListPage, HomeworkSubmitPage } from '@/pages/app/HomeworkPages';
import { CertificatesPage } from '@/pages/app/CertificatesPage';
import { AdminExamQuestionsPage, AdminExamResultsPage } from '@/pages/admin/AdminExamPages';
import { AdminHomeworkGradePage, AdminHomeworkListPage, AdminHomeworkTasksPage } from '@/pages/admin/AdminHomeworkPages';
import {
  AdminAssessmentsPage,
  AdminAuditLogsPage,
  AdminCoursesPage,
  AdminOrganizationsPage,
  AdminUsersPage,
  ContentManagerDashboardPage,
  ContentManagerSettingsPage,
} from '@/pages/admin/ContentAdminPages';
import {
  CoachDashboardPage,
  GenericRolePage,
  GuardianDashboardPage,
  SettingsPage,
} from '@/pages/shared/RolePages';

const athleteNav = [
  { to: '/app', label: '대시보드' },
  { to: '/app/courses', label: '교육과정' },
  { to: '/app/growth', label: '시험' },
  { to: '/app/commitments', label: '과제제출' },
  { to: '/app/certificates', label: '수료증' },
  { to: '/app/settings', label: '설정' },
];

const guardianNav = [
  { to: '/guardian', label: '대시보드' },
  { to: '/guardian/consents', label: '보호자 동의' },
  { to: '/guardian/children', label: '자녀' },
  { to: '/guardian/courses', label: '교육' },
  { to: '/guardian/exams', label: '시험' },
  { to: '/guardian/homework', label: '과제제출' },
  { to: '/guardian/certificates', label: '수료증' },
  { to: '/guardian/resources', label: '자료' },
  { to: '/guardian/settings', label: '설정' },
];

const coachNav = [
  { to: '/coach', label: '대시보드' },
  { to: '/coach/courses', label: '교육' },
  { to: '/coach/exams', label: '시험' },
  { to: '/coach/homework', label: '과제제출' },
  { to: '/coach/certificates', label: '수료증' },
  { to: '/coach/settings', label: '설정' },
];

const orgNav = [
  { to: '/organization', label: '대시보드' },
  { to: '/organization/members', label: '구성원' },
  { to: '/organization/teams', label: '팀' },
  { to: '/organization/assignments', label: '배정' },
  { to: '/organization/progress', label: '진도' },
  { to: '/organization/insights', label: '익명 통계' },
  { to: '/organization/reports', label: '보고서' },
  { to: '/organization/settings', label: '설정' },
];

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'education', element: <EducationInfoPage /> },
      { path: 'about', element: <Navigate to="/education" replace /> },
      { path: 'values', element: <ValuesPage /> },
      { path: 'community/announcements', element: <AnnouncementsPage /> },
      { path: 'community/announcements/:id', element: <AnnouncementDetailPage /> },
      { path: 'community/faq', element: <FaqPage /> },
      { path: 'community/qna', element: <QnaPage /> },
      { path: 'community/qna/write', element: <QnaWritePage /> },
      { path: 'community/qna/:id', element: <QnaDetailPage /> },
      { path: 'programs/athlete', element: <Navigate to="/courses?role=athlete" replace /> },
      { path: 'programs/guardian', element: <Navigate to="/courses?role=guardian" replace /> },
      { path: 'programs/coach', element: <Navigate to="/courses?role=coach" replace /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:slug', element: <CourseDetailPage /> },
      { path: 'experience', element: <ExperiencePage /> },
      {
        path: 'organizations',
        element: <SimpleContentPage title="기관교육" body="배정·진도·수료·익명 통계를 한곳에서 관리합니다." />,
      },
      {
        path: 'resources',
        element: <SimpleContentPage title="교육자료" body="대상별 교육자료와 가이드를 제공합니다." />,
      },
      { path: 'support', element: <SupportPage /> },
      { path: 'proposal', element: <ProposalPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  {
    path: '/app',
    children: [
      {
        path: 'learn/:courseId',
        element: (
          <RequireAuth>
            <LearningPlayerPage />
          </RequireAuth>
        ),
      },
      {
        element: (
          <RequireAuth roles={['athlete']}>
            <AppShell basePath="/app" role="athlete" navItems={athleteNav} />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AthleteDashboardPage /> },
          { path: 'courses', element: <AppCoursesPage /> },
          { path: 'growth', element: <ExamListPage basePath="/app/growth" /> },
          { path: 'growth/:courseId', element: <ExamTakePage basePath="/app/growth" /> },
          { path: 'commitments', element: <HomeworkListPage basePath="/app/commitments" /> },
          { path: 'commitments/:courseId', element: <HomeworkSubmitPage basePath="/app/commitments" /> },
          { path: 'certificates', element: <CertificatesPage coursesPath="/app/courses" /> },
          { path: 'notifications', element: <GenericRolePage title="알림" /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '/guardian',
    element: (
      <RequireAuth roles={['guardian']}>
        <AppShell basePath="/guardian" role="guardian" navItems={guardianNav} />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <GuardianDashboardPage /> },
      { path: 'consents', element: <GenericRolePage title="보호자 동의" /> },
      { path: 'children', element: <GenericRolePage title="자녀 교육 요약" /> },
      { path: 'courses', element: <AppCoursesPage /> },
      { path: 'exams', element: <ExamListPage basePath="/guardian/exams" /> },
      { path: 'exams/:courseId', element: <ExamTakePage basePath="/guardian/exams" /> },
      { path: 'homework', element: <HomeworkListPage basePath="/guardian/homework" /> },
      { path: 'homework/:courseId', element: <HomeworkSubmitPage basePath="/guardian/homework" /> },
      { path: 'certificates', element: <CertificatesPage coursesPath="/guardian/courses" /> },
      { path: 'resources', element: <GenericRolePage title="자료" /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/coach',
    element: (
      <RequireAuth roles={['coach']}>
        <AppShell basePath="/coach" role="coach" navItems={coachNav} />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <CoachDashboardPage /> },
      { path: 'courses', element: <AppCoursesPage /> },
      { path: 'exams', element: <ExamListPage basePath="/coach/exams" /> },
      { path: 'exams/:courseId', element: <ExamTakePage basePath="/coach/exams" /> },
      { path: 'homework', element: <HomeworkListPage basePath="/coach/homework" /> },
      { path: 'homework/:courseId', element: <HomeworkSubmitPage basePath="/coach/homework" /> },
      { path: 'certificates', element: <CertificatesPage coursesPath="/coach/courses" /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/organization',
    element: (
      <RequireAuth roles={['org_manager']}>
        <AppShell basePath="/organization" role="org_manager" navItems={orgNav} />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OrganizationDashboardPage /> },
      { path: 'members', element: <OrganizationMembersPage /> },
      { path: 'teams', element: <OrganizationTeamsPage /> },
      { path: 'assignments', element: <OrganizationAssignmentsPage /> },
      { path: 'progress', element: <OrganizationProgressPage /> },
      {
        path: 'certificates',
        element: (
          <GenericRolePage
            title="수료증"
            description="기관 구성원의 수료 현황은 진도·보고서 메뉴에서 확인할 수 있습니다."
          />
        ),
      },
      { path: 'insights', element: <OrganizationInsightsPage /> },
      { path: 'reports', element: <OrganizationReportsPage /> },
      { path: 'settings', element: <><SettingsPage /><DemoResetButton /></> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth roles={['content_manager', 'super_admin']}>
        <AdminShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ContentManagerDashboardPage /> },
      { path: 'content', element: <Navigate to="/admin/content/courses" replace /> },
      { path: 'content/courses', element: <AdminCoursesPage /> },
      { path: 'content/assessments', element: <AdminAssessmentsPage /> },
      { path: 'exams/questions', element: <AdminExamQuestionsPage /> },
      { path: 'exams/results', element: <AdminExamResultsPage /> },
      { path: 'homework', element: <AdminHomeworkListPage /> },
      { path: 'homework/tasks', element: <AdminHomeworkTasksPage /> },
      { path: 'homework/:submissionId', element: <AdminHomeworkGradePage /> },
      { path: 'organizations', element: <AdminOrganizationsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'terms', element: <GenericRolePage title="약관" description="서비스 약관 및 정책 관리" /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
      { path: 'settings', element: <ContentManagerSettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
