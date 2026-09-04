/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELEASE_STAGE?: string;
  readonly VITE_DATA_PROVIDER?: string;
  readonly VITE_ENABLE_DEMO?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
