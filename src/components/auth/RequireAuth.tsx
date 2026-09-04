import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { ROLE_HOME_PATHS, type UserRole } from '@/domain';
import { LoadingState } from '@/components/ui/PageStates';

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="세션 확인 중…" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(session.role)) {
    return <Navigate to={ROLE_HOME_PATHS[session.role]} replace />;
  }
  return <>{children}</>;
}
