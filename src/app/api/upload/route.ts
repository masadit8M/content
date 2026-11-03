import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Silakan login terlebih dahulu" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan dalam request" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl = "";

    // 1. Coba upload ke Supabase Storage jika credentials tersedia
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "Media";

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const timestamp = Date.now();
        const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `uploads/${timestamp}_${sanitizedOriginalName}`;

        let { data, error } = await supabase.storage.from(bucketName).upload(filePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

        if (error && (bucketName === "Media" || bucketName === "media")) {
          const altBucket = bucketName === "Media" ? "media" : "Media";
          const altRes = await supabase.storage.from(altBucket).upload(filePath, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });
          if (!altRes.error && altRes.data) {
            data = altRes.data;
            error = null;
          }
        }

        if (!error && data) {
          const { data: { publicUrl: sbUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
          publicUrl = sbUrl;
        }
      } catch (sbError) {
        console.warn("Supabase direct upload failed, fallback to local:", sbError);
      }
    }

    // 2. Jika Supabase tidak menghasilkan URL, simpan ke filesystem lokal / public/uploads jika writable
    if (!publicUrl) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueFileName = `${timestamp}_${sanitizedOriginalName}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        await writeFile(filePath, buffer);
        publicUrl = `/uploads/${uniqueFileName}`;
      } catch (fsError) {
        // 3. Fallback untuk Vercel Serverless (di mana filesystem /var/task read-only)
        console.warn("Server filesystem read-only (Vercel Lambda). Menggunakan Data URL fallback:", fsError);
        const mime = file.type || "application/octet-stream";
        publicUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: error.message || "Gagal mengupload file ke server",
    }, { status: 500 });
  }
}
