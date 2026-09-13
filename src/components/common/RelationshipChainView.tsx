"use client";

import React from "react";
import {
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle2,
  ListTodo,
  CheckCheck,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { getStatusBadgeClass } from "@/lib/utils";

interface ChainItemProps {
  activity?: any;
  issue?: any;
  recommendation?: any;
  decision?: any;
  task?: any;
}

export function RelationshipChainView({
  activity,
  issue,
  recommendation,
  decision,
  task,
}: ChainItemProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Consulting Relationship Chain (Single Source of Truth)
        </span>
      </div>

      <div className="flex items-center gap-2 min-w-[760px] text-xs">
        {/* Step 1: Activity */}
        <div className={`p-3 rounded-lg border flex-1 ${activity ? "bg-slate-50 border-slate-300" : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400"}`}>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Activity Log</span>
          </div>
          {activity ? (
            <div>
              <p className="font-medium text-slate-900 truncate">{activity.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{activity.activityType} · {activity.durationMinutes}m</p>
            </div>
          ) : (
            <p className="text-[11px]">Tidak ditautkan</p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

        {/* Step 2: Issue */}
        <div className={`p-3 rounded-lg border flex-1 ${issue ? "bg-amber-50/50 border-amber-200" : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400"}`}>
          <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Issue Log</span>
          </div>
          {issue ? (
            <div>
              <p className="font-medium text-slate-900 truncate">{issue.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getStatusBadgeClass(issue.severity)}`}>
                  {issue.severity}
                </span>
                <span className="text-[10px] text-slate-500">{issue.status}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px]">N/A</p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

        {/* Step 3: Recommendation */}
        <div className={`p-3 rounded-lg border flex-1 ${recommendation ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400"}`}>
          <div className="flex items-center gap-1.5 font-semibold text-indigo-800 mb-1">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Consultant Rec</span>
          </div>
          {recommendation ? (
            <div>
              <p className="font-medium text-slate-900 truncate">{recommendation.title}</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">{recommendation.recCode || "REC"}</p>
            </div>
          ) : (
            <p className="text-[11px]">N/A</p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

        {/* Step 4: Client Decision */}
        <div className={`p-3 rounded-lg border flex-1 ${decision ? "bg-emerald-50/50 border-emerald-200" : "bg-amber-50/40 border-dashed border-amber-300 text-amber-800"}`}>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-800 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Client Decision</span>
          </div>
          {decision ? (
            <div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(decision.decision)}`}>
                {decision.decision}
              </span>
              <p className="text-[11px] text-slate-600 mt-1 truncate">
                by {decision.decisionBy?.name || "Client"}
              </p>
            </div>
          ) : (
            <p className="text-[11px] font-medium text-amber-700">Awaiting Decision</p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

        {/* Step 5: Task / Implementation */}
        <div className={`p-3 rounded-lg border flex-1 ${task ? "bg-blue-50/50 border-blue-200" : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400"}`}>
          <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
            <ListTodo className="w-3.5 h-3.5 text-blue-600" />
            <span>Action Task</span>
          </div>
          {task ? (
            <div>
              <p className="font-medium text-slate-900 truncate">{task.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getStatusBadgeClass(task.status)}`}>
                  {task.status}
                </span>
                <span className="text-[10px] text-slate-500">
                  {task.assignedTo?.name ? `PIC: ${task.assignedTo.name.split(" ")[0]}` : "Unassigned"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px]">Belum dibuat</p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

        {/* Step 6: Verification / Closed */}
        <div className={`p-3 rounded-lg border flex-1 ${task?.status === "DONE" || recommendation?.status === "CLOSED" ? "bg-emerald-100/70 border-emerald-300 text-emerald-900" : "bg-slate-50/50 border-slate-200 text-slate-400"}`}>
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Verification</span>
          </div>
          <p className="text-[11px]">
            {task?.status === "DONE" || recommendation?.status === "CLOSED" ? "✓ Verified & Closed" : "Pending"}
          </p>
        </div>
      </div>
    </div>
  );
}
