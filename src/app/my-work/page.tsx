"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FileCheck2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { ScopeBadge } from "@/components/common/ScopeBadge";
import { formatDateIndo, getStatusBadgeClass } from "@/lib/utils";

export default function MyWorkPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMyWork = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/my-work");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWork();
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-slate-500">Memuat My Work Inbox...</div>
        </div>
      </div>
    );
  }

  const { assignedTasks, overdueTasks, dueTodayTasks, dueThisWeekTasks, pendingDecisions, myIssues } = data;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Personal Workspace · PRD #34
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              My Work — {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Semua tugas, keputusan, dan masalah operasional yang membutuhkan tindakan Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 font-semibold text-xs text-slate-700">
              {assignedTasks.length} Tugas Ditugaskan
            </span>
            {pendingDecisions.length > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 font-bold text-xs text-amber-800 border border-amber-200">
                {pendingDecisions.length} Keputusan Menunggu
              </span>
            )}
          </div>
        </div>

        {/* 1. Pending Decisions (for Decision Makers) */}
        {pendingDecisions.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/40">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-sm text-slate-900">
                Awaiting My Decision ({pendingDecisions.length} Rekomendasi)
              </h2>
            </div>
            <div className="space-y-2.5">
              {pendingDecisions.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-900">{rec.recCode}</span>
                      <ScopeBadge scope={rec.scopeStatus} />
                    </div>
                    <p className="font-bold text-slate-900 mt-1">{rec.title}</p>
                    <p className="text-slate-600 line-clamp-1 mt-0.5">{rec.recommendationText}</p>
                  </div>
                  <Link
                    href={`/projects/${rec.projectId}/recommendations`}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shrink-0 text-center transition"
                  >
                    Beri Keputusan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Overdue & Due Today Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overdue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Overdue Tasks ({overdueTasks.length})
              </h3>
            </div>
            {overdueTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nol tugas jatuh tempo yang terlambat 🎉</p>
            ) : (
              <div className="space-y-2">
                {overdueTasks.map((t: any) => (
                  <div key={t.id} className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs">
                    <span className="font-bold text-rose-800 block">{t.taskCode}: {t.title}</span>
                    <span className="text-[10px] text-rose-600 mt-1 block">Due: {formatDateIndo(t.dueDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Today */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Due Today ({dueTodayTasks.length})
              </h3>
            </div>
            {dueTodayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Tidak ada tugas jatuh tempo hari ini</p>
            ) : (
              <div className="space-y-2">
                {dueTodayTasks.map((t: any) => (
                  <div key={t.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                    <span className="font-bold text-emerald-900 block">{t.taskCode}: {t.title}</span>
                    <span className="text-[10px] text-emerald-700 mt-1 block">Jatuh tempo hari ini</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. All Tasks Assigned to Me */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                All Assigned Tasks ({assignedTasks.length})
              </h3>
            </div>
          </div>

          {assignedTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada tugas yang ditugaskan kepada Anda.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignedTasks.map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{t.taskCode}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getStatusBadgeClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 mt-0.5">{t.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Due: {formatDateIndo(t.dueDate)} · Proyek: {t.project?.displayName}
                    </p>
                  </div>
                  <Link
                    href={`/projects/${t.projectId}/tasks`}
                    className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                  >
                    Buka Task →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
