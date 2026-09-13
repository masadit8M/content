"use client";

import React, { useEffect, useState } from "react";
import {
  FolderGit2,
  FileText,
  History,
  CheckCircle2,
  Download,
  Plus,
  Upload,
  ArrowRight,
  ShieldCheck,
  Folder,
} from "lucide-react";
import { formatDateIndo, formatDateTimeIndo, getStatusBadgeClass } from "@/lib/utils";

const FOLDERS = [
  "ALL",
  "SOP",
  "CURRICULUM",
  "TRAINING",
  "EVALUATION",
  "SDM",
  "MEETING_NOTES",
  "REPORTS",
  "OTHER",
];

export default function DocumentsPage({ params }: { params: { id: string } }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // New version modal state
  const [uploadingVersionDoc, setUploadingVersionDoc] = useState<any>(null);
  const [newVersionNotes, setNewVersionNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (selectedFolder !== "ALL") query.set("folder", selectedFolder);

      const res = await fetch(`/api/projects/${params.id}/documents?${query.toString()}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [params.id, selectedFolder]);

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingVersionDoc) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("documentId", uploadingVersionDoc.id);
      formData.append("changeNotes", newVersionNotes);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch(`/api/projects/${params.id}/documents`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadingVersionDoc(null);
        setNewVersionNotes("");
        setSelectedFile(null);
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const consultingOutputs = documents.filter((d) => d.isConsultingOutput);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Document Center & Versioning
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {documents.length} Dokumen
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Penyimpanan dokumen konsultasi dengan histori revisi tidak tertimpa (v1, v2, v3) dan register output serah terima PKS (PRD #22-#24, #61).
        </p>
      </div>

      {/* Consulting Output Register Checklist (PRD #61) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Consultant Deliverables Register (Output PKS Lampiran 5)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Digital Handover Verification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {consultingOutputs.length === 0 ? (
            <p className="text-slate-400 py-2">Belum ada output terdaftar.</p>
          ) : (
            consultingOutputs.map((output) => (
              <div
                key={output.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">{output.folder}</span>
                  <p className="font-semibold text-slate-900 truncate max-w-[150px]">{output.title}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(output.outputStatus || "DELIVERED")}`}>
                  ✓ {output.outputStatus || "DELIVERED"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Folder Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FOLDERS.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFolder(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedFolder === f
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "ALL" ? "Semua Folder" : f}
          </button>
        ))}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat berkas dokumen...</div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
          Nol dokumen dalam folder ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const latestVer = doc.versions?.[0];
            const versionCount = doc.versions?.length || 1;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{doc.docCode}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {doc.folder}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{doc.title}</h3>

                  {/* Version history list (PRD #23) */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        Histori Versi ({versionCount} revisi):
                      </span>
                      <span className="text-[10px] text-emerald-600">Active: v{latestVer?.versionNumber}</span>
                    </div>

                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {doc.versions?.map((ver: any) => (
                        <div
                          key={ver.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/70 text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-900">v{ver.versionNumber}.0</span>
                            <span className="text-slate-400 mx-1">·</span>
                            <span className="text-slate-600">{ver.fileName}</span>
                            {ver.changeNotes && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">"{ver.changeNotes}"</p>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDateIndo(ver.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {latestVer?.uploadedBy?.name ? `Diunggah oleh ${latestVer.uploadedBy.name}` : ""}
                  </span>

                  <button
                    onClick={() => setUploadingVersionDoc(doc)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    Upload Revisi Baru
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Version Upload Modal */}
      {uploadingVersionDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="font-bold text-slate-900 text-sm">
                Unggah Revisi Dokumen ({uploadingVersionDoc.docCode})
              </h3>
              <button onClick={() => setUploadingVersionDoc(null)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadNewVersion} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Dokumen:</label>
                <p className="font-bold text-slate-900">{uploadingVersionDoc.title}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih File Baru:</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Perubahan (Change Notes) *:</label>
                <textarea
                  required
                  rows={3}
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  placeholder="Contoh: Revisi format verifikasi identitas wali murid sesuai masukan Mr. Ryan."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadingVersionDoc(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  {uploading ? "Mengunggah..." : "Simpan Revisi Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
