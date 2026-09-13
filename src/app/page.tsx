"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ListTodo,
  FileCheck2,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          setProjects(data.projects || []);
        })
        .catch(console.error)
        .finally(() => setDataLoading(false));
    }
  }, [user, loading, router]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-base font-semibold text-slate-600">
            Memuat Arjuna Consulting Workspace...
          </span>
        </div>
      </div>
    );
  }

  const isArjunaTeam = user?.globalRole?.startsWith("ARJUNA");
  const project = projects[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              {isArjunaTeam ? "Tim Konsultan Arjuna" : "Portal Klien Daycare"}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Selamat datang, {user?.name} 👋
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              {isArjunaTeam
                ? "Workspace terpadu pendampingan operasional, rekap kunjungan, dan persetujuan rekomendasi daycare Rumah Nara."
                : "Pantau jurnal pendampingan konsultan, berikan persetujuan rekomendasi, dan cek tugas operasional harian Rumah Nara."}
            </p>
          </div>
        </div>

        {/* Project Card */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Proyek Pendampingan Aktif
          </h2>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 font-medium">
              Belum ada proyek aktif.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-6 sm:p-8 shadow-sm transition space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-500 block">
                        {proj.clientOrg?.name || "Rumah Nara Islamic Child Center"}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                        {proj.displayName}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        {proj.legalName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        ● STATUS: AKTIF
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 mb-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Kunjungan
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-slate-900">
                        {proj._count?.activityLogs ?? 0}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                      <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 mb-1">
                        <FileCheck2 className="w-4 h-4 text-indigo-500" />
                        Rekomendasi
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-indigo-900">
                        {proj._count?.recommendations ?? 0}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 mb-1">
                        <ListTodo className="w-4 h-4 text-emerald-500" />
                        Tugas
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-emerald-900">
                        {proj._count?.tasks ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base transition flex items-center gap-2.5 shadow-md group"
                    >
                      <span>Buka Dashboard Rumah Nara</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition stroke-[2.5]" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
