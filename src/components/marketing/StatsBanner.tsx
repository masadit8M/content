"use client";

import React from "react";
import { Sparkles, Clock, CheckCircle2, Flame, Layers, ListChecks } from "lucide-react";

interface StatsProps {
  contents: any[];
}

export function StatsBanner({ contents }: StatsProps) {
  const total = contents.length;
  const inPrep = contents.filter((c) => c.status === "IN_PREPARATION" || c.status === "IDEA").length;
  const inReview = contents.filter((c) => c.status === "IN_REVIEW").length;
  const ready = contents.filter((c) => c.status === "READY_TO_PUBLISH").length;
  const published = contents.filter((c) => c.status === "PUBLISHED" || c.liveUrl).length;

  const allTasks = contents.flatMap((c) => c.tasks || []);
  const completedTasks = allTasks.filter((t) => t.isCompleted).length;
  const taskPercent = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      {/* Total Konten */}
      <div className="bg-white border-2 border-[#1A3460]/15 rounded-2xl p-4 shadow-sm hover:border-[#1A3460]/40 transition">
        <div className="flex items-center justify-between text-[#1A3460]/70 text-xs font-bold mb-1">
          <span>Total Konten</span>
          <Layers className="w-4 h-4 text-[#1A3460]" />
        </div>
        <div className="text-2xl font-black text-[#1A3460]">{total}</div>
        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Semua kampanye tim</div>
      </div>

      {/* Persiapan Admin */}
      <div className="bg-white border-2 border-[#F3BC6F] rounded-2xl p-4 shadow-sm hover:border-[#F35E50] transition">
        <div className="flex items-center justify-between text-[#F35E50] text-xs font-bold mb-1">
          <span>Persiapan Admin</span>
          <Clock className="w-4 h-4 text-[#F35E50]" />
        </div>
        <div className="text-2xl font-black text-[#F35E50]">{inPrep}</div>
        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Riset naskah & visual</div>
      </div>

      {/* Review & Revisi */}
      <div className="bg-white border-2 border-[#F9C5CB] rounded-2xl p-4 shadow-sm hover:border-[#F35E50] transition">
        <div className="flex items-center justify-between text-[#1A3460] text-xs font-bold mb-1">
          <span>Review & Revisi</span>
          <Sparkles className="w-4 h-4 text-[#F35E50]" />
        </div>
        <div className="text-2xl font-black text-[#1A3460]">{inReview}</div>
        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Umpan balik tim</div>
      </div>

      {/* Sudah Live! (Showcase) */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-400 rounded-2xl p-4 shadow-sm hover:border-emerald-600 transition">
        <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
          <span>Hasil Live!</span>
          <Flame className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-black text-emerald-700">{published}</div>
        <div className="text-[11px] text-emerald-600/80 font-bold mt-0.5">Tautan publik aktif</div>
      </div>

      {/* Subtask Selesai */}
      <div className="col-span-2 md:col-span-1 bg-white border-2 border-[#1A3460]/15 rounded-2xl p-4 shadow-sm hover:border-[#1A3460]/40 transition">
        <div className="flex items-center justify-between text-[#1A3460]/70 text-xs font-bold mb-1">
          <span>Task Tambahan Tim</span>
          <ListChecks className="w-4 h-4 text-[#1A3460]" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-black text-[#1A3460]">
            {completedTasks}/{allTasks.length}
          </div>
          <span className="text-xs font-black text-[#F35E50]">({taskPercent}%)</span>
        </div>
        <div className="w-full bg-[#FFF8F3] border border-[#1A3460]/10 h-2 rounded-full mt-1.5 overflow-hidden">
          <div
            className="bg-[#F35E50] h-full rounded-full transition-all duration-500"
            style={{ width: `${taskPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
