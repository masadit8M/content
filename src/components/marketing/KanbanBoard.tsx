"use client";

import React from "react";
import { getPlatformBadge } from "@/lib/platformUtils";
import {
  ExternalLink,
  MessageSquare,
  CheckSquare,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  Plus,
  Flame,
  CheckCircle2,
  Sparkles,
  Wand2,
} from "lucide-react";

interface KanbanProps {
  contents: any[];
  onSelectContent: (content: any) => void;
  onQuickMoveStatus: (contentId: string, nextStatus: string) => void;
  onOpenCreateModal: (defaultStatus?: string) => void;
  onOpenStudio?: (initialTopic?: string) => void;
}

const COLUMNS = [
  {
    id: "RAW_MATERIAL",
    title: "1. Bahan Mentah",
    icon: "📁",
    borderClass: "border-2 border-indigo-200 bg-indigo-50/15",
    headerColor: "text-indigo-900",
    badgeBg: "bg-indigo-600 text-white",
  },
  {
    id: "IN_EDITING",
    title: "2. Sedang Diedit",
    icon: "🎨",
    borderClass: "border-2 border-amber-300 bg-amber-50/15",
    headerColor: "text-amber-900",
    badgeBg: "bg-amber-500 text-white",
  },
  {
    id: "NEED_REVISION",
    title: "3. Perlu Revisi",
    icon: "🔁",
    borderClass: "border-2 border-rose-300 bg-rose-50/15",
    headerColor: "text-rose-900",
    badgeBg: "bg-rose-500 text-white",
  },
  {
    id: "READY_TO_PUBLISH",
    title: "4. Siap Upload",
    icon: "🚀",
    borderClass: "border-2 border-blue-300 bg-blue-50/15",
    headerColor: "text-blue-900",
    badgeBg: "bg-blue-600 text-white",
  },
  {
    id: "PUBLISHED",
    title: "5. Sudah Live!",
    icon: "🎉",
    borderClass: "border-2 border-emerald-400 bg-emerald-50/30",
    headerColor: "text-emerald-800",
    badgeBg: "bg-emerald-600 text-white",
  },
];

