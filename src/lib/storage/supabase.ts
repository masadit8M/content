import { createClient } from "@supabase/supabase-js";
import { StorageService, UploadResult } from "./index";

export class SupabaseStorageService implements StorageService {
  private supabase: any;
  private bucketName: string;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || "Media";

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    options: {
      projectId: string;
      folder: string;
    }
  ): Promise<UploadResult> {
    if (!this.supabase) {
      throw new Error("Supabase credentials are not configured");
    }

    const safeProject = options.projectId.replace(/[^a-zA-Z0-9_-]/g, "");
    const safeFolder = options.folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const timestamp = Date.now();
    const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = "projects/" + safeProject + "/" + safeFolder + "/" + timestamp + "_" + sanitizedFileName;

    const ext = originalName.split(".").pop()?.toLowerCase() || "";
    let mimeType = "application/octet-stream";
    if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "mp4") mimeType = "video/mp4";
    else if (ext === "mov") mimeType = "video/quicktime";
    else if (ext === "webm") mimeType = "video/webm";
    else if (ext === "pdf") mimeType = "application/pdf";

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw new Error("Gagal mengunggah ke Supabase Storage: " + error.message);
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);

    return {
      fileName: originalName,
      filePath: data.path,
      fileSize: fileBuffer.length,
      mimeType,
      url: publicUrl,
    };
  }

  async getFileStream(filePath: string): Promise<Buffer> {
    if (!this.supabase) throw new Error("Supabase not configured");
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(filePath);
    if (error) throw error;
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    if (!this.supabase) return false;
    try {
      const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([cleanPath]);
      return !error;
    } catch {
      return false;
    }
  }

  getUrl(filePath: string): string {
    if (!this.supabase) return filePath;
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);
    return publicUrl;
  }
}
