import React from "react";
import { getScopeBadgeClass } from "@/lib/utils";

interface ScopeBadgeProps {
  scope: string;
  size?: "sm" | "md";
}

export function ScopeBadge({ scope, size = "sm" }: ScopeBadgeProps) {
  const { label, className } = getScopeBadgeClass(scope);

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${className} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
      title={`Scope status: ${label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
