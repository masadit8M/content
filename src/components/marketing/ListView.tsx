"use client";

import React from "react";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
import {
  ExternalLink,
  MessageSquare,
  CheckSquare,
  Flame,
  Calendar,
} from "lucide-react";

interface ListProps {
  contents: any[];
  onSelectContent: (content: any) => void;
  onQuickMoveStatus: (contentId: string, nextStatus: string) => void;
}

export function ListView({ contents, onSelectContent, onQuickMoveStatus }: ListProps) {
  return (
    <div className="bg-white border-2 border-[#1A3460]/15 rounded-3xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1A3460] text-[#F3BC6F] text-[11px] font-black uppercase tracking-wider">
              <th className="py-3.5 px-4">Konten & Platform</th>
              <th className="py-3.5 px-4">Status Alur</th>
              <th className="py-3.5 px-4">Laporan Persiapan</th>
              <th className="py-3.5 px-4">Task Tim</th>
              <th className="py-3.5 px-4">Hasil Live</th>
              <th className="py-3.5 px-4">PIC / Pembuat</th>
              <th className="py-3.5 px-4">Target Tayang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A3460]/10 text-xs">
            {contents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#1A3460]/50 font-bold">
                  Tidak ada konten yang sesuai filter.
                </td>
              </tr>
            ) : (
              contents.map((item) => {
                const platformInfo = getPlatformBadge(item.platform);
                const statusInfo = getStatusBadge(item.status);
                const totalTasks = item.tasks?.length || 0;
                const doneTasks = item.tasks?.filter((t: any) => t.isCompleted).length || 0;
                const totalComments = item.comments?.length || 0;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectContent(item)}
                    className="hover:bg-[#FFF8F3] cursor-pointer transition group"
                  >
                    {/* Title & Platform */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${platformInfo.className}`}
                        >
                          {platformInfo.icon}
                          {platformInfo.label}
                        </span>
                        <span className="text-[10px] text-[#1A3460]/60 font-bold uppercase">
                          {item.contentType?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="font-black text-[#1A3460] group-hover:text-[#F35E50] transition line-clamp-1">
                        {item.title}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Laporan Persiapan */}
                    <td className="py-3.5 px-4 max-w-xs text-[#1A3460]">
                      {item.prepNotes ? (
                        <p className="line-clamp-2 text-[11px] text-[#1A3460]/75 font-medium">
                          {item.prepNotes}
                        </p>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum ada catatan</span>
                      )}
                    </td>

                    {/* Task Tim */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-xs ${
                            totalTasks > 0 && doneTasks === totalTasks
                              ? "text-emerald-600"
                              : "text-[#F35E50]"
                          }`}
                        >
                          {doneTasks}/{totalTasks}
                        </span>
                        {totalComments > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-[#1A3460] font-bold">
                            <MessageSquare className="w-3 h-3 text-[#1A3460]" />
                            {totalComments}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Hasil Live Link */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.liveUrl ? (
                        <a
                          href={item.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition"
                        >
                          <Flame className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Link Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-semibold">-</span>
                      )}
                    </td>

                    {/* PIC / Author */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {item.createdBy?.avatar && (
                          <img
                            src={item.createdBy.avatar}
                            alt={item.createdBy.name}
                            className="w-6 h-6 rounded-full object-cover border border-[#F3BC6F]"
                          />
                        )}
                        <span className="font-bold text-[#1A3460]">
                          {item.createdBy?.name || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Target Tayang */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-bold text-[11px]">
                      {item.targetDate ? (
                        <span className="flex items-center gap-1 text-[#1A3460]">
                          <Calendar className="w-3.5 h-3.5 text-[#F3BC6F]" />
                          {new Date(item.targetDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
