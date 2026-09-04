/** 과제 첨부 허용 문서 확장자 */
export const HOMEWORK_DOCUMENT_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'hwp',
  'hwpx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'txt',
  'rtf',
  'odt',
  'ods',
  'odp',
] as const;

export const HOMEWORK_DOCUMENT_ACCEPT = HOMEWORK_DOCUMENT_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(',');

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function isAllowedHomeworkDocument(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return (HOMEWORK_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
}
