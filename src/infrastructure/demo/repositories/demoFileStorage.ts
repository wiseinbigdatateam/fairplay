import type { FileStorage } from '@/application/ports';

export class DemoFileStorage implements FileStorage {
  getPublicAsset(ref: { bucket: string; objectKey: string }): string {
    return `/assets/demo/${ref.bucket}/${ref.objectKey}`;
  }

  async getSignedAsset(ref: { bucket: string; objectKey: string }): Promise<string> {
    return this.getPublicAsset(ref);
  }

  async upload(): Promise<never> {
    throw new Error('파일 업로드는 운영 백엔드 연결 후 활성화됩니다.');
  }

  async remove(): Promise<never> {
    throw new Error('파일 삭제는 운영 백엔드 연결 후 활성화됩니다.');
  }
}
