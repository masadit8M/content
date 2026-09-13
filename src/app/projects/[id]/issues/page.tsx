"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  User,
  AlertTriangle,
} from "lucide-react";
import { formatDateIndo, formatDateTimeIndo, getStatusBadgeClass } from "@/lib/utils";

const ISSUE_STATUSES = [
  { key: "OPEN", label: "Open" },
  { key: "INVESTIGATING", label: "Investigating" },
  { key: "ACTION_REQUIRED", label: "Action Required" },
  { key: "MONITORING", label: "Monitoring" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

export default function IssuesPage({ params }: { params: { id: string } }) {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (severityFilter) query.set("severity", severityFilter);
      if (statusFilter) query.set("status", statusFilter);

      const res = await fetch(`/api/projects/${params.id}/issues?${query.toString()}`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [params.id, severityFilter, statusFilter]);

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const res = await fetch(`/api/projects/${params.id}/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setIssues((prev) =>
          prev.map((i) => (i.id === issueId ? { ...i, status } : i))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Issue & Problem Log
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {issues.length} Masalah
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Pencatatan masalah operasional daycare di lapangan dengan investigasi, analisis dampak, dan PIC penanganan.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari masalah operasional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchIssues()}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none w-full md:w-40 font-semibold"
          >
            <option value="">Semua Severity</option>
            <option value="CRITICAL">⚠ CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none w-full md:w-40"
          >
            <option value="">Semua Status</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat log masalah...</div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
          Nol masalah operasional untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const isCritical = issue.severity === "CRITICAL";

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition space-y-3.5 ${
                  isCritical
                    ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{issue.issueCode}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                        isCritical
                          ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                          : getStatusBadgeClass(issue.severity)
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      Dilaporkan oleh <strong className="text-slate-800">{issue.reportedBy?.name}</strong> pada {formatDateIndo(issue.createdAt)}
                    </span>
                  </div>

                  <select
                    value={issue.status}
                    onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border ${getStatusBadgeClass(issue.status)}`}
                  >
                    {ISSUE_STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        Status: {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <h3 className="text-base font-bold text-slate-900">{issue.title}</h3>

                {/* Problem & Impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                      Problem Lapangan:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{issue.problem}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-100 space-y-1">
                    <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] block">
                      Dampak Terhadap Operasional (Impact):
                    </span>
                    <p className="text-slate-700 leading-relaxed">{issue.impact || "Operasional terganggu."}</p>
                  </div>
                </div>

                {/* Consultant Analysis & Recommendation */}
                {(issue.consultantAnalysis || issue.recommendation) && (
                  <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 text-xs space-y-1.5">
                    <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px] block">
                      Analisis & Rekomendasi Solusi Konsultan:
                    </span>
                    {issue.consultantAnalysis && (
                      <p className="text-slate-700">
                        <strong>Analisis:</strong> {issue.consultantAnalysis}
                      </p>
                    )}
                    {issue.recommendation && (
                      <p className="text-emerald-800 font-semibold pt-1 border-t border-blue-100/60">
                        <strong>Solusi Disarankan:</strong> {issue.recommendation}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Ditugaskan kepada: <strong className="text-slate-800">{issue.assignedTo?.name || "Ms. Tsania (Kepala Daycare)"}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
