import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, UserProfile } from '@/domain';
import { useDeps } from '@/app/providers/AppProvider';

interface AuthContextValue {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authGateway } = useDeps();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const s = await authGateway.getCurrentSession();
    setSession(s);
    setUser(s ? await authGateway.getCurrentUser() : null);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await authGateway.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider required');
  return ctx;
}
