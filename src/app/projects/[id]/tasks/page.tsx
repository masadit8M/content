"use client";

import React, { useEffect, useState } from "react";
import {
  ListTodo,
  CheckCircle2,
  Search,
  Plus,
  X,
  User,
  Calendar,
  Printer,
} from "lucide-react";
import { ScopeBadge } from "@/components/common/ScopeBadge";
import { formatDateIndo, getStatusBadgeClass } from "@/lib/utils";

const TASK_STATUS_OPTIONS = [
  { key: "TO_DO", label: "Belum Mulai" },
  { key: "IN_PROGRESS", label: "Sedang Dikerjakan" },
  { key: "WAITING_CLIENT", label: "Menunggu Pihak Klien" },
  { key: "WAITING_CONSULTANT", label: "Menunggu Konsultan" },
  { key: "DONE", label: "✓ Sudah Selesai" },
];

export default function TasksPage({ params }: { params: { id: string } }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    priority: "NORMAL",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    checklists: "",
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter) query.set("status", statusFilter);

      const res = await fetch(`/api/projects/${params.id}/tasks?${query.toString()}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setMembers(data.members || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [params.id, statusFilter]);

  const toggleChecklist = async (taskId: string, checklistId: string) => {
    try {
      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              checklist: t.checklist.map((c: any) =>
                c.id === checklistId ? { ...c, isCompleted: !c.isCompleted } : c
              ),
            };
          }
          return t;
        })
      );

      await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistToggleId: checklistId }),
      });
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const checklistItems = taskForm.checklists
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const res = await fetch(`/api/projects/${params.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          assignedToId: taskForm.assignedToId || null,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || null,
          checklists: checklistItems,
          scopeStatus: "IN_SCOPE",
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setTaskForm({
          title: "",
          description: "",
          assignedToId: "",
          priority: "NORMAL",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          checklists: "",
        });
        fetchTasks();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal membuat tugas");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Daftar Tugas & Tindak Lanjut
            </h1>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {tasks.length} Tugas
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Pekerjaan operasional harian yang perlu diselesaikan tim Rumah Nara dan Konsultan Arjuna.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {tasks.length > 0 && (
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base transition flex items-center justify-center gap-2"
              title="Cetak atau Simpan Checklist Tugas ke PDF"
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
            Tambah Tugas Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari tugas atau tindak lanjut..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTasks()}
            className="w-full pl-11 pr-4 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-56 px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="">Semua Status</option>
            {TASK_STATUS_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-16 text-center text-base text-slate-400 font-medium">
          Memuat daftar tugas...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <ListTodo className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              Belum Ada Tugas Aktif
            </h3>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mt-1">
              Tugas akan dibuat otomatis begitu rekomendasi disetujui oleh pihak Rumah Nara, atau Anda bisa menambahkannya sekarang.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Buat Tugas Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const completedChecklistCount =
              task.checklist?.filter((c: any) => c.isCompleted).length || 0;
            const totalChecklistCount = task.checklist?.length || 0;
            const isDone = task.status === "DONE";

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition space-y-4 ${
                  isDone
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header: Code, Priority, Due Date, Status Changer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                      {task.taskCode}
                    </span>
                    <ScopeBadge scope={task.scopeStatus} />
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadgeClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Batas: {formatDateIndo(task.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-500">Status:</span>
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border focus:outline-none cursor-pointer ${
                        isDone
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-slate-100 text-slate-800 border-slate-300"
                      }`}
                    >
                      {TASK_STATUS_OPTIONS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3
                    className={`text-lg sm:text-xl font-black leading-snug ${
                      isDone ? "line-through text-slate-500" : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm sm:text-base text-slate-600 mt-1.5 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Checklist (Large tap targets for mobile non-techies) */}
                {totalChecklistCount > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
                      <span>
                        Daftar Pengecekan ({completedChecklistCount}/{totalChecklistCount})
                      </span>
                      {completedChecklistCount === totalChecklistCount && (
                        <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Semua ceklist selesai!
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                      {task.checklist.map((c: any) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleChecklist(task.id, c.id)}
                          className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg hover:bg-white transition group cursor-pointer"
                        >
                          <div className="mt-0.5 shrink-0">
                            {c.isCompleted ? (
                              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-lg border-2 border-slate-300 group-hover:border-slate-500 bg-white" />
                            )}
                          </div>
                          <span
                            className={`text-sm sm:text-base leading-snug flex-1 ${
                              c.isCompleted
                                ? "line-through text-slate-400 font-normal"
                                : "text-slate-800 font-medium"
                            }`}
                          >
                            {c.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer: PIC / Assigned */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>
                      Penanggung Jawab (PIC):{" "}
                      <strong className="text-slate-800">
                        {task.assignedTo?.name || "Belum Ditugaskan"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
                  Pratinjau Cetak Lembar Checklist Tugas
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {tasks.length} Tugas
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
                    Lembar Checklist & Status Tugas
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Klien: <strong>Rumah Nara Islamic Child Center</strong>
                  </p>
                </div>
                <div className="sm:text-right text-xs sm:text-sm text-slate-600 space-y-0.5">
                  <p><strong>Total Tugas:</strong> {tasks.length} Item</p>
                  <p><strong>Selesai:</strong> {tasks.filter((t) => t.status === "DONE").length} Item</p>
                  <p><strong>Tanggal Dicetak:</strong> {formatDateIndo(new Date().toISOString())}</p>
                </div>
              </div>

              {/* Table / List of Tasks */}
              <div className="space-y-4">
                {tasks.map((task, idx) => (
                  <div key={task.id} className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-black text-slate-900 text-sm">
                        {idx + 1}. [{task.taskCode}] {task.title}
                      </span>
                      <span className="font-bold text-slate-700">
                        Status: {task.status === "DONE" ? "SELESAI" : task.status}
                      </span>
                    </div>
                    {task.description && <p className="text-slate-600">{task.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>PIC: <strong>{task.assignedTo?.name || "Belum Ditugaskan"}</strong></span>
                      {task.dueDate && <span>Batas: {formatDateIndo(task.dueDate)}</span>}
                      <span>Prioritas: {task.priority}</span>
                    </div>

                    {task.checklist && task.checklist.length > 0 && (
                      <div className="pt-2 pl-2 space-y-1">
                        <p className="font-bold text-xs text-slate-700">Sub-Checklist:</p>
                        {task.checklist.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-2 text-xs text-slate-700">
                            <span>{c.isCompleted ? "[X]" : "[ ]"}</span>
                            <span className={c.isCompleted ? "line-through text-slate-400" : ""}>
                              {c.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs sm:text-sm">
                <div className="space-y-16">
                  <p className="font-bold text-slate-700">Konsultan Arjuna</p>
                  <div>
                    <p className="font-black text-slate-900 border-t border-slate-400 pt-2 w-48 mx-auto">
                      Mbak Tika
                    </p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p className="font-bold text-slate-700">PIC Rumah Nara</p>
                  <div>
                    <p className="font-black text-slate-900 border-t border-slate-400 pt-2 w-48 mx-auto">
                      Ms. Tsania
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Tugas Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Tambah Tugas Baru
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Buat tugas operasional atau tindak lanjut pendampingan.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Judul Tugas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Briefing SOP Makan Siang Baru kepada Guru Daycare"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Penanggung Jawab (PIC)
                  </label>
                  <select
                    value={taskForm.assignedToId}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">Pilih Penanggung Jawab...</option>
                    {members.map((m) => (
                      <option key={m.user?.id || m.id} value={m.user?.id || m.id}>
                        {m.user?.name || m.name} ({m.user?.role || m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Batas Waktu (Due Date)
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Prioritas
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Tinggi (Penting)</option>
                  <option value="URGENT">Mendesak (Segera)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Keterangan Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail instruksi atau arahan pengerjaan tugas..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Daftar Pengecekan / Checklist (1 item per baris)
                </label>
                <textarea
                  rows={3}
                  placeholder={"Siapkan lembar panduan SOP\nKumpulkan guru di ruang aula jam 12:30\nSimulasi langkah pemberian makan anak"}
                  value={taskForm.checklists}
                  onChange={(e) => setTaskForm({ ...taskForm, checklists: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none font-mono text-xs sm:text-sm"
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
                  disabled={submitting}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
