import type { MediaFile } from "./content-utils";

export type UploadProgress = (percent: number | null, status: string) => void;

const MAX_DATA_URL_MB = 4;

/**
 * Unggah satu berkas foto/video ke penyimpanan cloud.
 * Urutan: (1) signed upload langsung ke Supabase Storage → (2) endpoint /api/upload →
 * (3) Data URL browser untuk berkas kecil. Melempar Error berpesan ramah jika semua gagal.
 */
export async function uploadMediaFile(file: File, onProgress?: UploadProgress): Promise<MediaFile> {
  const sizeInMB = file.size / (1024 * 1024);
  onProgress?.(0, "Menyiapkan koneksi cloud storage...");

  // 1. Signed upload langsung ke Supabase (melewati batas body serverless)
  try {
    const signRes = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folder: "bank-konten",
      }),
    });

    if (signRes.ok) {
      const signData = await signRes.json();
      if (signData.signedUrl) {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signData.signedUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress?.(percent, `Mengunggah ${percent}%`);
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`Direct upload status ${xhr.status}`));
          xhr.onerror = () => reject(new Error("Network error during cloud direct upload"));
          xhr.send(file);
        });
        return { url: signData.publicUrl, name: file.name, size: file.size, type: file.type };
      }
    }
  } catch (err) {
    console.warn("Direct signed upload failed, attempting fallback:", err);
  }

  // 2. Fallback: unggah lewat server
  try {
    onProgress?.(null, "Mencoba unggah lewat server...");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          url: data.url,
          name: data.fileName || file.name,
          size: data.fileSize || file.size,
          type: data.fileType || file.type,
        };
      }
    }
  } catch (err) {
    console.warn("Server upload failed:", err);
  }

  // 3. Fallback terakhir: Data URL untuk berkas kecil
  if (sizeInMB <= MAX_DATA_URL_MB) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Gagal membaca berkas dari perangkat."));
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, name: file.name, size: file.size, type: file.type };
  }

  throw new Error(
    `Gagal mengunggah "${file.name}" (${sizeInMB.toFixed(1)} MB). Coba lagi, atau gunakan tab "Tautan Drive / Canva" untuk berkas besar.`
  );
}

/** Unduh satu berkas ke perangkat. Berkas lintas-domain diambil sebagai blob agar benar-benar terunduh. */
export async function downloadMediaFile(file: MediaFile, fallbackName = "berkas"): Promise<void> {
  const name = file.name || fallbackName;
  const triggerAnchor = (href: string, revoke = false) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 4000);
  };

  if (file.url.startsWith("data:") || file.url.startsWith("/")) {
    triggerAnchor(file.url);
    return;
  }

  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    triggerAnchor(URL.createObjectURL(blob), true);
  } catch {
    // Server tujuan menolak fetch lintas-domain → buka di tab baru agar tetap bisa disimpan manual.
    window.open(file.url, "_blank", "noopener,noreferrer");
  }
}

/** Unduh beberapa berkas berurutan (jeda singkat agar browser tidak memblokir unduhan beruntun). */
export async function downloadAllMedia(files: MediaFile[], baseName = "konten-arjuna"): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    await downloadMediaFile(files[i], `${baseName}-${i + 1}`);
    if (i < files.length - 1) await new Promise((r) => setTimeout(r, 450));
  }
}
