import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";

interface CriticalAlertProps {
  issues: Array<{
    id: string;
    issueCode: string | null;
    title: string;
    problem: string;
    assignedTo?: { name: string } | null;
    createdAt: string | Date;
  }>;
  projectId: string;
}

export function CriticalIssueAlert({ issues, projectId }: CriticalAlertProps) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="relative overflow-hidden rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 via-red-50 to-rose-50 p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-600 text-white shadow-sm shrink-0 mt-0.5 sm:mt-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white tracking-wider uppercase">
                    ⚠ CRITICAL ISSUE
                  </span>
                  <span className="text-xs font-semibold text-rose-900">
                    {issue.issueCode}
                  </span>
                  <span className="text-xs text-rose-600">
                    Awaiting Immediate Action
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mt-1">
                  {issue.title}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                  {issue.problem}
                </p>
              </div>
            </div>

            <Link
              href={`/projects/${projectId}/issues`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shrink-0 self-start sm:self-auto"
            >
              Lihat & Tindak Lanjuti
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
