import type { DataProvider, ReleaseStage } from '@/domain';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class BackendNotConfiguredError extends Error {
  readonly requiredEnvVars: string[];

  constructor(requiredEnvVars: string[]) {
    super('운영 백엔드가 연결되지 않았습니다.');
    this.name = 'BackendNotConfiguredError';
    this.requiredEnvVars = requiredEnvVars;
  }
}

export interface AppConfig {
  releaseStage: ReleaseStage;
  dataProvider: DataProvider;
  enableDemo: boolean;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
}

function parseReleaseStage(value: string | undefined): ReleaseStage {
  if (value === 'prototype' || value === 'pilot' || value === 'production') {
    return value;
  }
  return 'prototype';
}

function parseDataProvider(value: string | undefined): DataProvider {
  if (value === 'demo' || value === 'supabase') {
    return value;
  }
  return 'demo';
}

export function loadAppConfig(env: ImportMetaEnv = import.meta.env): AppConfig {
  const releaseStage = parseReleaseStage(env.VITE_RELEASE_STAGE);
  const dataProvider = parseDataProvider(env.VITE_DATA_PROVIDER);
  const enableDemo = env.VITE_ENABLE_DEMO !== 'false';

  if (releaseStage === 'production' && dataProvider === 'demo') {
    throw new ConfigurationError(
      'VITE_RELEASE_STAGE=production 환경에서는 VITE_DATA_PROVIDER=demo를 사용할 수 없습니다.',
    );
  }

  return {
    releaseStage,
    dataProvider,
    enableDemo,
    supabaseUrl: env.VITE_SUPABASE_URL || undefined,
    supabasePublishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY || undefined,
  };
}

export function validateProductionBackend(config: AppConfig): void {
  if (config.releaseStage !== 'production' || config.dataProvider !== 'supabase') {
    return;
  }

  const missing: string[] = [];
  if (!config.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!config.supabasePublishableKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    throw new BackendNotConfiguredError(missing);
  }
}

export function isDemoMode(config: AppConfig): boolean {
  return config.dataProvider === 'demo' && config.enableDemo;
}

export function shouldShowDemoBadge(config: AppConfig): boolean {
  return config.releaseStage !== 'production' && isDemoMode(config);
}
