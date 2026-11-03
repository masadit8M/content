"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
import { TeamMentionInput, renderMentionedText } from "@/components/common/TeamMentionInput";
import { FileUploadInput, UploadedFile } from "@/components/common/FileUploadInput";
import {
  X,
  ExternalLink,
  Flame,
  CheckSquare,
  Square,
  Plus,
  Send,
  Trash2,
  Calendar,
  User,
  FileText,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  Video,
  Image as ImageIcon,
  UploadCloud,
  Wand2,
  RefreshCw,
  Download,
} from "lucide-react";

interface DetailModalProps {
  content: any;
  users: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export function ContentDetailModal({
  content,
  users,
  onClose,
  onRefresh,
}: DetailModalProps) {
  const { currentUser } = useAuth();

  // State for content editing
  const [status, setStatus] = useState(content.status);
  const [prepNotes, setPrepNotes] = useState(content.prepNotes || "");
  const [liveUrl, setLiveUrl] = useState(content.liveUrl || "");
  const [liveNote, setLiveNote] = useState(content.liveNote || "");
  const [assetUrl, setAssetUrl] = useState(content.assetUrl || "");
  const [assignedToId, setAssignedToId] = useState(content.assignedToId || "");
  const [revisionNote, setRevisionNote] = useState(content.revisionNote || "");
  const [newEditedFile, setNewEditedFile] = useState<UploadedFile | null>(null);

  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for adding additional task
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser?.id || "");
  const [addingTask, setAddingTask] = useState(false);

