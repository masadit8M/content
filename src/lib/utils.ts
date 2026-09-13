import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy", { locale: id });
}

export function formatDateTimeIndo(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy HH:mm", { locale: id });
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "APPROVED":
    case "DONE":
    case "COMPLETED":
    case "ACTIVE":
    case "RESOLVED":
    case "VERIFIED":
    case "IMPLEMENTED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "UNDER_DISCUSSION":
    case "AWAITING_APPROVAL":
    case "WAITING_CLIENT":
    case "WAITING_CONSULTANT":
    case "ACTION_REQUIRED":
    case "MONITORING":
    case "YELLOW":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    
    case "CRITICAL":
    case "REJECTED":
    case "OVERDUE":
    case "BLOCKED":
    case "CANCELLED":
    case "RED":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    
    case "IN_PROGRESS":
    case "IMPLEMENTING":
    case "INVESTIGATING":
    case "BLUE":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    
    case "DRAFT":
    case "BACKLOG":
    case "TO_DO":
    case "NOT_STARTED":
    case "GRAY":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700";
  }
}

export function getScopeBadgeClass(scope: string): { label: string; className: string } {
  switch (scope) {
    case "IN_SCOPE":
      return {
        label: "IN SCOPE",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
      };
    case "ADDITIONAL_REQUEST":
      return {
        label: "ADDITIONAL REQUEST",
        className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
      };
    case "OUTSIDE_ORIGINAL_SCOPE":
      return {
        label: "OUTSIDE ORIGINAL SCOPE",
        className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
      };
    default:
      return {
        label: scope,
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}
