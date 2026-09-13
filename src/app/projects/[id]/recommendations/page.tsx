"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  ListTodo,
  UserCheck,
  Plus,
  X,
  Sparkles,
  Printer,
} from "lucide-react";
import { ScopeBadge } from "@/components/common/ScopeBadge";
import { formatDateIndo, formatDateTimeIndo, getStatusBadgeClass } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function RecommendationsPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Proposal Modal State (for Consultant)
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingRec, setSubmittingRec] = useState(false);
  const [recForm, setRecForm] = useState({
    title: "",
    priority: "NORMAL",
    problemBackground: "",
    consultantAnalysis: "",
    recommendationText: "",
    expectedOutcome: "",
    scopeStatus: "IN_SCOPE",
  });

  // Decision Modal State (for Client)
  const [selectedRec, setSelectedRec] = useState<any>(null);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED" | "REVISION_REQUESTED" | "NEED_DISCUSSION">("APPROVED");
  const [decisionComment, setDecisionComment] = useState("");
  const [createTask, setCreateTask] = useState(true);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${params.id}/recommendations`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [params.id]);

  const handleCreateRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingRec(true);
      const res = await fetch(`/api/projects/${params.id}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recForm),
      });

      if (res.ok) {
        setShowAddModal(false);
        setRecForm({
          title: "",
          priority: "NORMAL",
          problemBackground: "",
          consultantAnalysis: "",
          recommendationText: "",
          expectedOutcome: "",
          scopeStatus: "IN_SCOPE",
        });
        fetchRecommendations();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengajukan rekomendasi");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmittingRec(false);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRec) return;

    try {
      setSubmittingDecision(true);
      const res = await fetch(
        `/api/projects/${params.id}/recommendations/${selectedRec.id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: decisionType,
            comment: decisionComment,
            createActionTask: createTask,
          }),
        }
      );

      if (res.ok) {
        setSelectedRec(null);
        setDecisionComment("");
        fetchRecommendations();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan keputusan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rekomendasi & Keputusan Klien
            </h1>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {recommendations.length} Rekomendasi
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Usulan perbaikan operasional dari Konsultan Arjuna dan persetujuan resmi dari Pihak Rumah Nara.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {recommendations.length > 0 && (
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base transition flex items-center justify-center gap-2"
              title="Cetak Rekap Rekomendasi ke PDF"
            >
              <Printer className="w-5 h-5 text-slate-600" />
              <span className="hidden sm:inline">Cetak / PDF</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 text-emerald-400" />
            Ajukan Rekomendasi Baru
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="py-16 text-center text-base text-slate-400 font-medium">
          Memuat data rekomendasi...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              Belum Ada Usulan Rekomendasi
            </h3>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mt-1">
              Konsultan Arjuna dapat mengajukan rekomendasi solusi perbaikan operasional untuk disetujui pihak Rumah Nara.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Ajukan Rekomendasi Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec) => {
            const hasDecision = rec.decisions && rec.decisions.length > 0;
            const latestDecision = hasDecision ? rec.decisions[0] : null;

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5 hover:border-slate-300 transition"
              >
                {/* Top bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-extrabold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                      {rec.recCode}
                    </span>
                    <ScopeBadge scope={rec.scopeStatus} />
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadgeClass(
                        rec.priority
                      )}`}
                    >
                      Prioritas: {rec.priority}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500">
                      Diajukan oleh: <strong className="text-slate-800">{rec.createdBy?.name}</strong> (
                      {formatDateIndo(rec.createdAt)})
                    </span>
                  </div>

                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${getStatusBadgeClass(
                        rec.status
                      )}`}
                    >
                      {rec.status === "SUBMITTED"
                        ? "Menunggu Keputusan"
                        : rec.status === "APPROVED"
                        ? "Disetujui"
                        : rec.status}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {rec.title}
                  </h3>
                </div>

                {/* Problem Background & Consultant Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-xs block">
                      1. Latar Belakang Masalah
                    </span>
                    <p className="text-slate-700 leading-relaxed">{rec.problemBackground}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                    <span className="font-bold text-blue-900 uppercase tracking-wider text-xs block">
                      2. Analisis Konsultan Arjuna
                    </span>
                    <p className="text-slate-800 leading-relaxed">{rec.consultantAnalysis}</p>
                  </div>
                </div>

                {/* Core Recommendation & Impact */}
                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <span className="font-bold text-indigo-950 uppercase tracking-wider text-xs block">
                    3. Usulan Solusi Rekomendasi
                  </span>
                  <p className="text-slate-900 font-semibold text-base sm:text-lg leading-relaxed">
                    {rec.recommendationText}
                  </p>
                  {rec.expectedOutcome && (
                    <p className="text-sm sm:text-base text-emerald-800 font-bold pt-2 border-t border-indigo-200/60 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Target Dampak: {rec.expectedOutcome}
                    </p>
                  )}
                </div>

                {/* Client Decision Section */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {latestDecision ? (
                    <div className="flex items-start gap-3 text-sm sm:text-base">
                      <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">
                            Keputusan Klien:{" "}
                            <span
                              className={
                                latestDecision.decision === "APPROVED"
                                  ? "text-emerald-700 font-black"
                                  : latestDecision.decision === "REJECTED"
                                  ? "text-rose-700 font-black"
                                  : "text-amber-700 font-black"
                              }
                            >
                              {latestDecision.decision === "APPROVED"
                                ? "SETUJU (DITERAPKAN)"
                                : latestDecision.decision === "REJECTED"
                                ? "DITOLAK"
                                : latestDecision.decision === "NEED_DISCUSSION"
                                ? "PERLU DISKUSI DULU"
                                : "MINTA REVISI"}
                            </span>
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 text-xs sm:text-sm">
                            oleh <strong>{latestDecision.decisionBy?.name}</strong> (
                            {formatDateTimeIndo(latestDecision.decisionAt)})
                          </span>
                        </div>
                        {latestDecision.comment && (
                          <p className="text-slate-700 italic mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            "{latestDecision.comment}"
                          </p>
                        )}
                        {latestDecision.generatedTaskId && (
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 mt-2 bg-blue-50 px-2.5 py-1 rounded-lg">
                            <ListTodo className="w-4 h-4" />
                            Otomatis dibuat task tindak lanjut: {latestDecision.generatedTaskId}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-sm sm:text-base text-amber-800 font-semibold bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                      <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Menunggu persetujuan resmi dari Pihak Rumah Nara (Ms. Tsania / Mr. Ryan)</span>
                    </div>
                  )}

                  {/* Decision Action Button */}
                  {!latestDecision && (
                    <button
                      onClick={() => {
                        setSelectedRec(rec);
                        setDecisionType("APPROVED");
                      }}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2 shrink-0"
                    >
                      <UserCheck className="w-5 h-5" />
                      Berikan Keputusan Klien
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Ajukan Rekomendasi Baru (Consultant) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Ajukan Usulan Rekomendasi Baru
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Konsultan mengajukan usulan perbaikan sistem atau operasional ke Rumah Nara.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecommendation} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Judul Usulan Rekomendasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penerapan Jadwal Shift Istirahat & Rotasi Guru Daycare"
                  value={recForm.title}
                  onChange={(e) => setRecForm({ ...recForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Prioritas
                </label>
                <select
                  value={recForm.priority}
                  onChange={(e) => setRecForm({ ...recForm, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Tinggi (Penting)</option>
                  <option value="URGENT">Mendesak (Segera)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  1. Latar Belakang & Masalah *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Apa masalah atau kendala yang diamati di lapangan?"
                  value={recForm.problemBackground}
                  onChange={(e) => setRecForm({ ...recForm, problemBackground: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  2. Analisis Konsultan Arjuna *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Penjelasan analisa konsultan mengapa hal ini penting diperbaiki..."
                  value={recForm.consultantAnalysis}
                  onChange={(e) => setRecForm({ ...recForm, consultantAnalysis: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1.5">
                  3. Usulan Solusi Rekomendasi *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Langkah nyata atau solusi konkret yang direkomendasikan untuk diterapkan..."
                  value={recForm.recommendationText}
                  onChange={(e) => setRecForm({ ...recForm, recommendationText: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-indigo-200 bg-indigo-50/40 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-800 mb-1.5">
                  Target Dampak / Outcome Positif
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Menjaga rasio anak-guru aman dan pengasuh tidak kelelahan"
                  value={recForm.expectedOutcome}
                  onChange={(e) => setRecForm({ ...recForm, expectedOutcome: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-emerald-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRec}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingRec ? "Mengajukan..." : "Ajukan Usulan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Berikan Keputusan Klien (Client) */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 block">
                  Keputusan Pihak Rumah Nara
                </span>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-0.5">
                  {selectedRec.recCode}: {selectedRec.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">
                  Pilih Keputusan:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDecisionType("APPROVED")}
                    className={`p-3.5 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${
                      decisionType === "APPROVED"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    ✓ Setuju & Terapkan
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("NEED_DISCUSSION")}
                    className={`p-3.5 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${
                      decisionType === "NEED_DISCUSSION"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    💬 Perlu Diskusi Dulu
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("REVISION_REQUESTED")}
                    className={`p-3.5 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${
                      decisionType === "REVISION_REQUESTED"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <AlertCircle className="w-5 h-5" />
                    ✍️ Minta Revisi
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("REJECTED")}
                    className={`p-3.5 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${
                      decisionType === "REJECTED"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    ✕ Tolak Usulan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Catatan atau Arahan Tambahan dari Klien:
                </label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Contoh: Setuju diterapkan mulai Senin depan. Mohon Mbak Tika briefing guru terlebih dahulu."
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {decisionType === "APPROVED" && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="createTaskCheck"
                    checked={createTask}
                    onChange={(e) => setCreateTask(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="createTaskCheck" className="text-xs sm:text-sm font-bold text-emerald-950 cursor-pointer">
                    Otomatis buat tugas tindak lanjut di menu Daftar Tugas
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRec(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingDecision ? "Menyimpan..." : "Simpan Keputusan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW / PDF MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-6">
            {/* Action Bar (Not Printed) */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">
                  Pratinjau Cetak Rekomendasi & Keputusan Klien
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {recommendations.length} Rekomendasi
                </span>
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
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 space-y-6 text-slate-900 bg-white">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider block">
                    Yayasan Arjuna Cendekia · Pendampingan Operasional Daycare
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Arsip Rekomendasi & Keputusan Klien
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Klien: <strong>Rumah Nara Islamic Child Center</strong>
                  </p>
                </div>
                <div className="sm:text-right text-xs sm:text-sm text-slate-600 space-y-0.5">
                  <p><strong>Total Rekomendasi:</strong> {recommendations.length} Item</p>
                  <p><strong>Tanggal Dicetak:</strong> {formatDateIndo(new Date().toISOString())}</p>
                </div>
              </div>

              {/* Table / List of Recommendations */}
              <div className="space-y-5">
                {recommendations.map((rec, idx) => {
                  const hasDecision = rec.decisions && rec.decisions.length > 0;
                  const latestDecision = hasDecision ? rec.decisions[0] : null;

                  return (
                    <div key={rec.id} className="p-5 rounded-xl border border-slate-200 space-y-3 text-xs sm:text-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {idx + 1}. [{rec.recCode}] {rec.title}
                        </span>
                        <span className="font-bold px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-800">
                          {rec.status === "APPROVED" ? "DISETUJUI" : rec.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <strong>Latar Belakang Masalah:</strong>
                          <p className="text-slate-600 mt-0.5">{rec.problemBackground}</p>
                        </div>
                        <div className="p-2.5 bg-blue-50/60 rounded-lg">
                          <strong>Analisis Konsultan:</strong>
                          <p className="text-slate-700 mt-0.5">{rec.consultantAnalysis}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50/50 rounded-lg text-xs sm:text-sm">
                        <strong className="text-indigo-950">Solusi Rekomendasi Konsultan:</strong>
                        <p className="text-slate-800 mt-1 font-medium">{rec.recommendationText}</p>
                      </div>

                      {/* Decision Details */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span>
                          Diajukan oleh: <strong>{rec.createdBy?.name}</strong> ({formatDateIndo(rec.createdAt)})
                        </span>
                        {latestDecision ? (
                          <span className="text-emerald-700 font-bold">
                            Keputusan Klien: {latestDecision.decision} oleh {latestDecision.decisionBy?.name} ({formatDateTimeIndo(latestDecision.decisionAt)})
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">
                            Menunggu Keputusan Klien
                          </span>
                        )}
                      </div>

                      {latestDecision?.comment && (
                        <p className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded">
                          Arahan Klien: "{latestDecision.comment}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs sm:text-sm">
                <div className="space-y-16">
                  <p className="font-bold text-slate-700">Konsultan Pendamping (Arjuna)</p>
                  <div>
                    <p className="font-black text-slate-900 border-t border-slate-400 pt-2 w-48 mx-auto">
                      Mbak Tika
                    </p>
                    <p className="text-xs text-slate-500">Lead Consultant</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p className="font-bold text-slate-700">Pihak Rumah Nara</p>
                  <div>
                    <p className="font-black text-slate-900 border-t border-slate-400 pt-2 w-48 mx-auto">
                      Ms. Tsania / Mr. Ryan
                    </p>
                    <p className="text-xs text-slate-500">Kepala Daycare / Owner</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
