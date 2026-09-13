"use client";

import React, { useEffect, useState } from "react";
import {
  GitCommit,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  ListTodo,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { RelationshipChainView } from "@/components/common/RelationshipChainView";
import { formatDateIndo, formatDateTimeIndo } from "@/lib/utils";

export default function TimelinePage({ params }: { params: { id: string } }) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [chains, setChains] = useState<any>({ activityChains: [], recommendationChains: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${params.id}/timeline`).then((res) => res.json()),
      fetch(`/api/projects/${params.id}/chain`).then((res) => res.json()),
    ])
      .then(([timelineData, chainData]) => {
        setTimeline(timelineData.timeline || []);
        setChains(chainData || { activityChains: [], recommendationChains: [] });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Timeline & Digital Trail
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            PRD Principle: Everything should leave a trail
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Jejak digital transparan: Who $\rightarrow$ Did What $\rightarrow$ When $\rightarrow$ Result $\rightarrow$ Next Action.
        </p>
      </div>

      {/* 1. Relationship Chain Section (PRD #58) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Consulting Relationship Chains (PRD #58)
          </h2>
          <span className="text-xs text-slate-500">Alur keterkaitan Activity $\rightarrow$ Issue $\rightarrow$ Rec $\rightarrow$ Task</span>
        </div>

        {chains.recommendationChains?.length === 0 ? (
          <p className="text-xs text-slate-400 bg-white p-4 rounded-xl border border-slate-200">
            Belum ada rantai relasi yang terbentuk.
          </p>
        ) : (
          <div className="space-y-3">
            {chains.recommendationChains.map((rec: any) => {
              const latestDecision = rec.decisions?.[0];
              const linkedTask = rec.tasks?.[0];
              const linkedActivity = rec.activity;

              return (
                <RelationshipChainView
                  key={rec.id}
                  activity={linkedActivity}
                  recommendation={rec}
                  decision={latestDecision}
                  task={linkedTask}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Chronological Audit Trail (PRD #4, #25, #43, #44) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Chronological Audit Stream
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat riwayat jejak digital...</div>
        ) : timeline.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat tercatat.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((event) => (
              <div key={event.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-900 shadow-xs group-hover:scale-125 transition" />

                <div className="bg-slate-50 hover:bg-slate-100/70 transition p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        {event.action}
                      </span>
                      {event.entityType}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTimeIndo(event.createdAt)}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium">{event.description}</p>
                  <p className="text-[10px] text-slate-400">
                    Oleh: <strong className="text-slate-600">{event.user?.name || "System"}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
