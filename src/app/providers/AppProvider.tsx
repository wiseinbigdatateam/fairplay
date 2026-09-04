import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AppDependencies } from '@/application/ports';
import type { AppConfig } from '@/infrastructure/config/appConfig';
import { createAppDependencies } from '@/infrastructure/composition/createAppDependencies';

interface AppContextValue {
  config: AppConfig;
  deps: AppDependencies;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
  const deps = useMemo(() => createAppDependencies(config), [config]);
  const value = useMemo(() => ({ config, deps }), [config, deps]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('AppProvider required');
  return ctx;
}

export function useDeps() {
  return useApp().deps;
}

export function useAppConfig() {
  return useApp().config;
}
