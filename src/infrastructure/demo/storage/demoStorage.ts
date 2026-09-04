export const DEMO_STORAGE_NAMESPACE = 'fairplay:demo:v1';
export const DEMO_SCHEMA_VERSION_KEY = 'fairplay:demo:schema-version';
export const CURRENT_DEMO_SCHEMA_VERSION = '1.3.0';

export class DemoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoStorageError';
  }
}

export interface DemoPersistedState {
  session: unknown;
  profiles: unknown[];
  memberships: unknown[];
  teams: unknown[];
  courses: unknown[];
  lessons: unknown[];
  scenarios: unknown[];
  quizzes: unknown[];
  lessonProgress: unknown[];
  courseProgress: unknown[];
  scenarioAttempts: unknown[];
  quizAttempts: unknown[];
  examQuestions: unknown[];
  examAttempts: unknown[];
  homeworkTasks: unknown[];
  homeworkSubmissions: unknown[];
  commitments: unknown[];
  completions: unknown[];
  certificates: unknown[];
  assignments: unknown[];
  guardianRelationships: unknown[];
  auditLogs: unknown[];
  announcements: unknown[];
  qnaPosts: unknown[];
  resources: unknown[];
}

function isStorageAvailable(): boolean {
  try {
    const key = '__fairplay_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readDemoState(): DemoPersistedState | null {
  if (!isStorageAvailable()) {
    throw new DemoStorageError('브라우저 저장공간을 사용할 수 없습니다.');
  }
  const raw = localStorage.getItem(DEMO_STORAGE_NAMESPACE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoPersistedState;
  } catch {
    throw new DemoStorageError('데모 데이터가 손상되었습니다. 초기화가 필요합니다.');
  }
}

export function writeDemoState(state: DemoPersistedState): void {
  if (!isStorageAvailable()) {
    throw new DemoStorageError('브라우저 저장공간을 사용할 수 없습니다.');
  }
  try {
    localStorage.setItem(DEMO_STORAGE_NAMESPACE, JSON.stringify(state));
  } catch {
    throw new DemoStorageError('데모 데이터 저장에 실패했습니다.');
  }
}

export function readSchemaVersion(): string | null {
  if (!isStorageAvailable()) return null;
  return localStorage.getItem(DEMO_SCHEMA_VERSION_KEY);
}

export function writeSchemaVersion(version: string): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(DEMO_SCHEMA_VERSION_KEY, version);
}

export function clearDemoStorage(): void {
  if (!isStorageAvailable()) {
    throw new DemoStorageError('브라우저 저장공간을 사용할 수 없습니다.');
  }
  localStorage.removeItem(DEMO_STORAGE_NAMESPACE);
  localStorage.removeItem(DEMO_SCHEMA_VERSION_KEY);
}

export function needsSchemaMigration(): boolean {
  const current = readSchemaVersion();
  return current !== CURRENT_DEMO_SCHEMA_VERSION;
}
