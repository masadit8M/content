import fs from "fs/promises";
import path from "path";
import { StorageService, UploadResult } from "./index";

export class LocalStorageService implements StorageService {
  private baseDir: string;

  constructor() {
    // Save to public/uploads so files can be served directly or via api route
    this.baseDir = path.join(process.cwd(), "public", "uploads");
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    options: {
      projectId: string;
      folder: string;
    }
  ): Promise<UploadResult> {
    const safeProject = options.projectId.replace(/[^a-zA-Z0-9_-]/g, "");
    const safeFolder = options.folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const targetDir = path.join(this.baseDir, "projects", safeProject, safeFolder);

    await fs.mkdir(targetDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
    const fullPath = path.join(targetDir, uniqueFileName);

    await fs.writeFile(fullPath, fileBuffer);

    const relativePath = `/uploads/projects/${safeProject}/${safeFolder}/${uniqueFileName}`;

    return {
      fileName: originalName,
      filePath: relativePath,
      fileSize: fileBuffer.length,
      mimeType: "application/octet-stream",
      url: relativePath,
    };
  }

  async getFileStream(filePath: string): Promise<Buffer> {
    const fullPath = path.join(process.cwd(), "public", filePath);
    return await fs.readFile(fullPath);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), "public", filePath);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(filePath: string): string {
    return filePath;
  }
}

import { SupabaseStorageService } from "./supabase";

export const storageService: StorageService =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? new SupabaseStorageService()
    : new LocalStorageService();
