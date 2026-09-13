export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface StorageService {
  uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    options: {
      projectId: string;
      folder: string; // "documents" | "activities" | "issues" | "reports" | "sdm"
    }
  ): Promise<UploadResult>;

  getFileStream(filePath: string): Promise<ReadableStream | Buffer>;

  deleteFile(filePath: string): Promise<boolean>;

  getUrl(filePath: string): string;
}
