"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck2,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { formatDateIndo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function ProjectDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${params.id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [params.id, user]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-base font-semibold text-slate-600">
          <div className="w-5 h-5 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Memuat ringkasan proyek...</span>
        </div>
      </div>
    );
  }

  const { project, todaysFocus, pendingDecisions, latestActivities } = data;
  const isKonsultan = user?.email?.includes("arjuna.id");

  return (
    <div className="space-y-8">
      {/* 1. Big Welcome & Project Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              STATUS: PENDAMPINGAN AKTIF
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {project.displayName}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Pendampingan operasional &amp; standarisasi daycare bersama Tim Arjuna
            </p>
          </div>
      </div>

      {/* 2. Three Main Focus Sections */}
      <div className="space-y-6">
        {/* SECTION A: Rekomendasi Menunggu Persetujuan Klien */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Perlu Persetujuan Rumah Nara
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Masukan & solusi dari Mbak Tika yang memerlukan persetujuan
                </p>
              </div>
            </div>

            <Link
              href={`/projects/${params.id}/recommendations`}
              className="text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              Buka Semua ({pendingDecisions?.length || 0})
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {pendingDecisions?.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-base font-bold text-slate-700">
                Semua rekomendasi telah disetujui 🎉
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {isKonsultan
                  ? "Mbak Tika dapat mengajukan saran atau SOP baru di menu Rekomendasi."
                  : "Tidak ada rekomendasi yang tertunda. Semua masukan konsultan telah diproses."}
              </p>
              <Link
                href={`/projects/${params.id}/recommendations`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold mt-2"
              >
                + Buat Rekomendasi Baru
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDecisions.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-800">{rec.recCode}</span>
                    <h3 className="text-base font-bold text-slate-900">{rec.title}</h3>
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                      {rec.recommendationText}
                    </p>
                    <p className="text-xs text-slate-500 pt-1">
                      Diajukan oleh <strong>{rec.createdBy?.name}</strong>
                    </p>
                  </div>

                  <Link
                    href={`/projects/${params.id}/recommendations`}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition shrink-0 text-center shadow-xs"
                  >
                    Beri Persetujuan
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION B: Daftar Tugas Aktif */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Daftar Tugas Operasional
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Checklist apa yang harus dikerjakan bersama di daycare
                </p>
              </div>
            </div>

            <Link
              href={`/projects/${params.id}/tasks`}
              className="text-sm font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1"
            >
              Lihat Tugas ({todaysFocus?.length || 0})
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {todaysFocus?.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-base font-bold text-slate-700">
                Belum ada tugas aktif
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Tugas akan otomatis dibuat saat rekomendasi disetujui, atau Anda dapat membuat tugas manual.
              </p>
              <Link
                href={`/projects/${params.id}/tasks`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold mt-2"
              >
                + Buat Tugas Baru
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysFocus.map((task: any) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{task.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Penanggung Jawab: <strong className="text-slate-700">{task.assignedTo?.name || "Ms. Tsania"}</strong>
                      {task.dueDate && ` · Batas: ${formatDateIndo(task.dueDate)}`}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION C: Jurnal Kunjungan Terakhir */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Jurnal Kunjungan Mbak Tika
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Aktivitas pendampingan harian konsultan di Rumah Nara
                </p>
              </div>
            </div>

            <Link
              href={`/projects/${params.id}/activities`}
              className="text-sm font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              Semua Jurnal ({latestActivities?.length || 0})
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {latestActivities?.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-base font-bold text-slate-700">
                Belum ada catatan kunjungan
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Mbak Tika dapat mencatat kegiatan pendampingan hari ini agar pihak Rumah Nara selalu mengetahui perkembangan terkini.
              </p>
              <Link
                href={`/projects/${params.id}/activities`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold mt-2"
              >
                + Catat Kunjungan Pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {latestActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">
                      {formatDateIndo(act.date)} {act.startTime ? `· Pukul ${act.startTime}` : ""}
                    </span>
                    <span className="text-xs text-slate-500">
                      Oleh <strong>{act.createdBy?.name}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{act.title}</h3>
                  <p className="text-sm text-slate-600">{act.description}</p>
                  {act.outcome && (
                    <p className="text-xs font-semibold text-emerald-700 pt-1">
                      ✓ Hasil: {act.outcome}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
