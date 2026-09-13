"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  X,
  Printer,
  MapPin,
  Send,
  Lock,
  Image as ImageIcon,
  Video,
  Trash2,
  Edit3,
  Check,
  UploadCloud,
  Eye,
  Shield,
  Filter,
} from "lucide-react";
import { ScopeBadge } from "@/components/common/ScopeBadge";
import { formatDateIndo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const MONTH_OPTIONS = [
  { value: "", label: "Semua Periode (12 Bulan)" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "Oktober 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "Desember 2026" },
  { value: "2027-01", label: "Januari 2027" },
  { value: "2027-02", label: "Februari 2027" },
  { value: "2027-03", label: "Maret 2027" },
  { value: "2027-04", label: "April 2027" },
  { value: "2027-05", label: "Mei 2027" },
  { value: "2027-06", label: "Juni 2027" },
  { value: "2027-07", label: "Juli 2027" },
  { value: "2027-08", label: "Agustus 2027" },
  { value: "2027-09", label: "September 2027" },
];

export default function ActivitiesPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();

  // Navigation Sub-tab: "activities" (Jurnal & Jadwal Tim) vs "diary" (Diary Pribadi Saya)
  const [activeTab, setActiveTab] = useState<"activities" | "diary">("activities");

  // Activities State
  const [activities, setActivities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // "" (All), "SCHEDULED", "COMPLETED"

  // Personal Diary State
  const [diaries, setDiaries] = useState<any[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [diarySearch, setDiarySearch] = useState("");
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [editingDiary, setEditingDiary] = useState<any | null>(null);
  const [submittingDiary, setSubmittingDiary] = useState(false);
  const [diaryForm, setDiaryForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    content: "",
    tags: "Observasi Lapangan",
  });

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Activity Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewMediaModal, setPreviewMediaModal] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    categoryId: string;
    location: string;
    status: string;
    reportToUserId: string;
    reportedUserIds: string[];
    mediaUrl: string;
    description: string;
    participants: string;
    outcome: string;
    finding: string;
    nextAction: string;
    scopeStatus: string;
  }>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "11:00",
    durationMinutes: 120,
    categoryId: "",
    location: "Daycare Rumah Nara (Jl. Pajajaran)",
    status: "SCHEDULED", // "SCHEDULED" (Rencana) atau "COMPLETED" (Sudah Selesai)
    reportToUserId: "",
    reportedUserIds: [],
    mediaUrl: "",
    description: "",
    participants: "",
    outcome: "",
    finding: "",
    nextAction: "",
    scopeStatus: "IN_SCOPE",
  });

  // Fetch Team Activities & Members
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (selectedCategory) query.set("categoryId", selectedCategory);
      if (selectedMonth) query.set("month", selectedMonth);

      const res = await fetch(`/api/projects/${params.id}/activities?${query.toString()}`);
      const data = await res.json();
      setActivities(data.activities || []);
      setCategories(data.categories || []);
      setMembers(data.members || []);

      // Auto-set default report to member if not set
      if (formData.reportedUserIds.length === 0 && data.members?.length > 0) {
        const clientMembers = data.members.filter((m: any) => m.role === "CLIENT_LEAD");
        const defaultIds = clientMembers.length > 0
          ? clientMembers.map((m: any) => m.userId)
          : [data.members[0].userId];
        setFormData((prev) => ({
          ...prev,
          reportedUserIds: defaultIds,
          reportToUserId: defaultIds[0] || "",
        }));
      }
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch User's Strict Personal Diaries
  const fetchDiaries = async () => {
    try {
      setDiaryLoading(true);
      const query = new URLSearchParams();
      if (diarySearch) query.set("search", diarySearch);

      const res = await fetch(`/api/projects/${params.id}/diary?${query.toString()}`);
      const data = await res.json();
      setDiaries(data.diaries || []);
    } catch (err) {
      console.error("Failed to load personal diaries:", err);
    } finally {
      setDiaryLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [params.id, selectedCategory, selectedMonth]);

  useEffect(() => {
    if (activeTab === "diary") {
      fetchDiaries();
    }
  }, [activeTab, params.id]);

  // Handle Media Upload for Activity
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, mediaUrl: data.url }));
      } else {
        alert(data.error || "Gagal mengunggah foto/video");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan teknis saat mengunggah foto/video");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Create Activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${params.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          title: "",
          date: new Date().toISOString().split("T")[0],
          startTime: "09:00",
          endTime: "11:00",
          durationMinutes: 120,
          categoryId: "",
          location: "Daycare Rumah Nara (Jl. Pajajaran)",
          status: "SCHEDULED",
          reportToUserId: "",
          reportedUserIds: [],
          mediaUrl: "",
          description: "",
          participants: "",
          outcome: "",
          finding: "",
          nextAction: "",
          scopeStatus: "IN_SCOPE",
        });
        fetchActivities();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan jadwal / kegiatan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  // Mark Scheduled Activity as Completed
  const handleMarkAsCompleted = async (actId: string) => {
    try {
      const res = await fetch(`/api/projects/${params.id}/activities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actId, status: "COMPLETED" }),
      });
      if (res.ok) {
        fetchActivities();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal memperbarui status");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui status kegiatan");
    }
  };

  // Create / Update Personal Diary
  const handleSaveDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingDiary(true);
      const url = editingDiary
        ? `/api/projects/${params.id}/diary/${editingDiary.id}`
        : `/api/projects/${params.id}/diary`;
      const method = editingDiary ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diaryForm),
      });

      if (res.ok) {
        setShowDiaryModal(false);
        setEditingDiary(null);
        setDiaryForm({
          title: "",
          date: new Date().toISOString().split("T")[0],
          content: "",
          tags: "Observasi Lapangan",
        });
        fetchDiaries();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan diary pribadi");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan catatan diary");
    } finally {
      setSubmittingDiary(false);
    }
  };

  // Delete Personal Diary
  const handleDeleteDiary = async (diaryId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan diary pribadi ini?")) return;
    try {
      const res = await fetch(`/api/projects/${params.id}/diary/${diaryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDiaries();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus catatan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus");
    }
  };

  // Filter activities by statusFilter
  const filteredActivities = activities.filter((act) => {
    if (!statusFilter) return true;
    return act.status === statusFilter;
  });

  const scheduledCount = activities.filter((a) => a.status === "SCHEDULED").length;
  const completedCount = activities.filter((a) => a.status === "COMPLETED" || !a.status).length;

  const currentMonthLabel =
    MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || "Semua Periode";

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Jurnal & Jadwal Kerja
            </h1>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activities.length} Kegiatan Tim
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Pengaturan jadwal kerja harian, dokumentasi lapangan, dan diary observasi mandiri.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {activeTab === "activities" ? (
            <>
              {activities.length > 0 && (
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base transition flex items-center justify-center gap-2"
                  title="Cetak atau Simpan Jurnal ke PDF"
                >
                  <Printer className="w-5 h-5 text-slate-600" />
                  <span className="hidden sm:inline">Cetak PDF</span>
                </button>
              )}

              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, status: "SCHEDULED" }));
                  setShowAddModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>+ Rencana & Kunjungan</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditingDiary(null);
                setDiaryForm({
                  title: "",
                  date: new Date().toISOString().split("T")[0],
                  content: "",
                  tags: "Observasi Lapangan",
                });
                setShowDiaryModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5 text-white" />
              <span>+ Catat Diary Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Sub-Tab Switcher (Segmented Control) */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm sm:text-base transition ${
            activeTab === "activities"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Jurnal & Jadwal Tim</span>
          {scheduledCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-extrabold">
              {scheduledCount} Rencana
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("diary")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm sm:text-base transition ${
            activeTab === "diary"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>🔒 Diary Observasi Saya</span>
          {diaries.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              {diaries.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JURNAL KUNJUNGAN & JADWAL KERJA TIM                                */}
      {/* ========================================================================= */}
      {activeTab === "activities" && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Cari agenda, lokasi, atau temuan kegiatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchActivities()}
                className="w-full pl-11 pr-4 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Status Filter Pill */}
            <div className="w-full md:w-auto flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter("")}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                  statusFilter === "" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua ({activities.length})
              </button>
              <button
                onClick={() => setStatusFilter("SCHEDULED")}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1 ${
                  statusFilter === "SCHEDULED" ? "bg-white text-amber-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Rencana ({scheduledCount})
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1 ${
                  statusFilter === "COMPLETED" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Selesai ({completedCount})
              </button>
            </div>

            {/* 12-Month Filtering */}
            <div className="w-full md:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full md:w-52 px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none font-medium bg-slate-50"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {categories.length > 0 && (
              <div className="w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-44 px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Activities List */}
          {loading ? (
            <div className="py-16 text-center text-base text-slate-400 font-medium">
              Memuat data jadwal & kunjungan...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  Belum Ada Jadwal atau Catatan Kunjungan
                </h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mt-1">
                  Mbak Tika, Ms. Tsania, atau tim konsultan dapat menjadwalkan kunjungan kerja baru dan melampirkan foto/video dokumentasi.
                </p>
              </div>
              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, status: "SCHEDULED" }));
                  setShowAddModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Buat Rencana / Kunjungan Baru
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredActivities.map((act) => {
                const isScheduled = act.status === "SCHEDULED";

                return (
                  <div
                    key={act.id}
                    className={`bg-white rounded-2xl border ${
                      isScheduled
                        ? "border-amber-300 shadow-sm bg-gradient-to-br from-white to-amber-50/20"
                        : "border-slate-200 shadow-sm"
                    } p-5 sm:p-6 transition space-y-4`}
                  >
                    {/* Header Info & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Status Badge */}
                        {isScheduled ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-4 h-4 text-amber-700 animate-spin" />
                            📌 Rencana Jadwal Kerja
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Check className="w-4 h-4 text-emerald-700" />
                            ✅ Selesai Terlaksana
                          </span>
                        )}

                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          {formatDateIndo(act.date)}
                        </span>

                        {act.startTime && (
                          <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                            <Clock className="w-4 h-4 text-blue-600" />
                            {act.startTime} - {act.endTime || "Selesai"}
                          </span>
                        )}

                        <ScopeBadge scope={act.scopeStatus} />
                      </div>

                      {/* Reporter / Creator info */}
                      <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>
                          Dibuat: <strong className="text-slate-800">{act.createdBy?.name || "Konsultan"}</strong>
                        </span>
                        {(() => {
                          let ids: string[] = [];
                          if (act.reportedUserIds) {
                            try {
                              ids = JSON.parse(act.reportedUserIds);
                            } catch {
                              ids = [act.reportedUserIds];
                            }
                          } else if (act.reportToUser) {
                            ids = [act.reportToUser.id];
                          }
                          const repMembers = members.filter((m) => ids.includes(m.userId));
                          if (repMembers.length === 0 && act.reportToUser) {
                            repMembers.push({ userId: act.reportToUser.id, user: act.reportToUser });
                          }
                          if (repMembers.length === 0) return null;
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600">
                                <Send className="w-3.5 h-3.5 text-blue-600" />
                                Lapor ke:
                              </span>
                              {repMembers.map((rm) => (
                                <span
                                  key={rm.userId}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200"
                                >
                                  {rm.user?.name}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Location Badge */}
                    {act.location && (
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80 w-fit">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="font-bold text-slate-900">Lokasi:</span>
                        <span>{act.location}</span>
                      </div>
                    )}

                    {/* Title & Description */}
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                          {act.title}
                        </h3>

                        {/* If scheduled, allow 1-click mark as completed */}
                        {isScheduled && (
                          <button
                            onClick={() => handleMarkAsCompleted(act.id)}
                            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            Tandai Sudah Selesai
                          </button>
                        )}
                      </div>

                      <p className="text-sm sm:text-base text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
                        {act.description}
                      </p>
                    </div>

                    {/* Media Attachment (Photo / Video) */}
                    {act.mediaUrl && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                          <ImageIcon className="w-4 h-4 text-emerald-600" />
                          Lampiran Foto / Video Dokumentasi:
                        </span>
                        <div className="relative group max-w-sm rounded-lg overflow-hidden border border-slate-300">
                          {act.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video
                              src={act.mediaUrl}
                              controls
                              className="w-full max-h-56 object-cover bg-black"
                            />
                          ) : (
                            <img
                              src={act.mediaUrl}
                              alt="Dokumentasi Kunjungan"
                              className="w-full max-h-56 object-cover cursor-pointer hover:scale-102 transition duration-200"
                              onClick={() => setPreviewMediaModal(act.mediaUrl)}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {act.participants && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">Peserta / Pihak Terkait:</span>
                        <span className="truncate">{act.participants}</span>
                      </div>
                    )}

                    {/* 3 Clear Structured Findings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs sm:text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          Hasil / Outcome
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          {act.outcome || (isScheduled ? "Akan dicatat setelah kunjungan." : "Belum ada catatan hasil.")}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs sm:text-sm">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          Temuan Lapangan
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          {act.finding || (isScheduled ? "Akan diobservasi di lokasi." : "Tidak ada temuan khusus.")}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs sm:text-sm">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          Tindak Lanjut
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          {act.nextAction || "Akan dilanjutkan di sesi berikutnya."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIARY OBSERVASI PRIBADI (HANYA SAYA)                                */}
      {/* ========================================================================= */}
      {activeTab === "diary" && (
        <div className="space-y-5">
          {/* Privacy Notice Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-start gap-3.5 shadow-md">
            <div className="p-2.5 rounded-xl bg-emerald-700/60 shrink-0 mt-0.5">
              <Shield className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  🔒 Ruang Diary Observasi Mandiri
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Rahasia & Terenkripsi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
                Catatan di halaman ini <strong>hanya dapat dibaca dan diedit oleh Anda ({user?.name || "Anda"})</strong>.
                Anggota tim lain, konsultan lain, maupun pihak Rumah Nara tidak dapat melihat jurnal observasi ini.
                Gunakan untuk mencatat refleksi mandiri, ide spontan, atau evaluasi internal.
              </p>
            </div>
          </div>

          {/* Search and Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Cari catatan diary pribadi Anda..."
                value={diarySearch}
                onChange={(e) => setDiarySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDiaries()}
                className="w-full pl-11 pr-4 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              onClick={() => {
                setEditingDiary(null);
                setDiaryForm({
                  title: "",
                  date: new Date().toISOString().split("T")[0],
                  content: "",
                  tags: "Observasi Lapangan",
                });
                setShowDiaryModal(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-5 h-5 text-white" />
              <span>Tulis Catatan Baru</span>
            </button>
          </div>

          {/* Diaries Cards List */}
          {diaryLoading ? (
            <div className="py-16 text-center text-base text-slate-400 font-medium">
              Memuat diary pribadi Anda...
            </div>
          ) : diaries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  Belum Ada Catatan Diary Pribadi
                </h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mt-1">
                  Mulai tuangkan catatan observasi mandiri, pemikiran internal, atau ide perbaikan daycare Anda di sini dengan aman.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingDiary(null);
                  setDiaryForm({
                    title: "",
                    date: new Date().toISOString().split("T")[0],
                    content: "",
                    tags: "Observasi Lapangan",
                  });
                  setShowDiaryModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-white" />
                Tulis Catatan Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {diaries.map((diary) => (
                <div
                  key={diary.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-emerald-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        {formatDateIndo(diary.date)}
                      </span>
                      {diary.tags && (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          🏷️ {diary.tags}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          setEditingDiary(diary);
                          setDiaryForm({
                            title: diary.title,
                            date: new Date(diary.date).toISOString().split("T")[0],
                            content: diary.content,
                            tags: diary.tags || "",
                          });
                          setShowDiaryModal(true);
                        }}
                        className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDiary(diary.id)}
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {diary.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-700 whitespace-pre-line leading-relaxed">
                    {diary.content}
                  </p>

                  <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>🔒 Hanya Anda yang dapat melihat catatan ini</span>
                    <span>Terakhir diubah: {new Date(diary.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW FOTO / VIDEO                                               */}
      {/* ========================================================================= */}
      {previewMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewMediaModal(null)}
              className="absolute top-4 right-4 z-10 p-2 text-white bg-black/60 hover:bg-black/80 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-2 flex items-center justify-center">
              <img
                src={previewMediaModal}
                alt="Pratinjau Dokumentasi"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT PREVIEW / PDF MODAL (Shared with Team)                              */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-6">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">
                  Pratinjau Dokumen Cetak Jurnal & Jadwal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {currentMonthLabel}
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

            {/* Printable Sheet */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 space-y-6 text-slate-900 bg-white">
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider block">
                    Yayasan Arjuna Cendekia · Konsultan Pendampingan Daycare
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Arsip Jurnal Kunjungan & Jadwal Kerja
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Klien: <strong>Rumah Nara Islamic Child Center</strong> (Periode: {currentMonthLabel})
                  </p>
                </div>
                <div className="sm:text-right text-xs sm:text-sm text-slate-600 space-y-0.5">
                  <p><strong>Total Kegiatan:</strong> {activities.length} Sesi</p>
                  <p><strong>Tanggal Dicetak:</strong> {formatDateIndo(new Date().toISOString())}</p>
                </div>
              </div>

              <div className="space-y-4">
                {activities.map((act, idx) => (
                  <div key={act.id} className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-black text-slate-900 text-sm">
                        {idx + 1}. {act.title} [{act.status === "SCHEDULED" ? "RENCANA" : "SELESAI"}]
                      </span>
                      <span className="font-semibold text-slate-600">
                        {formatDateIndo(act.date)} ({act.startTime} - {act.endTime || "Selesai"})
                      </span>
                    </div>
                    {act.location && (
                      <p className="text-slate-600"><strong>Lokasi:</strong> {act.location}</p>
                    )}
                    {(() => {
                      let ids: string[] = [];
                      if (act.reportedUserIds) {
                        try {
                          ids = JSON.parse(act.reportedUserIds);
                        } catch {
                          ids = [act.reportedUserIds];
                        }
                      } else if (act.reportToUser) {
                        ids = [act.reportToUser.id];
                      }
                      const repMembers = members.filter((m) => ids.includes(m.userId));
                      if (repMembers.length === 0 && act.reportToUser) {
                        repMembers.push({ userId: act.reportToUser.id, user: act.reportToUser });
                      }
                      if (repMembers.length === 0) return null;
                      return (
                        <p className="text-blue-800 font-semibold">
                          Pelaporan Kepada: {repMembers.map((rm) => rm.user?.name).join(", ")}
                        </p>
                      );
                    })()}

                    <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <strong>Hasil:</strong> {act.outcome || "-"}
                      </div>
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <strong>Temuan:</strong> {act.finding || "-"}
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <strong>Tindak Lanjut:</strong> {act.nextAction || "-"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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

      {/* ========================================================================= */}
      {/* MODAL: INPUT / JADWALKAN KEGIATAN & KUNJUNGAN                              */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {formData.status === "SCHEDULED" ? "📅 Jadwalkan Rencana Kerja" : "✅ Catat Kunjungan Lapangan"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Isi rencana kerja hari ini, lokasi, pelaporan, dan lampiran foto/video.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type Toggle: Rencana vs Selesai Langsung */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Status Kegiatan
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: "SCHEDULED" })}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                      formData.status === "SCHEDULED"
                        ? "bg-amber-100 text-amber-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📌 Rencana Jadwal Hari Ini / Mendatang
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: "COMPLETED" })}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                      formData.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ✅ Sudah Terlaksana / Kunjungan Selesai
                  </button>
                </div>
              </div>

              {/* Plan / Judul Kegiatan */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Plan Hari Ini / Judul Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Observasi Operasional Pagi & Sosialisasi SOP Sanitasi"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  📍 Lokasi Kunjungan / Kerja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Daycare Rumah Nara (Jl. Pajajaran) / Daring Zoom"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Lapor ke User Siapa (Multi-PIC) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-800">
                    📤 Lapor / Koordinasi ke Siapa?
                  </label>
                  <span className="text-xs text-slate-500">Bisa pilih lebih dari satu PIC</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {members.map((m) => {
                    const isSelected = formData.reportedUserIds.includes(m.userId);
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => {
                          const newIds = isSelected
                            ? formData.reportedUserIds.filter((id) => id !== m.userId)
                            : [...formData.reportedUserIds, m.userId];
                          setFormData({
                            ...formData,
                            reportedUserIds: newIds,
                            reportToUserId: newIds[0] || "",
                          });
                        }}
                        className={`px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-bold border transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 font-black ${
                              isSelected ? "border-white bg-white text-blue-600" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                          <span className="truncate">{m.user?.name}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium ${
                            isSelected ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {m.role === "CLIENT_LEAD" ? "Rumah Nara" : m.role === "CONSULTANT_LEAD" ? "Konsultan" : "Tim"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {formData.reportedUserIds.length === 0 ? (
                  <p className="text-xs text-amber-600 mt-1">
                    * Klik nama PIC di atas yang ingin Anda beri laporan (misal: Ms. Tsania & Mr. Ryan).
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {formData.reportedUserIds.length} PIC terpilih untuk menerima laporan ini.
                  </p>
                )}
              </div>

              {/* Deskripsi / Detail Rencana Hari Ini */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Rencana Kegiatan / Agenda Lengkap *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tuliskan apa saja yang akan/telah dikerjakan selama kunjungan kerja..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              {/* Fitur Upload Foto / Video Dokumentasi */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  📸 Lampiran Foto / Video Dokumentasi
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>{uploadingMedia ? "Mengunggah..." : "Pilih Foto / Video"}</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      disabled={uploadingMedia}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-slate-400">atau masukkan URL langsung:</span>

                  <input
                    type="text"
                    placeholder="https://... atau /uploads/..."
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    className="flex-1 w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:outline-none"
                  />
                </div>

                {formData.mediaUrl && (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-emerald-200 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">File terlampir: {formData.mediaUrl}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaUrl: "" })}
                      className="ml-auto text-red-500 hover:text-red-700 font-bold"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Peserta Hadir */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Peserta / Anggota yang Hadir
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mbak Tika, Ms. Tsania, 4 Guru Daycare"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              {/* Hasil, Temuan & Tindak Lanjut (Bisa diisi nanti jika status Rencana) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-emerald-800 mb-1">
                    ✓ Hasil / Outcome (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Hasil langsung dari kunjungan"
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-emerald-200 bg-emerald-50/40 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-1">
                    ! Temuan Lapangan / Finding (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Catatan masalah atau kendala yang ditemukan"
                    value={formData.finding}
                    onChange={(e) => setFormData({ ...formData, finding: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-amber-200 bg-amber-50/40 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-1">
                    → Rencana Tindak Lanjut / Next Action (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Langkah berikutnya yang perlu dilakukan"
                    value={formData.nextAction}
                    onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-blue-200 bg-blue-50/40 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {submitting ? "Menyimpan..." : formData.status === "SCHEDULED" ? "Simpan Rencana Jadwal" : "Simpan Kunjungan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT / EDIT DIARY OBSERVASI PRIBADI                                */}
      {/* ========================================================================= */}
      {showDiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-800">
                  <Lock className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black">
                    {editingDiary ? "Edit Catatan Diary Pribadi" : "Tulis Diary Observasi Mandiri"}
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Hanya bisa dibaca oleh akun Anda ({user?.name || "Anda"}).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiaryModal(false)}
                className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiary} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Judul Catatan / Observasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Observasi Perilaku Guru Sentra Balita & Ide Kurikulum"
                  value={diaryForm.title}
                  onChange={(e) => setDiaryForm({ ...diaryForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Tanggal Catatan *
                  </label>
                  <input
                    type="date"
                    required
                    value={diaryForm.date}
                    onChange={(e) => setDiaryForm({ ...diaryForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Label / Kategori Pribadi
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Observasi Guru, Refleksi, Ide"
                    value={diaryForm.tags}
                    onChange={(e) => setDiaryForm({ ...diaryForm, tags: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Isi Diary / Catatan Observasi Lengkap *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Tuliskan bebas segala pengamatan, temuan rahasia, ide baru, atau catatan evaluasi yang tidak ingin Anda bagikan secara publik ke pihak lain..."
                  value={diaryForm.content}
                  onChange={(e) => setDiaryForm({ ...diaryForm, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiaryModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDiary}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingDiary ? "Menyimpan..." : "Simpan Diary Pribadi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