export function KanbanBoard({
  contents,
  onSelectContent,
  onQuickMoveStatus,
  onOpenCreateModal,
  onOpenStudio,
}: KanbanProps) {
  const getNextStatus = (current: string) => {
    switch (current) {
      case "RAW_MATERIAL":
      case "IDEA":
        return "IN_EDITING";
      case "IN_EDITING":
      case "IN_PREPARATION":
        return "NEED_REVISION";
      case "NEED_REVISION":
      case "IN_REVIEW":
        return "READY_TO_PUBLISH";
      case "READY_TO_PUBLISH":
        return "PUBLISHED";
      default:
        return null;
    }
  };

  const getPrevStatus = (current: string) => {
    switch (current) {
      case "PUBLISHED":
        return "READY_TO_PUBLISH";
      case "READY_TO_PUBLISH":
        return "NEED_REVISION";
      case "NEED_REVISION":
      case "IN_REVIEW":
        return "IN_EDITING";
      case "IN_EDITING":
      case "IN_PREPARATION":
        return "RAW_MATERIAL";
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
      {COLUMNS.map((col) => {
        const columnContents = contents.filter((c) => {
          if (col.id === "RAW_MATERIAL") {
            return (c.status === "RAW_MATERIAL" || c.status === "IDEA") && !c.liveUrl;
          }
          if (col.id === "IN_EDITING") {
            return (c.status === "IN_EDITING" || c.status === "IN_PREPARATION") && !c.liveUrl;
          }
          if (col.id === "NEED_REVISION") {
            return (c.status === "NEED_REVISION" || c.status === "IN_REVIEW") && !c.liveUrl;
          }
          if (col.id === "READY_TO_PUBLISH") {
            return c.status === "READY_TO_PUBLISH" && !c.liveUrl;
          }
          if (col.id === "PUBLISHED") {
            return c.status === "PUBLISHED" || Boolean(c.liveUrl);
          }
          return false;
        });

        return (
          <div
            key={col.id}
            className={`flex flex-col rounded-3xl ${col.borderClass} bg-white p-3.5 min-h-[580px] shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1A3460]/10 mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{col.icon}</span>
                <span className={`text-xs font-black uppercase tracking-wider ${col.headerColor}`}>
                  {col.title}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${col.badgeBg}`}>
                  {columnContents.length}
                </span>
              </div>

              {/* Action Buttons in Column Header */}
              <div className="flex items-center gap-1.5">
                {col.id === "IDEA" && onOpenStudio && (
                  <button
                    onClick={() => onOpenStudio()}
                    title="Buka Studio Ide AI Arjuna"
                    className="px-2 py-1 rounded-xl bg-[#F3BC6F] hover:bg-[#F35E50] text-[#1A3460] hover:text-white font-black text-[10px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#1A3460] group-hover:text-white" />
                    <span>Studio AI</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenCreateModal(col.id)}
                  title="Tambah konten manual di kolom ini"
                  className="w-7 h-7 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/40 border border-[#1A3460]/15 flex items-center justify-center text-[#1A3460] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Cards List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {columnContents.length === 0 ? (
                col.id === "IDEA" && onOpenStudio ? (
                  /* Dedicated Bridge Card in Column 1 */
                  <div className="p-4 rounded-2xl border-2 border-dashed border-[#F3BC6F] bg-gradient-to-b from-[#FFF8F3] to-white flex flex-col items-center justify-center text-center space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-2xl bg-[#1A3460] text-[#F3BC6F] flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-[#F3BC6F]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#1A3460]">Cari & Rancang Ide Baru</div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Gunakan AI Studio untuk riset hook parenting, kalender hari besar, dan naskah otomatis.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenStudio()}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>🎨 Buka Studio Ide Arjuna</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCreateModal(col.id)}
                      className="text-[10px] font-bold text-slate-500 hover:text-[#1A3460] underline cursor-pointer"
                    >
                      + atau input ide manual
                    </button>
                  </div>
                ) : (
                  <div className="h-28 rounded-2xl border-2 border-dashed border-[#1A3460]/15 flex flex-col items-center justify-center text-[#1A3460]/50 text-[11px] font-bold p-2 text-center bg-[#FFF8F3]/50">
                    <span>Belum ada konten</span>
                    <button
                      onClick={() => onOpenCreateModal(col.id)}
                      className="text-[#F35E50] hover:underline mt-1 font-black cursor-pointer"
                    >
                      + Buat Baru
                    </button>
                  </div>
                )
              ) : (
                <>
                  {/* Shortcut Button at Top of Column 1 */}
                  {col.id === "IDEA" && onOpenStudio && (
                    <button
                      type="button"
                      onClick={() => onOpenStudio()}
                      className="w-full py-2 px-3 rounded-xl bg-[#1A3460] hover:bg-[#23457c] text-[#F3BC6F] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm border border-[#F3BC6F]/40 transition cursor-pointer mb-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F35E50]" />
                      <span>+ Brainstorm Ide di Studio AI</span>
                    </button>
                  )}

                  {columnContents.map((content) => {
                    const platformInfo = getPlatformBadge(content.platform);
                    const nextStatus = getNextStatus(content.status);
                    const prevStatus = getPrevStatus(content.status);
                    const totalTasks = content.tasks?.length || 0;
                    const doneTasks = content.tasks?.filter((t: any) => t.isCompleted).length || 0;
                    const totalComments = content.comments?.length || 0;

                    return (
                      <div
                        key={content.id}
                        onClick={() => onSelectContent(content)}
                        className="group bg-[#FFF8F3] hover:bg-white border-2 border-[#1A3460]/15 hover:border-[#F35E50] rounded-2xl p-3.5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col gap-2.5 relative"
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black border ${platformInfo.className}`}
                          >
                            {platformInfo.icon}
                            {platformInfo.label}
                          </span>

                          <span className="text-[10px] text-[#1A3460]/60 font-bold uppercase">
                            {content.contentType?.replace("_", " ")}
                          </span>
                        </div>

                        {/* Content Title */}
                        <h4 className="text-xs sm:text-sm font-black text-[#1A3460] group-hover:text-[#F35E50] transition line-clamp-2 leading-snug">
                          {content.title}
                        </h4>

                        {/* In Column 1: One-Click Expand in Studio Button */}
                        {col.id === "IDEA" && onOpenStudio && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStudio(content.title);
                            }}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#F3BC6F]/30 border border-[#F3BC6F] text-[#1A3460] text-[10px] font-black flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3 h-3 text-[#F35E50]" />
                            <span>Kembangkan di Studio Ide →</span>
                          </button>
                        )}

                        {/* Prep Notes Snippet (Admin report) */}
                        {content.prepNotes && (
                          <div className="p-2.5 rounded-xl bg-white border border-[#F3BC6F]/60 text-[11px] text-[#1A3460]">
                            <div className="flex items-center gap-1 text-[10px] text-[#F35E50] font-black mb-0.5">
                              <FileText className="w-3 h-3 text-[#F35E50]" />
                              Laporan Persiapan Admin:
                            </div>
                            <p className="line-clamp-2 whitespace-pre-line text-[#1A3460]/75 text-[10px] font-medium">
                              {content.prepNotes}
                            </p>
                          </div>
                        )}

                        {/* LIVE LINK HIGHLIGHT (If published) */}
                        {content.liveUrl && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-black flex items-center gap-1 uppercase tracking-wider text-emerald-700">
                                <Flame className="w-3 h-3 text-emerald-600" />
                                Link Live Hasil Kerja
                              </span>
                            </div>
                            <a
                              href={content.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg transition truncate max-w-full shadow-sm"
                            >
                              <span className="truncate">Buka Link Live</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}

                        {/* Footer Info: Tasks count, Comments, Assignee */}
                        <div className="pt-2 border-t border-[#1A3460]/10 flex items-center justify-between text-[11px] text-[#1A3460]/70 font-bold">
                          <div className="flex items-center gap-2.5">
                            {totalTasks > 0 && (
                              <span
                                className={`flex items-center gap-1 text-[10px] font-black ${
                                  doneTasks === totalTasks
                                    ? "text-emerald-600"
                                    : "text-[#F35E50]"
                                }`}
                              >
                                <CheckSquare className="w-3 h-3" />
                                {doneTasks}/{totalTasks}
                              </span>
                            )}

                            {totalComments > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-[#1A3460]">
                                <MessageSquare className="w-3 h-3" />
                                {totalComments}
                              </span>
                            )}
                          </div>

                          {/* Author / Assignee Avatar */}
                          <div className="flex items-center gap-1">
                            {content.createdBy?.avatar && (
                              <img
                                src={content.createdBy.avatar}
                                alt={content.createdBy.name}
                                title={`Dibuat oleh ${content.createdBy.name}`}
                                className="w-5 h-5 rounded-full object-cover border border-[#F3BC6F]"
                              />
                            )}
                            <span className="text-[10px] text-[#1A3460]/70 font-semibold truncate max-w-[80px]">
                              {content.createdBy?.name?.split(" ")[0]}
                            </span>
                          </div>
                        </div>

                        {/* Quick Move Action Buttons (Kembali & Lanjut) */}
                        {prevStatus && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickMoveStatus(content.id, prevStatus);
                            }}
                            title="Kembalikan ke tahap sebelumnya (Revisi / Batal)"
                            className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute -bottom-3 left-3 bg-white hover:bg-[#FFF8F3] text-[#1A3460] text-[10px] font-black py-1 px-2.5 rounded-full flex items-center gap-1 shadow-md border-2 border-[#1A3460]/20 hover:border-[#1A3460] cursor-pointer active:scale-95 z-10"
                          >
                            <ArrowLeft className="w-3 h-3 text-[#1A3460]" />
                            <span>Kembali</span>
                          </button>
                        )}

                        {nextStatus && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickMoveStatus(content.id, nextStatus);
                            }}
                            title="Lanjut ke tahap berikutnya"
                            className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute -bottom-3 right-3 bg-[#1A3460] hover:bg-[#F35E50] text-white text-[10px] font-black py-1 px-2.5 rounded-full flex items-center gap-1 shadow-md border-2 border-white cursor-pointer active:scale-95 z-10"
                          >
                            <span>Lanjut</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
