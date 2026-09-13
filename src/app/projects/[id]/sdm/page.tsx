"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  UserCheck,
  Plus,
  Send,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { formatDateIndo, formatDateTimeIndo, formatRupiah, getStatusBadgeClass } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function SDMPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal modal state (Consultant)
  const [proposingReq, setProposingReq] = useState<any>(null);
  const [candidateName, setCandidateName] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("4500000");
  const [additionalCost, setAdditionalCost] = useState("450000");
  const [proposalNotes, setProposalNotes] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Decision modal state (Client)
  const [decidingProposal, setDecidingProposal] = useState<{ req: any; proposal: any } | null>(null);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decisionComment, setDecisionComment] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchSDM = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${params.id}/sdm`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSDM();
  }, [params.id]);

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposingReq) return;

    try {
      setSubmittingProposal(true);
      const res = await fetch(`/api/projects/${params.id}/sdm/${proposingReq.id}/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedPersonnel: candidateName,
          monthlyCost: Number(monthlyCost),
          additionalCost: Number(additionalCost),
          notes: proposalNotes,
        }),
      });
      if (res.ok) {
        setProposingReq(null);
        setCandidateName("");
        fetchSDM();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decidingProposal) return;

    try {
      setSubmittingDecision(true);
      const res = await fetch(
        `/api/projects/${params.id}/sdm/${decidingProposal.req.id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId: decidingProposal.proposal.id,
            decision: decisionType,
            comment: decisionComment,
          }),
        }
      );
      if (res.ok) {
        setDecidingProposal(null);
        setDecisionComment("");
        fetchSDM();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const isArjunaTeam = user?.globalRole?.startsWith("ARJUNA");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            SDM Request & Cost Approval
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            {requests.length} Permintaan SDM
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Modul paperless pengelolaan penugasan tenaga kerja daycare: permintaan $\rightarrow$ penawaran personil & biaya $\rightarrow$ persetujuan klien $\rightarrow$ penugasan aktif (PRD #18-#21).
        </p>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat data permintaan SDM...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
          Belum ada permintaan penambahan SDM.
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((req) => {
            const latestProposal = req.proposals?.[0];
            const hasApproval = latestProposal?.approvals?.[0];

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-purple-700">{req.requestCode}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      Diajukan oleh <strong className="text-slate-800">{req.requestedBy?.name}</strong> pada {formatDateIndo(req.createdAt)}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                {/* Position Title & Core Details */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {req.position} ({req.personnelCount} Orang)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">{req.duties}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Mulai Bertugas:</span>
                    <span className="font-semibold text-slate-800">{formatDateIndo(req.requestedStartDate)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Jadwal Kerja:</span>
                    <span className="font-semibold text-slate-800 truncate block">{req.workSchedule}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Durasi Kontrak:</span>
                    <span className="font-semibold text-slate-800">{req.duration}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Lokasi Penempatan:</span>
                    <span className="font-semibold text-slate-800">{req.location}</span>
                  </div>
                </div>

                {/* Arjuna Proposal & Cost Breakdown (PRD #21) */}
                {latestProposal ? (
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px]">
                        Penawaran Personel & Rincian Biaya oleh Arjuna Cendekia:
                      </span>
                      <span className="text-[11px] text-purple-700">
                        {formatDateTimeIndo(latestProposal.createdAt)}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{latestProposal.proposedPersonnel}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{latestProposal.notes}</p>
                        </div>
                      </div>

                      {/* Cost Table (PRD #21) */}
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Biaya Bulanan Pokok (Gaji & Tunjangan):</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(latestProposal.monthlyCost)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Biaya Operasional Tambahan (BPJS & Seragam):</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(latestProposal.additionalCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                          <span>TOTAL BIAYA PER BULAN:</span>
                          <span className="text-purple-800 text-base">{formatRupiah(latestProposal.totalCost)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Approval status or Decision buttons */}
                    {hasApproval ? (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-emerald-900">Persetujuan Klien: [{hasApproval.decision}]</span>
                            <span className="text-emerald-700 block text-[11px]">
                              oleh {hasApproval.decisionBy?.name} pada {formatDateTimeIndo(hasApproval.decisionAt)}
                            </span>
                          </div>
                        </div>
                        {hasApproval.comment && (
                          <span className="italic text-slate-600">"{hasApproval.comment}"</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-amber-800 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu persetujuan biaya dari Owner Rumah Nara (Mr. Ryan)
                        </span>

                        <button
                          onClick={() => setDecidingProposal({ req, proposal: latestProposal })}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Beri Persetujuan Biaya
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Belum ada penawaran kandidat dan biaya dari Tim Arjuna.
                    </span>

                    <button
                      onClick={() => setProposingReq(req)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      Kirim Penawaran Personel & Biaya
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Consultant Proposal Modal */}
      {proposingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kirim Penawaran Personel & Biaya (PRD #19, #21)
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{proposingReq.requestCode}: {proposingReq.position}</h3>
              </div>
              <button onClick={() => setProposingReq(null)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendProposal} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kandidat Tenaga Kerja & Kualifikasi *</label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Contoh: Ustazah Aulia (S1 PGPAUD, Pengalaman 3 Tahun)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Bulanan Pokok (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={monthlyCost}
                    onChange={(e) => setMonthlyCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Tambahan Operasional (Rp)</label>
                  <input
                    type="number"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Total Estimasi Biaya:</span>
                <span className="text-purple-800 text-sm">
                  {formatRupiah((Number(monthlyCost) || 0) + (Number(additionalCost) || 0))}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Kualifikasi / Screening:</label>
                <textarea
                  rows={2}
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="Kandidat telah lolos tes kepribadian psikologi anak dan screening latar belakang..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProposingReq(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  {submittingProposal ? "Mengirimkan..." : "Kirim Proposal ke Klien"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Cost Decision Modal */}
      {decidingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="font-bold text-slate-900 text-sm">Persetujuan Biaya SDM</h3>
              <button onClick={() => setDecidingProposal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleDecision} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-900">{decidingProposal.proposal.proposedPersonnel}</p>
                <p className="font-bold text-purple-900 text-sm">
                  Total Biaya: {formatRupiah(decidingProposal.proposal.totalCost)} / bulan
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Keputusan Klien:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType("APPROVED")}
                    className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                      decisionType === "APPROVED"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    APPROVE (Setuju Biaya)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType("REJECTED")}
                    className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                      decisionType === "REJECTED"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    REJECT (Tolak)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Persetujuan:</label>
                <textarea
                  rows={2}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Setuju dengan penawaran biaya. Mulai aktif per tanggal penugasan."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDecidingProposal(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  {submittingDecision ? "Menyimpan..." : "Simpan Persetujuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
