import type { AppConfig } from '@/infrastructure/config/appConfig';
import { BackendNotConfiguredError, validateProductionBackend } from '@/infrastructure/config/appConfig';
import type { AppDependencies } from '@/application/ports';
import { createDemoDependencies } from '@/infrastructure/demo/createDemoDependencies';

export function createAppDependencies(config: AppConfig): AppDependencies {
  validateProductionBackend(config);

  if (config.dataProvider === 'demo') {
    return createDemoDependencies();
  }

  if (config.dataProvider === 'supabase') {
    throw new BackendNotConfiguredError(['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']);
  }

  throw new BackendNotConfiguredError(['VITE_DATA_PROVIDER']);
}