  // Save content details
  const handleSaveDetails = async (forcedStatus?: string) => {
    try {
      setSavingDetails(true);
      const updatePayload: any = {
        status: forcedStatus || status,
        prepNotes,
        liveUrl,
        liveNote,
        assetUrl,
        assignedToId: assignedToId || null,
        revisionNote: revisionNote.trim() || null,
      };

      if (newEditedFile) {
        updatePayload.editedAssetUrl = newEditedFile.url;
        updatePayload.editedAssetName = newEditedFile.fileName;
        updatePayload.version = (content.version || 1) + 1;
      }

      const res = await fetch(`/api/contents/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        if (forcedStatus) setStatus(forcedStatus);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDetails(false);
    }
  };

  // Quick Action: Ambil Bahan untuk Diedit
  const handleClaim = async () => {
    if (!currentUser) return;
    setAssignedToId(currentUser.id);
    await handleSaveDetails("IN_EDITING");
    await handlePostComment(`🖐️ @${currentUser.name} mengambil alih editing konten ini.`);
  };

  // Add additional task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setAddingTask(true);
      const res = await fetch(`/api/contents/${content.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          assignedToId: newTaskAssignee || null,
        }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTask(false);
    }
  };

  // Toggle task
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/contents/${content.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/contents/${content.id}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post comment with tagging
  const handlePostComment = async (message: string, taggedUserId?: string) => {
    if (!message.trim()) return;

    try {
      const res = await fetch(`/api/contents/${content.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), taggedUserId }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const platformInfo = getPlatformBadge(content.platform);
  const rawUrl = content.rawAssetUrl || content.assetUrl;
  const editedUrl = content.editedAssetUrl;

  return (
    <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b-2 border-[#F3BC6F] flex items-start justify-between gap-4 bg-[#1A3460] text-white">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border ${platformInfo.className}`}
              >
                {platformInfo.icon}
                {platformInfo.label}
              </span>

              <span className="text-xs px-2 py-0.5 rounded-lg bg-white/10 text-white font-bold">
                {content.contentType?.replace("_", " ")}
              </span>

              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <span className="text-xs text-[#F3BC6F] font-black">Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-[#122544] border-2 border-[#F3BC6F] text-[#F3BC6F] text-xs font-black rounded-xl px-2.5 py-1 focus:outline-none focus:border-[#F35E50] cursor-pointer"
                >
                  <option value="RAW_MATERIAL">📁 Bahan Mentah (Siap Diambil)</option>
                  <option value="IN_EDITING">🎨 Sedang Diedit</option>
                  <option value="NEED_REVISION">🔁 Perlu Revisi</option>
                  <option value="READY_TO_PUBLISH">🚀 Siap Upload</option>
                  <option value="PUBLISHED">🎉 Sudah Live!</option>
                </select>
              </div>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
              {content.title}
            </h2>

            {content.description && (
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-semibold">
                {content.description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F35E50] text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Media Previews, Editing Slots, Caption */}
          <div className="lg:col-span-7 space-y-5">
            {/* MEDIA PREVIEW: Bahan Mentah vs Hasil Editing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Box 1: Bahan Mentah */}
              <div className="bg-[#FFF8F3] border-2 border-[#1A3460]/20 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-[#1A3460]">
                  <span className="flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5 text-[#1A3460]" />
                    Bahan Mentah Lapangan:
                  </span>
                  {rawUrl && (
                    <a
                      href={rawUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#F35E50] hover:underline font-bold"
                    >
                      Buka Media
                    </a>
                  )}
                </div>

                {rawUrl ? (
                  rawUrl.match(/\.(mp4|webm|mov|m4v)/i) ? (
                    <video
                      src={rawUrl}
                      controls
                      className="w-full h-36 rounded-xl object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={rawUrl}
                      alt="Bahan Mentah"
                      className="w-full h-36 rounded-xl object-cover"
                    />
                  )
                ) : (
                  <div className="h-36 rounded-xl border border-dashed border-[#1A3460]/20 flex items-center justify-center text-xs text-slate-400">
                    Tidak ada file media langsung
                  </div>
                )}
              </div>

              {/* Box 2: Hasil Editing */}
              <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-[#F35E50]">
                  <span className="flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5" />
                    Hasil Editing Draft:
                  </span>
                  {editedUrl && (
                    <a
                      href={editedUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-emerald-700 hover:underline font-bold"
                    >
                      Download
                    </a>
                  )}
                </div>

                {editedUrl ? (
                  editedUrl.match(/\.(mp4|webm|mov|m4v)/i) ? (
                    <video
                      src={editedUrl}
                      controls
                      className="w-full h-36 rounded-xl object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={editedUrl}
                      alt="Hasil Edit"
                      className="w-full h-36 rounded-xl object-cover"
                    />
                  )
                ) : (
                  <div className="h-36 rounded-xl border-2 border-dashed border-[#F3BC6F]/40 flex flex-col items-center justify-center text-center p-2 text-xs text-[#1A3460]/60 space-y-1">
                    <span>Belum ada draft hasil edit</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Claim Bar if not claimed */}
            {(!content.assignedToId || content.assignedToId === content.createdById) && status === "RAW_MATERIAL" && (
              <div className="p-3.5 rounded-2xl bg-[#1A3460] text-white flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-black text-[#F3BC6F]">Bahan ini belum ada editor!</div>
                  <div className="text-[11px] text-white/80">Apakah Anda ingin mengambil bahan ini untuk diedit?</div>
                </div>
                <button
                  type="button"
                  onClick={handleClaim}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black transition cursor-pointer"
                >
                  🖐️ Ambil Bahan Ini
                </button>
              </div>
            )}

            {/* Slot Upload / Ganti Hasil Edit Baru */}
            <div className="bg-[#FFF8F3] border-2 border-[#1A3460]/15 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-black text-[#1A3460] uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-[#F35E50]" />
                Unggah File Hasil Edit Baru (Revisi v{(content.version || 1) + 1})
              </label>

              <FileUploadInput
                label="Pilih File Video / Gambar Hasil Edit"
                helperText="Upload video MP4 atau gambar PNG/JPG yang sudah diedit. Bisa juga link Canva."
                value={newEditedFile?.url}
                fileName={newEditedFile?.fileName}
                fileSize={newEditedFile?.fileSize}
                fileType={newEditedFile?.fileType}
                onChange={(file) => setNewEditedFile(file)}
              />
            </div>

            {/* Penugasan PIC Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#1A3460] mb-1">
                  Editor yang Bertugas (PIC)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] font-bold focus:outline-none focus:border-[#F35E50]"
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-[#1A3460] mb-1">
                  Catatan Revisi Terakhir
                </label>
                <input
                  type="text"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Poin perbaikan (opsional)..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] font-medium focus:outline-none focus:border-[#F35E50]"
                />
              </div>
            </div>

            {/* Draft Caption & Naskah */}
            <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-black text-[#F35E50] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Draft Naskah & Caption Konten
              </label>

              <textarea
                rows={4}
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Tuliskan naskah hook, isi carousel, dan copywriting postingan..."
                className="w-full p-3 text-xs rounded-xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-medium leading-relaxed"
              />
            </div>

            {/* Tautan Live Hasil Pekerjaan */}
            <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-400 rounded-2xl p-4 space-y-2">
              <label className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-600" />
                Link Postingan Live (Setelah Tayang)
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/... atau link TikTok live"
                className="w-full p-2.5 text-xs rounded-xl bg-white border-2 border-emerald-400 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-bold"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleSaveDetails()}
                disabled={savingDetails}
                className="px-5 py-2.5 rounded-xl bg-[#1A3460] hover:bg-[#23457c] text-[#F3BC6F] text-xs font-black flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {savingDetails ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#F3BC6F]" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>

              {saveSuccess && (
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Berhasil disimpan!
                </span>
              )}
            </div>
          </div>

          {/* Right Column: ClickUp Style Subtasks & Discussion with Tagging */}
          <div className="lg:col-span-5 space-y-6">
            {/* Subtasks Tim */}
            <div className="bg-[#FFF8F3] border-2 border-[#1A3460]/15 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#1A3460] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#F35E50]" />
                  Checklist Task Tim ({content.tasks?.length || 0})
                </h3>
              </div>

              {/* Task Input Form */}
              <form onSubmit={handleAddTask} className="space-y-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="+ Tambah tugas tambahan (misal: potong 5 detik awal)..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-medium"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-white border border-[#1A3460]/20 text-[#1A3460] focus:outline-none font-bold"
                  >
                    <option value="">-- Tugaskan ke Admin --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={addingTask || !newTaskTitle.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black transition disabled:opacity-50 cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
              </form>

              {/* Task Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!content.tasks || content.tasks.length === 0) ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Belum ada subtask tambahan.
                  </p>
                ) : (
                  content.tasks.map((t: any) => (
                    <div
                      key={t.id}
                      className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 transition ${
                        t.isCompleted
                          ? "bg-white/60 border-slate-200 text-slate-400"
                          : "bg-white border-[#1A3460]/15 text-[#1A3460]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(t.id, t.isCompleted)}
                        className="mt-0.5 text-[#F35E50] hover:text-[#e04b3d] transition cursor-pointer"
                      >
                        {t.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-[#1A3460]/40" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-bold leading-snug ${
                            t.isCompleted ? "line-through text-slate-400" : "text-[#1A3460]"
                          }`}
                        >
                          {t.title}
                        </p>
                        {t.assignedTo && (
                          <div className="text-[10px] text-[#1A3460]/60 font-semibold mt-0.5">
                            PIC: {t.assignedTo.name}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                        title="Hapus task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Diskusi Tim dengan Tagging @Mention */}
            <div className="bg-white border-2 border-[#1A3460]/15 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#1A3460] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F35E50]" />
                  Diskusi & Review Tim ({content.comments?.length || 0})
                </h3>
                <span className="text-[10px] text-[#F35E50] font-black">
                  Gunakan @ untuk mention
                </span>
              </div>

              {/* Comments Feed */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {(!content.comments || content.comments.length === 0) ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Belum ada feedback dari tim. Tulis komentar atau mention anggota tim di bawah.
                  </p>
                ) : (
                  content.comments.map((cm: any) => (
                    <div
                      key={cm.id}
                      className="p-3 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-black text-[#1A3460]">
                          <img
                            src={
                              cm.user?.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                            }
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{cm.user?.name || "Admin"}</span>
                          <span className="text-[9px] px-1 rounded bg-[#1A3460]/10 text-[#1A3460]">
                            {cm.user?.role || "TIM"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(cm.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A3460]/90 font-medium leading-relaxed">
                        {renderMentionedText(cm.message)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Team Mention Input Component */}
              <div className="pt-2 border-t border-[#1A3460]/10">
                <TeamMentionInput
                  users={users}
                  onSend={handlePostComment}
                  placeholder="Ketik komentar atau tag @Nama..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
