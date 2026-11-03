import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, fileType, folder = "raw-materials" } = body;

    if (!fileName) {
      return NextResponse.json({ error: "fileName wajib diisi" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "Media";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase Storage credentials belum dikonfigurasi di server" },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${safeFolder}/${timestamp}_${sanitizedFileName}`;

    // Buat signed upload URL (berlaku 2 jam / 7200 detik)
    let { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    // Fallback jika nama bucket beda huruf besar/kecil
    if (error && (bucketName === "Media" || bucketName === "media")) {
      const altBucket = bucketName === "Media" ? "media" : "Media";
      const altRes = await supabase.storage.from(altBucket).createSignedUploadUrl(filePath);
      if (!altRes.error && altRes.data) {
        data = altRes.data;
        error = null;
      }
    }

    if (error || !data) {
      console.error("Gagal membuat signed upload URL:", error);
      return NextResponse.json(
        { error: error?.message || "Gagal membuat URL upload Supabase" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl,
    });
  } catch (error: any) {
    console.error("Sign upload error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses izin upload" },
      { status: 500 }
    );
  }
}
