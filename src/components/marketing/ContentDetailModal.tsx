"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
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
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for adding additional task
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser?.id || "");
  const [addingTask, setAddingTask] = useState(false);

  // State for comments
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Save content details (Prep notes, Live URL, Status)
  const handleSaveDetails = async (forcedStatus?: string) => {
    try {
      setSavingDetails(true);
      const res = await fetch(`/api/contents/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: forcedStatus || status,
          prepNotes,
          liveUrl,
          liveNote,
          assetUrl,
        }),
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

  // Add additional task from admin
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

  // Toggle task completion
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

  // Post comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setPostingComment(true);
      const res = await fetch(`/api/contents/${content.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newComment.trim() }),
      });

      if (res.ok) {
        setNewComment("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  const platformInfo = getPlatformBadge(content.platform);

  return (
    <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
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
                  <option value="IDEA">💡 Ide & Konsep</option>
                  <option value="IN_PREPARATION">🛠️ Persiapan Admin</option>
                  <option value="IN_REVIEW">🔍 Review & Revisi</option>
                  <option value="READY_TO_PUBLISH">🚀 Siap Tayang</option>
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
          {/* Left Column: Prep Notes & Live Showcase Link */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Laporan Persiapan Admin */}
            <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#F35E50] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Laporan Persiapan Admin
                </label>
                <span className="text-[10px] text-[#1A3460]/60 font-bold">
                  (Naskah, angle visual, draft hook)
                </span>
              </div>

              <textarea
                rows={5}
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Tuliskan persiapan yang sudah dibuat admin: draft naskah, angle hook, slide canva, atau catatan konsep..."
                className="w-full p-3 text-xs sm:text-sm rounded-xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] focus:ring-1 focus:ring-[#F35E50] leading-relaxed font-sans font-medium"
              />

              <div>
                <label className="block text-[11px] font-black text-[#1A3460] mb-1">
                  Link Asset Desain / Preview (Figma, Canva, atau Google Drive)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-[#1A3460]/50 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    placeholder="https://www.canva.com/design/... atau Google Drive"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Publikasi & Tautan Live (Live Showcase) */}
            <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-400 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  Hasil Live (Tautan Postingan Publik)
                </label>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Dilihat semua user di Showcase
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="Paste URL hasil karya yang sudah live (Instagram/TikTok/YouTube)..."
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl bg-white border-2 border-emerald-400 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-bold"
                />

                <input
                  type="text"
                  value={liveNote}
                  onChange={(e) => setLiveNote(e.target.value)}
                  placeholder="Catatan saat tayang (cth: 'Tayang jam 17:00 WIB, performa reach bagus')..."
                  className="w-full p-2 text-xs rounded-xl bg-white border border-emerald-300 text-[#1A3460] placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>

              {liveUrl && (
                <div className="pt-1 flex items-center justify-between">
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition shadow-sm"
                  >
                    <span>Uji Buka Link Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {status !== "PUBLISHED" && (
                    <button
                      type="button"
                      onClick={() => handleSaveDetails("PUBLISHED")}
                      className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ubah Status ke Live Sekarang</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Save Button for Left Section */}
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
                    <span>Simpan Perubahan Konten</span>
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

          {/* Right Column: ClickUp Style Subtasks & Comments */}
          <div className="lg:col-span-5 space-y-6">
            {/* Additional Tasks (Subtasks ClickUp) */}
            <div className="bg-[#FFF8F3] border-2 border-[#1A3460]/15 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#1A3460] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#F35E50]" />
                  Task Tambahan Tim ({content.tasks?.length || 0})
                </h3>
                <span className="text-[10px] text-[#1A3460]/60 font-bold">
                  Saling bantu sesama admin
                </span>
              </div>

              {/* Task Input Form */}
              <form onSubmit={handleAddTask} className="space-y-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="+ Tambah tugas tambahan (misal: buat caption / revisi cover)..."
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
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(!content.tasks || content.tasks.length === 0) ? (
                  <p className="text-xs text-slate-400 italic text-center py-3">
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

            {/* Comments & Team Feedback */}
            <div className="bg-white border-2 border-[#1A3460]/15 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-black text-[#1A3460] uppercase tracking-wider flex items-center gap-1.5">
                Komentar & Diskusi Tim ({content.comments?.length || 0})
              </h3>

              {/* Comments Feed */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {(!content.comments || content.comments.length === 0) ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Belum ada komentar dari admin lain.
                  </p>
                ) : (
                  content.comments.map((cm: any) => (
                    <div
                      key={cm.id}
                      className="p-2.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-[#1A3460]">
                          {cm.user?.name || "Admin"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(cm.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A3460]/85 font-medium leading-relaxed">
                        {cm.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Beri komentar atau feedback..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-medium"
                />
                <button
                  type="submit"
                  disabled={postingComment || !newComment.trim()}
                  className="px-3 py-2 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
