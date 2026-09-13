"use client";

import React, { useState } from "react";
import { Plus, X, Calendar, ListTodo, FileText, AlertCircle, Users, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface QuickCreateModalProps {
  projectId: string;
  onSuccess?: () => void;
}

export function QuickCreateModal({ projectId, onSuccess }: QuickCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "task" | "rec" | "issue" | "sdm">("activity");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Activity form state
  const [actTitle, setActTitle] = useState("");
  const [actType, setActType] = useState("CONSULTATION");
  const [actDate, setActDate] = useState(new Date().toISOString().split("T")[0]);
  const [actDuration, setActDuration] = useState("60");
  const [actDescription, setActDescription] = useState("");
  const [actOutcome, setActOutcome] = useState("");
  const [actFinding, setActFinding] = useState("");
  const [actNextAction, setActNextAction] = useState("");
  const [actScope, setActScope] = useState("IN_SCOPE");

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("NORMAL");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskScope, setTaskScope] = useState("IN_SCOPE");

  // Rec form state
  const [recTitle, setRecTitle] = useState("");
  const [recProblem, setRecProblem] = useState("");
  const [recAnalysis, setRecAnalysis] = useState("");
  const [recText, setRecText] = useState("");
  const [recPriority, setRecPriority] = useState("HIGH");
  const [recScope, setRecScope] = useState("IN_SCOPE");

  // Issue form state
  const [issueTitle, setIssueTitle] = useState("");
  const [issueProblem, setIssueProblem] = useState("");
  const [issueImpact, setIssueImpact] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("MEDIUM");

  // SDM form state
  const [sdmPosition, setSdmPosition] = useState("");
  const [sdmCount, setSdmCount] = useState("1");
  const [sdmStartDate, setSdmStartDate] = useState("");
  const [sdmSchedule, setSdmSchedule] = useState("Senin - Jumat, 07.00 - 16.00");
  const [sdmDuties, setSdmDuties] = useState("");

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: actTitle,
          activityType: actType,
          date: actDate,
          durationMinutes: actDuration,
          description: actDescription,
          outcome: actOutcome,
          finding: actFinding,
          nextAction: actNextAction,
          scopeStatus: actScope,
        }),
      });
      if (res.ok) {
        setIsOpen(false);
        resetForms();
        if (onSuccess) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          scopeStatus: taskScope,
        }),
      });
      if (res.ok) {
        setIsOpen(false);
        resetForms();
        if (onSuccess) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRec = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recTitle,
          problemBackground: recProblem,
          consultantAnalysis: recAnalysis,
          recommendationText: recText,
          priority: recPriority,
          scopeStatus: recScope,
        }),
      });
      if (res.ok) {
        setIsOpen(false);
        resetForms();
        if (onSuccess) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: issueTitle,
          problem: issueProblem,
          impact: issueImpact,
          severity: issueSeverity,
        }),
      });
      if (res.ok) {
        setIsOpen(false);
        resetForms();
        if (onSuccess) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSDM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/sdm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: sdmPosition,
          personnelCount: sdmCount,
          requestedStartDate: sdmStartDate,
          workSchedule: sdmSchedule,
          duties: sdmDuties,
        }),
      });
      if (res.ok) {
        setIsOpen(false);
        resetForms();
        if (onSuccess) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setActTitle("");
    setActDescription("");
    setActOutcome("");
    setActFinding("");
    setActNextAction("");
    setTaskTitle("");
    setTaskDescription("");
    setRecTitle("");
    setRecProblem("");
    setRecAnalysis("");
    setRecText("");
    setIssueTitle("");
    setIssueProblem("");
    setIssueImpact("");
    setSdmPosition("");
    setSdmDuties("");
  };

  return (
    <>
      {/* Floating Action Button (PRD #56) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm no-print"
        title="Quick Create (Aktivitas, Task, Rekomendasi, Issue, SDM)"
      >
        <Plus className="w-5 h-5 text-emerald-400" />
        <span className="hidden sm:inline">Quick Create</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Quick Action</h3>
                <p className="text-xs text-slate-500">Catat aktivitas penting langsung ke digital trail</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-100 p-2 gap-1 overflow-x-auto bg-slate-50/30">
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "activity" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                + Activity
              </button>
              <button
                onClick={() => setActiveTab("task")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "task" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                + Task
              </button>
              <button
                onClick={() => setActiveTab("rec")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "rec" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                + Rekomendasi
              </button>
              <button
                onClick={() => setActiveTab("issue")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "issue" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                + Issue Log
              </button>
              <button
                onClick={() => setActiveTab("sdm")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "sdm" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                + Permintaan SDM
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* ACTIVITY TAB */}
              {activeTab === "activity" && (
                <form onSubmit={handleCreateActivity} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Aktivitas *</label>
                    <input
                      type="text"
                      required
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      placeholder="Contoh: Observasi Operasional Pagi & Sanitasi"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe</label>
                      <select
                        value={actType}
                        onChange={(e) => setActType(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="CONSULTATION">Consultation</option>
                        <option value="MEETING">Meeting</option>
                        <option value="TRAINING">Training</option>
                        <option value="SUPERVISION">Supervision</option>
                        <option value="SITE_VISIT">Site Visit</option>
                        <option value="REVIEW">Review</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={actDate}
                        onChange={(e) => setActDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi (Menit)</label>
                      <input
                        type="number"
                        value={actDuration}
                        onChange={(e) => setActDuration(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Control Flag (PRD #9)</label>
                    <select
                      value={actScope}
                      onChange={(e) => setActScope(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="IN_SCOPE">● IN SCOPE (Sesuai PKS Pokok)</option>
                      <option value="ADDITIONAL_REQUEST">● ADDITIONAL REQUEST (Permintaan Tambahan)</option>
                      <option value="OUTSIDE_ORIGINAL_SCOPE">● OUTSIDE ORIGINAL SCOPE (Di luar Fee PKS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Kegiatan *</label>
                    <textarea
                      required
                      rows={2}
                      value={actDescription}
                      onChange={(e) => setActDescription(e.target.value)}
                      placeholder="Uraian apa yang dikerjakan saat pendampingan..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome / Hasil</label>
                      <input
                        type="text"
                        value={actOutcome}
                        onChange={(e) => setActOutcome(e.target.value)}
                        placeholder="Hasil yang dicapai..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Next Action</label>
                      <input
                        type="text"
                        value={actNextAction}
                        onChange={(e) => setActNextAction(e.target.value)}
                        placeholder="Tindak lanjut berikutnya..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    {loading ? "Menyimpan..." : "Simpan Activity Log"}
                  </button>
                </form>
              )}

              {/* TASK TAB */}
              {activeTab === "task" && (
                <form onSubmit={handleCreateTask} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Task *</label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Contoh: Susun Draft Formulir Penjemputan Anak"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="LOW">LOW</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Catatan</label>
                    <textarea
                      rows={2}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Detail instruksi pengerjaan..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    {loading ? "Menyimpan..." : "Buat Task Baru"}
                  </button>
                </form>
              )}

              {/* RECOMMENDATION TAB */}
              {activeTab === "rec" && (
                <form onSubmit={handleCreateRec} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Rekomendasi *</label>
                    <input
                      type="text"
                      required
                      value={recTitle}
                      onChange={(e) => setRecTitle(e.target.value)}
                      placeholder="Contoh: Protokol Verifikasi Identitas Wali Penjemput"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Latar Belakang Masalah *</label>
                    <textarea
                      required
                      rows={2}
                      value={recProblem}
                      onChange={(e) => setRecProblem(e.target.value)}
                      placeholder="Masalah atau celah operasional yang ditemukan..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Analisis Konsultan *</label>
                    <textarea
                      required
                      rows={2}
                      value={recAnalysis}
                      onChange={(e) => setRecAnalysis(e.target.value)}
                      placeholder="Analisa risiko dan dampak operasional/hukum..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teks Rekomendasi Solusi *</label>
                    <textarea
                      required
                      rows={2}
                      value={recText}
                      onChange={(e) => setRecText(e.target.value)}
                      placeholder="Rekomendasi spesifik langkah yang harus diambil..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    {loading ? "Mengajukan..." : "Ajukan Rekomendasi ke Klien"}
                  </button>
                </form>
              )}

              {/* ISSUE TAB */}
              {activeTab === "issue" && (
                <form onSubmit={handleCreateIssue} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Masalah *</label>
                    <input
                      type="text"
                      required
                      value={issueTitle}
                      onChange={(e) => setIssueTitle(e.target.value)}
                      placeholder="Contoh: Kunci Grendel Pagar Samping Longgar"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Keparahan (Severity)</label>
                    <select
                      value={issueSeverity}
                      onChange={(e) => setIssueSeverity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">⚠ CRITICAL (Memunculkan Alert Utama)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Uraian Problem *</label>
                    <textarea
                      required
                      rows={2}
                      value={issueProblem}
                      onChange={(e) => setIssueProblem(e.target.value)}
                      placeholder="Fakta kejadian yang ditemukan..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dampak (Impact)</label>
                    <input
                      type="text"
                      value={issueImpact}
                      onChange={(e) => setIssueImpact(e.target.value)}
                      placeholder="Dampak terhadap keselamatan / kelancaran operasional..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    {loading ? "Melaporkan..." : "Laporkan Masalah Operasional"}
                  </button>
                </form>
              )}

              {/* SDM TAB */}
              {activeTab === "sdm" && (
                <form onSubmit={handleCreateSDM} className="space-y-3.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Posisi Tenaga Kerja *</label>
                      <input
                        type="text"
                        required
                        value={sdmPosition}
                        onChange={(e) => setSdmPosition(e.target.value)}
                        placeholder="Contoh: Guru Pendamping Sentra Balita"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
                      <input
                        type="number"
                        min="1"
                        value={sdmCount}
                        onChange={(e) => setSdmCount(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Mulai Bekerja</label>
                      <input
                        type="date"
                        required
                        value={sdmStartDate}
                        onChange={(e) => setSdmStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Jadwal Kerja</label>
                      <input
                        type="text"
                        value={sdmSchedule}
                        onChange={(e) => setSdmSchedule(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rincian Tugas (Job Description) *</label>
                    <textarea
                      required
                      rows={2}
                      value={sdmDuties}
                      onChange={(e) => setSdmDuties(e.target.value)}
                      placeholder="Uraian tanggung jawab dan tugas pokok..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    {loading ? "Mengirimkan..." : "Kirim Permintaan SDM"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
