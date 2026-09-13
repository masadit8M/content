"use client";

import React, { useEffect, useState } from "react";
import {
  FileBarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Lock,
  Plus,
  ArrowRight,
  X,
  FileText,
} from "lucide-react";
import { formatDateIndo, formatDateTimeIndo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function ReportsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Report Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportType, setReportType] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportTitle, setReportTitle] = useState("");
  const [execSummary, setExecSummary] = useState("");
  const [keyObservations, setKeyObservations] = useState("");
  const [nextPriorities, setNextPriorities] = useState("");
  const [generating, setGenerating] = useState(false);

  // View Report Modal
  const [viewingReport, setViewingReport] = useState<any>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${params.id}/reports`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [params.id]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const title =
        reportTitle ||
        `Laporan Konsultasi ${
          reportType === "DAILY" ? "Harian" : reportType === "WEEKLY" ? "Mingguan" : "Bulanan"
        } — Rumah Nara`;

      const res = await fetch(`/api/projects/${params.id}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          startDate,
          endDate,
          title,
          executiveSummary: execSummary,
          keyObservations,
          nextPriorities,
        }),
      });

      if (res.ok) {
        setShowGenerateModal(false);
        setReportTitle("");
        setExecSummary("");
        setKeyObservations("");
        setNextPriorities("");
        fetchReports();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal membuat laporan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async (reportId: string) => {
    try {
      const res = await fetch(`/api/projects/${params.id}/reports/${reportId}/finalize`, {
        method: "POST",
      });
      if (res.ok) {
        fetchReports();
        if (viewingReport && viewingReport.id === reportId) {
          setViewingReport((prev: any) => ({ ...prev, status: "FINALIZED" }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Laporan Konsultasi
            </h1>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {reports.length} Laporan
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Rekap otomatis jurnal kunjungan dan kemajuan tugas yang siap dicetak atau disimpan ke PDF.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-md shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5 text-emerald-400" />
          Buat Laporan Baru
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-16 text-center text-base text-slate-400 font-medium">
          Memuat arsip laporan...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileBarChart2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              Belum Ada Laporan Konsultasi
            </h3>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mt-1">
              Sistem dapat mengompilasi otomatis semua kunjungan dan tugas menjadi dokumen laporan resmi.
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Generate Laporan Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((rep) => {
            let metrics: any = {};
            try {
              metrics = JSON.parse(rep.metricsJson || "{}");
            } catch {}

            const isFinal = rep.status === "FINALIZED";

            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                      {rep.reportCode}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isFinal
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {isFinal ? "🔒 RESMI (FINAL)" : "📝 DRAFT"}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 leading-snug">
                    {rep.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Periode: {formatDateIndo(rep.periodStart)} — {formatDateIndo(rep.periodEnd)}
                  </p>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-3 gap-2.5 pt-4 mt-4 border-t border-slate-100 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-500 block font-medium">Aktivitas</span>
                      <strong className="text-slate-900 text-base sm:text-lg">
                        {metrics.activitiesCount ?? 0}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-500 block font-medium">Jam Kerja</span>
                      <strong className="text-blue-700 text-base sm:text-lg">
                        {metrics.consultingHours ?? 0}j
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-500 block font-medium">Tugas Selesai</span>
                      <strong className="text-emerald-700 text-base sm:text-lg">
                        {metrics.completedTasks ?? 0}
                      </strong>
                    </div>
                  </div>

                  {rep.executiveSummary && (
                    <p className="text-xs sm:text-sm text-slate-700 mt-3 italic line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      "{rep.executiveSummary}"
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-500">
                    Oleh: <strong className="text-slate-800">{rep.generatedBy?.name}</strong>
                  </span>

                  <button
                    onClick={() => setViewingReport(rep)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2"
                  >
                    Buka Laporan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Generate Report Baru */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Buat Laporan Konsultasi Baru
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Sistem otomatis mengumpulkan data kegiatan dan tugas di periode ini.
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Pilih Frekuensi Laporan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportType("DAILY")}
                    className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                      reportType === "DAILY"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("WEEKLY")}
                    className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                      reportType === "WEEKLY"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Mingguan
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("MONTHLY")}
                    className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                      reportType === "MONTHLY"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Bulanan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Judul Laporan (Opsional)
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder={`Laporan Konsultasi ${
                    reportType === "DAILY" ? "Harian" : reportType === "WEEKLY" ? "Mingguan" : "Bulanan"
                  } — Rumah Nara`}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Ringkasan Eksekutif (Catatan Konsultan)
                </label>
                <textarea
                  rows={2}
                  value={execSummary}
                  onChange={(e) => setExecSummary(e.target.value)}
                  placeholder="Ringkasan singkat pencapaian selama periode ini..."
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Temuan & Observasi Kunci
                </label>
                <textarea
                  rows={2}
                  value={keyObservations}
                  onChange={(e) => setKeyObservations(e.target.value)}
                  placeholder="Catatan observasi perkembangan staf daycare..."
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {generating ? "Mengekstrak..." : "Generate Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tampilan & Cetak Laporan (Print / PDF) */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-6">
            {/* Action Bar (Not Printed) */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-sm text-slate-800">
                  {viewingReport.reportCode}
                </span>
                {viewingReport.status === "FINALIZED" ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    Laporan Resmi (Terkunci)
                  </span>
                ) : (
                  <button
                    onClick={() => handleFinalize(viewingReport.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Kunci Laporan Resmi
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setViewingReport(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Document */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 space-y-6 text-slate-900 bg-white">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider block">
                    Yayasan Arjuna Cendekia · Pendampingan Operasional Daycare
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {viewingReport.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Periode: {formatDateIndo(viewingReport.periodStart)} — {formatDateIndo(viewingReport.periodEnd)}
                  </p>
                </div>
                <div className="sm:text-right text-xs sm:text-sm text-slate-600 space-y-0.5">
                  <p><strong>Nomor Dokumen:</strong> {viewingReport.reportCode}</p>
                  <p><strong>Dibuat oleh:</strong> {viewingReport.generatedBy?.name}</p>
                  <p><strong>Tanggal Terbit:</strong> {formatDateIndo(viewingReport.generatedAt)}</p>
                </div>
              </div>

              {/* Statistics Grid */}
              {(() => {
                let metrics: any = {};
                try {
                  metrics = JSON.parse(viewingReport.metricsJson || "{}");
                } catch {}

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <span className="text-xs text-slate-500 block font-semibold">Total Kunjungan</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          {metrics.activitiesCount ?? 0} Sesi
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <span className="text-xs text-slate-500 block font-semibold">Jam Pendampingan</span>
                        <p className="text-2xl font-black text-blue-700 mt-1">
                          {metrics.consultingHours ?? 0} Jam
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <span className="text-xs text-slate-500 block font-semibold">Tugas Selesai</span>
                        <p className="text-2xl font-black text-emerald-700 mt-1">
                          {metrics.completedTasks ?? 0} Tugas
                        </p>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    {viewingReport.executiveSummary && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Ringkasan Eksekutif
                        </h4>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base leading-relaxed text-slate-800">
                          {viewingReport.executiveSummary}
                        </div>
                      </div>
                    )}

                    {/* Key Observations */}
                    {viewingReport.keyObservations && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Temuan & Observasi Kunci
                        </h4>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base leading-relaxed text-slate-800">
                          {viewingReport.keyObservations}
                        </div>
                      </div>
                    )}

                    {/* Next Priorities */}
                    {viewingReport.nextPriorities && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Target Periode Berikutnya
                        </h4>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base leading-relaxed text-slate-800">
                          {viewingReport.nextPriorities}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
